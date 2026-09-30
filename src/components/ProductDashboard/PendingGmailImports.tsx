import React from 'react';
import { usePendingGmailOrderImports } from '../../hooks/usePendingGmailOrderImports';
import { BookmarkletPayload } from '../../utils/bookmarklet';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';

interface PendingGmailImportsProps {
  onAdd: (payload: BookmarkletPayload) => void;
}

export const PendingGmailImports: React.FC<PendingGmailImportsProps> = ({ onAdd }) => {
  const { pendingImports, dismiss } = usePendingGmailOrderImports();

  if (pendingImports.length === 0) return null;

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} p-4 sm:p-6 space-y-3`}>
      <div>
        <h2 className={typography.sectionTitle}>📦 New orders detected from Gmail</h2>
        <p className={`${typography.caption} mt-1`}>
          Extracted from your inbox automatically — review each one before adding it to the tracker.
        </p>
      </div>
      <div className="space-y-2">
        {pendingImports.map(({ id, payload }) => (
          <div
            key={id}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[rgba(196,198,207,0.2)]"
          >
            <div className="min-w-0">
              <p className={`${typography.bodyStrong} truncate`}>{payload.productName || 'Unknown item'}</p>
              <p className={typography.caption}>
                {payload.orderNumber && <>Order {payload.orderNumber}</>}
                {payload.orderTotal != null && <> · ${payload.orderTotal.toFixed(2)}</>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  onAdd(payload);
                  dismiss(id);
                }}
                className={`${colors.button.primary} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
              >
                Add
              </button>
              <button
                onClick={() => dismiss(id)}
                className={`${colors.button.secondary} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
