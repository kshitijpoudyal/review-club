import React, { useState } from 'react';
import { usePendingGmailTransactionImports } from '../../hooks/usePendingGmailTransactionImports';
import { Transaction } from '../../types/Transaction';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/currency';

interface PendingGmailTransactionImportsProps {
  onAdd: (transaction: Transaction) => Promise<boolean>;
}

export const PendingGmailTransactionImports: React.FC<PendingGmailTransactionImportsProps> = ({ onAdd }) => {
  const { pendingImports, dismiss } = usePendingGmailTransactionImports();
  const [addingId, setAddingId] = useState<string | null>(null);

  if (pendingImports.length === 0) return null;

  const handleAdd = async (id: string, payload: Omit<Transaction, 'id'>) => {
    setAddingId(id);
    try {
      const success = await onAdd(payload as Transaction);
      if (success) await dismiss(id);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} p-4 sm:p-6 space-y-3`}>
      <div>
        <h2 className={typography.sectionTitle}>💰 New PayPal transactions detected from Gmail</h2>
        <p className={`${typography.caption} mt-1`}>
          Extracted from your inbox automatically — review each one before adding it to the ledger.
        </p>
      </div>
      <div className="space-y-3">
        {pendingImports.map(({ id, payload, rawSubject }) => (
          <div key={id} className="p-3 rounded-xl border border-[rgba(196,198,207,0.2)] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`${typography.bodyStrong} truncate`}>
                {payload.name || 'Unknown sender'} · {formatCurrency(payload.amount)}
              </p>
              <p className={`${typography.caption} truncate`}>
                {payload.date} · {payload.type} · ID {payload.transactionId}
              </p>
              {rawSubject && <p className={`${typography.caption} truncate`}>From: {rawSubject}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => dismiss(id)}
                disabled={addingId === id}
                className={`${colors.button.secondary} px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50`}
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAdd(id, payload)}
                disabled={addingId === id}
                className={`${colors.button.primary} px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50`}
              >
                {addingId === id ? 'Adding...' : 'Add to ledger'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
