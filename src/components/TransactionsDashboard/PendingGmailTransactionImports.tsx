import React, { useMemo, useState } from 'react';
import { usePendingGmailTransactionImports } from '../../hooks/usePendingGmailTransactionImports';
import { Transaction } from '../../types/Transaction';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../common';

const PAYPAL_IMPORTS_EXPANDED_KEY = 'art_paypal_imports_expanded';

interface PendingGmailTransactionImportsProps {
  onAdd: (transaction: Transaction) => Promise<boolean>;
  /** PayPal IDs already saved on the ledger — still shown in the queue for review. */
  existingLedgerTransactionIds?: string[];
}

function readExpandedPreference(): boolean {
  try {
    return localStorage.getItem(PAYPAL_IMPORTS_EXPANDED_KEY) === 'true';
  } catch {
    return false;
  }
}

export const PendingGmailTransactionImports: React.FC<PendingGmailTransactionImportsProps> = ({
  onAdd,
  existingLedgerTransactionIds = [],
}) => {
  const { pendingImports, dismiss, loading, listenerError } = usePendingGmailTransactionImports();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const [addingId, setAddingId] = useState<string | null>(null);

  const ledgerIds = useMemo(
    () => new Set(existingLedgerTransactionIds.map((id) => id.trim()).filter(Boolean)),
    [existingLedgerTransactionIds]
  );

  if (listenerError) {
    return (
      <div className="px-4 sm:px-6 md:px-6 lg:px-8 mb-2">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm">
          Could not load PayPal imports from Gmail: {listenerError}
        </div>
      </div>
    );
  }

  if (loading) return null;

  if (pendingImports.length === 0) return null;

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PAYPAL_IMPORTS_EXPANDED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const totalCount = pendingImports.length;
  const collapsedSummary = `${totalCount} transaction${totalCount !== 1 ? 's' : ''} waiting to review`;

  const handleAdd = async (id: string, payload: Omit<Transaction, 'id'>) => {
    setAddingId(id);
    try {
      if (ledgerIds.has(payload.transactionId)) {
        await dismiss(id);
        showToast('Already in your ledger — removed from review queue');
        return;
      }
      const success = await onAdd(payload as Transaction);
      if (success) {
        await dismiss(id);
        showToast('Transaction added');
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-6 lg:px-8 mb-2">
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(2,36,72,0.07)] overflow-hidden border border-[#2563eb]/10">
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#fbf9f3]/80 transition-colors"
        >
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#2563eb]/10 text-[#1d4ed8] text-caption font-semibold tabular-nums">
              {totalCount}
            </span>
            <div className="min-w-0">
              <p className={`${typography.captionStrong} text-[#1b1c19]`}>
                💰 New PayPal transactions detected from Gmail
              </p>
              {!expanded && <p className="text-sm text-[#43474e] mt-0.5 truncate">{collapsedSummary}</p>}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-[#74777f] flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="border-t border-[rgba(196,198,207,0.2)] divide-y divide-[rgba(196,198,207,0.15)]">
            {pendingImports.map(({ id, payload, rawSubject }) => {
              const netReceived = payload.total ?? payload.amount + (payload.fees ?? 0);
              const isAdding = addingId === id;
              const inLedger = ledgerIds.has(payload.transactionId);

              return (
                <div key={id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className={typography.caption}>
                      {payload.date}
                      {payload.time ? <> · {payload.time}</> : null}
                      <> · Net {formatCurrency(netReceived)}</>
                      <> · ID {payload.transactionId}</>
                      {inLedger && <> · In ledger</>}
                    </p>
                    <button
                      type="button"
                      onClick={() => dismiss(id)}
                      disabled={isAdding}
                      className={`${colors.button.secondary} px-3 py-1 rounded-lg text-sm font-medium transition-colors shrink-0 disabled:opacity-50`}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`${typography.bodyStrong} truncate`}>
                        {payload.name || 'Unknown sender'} · {formatCurrency(payload.amount)}
                      </p>
                      {payload.type && <p className={typography.caption}>{payload.type}</p>}
                      {rawSubject && <p className={`${typography.caption} truncate`}>{rawSubject}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(id, payload)}
                      disabled={isAdding}
                      className={`${colors.button.primary} px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 disabled:opacity-50`}
                    >
                      {isAdding ? 'Adding...' : inLedger ? 'Clear' : 'Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
