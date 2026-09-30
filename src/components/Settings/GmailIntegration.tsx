import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useGmailAccounts } from '../../hooks/useGmailAccounts';
import { Retailer } from '../../types/Product';
import { typography } from '../../utils/typography';
import { colors, getBadgeClasses } from '../../utils/colors';

const TRIGGER_GMAIL_CHECK_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/triggerGmailCheck';

const RETAILER_OPTIONS: { value: Retailer; label: string; available: boolean }[] = [
  { value: 'amazon', label: 'Amazon', available: true },
  { value: 'wayfair', label: 'Wayfair', available: true },
  { value: 'walmart', label: 'Walmart', available: false },
];

export const GmailIntegration: React.FC = () => {
  const { accounts, loading, connectUrl, toggleRetailer, disconnectAccount } = useGmailAccounts();
  const [searchParams] = useSearchParams();
  const gmailParam = searchParams.get('gmail');

  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ notified: number; ordersDetected: number } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const anyConnected = accounts.some((a) => a.connected);

  const handleCheckNow = async (ignoreCursors = false) => {
    setIsChecking(true);
    setCheckError(null);
    try {
      const url = ignoreCursors ? `${TRIGGER_GMAIL_CHECK_URL}?ignoreCursors=true` : TRIGGER_GMAIL_CHECK_URL;
      const response = await fetch(url, { method: 'POST' });
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

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingId(accountId);
    try {
      await disconnectAccount(accountId);
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#ba1a1a]/8 text-[#ba1a1a] border border-[#ba1a1a]/20 flex items-center justify-center shrink-0">
              <EnvelopeIcon className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <h2 className={typography.sectionTitle}>Gmail watcher</h2>
              <p className={typography.caption}>
                Connect one Gmail account per store (e.g. a Wayfair inbox, a Walmart inbox, a separate Amazon
                account) and we&apos;ll check each one hourly for the retailers you pick below — review pushes
                send a reminder, orders get drafted for you to review and add. This never reads your emails for
                anything else, and never changes a product automatically.
              </p>

              {gmailParam === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">
                  Couldn&apos;t connect Gmail. Please try again.
                </div>
              )}

              {gmailParam === 'connected' && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-sm">
                  Gmail connected.
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
            {anyConnected && (
              <button
                onClick={() => handleCheckNow()}
                disabled={isChecking}
                className={`${colors.button.secondary} w-full lg:w-auto px-6 py-2.5 rounded-xl font-medium text-sm text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isChecking ? 'Checking...' : 'Check Gmail now'}
              </button>
            )}
            {anyConnected && (
              <div className="w-full lg:w-auto lg:max-w-[220px]">
                <button
                  onClick={() => handleCheckNow(true)}
                  disabled={isChecking}
                  className={`${colors.button.secondary} w-full px-6 py-2.5 rounded-xl font-medium text-sm text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isChecking ? 'Checking...' : 'Re-scan all (testing)'}
                </button>
                <p className={`${typography.caption} mt-1`}>
                  Re-checks every matching email across every connected account from the very beginning, not just
                  since the last check.
                </p>
              </div>
            )}
            {connectUrl && (
              <a
                href={connectUrl}
                className={`block w-full lg:w-auto lg:inline-block shrink-0 ${colors.button.primary} px-6 py-2.5 rounded-xl font-medium text-sm text-center transition-colors`}
              >
                {accounts.length > 0 ? 'Add another Gmail' : 'Connect Gmail'}
              </a>
            )}
          </div>
        </div>

        {!loading && accounts.length > 0 && (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className={`rounded-xl border p-4 ${colors.card.border}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <span className={getBadgeClasses(account.connected ? 'complete' : 'refund-pending')}>
                      {account.connected ? 'Connected' : 'Not connected'}
                    </span>
                    <span className="font-medium text-sm truncate">{account.emailAddress ?? 'Unknown account'}</span>
                    {account.lastCheckedAt && (
                      <span className={typography.caption}>
                        Last checked {new Date(account.lastCheckedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!account.connected && connectUrl && (
                      <a
                        href={connectUrl}
                        className={`${colors.button.secondary} px-4 py-1.5 rounded-lg font-medium text-sm text-center transition-colors`}
                      >
                        Reconnect
                      </a>
                    )}
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnectingId === account.id}
                      title="Disconnect this Gmail account"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {!account.connected && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2.5 rounded-lg text-sm mt-3">
                    You&apos;ll need to reconnect roughly every 7 days — Google requires that until this app goes
                    through full verification.
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className={typography.caption}>Watch this inbox for:</span>
                  {RETAILER_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 text-sm ${opt.available ? '' : 'opacity-50 cursor-not-allowed'}`}
                      title={opt.available ? undefined : 'Coming soon — order/review parsing for this retailer isn\'t built yet'}
                    >
                      <input
                        type="checkbox"
                        disabled={!opt.available}
                        checked={account.retailers.includes(opt.value)}
                        onChange={(e) => toggleRetailer(account.id, opt.value, e.target.checked)}
                        className="rounded"
                      />
                      {opt.label}
                      {!opt.available && <span className={typography.caption}>(Coming soon)</span>}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
