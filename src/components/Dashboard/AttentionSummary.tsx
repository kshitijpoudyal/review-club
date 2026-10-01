import React from 'react';
import { Link } from 'react-router-dom';
import { AttentionCounts } from '../../utils/dashboardMetrics';
import { formatCurrency } from '../../utils/currency';
import { typography } from '../../utils/typography';
import { ChartCard } from './ChartCard';

interface AttentionSummaryProps {
  attention: AttentionCounts;
}

interface AttentionItemProps {
  label: string;
  detail: string;
  to: string;
  highlight?: boolean;
}

function AttentionItem({ label, detail, to, highlight }: AttentionItemProps) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
        highlight
          ? 'border-amber-500/30 bg-amber-500/8 hover:bg-amber-500/12'
          : 'border-[#e4e2dd] hover:border-[#006a68]/30 hover:bg-[#006a68]/5'
      }`}
    >
      <span className={typography.bodyStrong}>{label}</span>
      <span className={`${typography.caption} tabular-nums`}>{detail}</span>
    </Link>
  );
}

export const AttentionSummary: React.FC<AttentionSummaryProps> = ({ attention }) => {
  const items: AttentionItemProps[] = [];

  if (attention.unlinkedTransactionCount > 0) {
    items.push({
      label: 'Unlinked transactions',
      detail: `${attention.unlinkedTransactionCount} · ${formatCurrency(attention.unlinkedTransactionAmount)}`,
      to: '/transactions?link=unlinked',
      highlight: true,
    });
  }
  if (attention.refundPending > 0) {
    items.push({
      label: 'Refund pending',
      detail: `${attention.refundPending} product${attention.refundPending !== 1 ? 's' : ''}`,
      to: '/products?status=refund-pending',
    });
  }
  if (attention.sendScreenshot > 0) {
    items.push({
      label: 'Need screenshot',
      detail: `${attention.sendScreenshot} product${attention.sendScreenshot !== 1 ? 's' : ''}`,
      to: '/products?status=send-screenshot',
    });
  }
  if (attention.addReview > 0) {
    items.push({
      label: 'Needs review',
      detail: `${attention.addReview} product${attention.addReview !== 1 ? 's' : ''}`,
      to: '/products?status=add-review',
    });
  }

  return (
    <ChartCard title="Needs attention" subtitle="Quick links to items that need action">
      {items.length === 0 ? (
        <p className={`${typography.caption} py-4 text-center`}>
          All caught up — nothing needs attention right now.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <AttentionItem key={item.to} {...item} />
          ))}
        </div>
      )}
    </ChartCard>
  );
};
