import { typography } from '../../utils/typography';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, StatusFilter } from '../../types/Product';
import { getProductStatusType } from '../../utils/productStatus';
import { formatCurrency } from '../../utils/currency';

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
                Needs attention
              </p>
              {!expanded && (
                <p className="text-sm text-[#43474e] mt-0.5 truncate">{collapsedSummary}</p>
              )}
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
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                  item.active
                    ? 'bg-[#006a68]/8 hover:bg-[#006a68]/12'
                    : 'hover:bg-[#fbf9f3]'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full tabular-nums text-caption font-semibold ${
                    item.key === 'transactions'
                      ? 'bg-amber-500/12 text-amber-800'
                      : 'bg-[#2563eb]/10 text-[#1d4ed8]'
                  }`}>
                    {item.count}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${item.active ? 'text-[#006a68]' : 'text-[#1b1c19]'}`}>
                      {item.label}
                    </p>
                    <p className={`${typography.caption} mt-0.5 truncate`}>{item.detail}</p>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${item.active ? 'text-[#006a68]' : 'text-[#74777f]'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NextActionsStrip;
