import React from 'react';
import { Link } from 'react-router-dom';
import { typography } from '../../utils/typography';
import { formatCurrency } from '../../utils/currency';
import {
  DashboardMetrics,
  getReconciliationGapColor,
} from '../../utils/dashboardMetrics';
import { ChartCard } from './ChartCard';

interface ReconciliationCardProps {
  metrics: DashboardMetrics;
}

function Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className={typography.caption}>{label}</span>
      <span className={`${typography.numericStrong} ${className}`}>{value}</span>
    </div>
  );
}

export const ReconciliationCard: React.FC<ReconciliationCardProps> = ({ metrics }) => {
  const gapColor = getReconciliationGapColor(
    metrics.reconciliationGap,
    metrics.reconciliation.unlinkedTransactionNet
  );

  return (
    <ChartCard
      title="Transactions vs Products"
      subtitle="Compare net received in transactions against product received totals"
    >
      <div className="space-y-1">
        <Row
          label="Transactions net received"
          value={formatCurrency(metrics.transactionNetReceived)}
          className="text-[#006a68]"
        />
        <Row
          label="Product received"
          value={formatCurrency(metrics.productTotalReceived)}
          className="text-[#006a68]"
        />
        <div className="border-t border-[#e4e2dd] my-2" />
        <Row
          label="Gap"
          value={formatCurrency(metrics.reconciliationGap)}
          className={gapColor}
        />
        <div className="pl-3 space-y-0.5 border-l-2 border-[#e4e2dd] ml-1 mt-2">
          <Row
            label="Unlinked transactions"
            value={formatCurrency(metrics.reconciliation.unlinkedTransactionNet)}
          />
          <Row
            label="Linked on products"
            value={formatCurrency(metrics.reconciliation.linkedProductReceived)}
          />
          <Row
            label="Void write-offs"
            value={formatCurrency(metrics.reconciliation.voidWriteOffs)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#e4e2dd]">
        <Link
          to="/transactions?link=unlinked"
          className={`${typography.captionStrong} px-3 py-1.5 rounded-full bg-[#0070BA]/10 text-[#0070BA] hover:bg-[#0070BA]/15 transition-colors`}
        >
          View unlinked transactions
        </Link>
        <Link
          to="/products?status=void"
          className={`${typography.captionStrong} px-3 py-1.5 rounded-full bg-[#9e9e9e]/15 text-[#74777f] hover:bg-[#9e9e9e]/25 transition-colors`}
        >
          View void products
        </Link>
      </div>
    </ChartCard>
  );
};
