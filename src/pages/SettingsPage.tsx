import React, { useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { typography } from '../utils/typography';
import { colors } from '../utils/colors';
import { VendorSettings } from '../components/Settings/VendorSettings';
import { GmailIntegration } from '../components/Settings/GmailIntegration';
import { NotificationSettings } from '../components/Settings/NotificationSettings';
import { VendorAdminUtils } from '../components/VendorAdminUtils';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { BookmarkletSetupPanel } from '../components/ProductDashboard/BookmarkletSetupPanel';

const TRIGGER_STATUS_CHECK_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/triggerStuckStatusCheck';

const SettingsPage: React.FC = () => {
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

  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushResult, setPushResult] = useState<{ sent: number; failed: number } | null>(null);

  const [stuckDaysDraft, setStuckDaysDraft] = useState(stuckStatusDays);
  const [isSavingStuckDays, setIsSavingStuckDays] = useState(false);
  const [stuckDaysSaved, setStuckDaysSaved] = useState(false);

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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className={typography.pageTitle}>Settings</h1>
        <p className={`${typography.caption} mt-1`}>
          Manage notification triggers, connected integrations, and your vendor roster.
        </p>
      </div>

      <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#006a68]/10 text-[#006a68] border border-[#006a68]/20 flex items-center justify-center shrink-0">
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
                <input
                  id="stuck-status-days"
                  type="number"
                  min={1}
                  value={stuckDaysDraft}
                  onChange={(e) => setStuckDaysDraft(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-3 py-1.5 rounded-lg border border-[rgba(196,198,207,0.4)] text-sm text-center"
                />
                <span className="text-sm">days in the same status</span>

                <button
                  onClick={handleSaveStuckDays}
                  disabled={!isStuckDaysDirty || isSavingStuckDays}
                  className={`${colors.button.secondary} px-4 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSavingStuckDays ? 'Saving...' : 'Save'}
                </button>

                {stuckDaysSaved && <span className="text-sm text-green-700">Saved</span>}
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">{error}</div>
              )}

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
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[rgba(196,198,207,0.15)] flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              onClick={handleSendPush}
              disabled={isSendingPush}
              className={`${colors.button.secondary} w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSendingPush ? 'Sending...' : 'Push notification'}
            </button>
          </div>
        </div>
      </section>

      <NotificationSettings />

      <GmailIntegration />

      <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
        <div className="p-4 sm:p-6 md:p-8">
          <h2 className={typography.sectionTitle}>Browser shortcuts</h2>
          <p className={`${typography.caption} mt-1 mb-3`}>
            Set up a drag-to-bookmark shortcut to pre-fill the Add Product form straight from an order page.
          </p>
          <BookmarkletSetupPanel />
        </div>
      </section>

      <VendorSettings />

      <VendorAdminUtils />
    </div>
  );
};

export default SettingsPage;
