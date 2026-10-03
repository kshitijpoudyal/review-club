import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
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
  const { user, loading: authLoading } = useAuth();
  const [pendingImports, setPendingImports] = useState<PendingGmailTransactionImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [listenerError, setListenerError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPendingImports([]);
      setLoading(false);
      setListenerError(null);
      return;
    }

    setLoading(true);
    setListenerError(null);
    const ref = collection(db, 'users', user.uid, 'pendingGmailTransactionImports');

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setPendingImports(
          snapshot.docs
            .map((docSnap) => {
              const { detectedAt, rawSubject, sourceAccountId, sourceEmail, ...payload } = docSnap.data() as Omit<
                Transaction,
                'id'
              > & {
                detectedAt?: string;
                rawSubject?: string;
                sourceAccountId?: string;
                sourceEmail?: string;
              };
              return { id: docSnap.id, payload: payload as Omit<Transaction, 'id'>, detectedAt, rawSubject };
            })
            .sort((a, b) => (b.detectedAt ?? '').localeCompare(a.detectedAt ?? ''))
        );
        setLoading(false);
        setListenerError(null);
      },
      (err) => {
        console.error('pendingGmailTransactionImports listener failed:', err);
        setListenerError(err.message || 'Could not load PayPal review queue');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const dismiss = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'pendingGmailTransactionImports', id));
  };

  return { pendingImports, dismiss, loading, listenerError, pendingCount: pendingImports.length };
}
