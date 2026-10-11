import React, { useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const TRIGGER_STATUS_CHECK_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/triggerStuckStatusCheck';

interface StuckItemNotificationSettingsProps {
  /** Shows the manual "Push notification" test trigger — a Superpower-mode-only tool. */
  showTestTrigger?: boolean;
}

export const StuckItemNotificationSettings: React.FC<StuckItemNotificationSettingsProps> = ({ showTestTrigger = false }) => {
  const { status, error, enable, disable } = usePushNotifications();
  const {
    stuckStatusDays,
    stuckStatusEnabled,
    loading: settingsLoading,
    setStuckStatusDays,
    setStuckStatusEnabled,
  } = useNotificationSettings();

  const isSubscribed = status === 'subscribed';
  const isLoading = status === 'loading';

  const [stuckDaysDraft, setStuckDaysDraft] = useState(stuckStatusDays);
  const [isSavingStuckDays, setIsSavingStuckDays] = useState(false);
  const [stuckDaysSaved, setStuckDaysSaved] = useState(false);

  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushResult, setPushResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    if (!settingsLoading) setStuckDaysDraft(stuckStatusDays);
  }, [settingsLoading, stuckStatusDays]);

  const isStuckDaysDirty = !settingsLoading && stuckDaysDraft !== stuckStatusDays;

  const handleSaveStuckDays = async () => {
    if (stuckDaysDraft < 1) return;
    setIsSavingStuckDays(true);
    try {
      await setStuckStatusDays(stuckDaysDraft);
      setStuckDaysSaved(true);
      setTimeout(() => setStuckDaysSaved(false), 2000);
    } finally {
      setIsSavingStuckDays(false);
    }
  };

  const handleToggleStuckStatus = async (enabled: boolean) => {
    await setStuckStatusEnabled(enabled);
    if (enabled) {
      if (!isSubscribed) await enable();
    } else if (isSubscribed) {
      await disable();
    }
  };

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
          <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center shrink-0">
            <BellIcon className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={typography.sectionTitle}>Stuck-item notifications</h2>
              <ToggleSwitch
                checked={stuckStatusEnabled && isSubscribed}
                onChange={handleToggleStuckStatus}
                disabled={settingsLoading || isLoading}
                label="Stuck-item notifications"
              />
            </div>
            <p className={typography.caption}>
              Get a push notification when a product sits in the same status too long, so you don&apos;t have
              to keep checking the dashboard.
            </p>

            <div className={`flex flex-wrap items-center gap-3 ${stuckStatusEnabled ? '' : 'opacity-50'}`}>
              <label htmlFor="stuck-status-days" className="text-sm font-medium">
                Remind me if stuck for
              </label>
              <Input
                id="stuck-status-days"
                type="number"
                min={1}
                value={stuckDaysDraft}
                onChange={(e) => setStuckDaysDraft(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-9 w-20 rounded-lg px-2 text-center"
              />
              <span className="text-sm">days in the same status</span>

              <Button
                variant="secondary"
                onClick={handleSaveStuckDays}
                disabled={!isStuckDaysDirty || isSavingStuckDays}
                className="py-1.5 rounded-lg"
              >
                {isSavingStuckDays ? 'Saving...' : 'Save'}
              </Button>

              {stuckDaysSaved && <span className="text-sm text-brand">Saved</span>}
            </div>

            {status === 'unsupported' && (
              <div className="bg-status-amber/10 border border-status-amber/30 text-status-amber-fg p-3 rounded-xl text-sm">
                Push notifications aren&apos;t supported in this browser. On iPhone/iPad, install this app to
                your Home Screen first (Share → Add to Home Screen), then enable notifications from there.
              </div>
            )}

            {status === 'unconfigured' && (
              <div className="bg-status-amber/10 border border-status-amber/30 text-status-amber-fg p-3 rounded-xl text-sm">
                Push notifications aren&apos;t configured for this app yet.
              </div>
            )}

            {status === 'denied' && (
              <div className="bg-destructive-container/60 border border-destructive/25 text-destructive p-3 rounded-xl text-sm">
                Notifications are blocked for this site. Enable them in your browser or device settings, then reload this page.
              </div>
            )}

            {error && (
              <div className="bg-destructive-container/60 border border-destructive/25 text-destructive p-3 rounded-xl text-sm">{error}</div>
            )}
          </div>
        </div>

        {showTestTrigger && (
          <div className="mt-6 pt-5 border-t border-input/15 space-y-3">
            <p className={typography.caption}>
              Trigger an immediate check for stuck items and send any pending push notifications now, instead of
              waiting for the next scheduled run.
            </p>

            {pushResult && (
              <div className={`p-3 rounded-xl text-sm ${
                pushResult.failed === 0
                  ? 'bg-brand/8 text-brand border border-brand/25'
                  : 'bg-destructive-container/60 text-destructive border border-destructive/25'
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
              <Button
                variant="secondary"
                onClick={handleSendPush}
                disabled={isSendingPush}
                className="w-full sm:w-auto px-6 rounded-xl"
              >
                {isSendingPush ? 'Sending...' : 'Push notification'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
