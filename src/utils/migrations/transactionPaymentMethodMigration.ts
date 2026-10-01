import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Firestore collection is still physically named `paypal_transactions` — see the
// note in src/contexts/TransactionsContext.tsx.
const TRANSACTIONS_COLLECTION = 'paypal_transactions';

// Firestore batched writes cap at 500 operations; chunk to stay under that.
const CHUNK_SIZE = 450;

/**
 * Backfills `paymentMethod` on any transaction docs that predate the field,
 * defaulting them to "PayPal" (the only source transactions came from before
 * this feature existed). Returns the number of docs updated.
 */
export async function backfillTransactionsWithPaymentMethod(userId: string): Promise<number> {
  const transactionsCollection = collection(db, `users/${userId}/${TRANSACTIONS_COLLECTION}`);
  const snapshot = await getDocs(transactionsCollection);

  const missing = snapshot.docs.filter(
    (d) => !d.data().hasOwnProperty('paymentMethod') || d.data().paymentMethod == null
  );

  if (missing.length === 0) return 0;

  let updated = 0;
  for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
    const chunk = missing.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((d) => {
      batch.update(doc(db, `users/${userId}/${TRANSACTIONS_COLLECTION}`, d.id), { paymentMethod: 'PayPal' });
    });
    await batch.commit();
    updated += chunk.length;
  }
  return updated;
}
