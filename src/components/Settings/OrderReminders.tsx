import React, { useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';

const TRIGGER_STATUS_CHECK_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/triggerStuckStatusCheck';

interface OrderRemindersProps {
  /** Shows the manual "Push notification" test trigger — a Superpower-mode-only tool. */
  showTestTrigger?: boolean;
}

// Combines the former separate Stuck-item notifications and Return reminder
// cards into one, with a single "Save changes" button for all four
// underlying settings fields. The two reminders are independent — no master
// toggle gates them.
export const OrderReminders: React.FC<OrderRemindersProps> = ({ showTestTrigger = false }) => {
  const { status, error: pushError, enable, disable } = usePushNotifications();
  const {
    stuckStatusEnabled,
    stuckStatusDays,
    returnReminderEnabled,
    returnReminderDays,
    loading: settingsLoading,
    updateOrderReminderSettings,
  } = useNotificationSettings();

  const isSubscribed = status === 'subscribed';

  const [stalledEnabledDraft, setStalledEnabledDraft] = useState(stuckStatusEnabled);
  const [stalledDaysDraft, setStalledDaysDraft] = useState(stuckStatusDays);
  const [returnEnabledDraft, setReturnEnabledDraft] = useState(returnReminderEnabled);
  const [returnDaysDraft, setReturnDaysDraft] = useState(returnReminderDays);

  useEffect(() => {
    if (settingsLoading) return;
    setStalledEnabledDraft(stuckStatusEnabled);
    setStalledDaysDraft(stuckStatusDays);
    setReturnEnabledDraft(returnReminderEnabled);
    setReturnDaysDraft(returnReminderDays);
  }, [settingsLoading, stuckStatusEnabled, stuckStatusDays, returnReminderEnabled, returnReminderDays]);

  const isDirty = !settingsLoading && (
    stalledEnabledDraft !== stuckStatusEnabled ||
    stalledDaysDraft !== stuckStatusDays ||
    returnEnabledDraft !== returnReminderEnabled ||
    returnDaysDraft !== returnReminderDays
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (stalledDaysDraft < 1 || returnDaysDraft < 1) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateOrderReminderSettings({
        stuckStatusEnabled: stalledEnabledDraft,
        stuckStatusDays: stalledDaysDraft,
        returnReminderEnabled: returnEnabledDraft,
        returnReminderDays: returnDaysDraft,
      });

      // Reconcile the actual browser push subscription with the stalled-reminder toggle.
      if (stalledEnabledDraft && !isSubscribed) await enable();
      else if (!stalledEnabledDraft && isSubscribed) await disable();

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushResult, setPushResult] = useState<{ sent: number; failed: number } | null>(null);

  const handleSendPush = async () => {
    setIsSendingPush(true);
    try {
      const response = await fetch(TRIGGER_STATUS_CHECK_URL, { method: 'POST' });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const result = await response.json();
      setPushResult({ sent: result.totalPushSent ?? 0, failed: result.totalPushFailed ?? 0 });
    } catch (err) {
      console.error('Error sending push notifications:', err);
      setPushResult({ sent: 0, failed: 1 });
    } finally {
      setIsSendingPush(false);
    }
  };

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#006a68]/10 text-[#006a68] border border-[#006a68]/20 flex items-center justify-center shrink-0">
            <BellIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className={typography.sectionTitle}>Order reminders</h2>
            <p className={typography.caption}>
              Set up reminders so you never miss an important update.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[rgba(196,198,207,0.15)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={typography.bodyStrong}>Stalled order reminders</h3>
            <ToggleSwitch
              checked={stalledEnabledDraft}
              onChange={setStalledEnabledDraft}
              disabled={settingsLoading || isSaving}
              label="Stalled order reminders"
            />
          </div>
          <p className={typography.caption}>
            Get a reminder when an order hasn&apos;t changed status for a set number of days.
          </p>
          <div className={`flex flex-wrap items-center gap-3 ${stalledEnabledDraft ? '' : 'opacity-50'}`}>
            <label htmlFor="stalled-reminder-days" className="text-sm font-medium">
              Remind me after
            </label>
            <input
              id="stalled-reminder-days"
              type="number"
              min={1}
              value={stalledDaysDraft}
              onChange={(e) => setStalledDaysDraft(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={isSaving}
              className="w-20 px-3 py-1.5 rounded-lg border border-[rgba(196,198,207,0.4)] text-sm text-center disabled:opacity-60"
            />
            <span className="text-sm">days without a status change</span>
          </div>

          {status === 'unsupported' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-sm">
              Push notifications aren&apos;t supported in this browser. On iPhone/iPad, install this app to
              your Home Screen first (Share → Add to Home Screen), then enable notifications from there.
            </div>
          )}
          {status === 'unconfigured' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-sm">
              Push notifications aren&apos;t configured for this app yet.
            </div>
          )}
          {status === 'denied' && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">
              Notifications are blocked for this site. Enable them in your browser or device settings, then reload this page.
            </div>
          )}
          {pushError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">{pushError}</div>
          )}

          {showTestTrigger && (
            <div className="pt-3 space-y-3">
              <p className={typography.caption}>
                Trigger an immediate check for stuck items and send any pending push notifications now, instead of
                waiting for the next scheduled run.
              </p>
              {pushResult && (
                <div className={`p-3 rounded-xl text-sm ${
                  pushResult.failed === 0
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {pushResult.sent > 0 && (
                    <div>✅ {pushResult.sent} push notification{pushResult.sent === 1 ? '' : 's'} sent</div>
                  )}
                  {pushResult.failed > 0 && (
                    <div>❌ {pushResult.failed} push notification{pushResult.failed === 1 ? '' : 's'} failed</div>
                  )}
                  {pushResult.sent === 0 && pushResult.failed === 0 && (
                    <div>ℹ️ No pending notifications right now</div>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-end">
                <button
                  onClick={handleSendPush}
                  disabled={isSendingPush}
                  className={`${colors.button.secondary} w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSendingPush ? 'Sending...' : 'Push notification'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-[rgba(196,198,207,0.15)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={typography.bodyStrong}>Return reminders</h3>
            <ToggleSwitch
              checked={returnEnabledDraft}
              onChange={setReturnEnabledDraft}
              disabled={settingsLoading || isSaving}
              label="Return reminders"
            />
          </div>
          <p className={typography.caption}>
            Get daily reminders when an order hasn&apos;t been refunded after a set number of days.
          </p>
          <div className={`flex flex-wrap items-center gap-3 ${returnEnabledDraft ? '' : 'opacity-50'}`}>
            <label htmlFor="return-reminder-days" className="text-sm font-medium">
              Start reminding me
            </label>
            <input
              id="return-reminder-days"
              type="number"
              min={1}
              value={returnDaysDraft}
              onChange={(e) => setReturnDaysDraft(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={isSaving}
              className="w-20 px-3 py-1.5 rounded-lg border border-[rgba(196,198,207,0.4)] text-sm text-center disabled:opacity-60"
            />
            <span className="text-sm">days after purchase</span>
          </div>
        </div>

        {saveError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">{saveError}</div>
        )}

        <div className="mt-6 pt-5 border-t border-[rgba(196,198,207,0.15)] flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-green-700">Saved</span>}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`${colors.button.primary} px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </section>
  );
};
