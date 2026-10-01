import React, { useEffect, useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';

export const NotificationSettings: React.FC = () => {
  const { returnReminderDays, returnReminderEnabled, loading, setReturnReminderDays, setReturnReminderEnabled } =
    useNotificationSettings();
  const [draft, setDraft] = useState(returnReminderDays);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) setDraft(returnReminderDays);
  }, [loading, returnReminderDays]);

  const isDirty = !loading && draft !== returnReminderDays;

  const handleSave = async () => {
    if (draft < 1) return;
    setIsSaving(true);
    try {
      await setReturnReminderDays(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#006a68]/10 text-[#006a68] border border-[#006a68]/20 flex items-center justify-center shrink-0">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={typography.sectionTitle}>Return reminder</h2>
              <ToggleSwitch
                checked={returnReminderEnabled}
                onChange={setReturnReminderEnabled}
                disabled={loading}
                label="Return reminder notifications"
              />
            </div>
            <p className={typography.caption}>
              The main reminder: once an order has been outstanding this many days without a refund, you&apos;ll
              get a push every day until it&apos;s marked complete — so a return window never quietly closes on you.
            </p>

            <div className={`flex flex-wrap items-center gap-3 pt-1 ${returnReminderEnabled ? '' : 'opacity-50'}`}>
              <label htmlFor="return-reminder-days" className="text-sm font-medium">
                Remind me after
              </label>
              <input
                id="return-reminder-days"
                type="number"
                min={1}
                value={draft}
                onChange={(e) => setDraft(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 px-3 py-1.5 rounded-lg border border-[rgba(196,198,207,0.4)] text-sm text-center"
              />
              <span className="text-sm">days since order</span>

              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className={`${colors.button.secondary} px-4 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>

              {saved && <span className="text-sm text-green-700">Saved</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
