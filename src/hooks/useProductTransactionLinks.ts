import { useMemo } from 'react';
import { Transaction } from '../types/Transaction';
import { getTransactionProductShare } from '../utils/transactionProductShare';
import { useTransactions } from './useTransactions';

export interface ProductTransactionLink {
  amount: number;
  transactionId: string;
}

function getProductShareFromTransaction(
  transaction: Transaction,
  productId: string,
): ProductTransactionLink | null {
  const linkedIds = transaction.linkedProductIds || [];
  if (!linkedIds.includes(productId) || transaction.total == null) return null;

  return {
    amount: getTransactionProductShare(transaction, productId),
    transactionId: transaction.transactionId || '',
  };
}

// Derives per-product transaction links from the already-fetched, shared transactions
// list (see TransactionsProvider) instead of independently re-reading the whole
// transactions collection every time a product table mounts.
export const useProductTransactionLinks = (_userId?: string, productIds?: string[]) => {
  const { data, loading } = useTransactions();

  const { linkedProductIds, linkedTransactionsByProduct } = useMemo(() => {
    const linkedIds = new Set<string>();
    const linksMap = new Map<string, ProductTransactionLink[]>();

    if (!productIds || productIds.length === 0 || !data?.transactions) {
      return { linkedProductIds: linkedIds, linkedTransactionsByProduct: linksMap };
    }

    for (const transaction of data.transactions) {
      const linkedIdsOnTransaction = transaction.linkedProductIds;
      if (!linkedIdsOnTransaction || !Array.isArray(linkedIdsOnTransaction)) continue;

      for (const linkedId of linkedIdsOnTransaction) {
        if (!productIds.includes(linkedId)) continue;

        linkedIds.add(linkedId);
        const link = getProductShareFromTransaction(transaction, linkedId);
        if (!link) continue;

        const existing = linksMap.get(linkedId) || [];
        linksMap.set(linkedId, [...existing, link]);
      }
    }

    return { linkedProductIds: linkedIds, linkedTransactionsByProduct: linksMap };
  }, [data?.transactions, productIds?.join(',')]);

  const isProductLinked = (productId: string): boolean => linkedProductIds.has(productId);
  const getLinkedTransactionLinks = (productId: string): ProductTransactionLink[] =>
    linkedTransactionsByProduct.get(productId) ?? [];
  const getLinkedAmount = (productId: string): number | null => {
    const links = getLinkedTransactionLinks(productId);
    if (links.length === 0) return null;
    return links.reduce((sum, link) => sum + link.amount, 0);
  };

  return {
    linkedProductIds,
    isProductLinked,
    getLinkedTransactionLinks,
    getLinkedAmount,
    loading,
  };
};
