import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

interface OnboardingStatusState {
  completed: boolean;
  currentStep: number;
}

interface OnboardingStatusContextValue extends OnboardingStatusState {
  loading: boolean;
  setCurrentStep: (step: number) => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

// No user signed in — irrelevant, never triggers a redirect on its own.
const SIGNED_OUT_DEFAULTS: OnboardingStatusState = { completed: true, currentStep: 0 };

// A signed-in user with no onboarding doc yet — whether brand new or an
// existing account that predates this feature — is treated as not having
// completed onboarding, so they'll see the wizard. The doc gets created the
// first time setCurrentStep/markOnboardingComplete writes to it (setDoc with
// merge creates it if absent), so no separate backfill is needed.
const NOT_ONBOARDED_DEFAULTS: OnboardingStatusState = { completed: false, currentStep: 0 };

const OnboardingStatusContext = createContext<OnboardingStatusContextValue | null>(null);

// A single onSnapshot subscription for the whole app. App.tsx and
// OnboardingPage.tsx each used to run their own independent copy of this —
// two separate listeners deciding, on their own timing, whether to redirect
// to "/onboarding" or to "/products". Any momentary disagreement between
// them turned into a redirect ping-pong (and a remount storm underneath it,
// since App's layout — and everything nested in it — tears down and rebuilds
// on every bounce). Sharing one subscription makes that disagreement
// impossible: every consumer reads the exact same state at the exact same
// time.
export const OnboardingStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingStatusState>(SIGNED_OUT_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setState(SIGNED_OUT_DEFAULTS);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.uid, 'settings', 'onboarding');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState(NOT_ONBOARDED_DEFAULTS);
          setLoading(false);
          return;
        }
        const data = snap.data();
        setState({
          completed: data?.completed === true,
          currentStep: typeof data?.currentStep === 'number' ? data.currentStep : 0,
        });
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (partial: Partial<OnboardingStatusState>) => {
    if (!user) return;
    await setDoc(
      doc(db, 'users', user.uid, 'settings', 'onboarding'),
      { ...partial, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return (
    <OnboardingStatusContext.Provider
      value={{
        ...state,
        loading,
        setCurrentStep: (step: number) => updateStatus({ currentStep: step }),
        markOnboardingComplete: () => updateStatus({ completed: true }),
      }}
    >
      {children}
    </OnboardingStatusContext.Provider>
  );
};

export const useOnboardingStatus = () => {
  const ctx = useContext(OnboardingStatusContext);
  if (!ctx) {
    throw new Error('useOnboardingStatus must be used within an OnboardingStatusProvider');
  }
  return ctx;
};
