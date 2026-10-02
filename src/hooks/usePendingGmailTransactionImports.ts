import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { Transaction } from '../types/Transaction';

export interface PendingGmailTransactionImport {
  id: string;
  payload: Omit<Transaction, 'id'>;
  detectedAt?: string;
  rawSubject?: string;
}

// Gmail-detected PayPal transaction drafts, written server-side to
// users/{uid}/pendingGmailTransactionImports by runGmailReviewCheck. Shaped
// to match Transaction so a confirmed draft can go straight into
// addTransaction without any new mapping logic.
export function usePendingGmailTransactionImports() {
  const { user } = useAuth();
  const [pendingImports, setPendingImports] = useState<PendingGmailTransactionImport[]>([]);

  useEffect(() => {
    if (!user) {
      setPendingImports([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'pendingGmailTransactionImports'),
      orderBy('detectedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingImports(
        snapshot.docs.map((docSnap) => {
          const { detectedAt, rawSubject, sourceAccountId, sourceEmail, ...payload } = docSnap.data() as Omit<Transaction, 'id'> & {
            detectedAt?: string;
            rawSubject?: string;
            sourceAccountId?: string;
            sourceEmail?: string;
          };
          return { id: docSnap.id, payload: payload as Omit<Transaction, 'id'>, detectedAt, rawSubject };
        })
      );
    });

    return () => unsubscribe();
  }, [user]);

  const dismiss = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'pendingGmailTransactionImports', id));
  };

  return { pendingImports, dismiss };
}
