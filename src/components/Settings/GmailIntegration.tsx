import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon, EnvelopeIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useGmailAccounts, GmailWatchSource } from '../../hooks/useGmailAccounts';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { useAuth } from '../../hooks/useAuth';
import { usePendingGmailTransactionImports } from '../../hooks/usePendingGmailTransactionImports';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { typography } from '../../utils/typography';
import { colors, getBadgeClasses } from '../../utils/colors';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

const TRIGGER_GMAIL_CHECK_URL = 'https://us-central1-productreview-52e51.cloudfunctions.net/triggerGmailCheck';

const formatLastChecked = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const RETAILER_OPTIONS: { value: GmailWatchSource; label: string; available: boolean }[] = [
  { value: 'amazon', label: 'Amazon', available: true },
  { value: 'walmart', label: 'Walmart', available: true },
  { value: 'wayfair', label: 'Wayfair', available: true },
  { value: 'paypal', label: 'PayPal', available: true },
];

interface GmailIntegrationProps {
  /** Hide the internal "Re-scan all (testing)" action — defaults on for the
   * regular Settings page, off when embedded in the onboarding wizard. */
  showTestingActions?: boolean;
  /** Onboarding wizard: after connect, offer import-history vs new-mail-only sync. */
  onboardingMode?: boolean;
}

export const GmailIntegration: React.FC<GmailIntegrationProps> = ({
  showTestingActions = true,
  onboardingMode = false,
}) => {
  const { user } = useAuth();
  const { accounts, loading, connectUrl, toggleRetailer, disconnectAccount } = useGmailAccounts();
  const { gmailWatcherEnabled, loading: settingsLoading, setGmailWatcherEnabled } = useNotificationSettings();
  const { pendingCount: pendingPaypalCount } = usePendingGmailTransactionImports();
  const [searchParams] = useSearchParams();
  const gmailParam = searchParams.get('gmail');

  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    notified: number;
    ordersDetected: number;
    transactionsDetected: number;
    pendingPaypalQueue?: number;
    startFromNow?: boolean;
  } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [accountsExpanded, setAccountsExpanded] = useState(false);

  const anyConnected = accounts.some((a) => a.connected);

  useEffect(() => {
    if (onboardingMode && anyConnected) setAccountsExpanded(true);
  }, [onboardingMode, anyConnected]);

  const handleCheckNow = async (ignoreCursors = false, startFromNow = false) => {
    setIsChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      if (!user) throw new Error('Sign in required');
      const params = new URLSearchParams();
      if (ignoreCursors) params.set('ignoreCursors', 'true');
      if (startFromNow) params.set('startFromNow', 'true');
      const query = params.toString();
      const url = query ? `${TRIGGER_GMAIL_CHECK_URL}?${query}` : TRIGGER_GMAIL_CHECK_URL;
      const token = await user.getIdToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const result = await response.json();
      setCheckResult({
        notified: result.notified ?? 0,
        ordersDetected: result.ordersDetected ?? 0,
        transactionsDetected: result.transactionsDetected ?? 0,
        pendingPaypalQueue: result.pendingPaypalQueue,
        startFromNow: result.startFromNow === true,
      });
    } catch (err) {
      console.error('Error triggering Gmail check:', err);
      setCheckError('Check failed — please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartFromNow = () => handleCheckNow(false, true);

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
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/8 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
            <EnvelopeIcon className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={typography.sectionTitle}>Email accounts</h2>
              <ToggleSwitch
                checked={gmailWatcherEnabled}
                onChange={setGmailWatcherEnabled}
                disabled={settingsLoading}
                label="Gmail watcher notifications"
              />
            </div>
            <p className={typography.caption}>
              Connect your Gmail accounts to automatically find and track orders from supported stores and
              payment services. We only scan for supported order and payment emails. We don&apos;t read or
              modify unrelated emails.
            </p>

            {gmailParam === 'error' && (
              <div className="bg-destructive-container/60 border border-destructive/25 text-destructive p-3 rounded-xl text-sm">
                Couldn&apos;t connect Gmail. Please try again.
              </div>
            )}

            {gmailParam === 'connected' && (
              <div className="bg-brand/8 border border-brand/25 text-brand p-3 rounded-xl text-sm">
                Gmail connected.
              </div>
            )}

            {pendingPaypalCount > 0 && (
              <div className="bg-status-blue/5 border border-status-blue/20 text-foreground p-3 rounded-xl text-sm">
                <strong>{pendingPaypalCount}</strong> PayPal import{pendingPaypalCount === 1 ? '' : 's'} waiting in your
                review queue — open{' '}
                <Link to="/transactions" className="text-status-blue-fg font-medium underline">
                  Transactions
                </Link>{' '}
                (above the table, not inside it).
              </div>
            )}

            {checkResult && checkResult.startFromNow && (
              <div className="bg-brand/8 border border-brand/25 text-brand p-3 rounded-xl text-sm">
                You&apos;re all set — we&apos;ll only pick up new order and payment emails from now on. Older mail
                won&apos;t be imported.
              </div>
            )}
            {checkResult && !checkResult.startFromNow && (
              <div className="bg-brand/8 border border-brand/25 text-brand p-3 rounded-xl text-sm">
                Checked your account — {checkResult.notified} review alert{checkResult.notified === 1 ? '' : 's'},{' '}
                {checkResult.ordersDetected} new order{checkResult.ordersDetected === 1 ? '' : 's'},{' '}
                {checkResult.transactionsDetected} newly staged PayPal email
                {checkResult.transactionsDetected === 1 ? '' : 's'}.
                {typeof checkResult.pendingPaypalQueue === 'number' && (
                  <>
                    {' '}
                    <strong>{checkResult.pendingPaypalQueue}</strong> total in your review queue on Transactions.
                  </>
                )}
                {checkResult.ordersDetected > 0 && ' Review orders on Products.'}
                {(checkResult.transactionsDetected > 0 || (checkResult.pendingPaypalQueue ?? 0) > 0) &&
                  ' Review PayPal imports on Transactions (expand the blue Gmail panel).'}
              </div>
            )}
            {checkError && (
              <div className="bg-destructive-container/60 border border-destructive/25 text-destructive p-3 rounded-xl text-sm">{checkError}</div>
            )}

            {anyConnected && onboardingMode && (
              <div className={`rounded-xl border p-4 space-y-4 ${colors.card.border}`}>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Sync your inbox</h3>
                  <p className={`${typography.caption} mt-1`}>
                    Your Gmail is connected. Choose whether to import orders from older emails or only watch for new
                    mail going forward.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <Button
                      type="button"
                      onClick={() => handleCheckNow(true)}
                      disabled={isChecking}
                      className="w-full px-6 rounded-xl"
                    >
                      {isChecking ? 'Syncing...' : 'Import past order emails'}
                    </Button>
                    <p className={typography.caption}>
                      Scans your Gmail history for supported Amazon, Walmart, Wayfair, and PayPal order messages.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleStartFromNow}
                      disabled={isChecking}
                      className="w-full px-6 rounded-xl"
                    >
                      {isChecking ? 'Setting up...' : 'Only new emails from now on'}
                    </Button>
                    <p className={typography.caption}>
                      Skips older mail and starts watching for new orders from this point forward.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap items-start gap-3 pt-1">
              {anyConnected && showTestingActions && (
                <Button
                  variant="secondary"
                  onClick={() => handleCheckNow()}
                  disabled={isChecking}
                  className="w-full sm:w-auto px-6 rounded-xl"
                >
                  {isChecking ? 'Checking...' : 'Check now'}
                </Button>
              )}
              {anyConnected && showTestingActions && (
                <Button
                  variant="secondary"
                  onClick={() => handleCheckNow(true)}
                  disabled={isChecking}
                  className="w-full sm:w-auto px-6 rounded-xl"
                >
                  {isChecking ? 'Checking...' : 'Re-scan Gmail history'}
                </Button>
              )}
              {anyConnected && showTestingActions && (
                <p className={`${typography.caption} -mt-2`}>
                  Re-scan reloads the full PayPal review queue from Gmail, including payments whose ID is already on
                  your ledger.
                </p>
              )}
              {connectUrl && (
                <a
                  href={connectUrl}
                  className={`w-full sm:w-auto shrink-0 ${colors.button.primary} px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5`}
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Gmail account
                </a>
              )}
            </div>
          </div>
        </div>

        {!loading && accounts.length > 0 && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setAccountsExpanded((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-foreground"
              aria-expanded={accountsExpanded}
            >
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${accountsExpanded ? 'rotate-180' : ''}`}
              />
              Connected accounts · {accounts.length}
            </button>

            {accountsExpanded && accounts.map((account) => (
              <div key={account.id} className={`rounded-xl border p-4 ${colors.card.border}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <span className={getBadgeClasses(account.connected ? 'complete' : 'refund-pending')}>
                      {account.connected ? 'Connected' : 'Not connected'}
                    </span>
                    <span className="font-medium text-sm truncate">{account.emailAddress ?? 'Unknown account'}</span>
                    {account.lastCheckedAt && (
                      <span className={typography.caption}>
                        Last checked {formatLastChecked(account.lastCheckedAt)}
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
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive-container/60 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {!account.connected && (
                  <div className="bg-status-amber/10 border border-status-amber/30 text-status-amber-fg p-2.5 rounded-lg text-sm mt-3">
                    You&apos;ll need to reconnect roughly every 7 days — Google requires that until this app goes
                    through full verification.
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {RETAILER_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 text-sm ${opt.available ? '' : 'opacity-50 cursor-not-allowed'}`}
                      title={opt.available ? undefined : 'Coming soon — order/review parsing for this retailer isn\'t built yet'}
                    >
                      <Checkbox
                        disabled={!opt.available}
                        checked={account.retailers.includes(opt.value)}
                        onCheckedChange={(value) => toggleRetailer(account.id, opt.value, value === true)}
                      />
                      {opt.label}
                      {!opt.available && <span className={typography.caption}>· Coming soon</span>}
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
