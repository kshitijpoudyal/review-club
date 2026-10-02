import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';

// Keep in sync with the DEFAULT_* constants in functions/src/index.ts — the
// backend falls back to these same values when a user has no settings doc yet.
export const DEFAULT_RETURN_REMINDER_DAYS = 25;
export const DEFAULT_STUCK_STATUS_DAYS = 7;

interface NotificationSettingsState {
  returnReminderDays: number;
  stuckStatusDays: number;
  // All default to enabled — only an explicit `false` in Firestore turns one off.
  returnReminderEnabled: boolean;
  stuckStatusEnabled: boolean;
  gmailWatcherEnabled: boolean;
}

const DEFAULTS: NotificationSettingsState = {
  returnReminderDays: DEFAULT_RETURN_REMINDER_DAYS,
  stuckStatusDays: DEFAULT_STUCK_STATUS_DAYS,
  returnReminderEnabled: true,
  stuckStatusEnabled: true,
  gmailWatcherEnabled: true,
};

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettingsState>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULTS);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.uid, 'settings', 'notifications');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setSettings({
          returnReminderDays: typeof data?.returnReminderDays === 'number' ? data.returnReminderDays : DEFAULTS.returnReminderDays,
          stuckStatusDays: typeof data?.stuckStatusDays === 'number' ? data.stuckStatusDays : DEFAULTS.stuckStatusDays,
          returnReminderEnabled: data?.returnReminderEnabled !== false,
          stuckStatusEnabled: data?.stuckStatusEnabled !== false,
          gmailWatcherEnabled: data?.gmailWatcherEnabled !== false,
        });
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  const updateSettings = async (partial: Partial<NotificationSettingsState>) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), partial, { merge: true });
  };

  return {
    ...settings,
    loading,
    setReturnReminderDays: (days: number) => updateSettings({ returnReminderDays: days }),
    setStuckStatusDays: (days: number) => updateSettings({ stuckStatusDays: days }),
    setReturnReminderEnabled: (enabled: boolean) => updateSettings({ returnReminderEnabled: enabled }),
    setStuckStatusEnabled: (enabled: boolean) => updateSettings({ stuckStatusEnabled: enabled }),
    setGmailWatcherEnabled: (enabled: boolean) => updateSettings({ gmailWatcherEnabled: enabled }),
    // Bulk write for the Order reminders card's single "Save changes" button,
    // which persists both reminders' enabled/days fields in one go instead of
    // four separate writes.
    updateOrderReminderSettings: (partial: Partial<NotificationSettingsState>) => updateSettings(partial),
  };
};
