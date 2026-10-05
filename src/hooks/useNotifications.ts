import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppNotification, NotificationKind } from '../types/Notification';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function mapNotificationDoc(id: string, data: Record<string, unknown>): AppNotification {
  return {
    id,
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    url: (data.url as string | null | undefined) ?? null,
    tag: (data.tag as string | null | undefined) ?? null,
    kind: (data.kind as NotificationKind) ?? 'stuck_status',
    createdAt: toDate(data.createdAt),
    readAt: toDate(data.readAt),
  };
}

export function useNotifications(userId: string | undefined, listLimit = 50) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const ref = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(listLimit)
    );

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setNotifications(snapshot.docs.map((docSnap) => mapNotificationDoc(docSnap.id, docSnap.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('notifications listener failed:', err);
        setError(err.message || 'Could not load notifications');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, listLimit]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications]
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      const ref = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(ref, { readAt: new Date().toISOString() });
    },
    [userId]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    const readAt = new Date().toISOString();
    for (const notification of unread) {
      batch.update(doc(db, 'users', userId, 'notifications', notification.id), { readAt });
    }
    await batch.commit();
  }, [userId, notifications]);

  return { notifications, unreadCount, loading, error, markRead, markAllRead };
}
