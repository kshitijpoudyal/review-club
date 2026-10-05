import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from '../components/common';
import { AppNotification } from '../types/Notification';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const inbox = useNotifications(user?.uid, 50);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    if (inbox.loading) return;

    if (!primedRef.current) {
      inbox.notifications.forEach((n) => seenIdsRef.current.add(n.id));
      primedRef.current = true;
      return;
    }

    for (const notification of inbox.notifications) {
      if (notification.readAt) continue;
      if (seenIdsRef.current.has(notification.id)) continue;
      seenIdsRef.current.add(notification.id);
      showToast(notification.title, 'info');
    }
  }, [inbox.loading, inbox.notifications, showToast]);

  useEffect(() => {
    if (!user) {
      seenIdsRef.current.clear();
      primedRef.current = false;
    }
  }, [user]);

  return (
    <NotificationsContext.Provider value={inbox}>{children}</NotificationsContext.Provider>
  );
};

export function useNotificationInbox(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationInbox must be used within NotificationsProvider');
  }
  return ctx;
}
