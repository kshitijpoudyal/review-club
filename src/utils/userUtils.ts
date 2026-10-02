import { doc, setDoc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase/config';

/**
 * Creates the user's Firestore doc on first sign-in and stamps lastLoginAt on
 * every sign-in thereafter. Returns true when the account was freshly created
 * (used to seed the onboarding tracker doc in the same batch — see the
 * `!userDoc.exists()` branch — never retroactively for existing accounts).
 */
export const initializeUserData = async (user: User): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    // Only create user document if it doesn't exist
    if (!userDoc.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      // Batched so the onboarding tracker can never exist without the user doc
      // (or vice versa) if one write fails — a partial result here would
      // permanently exempt a brand-new account from onboarding.
      const batch = writeBatch(db);
      batch.set(userDocRef, userData);
      batch.set(doc(db, 'users', user.uid, 'settings', 'onboarding'), {
        completed: false,
        currentStep: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      return true;
    } else {
      // Update last login time for existing users
      await setDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing user data:', error);
    throw error;
  }
};
