import { typography } from '../../utils/typography';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, StatusFilter } from '../../types/Product';
import { getProductStatusType } from '../../utils/productStatus';
import { formatCurrency } from '../../utils/currency';
import { AnimatePresence, motion } from 'motion/react';
import { statusSolid } from '../../utils/colors';

// Dot colour per chip, matching the status badge hues
const STRIP_DOT: Record<string, string> = statusSolid;

const ATTENTION_EXPANDED_KEY = 'art_attention_expanded';

interface NextActionsStripProps {
  products: Product[];
  activeStatusFilter: StatusFilter;
  onStatusFilter: (filter: StatusFilter) => void;
  unlinkedTransactionCount: number;
  unlinkedTransactionAmount: number;
}

interface AttentionItem {
  key: string;
  label: string;
  detail: string;
  count: number;
  onClick: () => void;
  active?: boolean;
}

function readExpandedPreference(): boolean {
  try {
    return localStorage.getItem(ATTENTION_EXPANDED_KEY) === 'true';
  } catch {
    return false;
  }
}

export const NextActionsStrip: React.FC<NextActionsStripProps> = ({
  products,
  activeStatusFilter,
  onStatusFilter,
  unlinkedTransactionCount,
  unlinkedTransactionAmount,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(readExpandedPreference);

  const counts = useMemo(() => {
    const result = {
      addReview: 0,
      reviewPending: 0,
      sendScreenshot: 0,
      refundPending: 0,
      orderPlaced: 0,
    };
    for (const p of products) {
      if (p.isVoid) continue;
      const status = getProductStatusType(p);
      if (status === 'add-review') result.addReview++;
      else if (status === 'review-pending') result.reviewPending++;
      else if (status === 'send-screenshot') result.sendScreenshot++;
      else if (status === 'refund-pending') result.refundPending++;
      else if (status === 'order-placed') result.orderPlaced++;
    }
    return result;
  }, [products]);

  const toggleFilter = (filter: StatusFilter) => {
    onStatusFilter(activeStatusFilter === filter ? '' : filter);
  };

  const items: AttentionItem[] = [
    {
      key: 'add-review',
      label: 'Needs review',
      detail: `${counts.addReview} product${counts.addReview !== 1 ? 's' : ''}`,
      count: counts.addReview,
      onClick: () => toggleFilter('add-review'),
      active: activeStatusFilter === 'add-review',
    },
    {
      key: 'send-screenshot',
      label: 'Need screenshot',
      detail: `${counts.sendScreenshot} product${counts.sendScreenshot !== 1 ? 's' : ''}`,
      count: counts.sendScreenshot,
      onClick: () => toggleFilter('send-screenshot'),
      active: activeStatusFilter === 'send-screenshot',
    },
    {
      key: 'order-placed',
      label: 'Awaiting delivery',
      detail: `${counts.orderPlaced} product${counts.orderPlaced !== 1 ? 's' : ''}`,
      count: counts.orderPlaced,
      onClick: () => toggleFilter('order-placed'),
      active: activeStatusFilter === 'order-placed',
    },
    {
      key: 'review-pending',
      label: 'Awaiting approval',
      detail: `${counts.reviewPending} product${counts.reviewPending !== 1 ? 's' : ''}`,
      count: counts.reviewPending,
      onClick: () => toggleFilter('review-pending'),
      active: activeStatusFilter === 'review-pending',
    },
    {
      key: 'refund-pending',
      label: 'Waiting for refund',
      detail: `${counts.refundPending} product${counts.refundPending !== 1 ? 's' : ''}`,
      count: counts.refundPending,
      onClick: () => toggleFilter('refund-pending'),
      active: activeStatusFilter === 'refund-pending',
    },
    {
      key: 'transactions',
      label: 'Unlinked Transactions',
      detail:
        unlinkedTransactionCount > 0
          ? `${unlinkedTransactionCount} transaction${unlinkedTransactionCount !== 1 ? 's' : ''} · ${formatCurrency(unlinkedTransactionAmount)}`
          : '0 transactions',
      count: unlinkedTransactionCount,
      onClick: () => navigate('/transactions'),
    },
  ].filter((item) => item.count > 0);

  if (items.length === 0) {
    return null;
  }

  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  const collapsedSummary = items
    .map((item) => {
      if (item.key === 'transactions') return `${item.count} unlinked transactions`;
      return `${item.count} ${item.label.toLowerCase()}`;
    })
    .join(' · ');

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(ATTENTION_EXPANDED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="page-gutter mb-2">
      <div className="bg-card rounded-2xl shadow-soft overflow-hidden border border-border/60">
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-status-blue/10 text-status-blue-fg text-caption font-semibold tabular-nums">
              {totalCount}
            </span>
            <div className="min-w-0">
              <p className={`${typography.captionStrong} text-foreground`}>
                Needs attention
              </p>
              {!expanded && (
                <p className="text-sm text-on-surface-variant mt-0.5 truncate">{collapsedSummary}</p>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3">
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.onClick}
                    title={item.detail}
                    aria-pressed={item.active}
                    className={`group inline-flex items-center gap-2 rounded-full border py-1.5 pl-3 pr-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${
                      item.active
                        ? 'border-brand/40 bg-brand/10 text-brand'
                        : 'border-border bg-card text-foreground hover:border-input hover:bg-muted/60'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.key === 'transactions' ? 'bg-status-amber' : STRIP_DOT[item.key] ?? 'bg-status-blue'
                      }`}
                      aria-hidden="true"
                    />
                    {item.label}
                    <span className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-caption font-semibold tabular-nums ${
                      item.active
                        ? 'bg-brand/15 text-brand'
                        : item.key === 'transactions'
                          ? 'bg-status-amber/12 text-status-amber-fg'
                          : 'bg-muted text-on-surface-variant'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NextActionsStrip;
