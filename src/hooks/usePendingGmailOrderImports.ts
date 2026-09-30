import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { BookmarkletPayload } from '../utils/bookmarklet';

export interface PendingGmailImport {
  id: string;
  payload: BookmarkletPayload;
  detectedAt?: string;
}

// Gmail-detected order drafts, written server-side to
// users/{uid}/pendingGmailImports by the checkGmailForReviewLive function.
// Shaped as BookmarkletPayload so they can feed the same Add Product
// prefill flow the bookmarklet import already uses.
export function usePendingGmailOrderImports() {
  const { user } = useAuth();
  const [pendingImports, setPendingImports] = useState<PendingGmailImport[]>([]);

  useEffect(() => {
    if (!user) {
      setPendingImports([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'pendingGmailImports'),
      orderBy('detectedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingImports(
        snapshot.docs.map((docSnap) => {
          const { detectedAt, ...payload } = docSnap.data() as BookmarkletPayload & { detectedAt?: string };
          return { id: docSnap.id, payload, detectedAt };
        })
      );
    });

    return () => unsubscribe();
  }, [user]);

  const dismiss = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'pendingGmailImports', id));
  };

  return { pendingImports, dismiss };
}
