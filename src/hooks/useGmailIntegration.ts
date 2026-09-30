import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';

const GMAIL_OAUTH_START_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/gmailOAuthStart';

interface GmailStatus {
  connected: boolean;
  connectedAt?: string;
  lastCheckedAt?: string | null;
  lastOrderCheckedAt?: string | null;
  emailAddress?: string | null;
}

export const useGmailIntegration = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.uid, 'integrations', 'gmailStatus');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setStatus(snap.exists() ? (snap.data() as GmailStatus) : null);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  const connectUrl = user ? `${GMAIL_OAUTH_START_URL}?uid=${user.uid}` : null;

  return {
    connected: status?.connected === true,
    lastCheckedAt: status?.lastCheckedAt ?? null,
    emailAddress: status?.emailAddress ?? null,
    loading,
    connectUrl,
  };
};
