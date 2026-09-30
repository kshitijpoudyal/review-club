import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { Retailer } from '../types/Product';

const GMAIL_OAUTH_START_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/gmailOAuthStart';
const DISCONNECT_GMAIL_ACCOUNT_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/disconnectGmailAccount';

export interface GmailAccount {
  id: string;
  emailAddress: string | null;
  connected: boolean;
  connectedAt?: string;
  lastCheckedAt?: string | null;
  retailers: Retailer[];
}

export const useGmailAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, 'users', user.uid, 'gmailAccounts');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setAccounts(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              emailAddress: data.emailAddress ?? null,
              connected: data.connected === true,
              connectedAt: data.connectedAt,
              lastCheckedAt: data.lastCheckedAt ?? null,
              retailers: data.retailers ?? [],
            };
          })
        );
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  const toggleRetailer = async (accountId: string, retailer: Retailer, enabled: boolean) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    const retailers = enabled
      ? [...account.retailers, retailer]
      : account.retailers.filter((r) => r !== retailer);
    await updateDoc(doc(db, 'users', user!.uid, 'gmailAccounts', accountId), { retailers });
  };

  const disconnectAccount = async (accountId: string) => {
    if (!user) return;
    await fetch(`${DISCONNECT_GMAIL_ACCOUNT_URL}?uid=${user.uid}&accountId=${accountId}`, { method: 'POST' });
  };

  const connectUrl = user ? `${GMAIL_OAUTH_START_URL}?uid=${user.uid}` : null;

  return {
    accounts,
    loading,
    connectUrl,
    toggleRetailer,
    disconnectAccount,
  };
};
