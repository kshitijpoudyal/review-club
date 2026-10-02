import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Transaction, TransactionData } from '../types/Transaction';
import { Product, ProductLinkOptions } from '../types/Product';
import { getTransactionProductShare } from '../utils/transactionProductShare';
import { getProductStatusType } from '../utils/productStatus';

// ─── Cache helpers ──────────────────────────────────────────────────────────
const CACHE_VERSION = 'v1';
const cacheKey = (uid: string) => `art_transactions_${CACHE_VERSION}_${uid}`;

// Firestore collection is still physically named `paypal_transactions` for historical
// reasons (it predates the generic "Transaction" rename). Renaming it would require a
// live-data migration; only the code-level name is "Transaction". Do not rename this
// path without a real migration plan.
const TRANSACTIONS_COLLECTION = 'paypal_transactions';

function readTransactionCache(uid: string): Transaction[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const { transactions } = JSON.parse(raw);
    return Array.isArray(transactions) ? transactions : null;
  } catch {
    return null;
  }
}

function writeTransactionCache(uid: string, transactions: Transaction[]): void {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify({ transactions, ts: Date.now() }));
  } catch {
    // Ignore quota errors
  }
}

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const dateComparison = b.date.localeCompare(a.date);
    if (dateComparison !== 0) return dateComparison;
    return b.time.localeCompare(a.time);
  });
}

export function buildTransactionData(transactions: Transaction[]): TransactionData {
  return {
    transactions,
    summary: {
      totalIncome: transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      totalFees: transactions.reduce((s, t) => s + Math.abs(t.fees), 0),
      netReceivedTotal: transactions.reduce((s, t) => s + t.total, 0),
      transactionCount: transactions.length
    }
  };
}

// Firestore batched writes cap at 500 operations; chunk to stay under that.
const BATCH_CHUNK_SIZE = 450;
// ───────────────────────────────────────────────────────────────────────────

interface TransactionsContextValue {
  data: TransactionData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<boolean>;
  importTransactions: (transactions: Transaction[]) => Promise<{ added: number; skipped: number; withdrawalSkipped: number }>;
  updateTransaction: (docId: string, transaction: Transaction) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  updateProductLink: (
    transactionId: string,
    linkedProductIds: string[],
    options?: ProductLinkOptions
  ) => Promise<boolean>;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export const TransactionsProvider: React.FC<{ userId?: string; children: ReactNode }> = ({ userId, children }) => {
  const initRef = useRef<{ data: TransactionData | null; hasCache: boolean } | null>(null);
  if (!initRef.current) {
    const cached = userId ? readTransactionCache(userId) : null;
    initRef.current = { data: cached ? buildTransactionData(cached) : null, hasCache: !!cached };
  }

  const [data, setData] = useState<TransactionData | null>(initRef.current.data);
  const [loading, setLoading] = useState(!initRef.current.hasCache);
  const [error, setError] = useState<string | null>(null);

  const applyTransactions = useCallback((userIdForCache: string, transactions: Transaction[]) => {
    const sorted = sortTransactions(transactions);
    writeTransactionCache(userIdForCache, sorted);
    setData(buildTransactionData(sorted));
    return sorted;
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setData(null);
      return;
    }

    if (!initRef.current?.hasCache) {
      setLoading(true);
    }
    setError(null);

    try {
      const transactionsRef = collection(db, 'users', userId, TRANSACTIONS_COLLECTION);
      const transactionsQuery = query(transactionsRef, orderBy('date', 'desc'));
      const transactionsSnap = await getDocs(transactionsQuery);

      const transactions: Transaction[] = transactionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));

      applyTransactions(userId, transactions);
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId, applyTransactions]);

  // Recomputes and writes a single product's `received`/`delta` from the transactions
  // already linked to it. Takes the current transactions array instead of re-reading
  // the whole transactions collection.
  const updateProductReceivedAmount = useCallback(async (
    productId: string,
    transactions: Transaction[],
    options?: { completeWorkflow?: boolean; refundDate?: string }
  ): Promise<void> => {
    if (!userId) return;

    try {
      const linkedTransactions = transactions.filter(
        transaction => transaction.linkedProductIds && transaction.linkedProductIds.includes(productId)
      );

      const productRef = doc(db, 'users', userId, 'products', productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = productSnap.data();
        const paid = productData.paid || 0;
        const currentStatus = productData.lastStatus;

        // Recompute lastStatus/statusChangedAt from the fields being written here —
        // the same bookkeeping saveProductToFirebase does on a manual edit. Without
        // this, a product completed via transaction-linking keeps whatever stale status
        // it had before, and the backend's stuck-item check keeps firing on it.
        const withStatus = (fields: Record<string, unknown>): Record<string, unknown> => {
          const merged = { ...productData, ...fields } as Product;
          const newStatus = getProductStatusType(merged);
          return {
            ...fields,
            lastStatus: newStatus,
            ...(newStatus !== currentStatus && { statusChangedAt: new Date().toISOString() }),
          };
        };

        if (productData.isVoid) {
          await updateDoc(productRef, withStatus({
            received: 0,
            delta: paid !== 0 ? -paid : null,
            updatedAt: serverTimestamp(),
          }));
          return;
        }

        if (linkedTransactions.length === 0) {
          await updateDoc(productRef, withStatus({
            received: null,
            delta: null,
            transactionIds: null,
            refundReceivedAt: null,
            updatedAt: serverTimestamp()
          }));
        } else {
          const totalReceived = linkedTransactions.reduce((sum, transaction) => {
            return sum + getTransactionProductShare(transaction, productId);
          }, 0);
          const transactionIds = linkedTransactions.map((t) => t.transactionId);
          const refundReceivedAt =
            options?.refundDate ||
            linkedTransactions[linkedTransactions.length - 1]?.date ||
            new Date().toISOString().slice(0, 10);

          const updates: Record<string, unknown> = {
            received: totalReceived,
            delta: totalReceived - paid,
            transactionIds,
            refundReceivedAt,
            updatedAt: serverTimestamp(),
          };

          if (options?.completeWorkflow && !productData.isVoid) {
            updates.orderPlaced = true;
            updates.orderDelivered = true;
            updates.reviewAdded = true;
            updates.reviewLive = true;
            updates.reviewSSSent = true;
          }

          await updateDoc(productRef, withStatus(updates));
        }
      }
    } catch (err) {
      console.error('Error updating product received amount:', err);
    }
  }, [userId]);

  const addTransactionToFirebase = useCallback(async (transaction: Transaction): Promise<boolean> => {
    if (!userId) return false;

    try {
      if (transaction.type === 'User Initiated Withdrawal') {
        return false;
      }

      const existing = data?.transactions ?? [];
      if (existing.some(t => t.transactionId === transaction.transactionId)) {
        return false; // Transaction already exists — checked against already-loaded data
      }

      const transactionData = {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'users', userId, TRANSACTIONS_COLLECTION), transactionData);

      applyTransactions(userId, [...existing, { ...transaction, id: docRef.id }]);

      return true;
    } catch (err) {
      console.error('Error adding transaction to Firebase:', err);
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      return false;
    }
  }, [userId, data, applyTransactions]);

  const importTransactionsFromCSV = useCallback(async (
    transactions: Transaction[]
  ): Promise<{ added: number; skipped: number; withdrawalSkipped: number }> => {
    if (!userId) return { added: 0, skipped: 0, withdrawalSkipped: 0 };

    const existingIds = new Set((data?.transactions ?? []).map(t => t.transactionId));
    let withdrawalSkipped = 0;
    let skipped = 0;
    const toAdd: Transaction[] = [];

    for (const transaction of transactions) {
      if (transaction.type === 'User Initiated Withdrawal') {
        withdrawalSkipped++;
        continue;
      }
      if (existingIds.has(transaction.transactionId)) {
        skipped++;
        continue;
      }
      existingIds.add(transaction.transactionId); // guard against dupes within the same CSV
      toAdd.push(transaction);
    }

    const transactionsRef = collection(db, 'users', userId, TRANSACTIONS_COLLECTION);
    const created: Transaction[] = [];

    for (let i = 0; i < toAdd.length; i += BATCH_CHUNK_SIZE) {
      const chunk = toAdd.slice(i, i + BATCH_CHUNK_SIZE);
      const batch = writeBatch(db);
      const chunkCreated: Transaction[] = [];

      for (const transaction of chunk) {
        const docRef = doc(transactionsRef);
        batch.set(docRef, {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        chunkCreated.push({ ...transaction, id: docRef.id });
      }

      try {
        await batch.commit();
        created.push(...chunkCreated);
      } catch (err) {
        console.error('Error batch-importing transactions:', err);
        skipped += chunk.length;
      }
    }

    if (created.length > 0) {
      applyTransactions(userId, [...(data?.transactions ?? []), ...created]);
    }

    return { added: created.length, skipped, withdrawalSkipped };
  }, [userId, data, applyTransactions]);

  const updateTransactionProductLink = useCallback(async (
    transactionId: string,
    linkedProductIds: string[],
    options?: ProductLinkOptions
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const currentTransactions = data?.transactions ?? [];
      const currentTransaction = currentTransactions.find(t => t.id === transactionId);
      const previousLinkedProductIds = currentTransaction?.linkedProductIds || [];

      const hasCustomSplit =
        linkedProductIds.length >= 2 &&
        options?.customSplitAmounts != null &&
        linkedProductIds.every((id) => options.customSplitAmounts![id] != null);

      const shouldEqualSplit =
        !hasCustomSplit &&
        linkedProductIds.length >= 2 &&
        options?.splitPrice === true;

      const transactionRef = doc(db, 'users', userId, TRANSACTIONS_COLLECTION, transactionId);
      const nextLinkedProductIds = linkedProductIds.length > 0 ? linkedProductIds : undefined;
      const nextSplitPrice = shouldEqualSplit ? true : undefined;
      const nextProductSplitAmounts = hasCustomSplit ? options!.customSplitAmounts! : undefined;

      await updateDoc(transactionRef, {
        linkedProductIds: nextLinkedProductIds ?? null,
        splitPrice: nextSplitPrice ?? null,
        productSplitAmounts: nextProductSplitAmounts ?? null,
        updatedAt: serverTimestamp()
      });

      // Apply the same change locally instead of re-reading the whole collection.
      const updatedTransactions = currentTransactions.map(t =>
        t.id === transactionId
          ? { ...t, linkedProductIds: nextLinkedProductIds, splitPrice: nextSplitPrice, productSplitAmounts: nextProductSplitAmounts }
          : t
      );
      applyTransactions(userId, updatedTransactions);

      const completeWorkflow =
        options?.completeWorkflow === true &&
        linkedProductIds.length === 1;

      for (const prevProductId of previousLinkedProductIds) {
        if (!linkedProductIds.includes(prevProductId)) {
          await updateProductReceivedAmount(prevProductId, updatedTransactions);
        }
      }

      for (const productId of linkedProductIds) {
        const isNewLink = !previousLinkedProductIds.includes(productId);
        const shouldComplete = completeWorkflow && isNewLink;
        await updateProductReceivedAmount(productId, updatedTransactions, {
          completeWorkflow: shouldComplete,
          refundDate: currentTransaction?.date,
        });
      }

      return true;
    } catch (err) {
      console.error('Error updating transaction product link:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product link');
      return false;
    }
  }, [userId, data, applyTransactions, updateProductReceivedAmount]);

  const updateTransactionInFirebase = useCallback(async (
    docId: string,
    transaction: Transaction
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      if (transaction.type === 'User Initiated Withdrawal') {
        return false;
      }

      const currentTransactions = data?.transactions ?? [];
      const isDuplicate = currentTransactions.some(
        (t) => t.id !== docId && t.transactionId === transaction.transactionId
      );
      if (isDuplicate) {
        setError('A transaction with this Transaction ID already exists');
        return false;
      }

      const current = currentTransactions.find(t => t.id === docId);
      const linkedProductIds = current?.linkedProductIds || [];

      const transactionRef = doc(db, 'users', userId, TRANSACTIONS_COLLECTION, docId);
      const updates = {
        date: transaction.date,
        time: transaction.time,
        timeZone: transaction.timeZone,
        name: transaction.name,
        type: transaction.type,
        currency: transaction.currency,
        amount: transaction.amount,
        fees: transaction.fees,
        total: transaction.total,
        transactionId: transaction.transactionId,
        itemTitle: transaction.itemTitle || undefined,
        receiptId: transaction.receiptId || undefined,
        exchangeRate: transaction.exchangeRate || undefined,
        paymentMethod: transaction.paymentMethod || undefined,
      };

      await updateDoc(transactionRef, {
        ...updates,
        itemTitle: updates.itemTitle ?? null,
        receiptId: updates.receiptId ?? null,
        exchangeRate: updates.exchangeRate ?? null,
        paymentMethod: updates.paymentMethod ?? null,
        updatedAt: serverTimestamp(),
      });

      const updatedTransactions = currentTransactions.map(t =>
        t.id === docId ? { ...t, ...updates } : t
      );
      applyTransactions(userId, updatedTransactions);

      for (const productId of linkedProductIds) {
        await updateProductReceivedAmount(productId, updatedTransactions);
      }

      return true;
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      return false;
    }
  }, [userId, data, applyTransactions, updateProductReceivedAmount]);

  const deleteTransactionFromFirebase = useCallback(async (transactionId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const transactionRef = doc(db, 'users', userId, TRANSACTIONS_COLLECTION, transactionId);
      await deleteDoc(transactionRef);

      const remaining = (data?.transactions ?? []).filter(t => t.id !== transactionId);
      applyTransactions(userId, remaining);

      return true;
    } catch (err) {
      console.error('Error deleting transaction from Firebase:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      return false;
    }
  }, [userId, data, applyTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const value: TransactionsContextValue = {
    data,
    loading,
    error,
    refetch: fetchTransactions,
    addTransaction: addTransactionToFirebase,
    importTransactions: importTransactionsFromCSV,
    updateTransaction: updateTransactionInFirebase,
    deleteTransaction: deleteTransactionFromFirebase,
    updateProductLink: updateTransactionProductLink
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = (): TransactionsContextValue => {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return ctx;
};
