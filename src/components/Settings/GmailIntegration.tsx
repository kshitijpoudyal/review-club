import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useGmailIntegration } from '../../hooks/useGmailIntegration';
import { typography } from '../../utils/typography';
import { colors, getBadgeClasses } from '../../utils/colors';

const TRIGGER_GMAIL_CHECK_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/triggerGmailCheck';

export const GmailIntegration: React.FC = () => {
  const { connected, lastCheckedAt, emailAddress, loading, connectUrl } = useGmailIntegration();
  const [searchParams] = useSearchParams();
  const gmailParam = searchParams.get('gmail');

  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ notified: number; ordersDetected: number } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleCheckNow = async () => {
    setIsChecking(true);
    setCheckError(null);
    try {
      const response = await fetch(TRIGGER_GMAIL_CHECK_URL, { method: 'POST' });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const result = await response.json();
      setCheckResult({ notified: result.notified ?? 0, ordersDetected: result.ordersDetected ?? 0 });
    } catch (err) {
      console.error('Error triggering Gmail check:', err);
      setCheckError('Check failed — please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#ba1a1a]/8 text-[#ba1a1a] border border-[#ba1a1a]/20 flex items-center justify-center shrink-0">
              <EnvelopeIcon className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className={typography.sectionTitle}>Gmail watcher</h2>
                {!loading && (
                  <span className={getBadgeClasses(connected ? 'complete' : 'refund-pending')}>
                    {connected ? 'Connected' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className={typography.caption}>
                Connect Gmail and we&apos;ll check hourly for Amazon review-confirmation emails and new
                order confirmations — review pushes send a reminder, orders get drafted for you to review
                and add. This never reads your emails for anything else, and never changes a product
                automatically.
              </p>

              {gmailParam === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">
                  Couldn&apos;t connect Gmail. Please try again.
                </div>
              )}

              {gmailParam === 'connected' && connected && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-sm">
                  Gmail connected.
                </div>
              )}

              {connected && (
                <p className={typography.caption}>
                  {emailAddress ?? 'Unknown account'}
                  {lastCheckedAt && <> · Last checked {new Date(lastCheckedAt).toLocaleString()}</>}
                </p>
              )}

              {connected && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-sm">
                  You&apos;ll need to reconnect roughly every 7 days — Google requires that until this app
                  goes through full verification. We&apos;ll push a reminder notification when it expires.
                </div>
              )}

              {checkResult && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-sm">
                  Checked — {checkResult.notified} review alert{checkResult.notified === 1 ? '' : 's'},{' '}
                  {checkResult.ordersDetected} new order{checkResult.ordersDetected === 1 ? '' : 's'} detected.
                </div>
              )}
              {checkError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">{checkError}</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full lg:w-auto">
            {connected && (
              <button
                onClick={handleCheckNow}
                disabled={isChecking}
                className={`${colors.button.secondary} w-full lg:w-auto px-6 py-2.5 rounded-xl font-medium text-sm text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isChecking ? 'Checking...' : 'Check Gmail now'}
              </button>
            )}
            {connectUrl && (
              <a
                href={connectUrl}
                className={`block w-full lg:w-auto lg:inline-block shrink-0 ${connected ? colors.button.secondary : colors.button.primary} px-6 py-2.5 rounded-xl font-medium text-sm text-center transition-colors`}
              >
                {connected ? 'Reconnect Gmail' : 'Connect Gmail'}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
