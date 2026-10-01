import React, { useCallback, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDataSource } from '../hooks/useDataSource';
import { useTransactions } from '../hooks/useTransactions';
import { useVendors } from '../hooks/useVendors';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useMinimumLoading } from '../hooks/useMinimumLoading';
import {
  DashboardLayout,
  DashboardStats,
  DashboardError,
  DashboardSection,
  PullToRefresh,
} from '../components/common';
import { ReconciliationCard } from '../components/Dashboard/ReconciliationCard';
import {
  FeesTrendChart,
  MonthlyAreaChart,
  PaidVsReceivedChart,
} from '../components/Dashboard/TransactionsVsProductTrendChart';
import { VendorVoidChart } from '../components/Dashboard/VendorVoidChart';
import { PipelineStatusChart } from '../components/Dashboard/PipelineStatusChart';
import { AttentionSummary } from '../components/Dashboard/AttentionSummary';
import { TimeRangeToggle } from '../components/Dashboard/TimeRangeToggle';
import { ComingSoonSection } from '../components/Dashboard/ComingSoonSection';
import { formatCurrency } from '../utils/currency';
import { getStatsColor } from '../utils/colors';
import {
  DashboardTimeRange,
  getReconciliationGapColor,
} from '../utils/dashboardMetrics';
import { typography } from '../utils/typography';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('All');

  const {
    data: productData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useDataSource(user?.uid);

  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions();

  const { vendors } = useVendors();

  const products = productData?.products ?? [];
  const transactions = transactionsData?.transactions ?? [];

  const metrics = useDashboardMetrics(products, transactions, vendors, timeRange);

  const loading = productsLoading || transactionsLoading;
  const displayLoading = useMinimumLoading(loading);
  const error = productsError || transactionsError;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchProducts(), refetchTransactions()]);
  }, [refetchProducts, refetchTransactions]);

  if (error) {
    return <DashboardError error={`Error loading dashboard: ${error}`} />;
  }

  const statsData = metrics
    ? [
        {
          value: formatCurrency(metrics.totalPaid),
          label: 'Total Paid',
          className: getStatsColor('paid'),
        },
        {
          value: formatCurrency(metrics.productTotalReceived),
          label: 'Product Received',
          className: getStatsColor('received'),
        },
        {
          value: formatCurrency(metrics.transactionNetReceived),
          label: 'Transactions Net Received',
          className: getStatsColor('netReceived'),
        },
        {
          value: formatCurrency(metrics.netDelta),
          label: 'Net Delta',
          className: getStatsColor('netDelta', metrics.netDelta),
        },
        {
          value: formatCurrency(metrics.reconciliationGap),
          label: 'Reconciliation Gap',
          className: getReconciliationGapColor(
            metrics.reconciliationGap,
            metrics.reconciliation.unlinkedTransactionNet
          ),
        },
        {
          value: `${(metrics.completionRate * 100).toFixed(0)}%`,
          label: 'Completion Rate',
          className: getStatsColor('completed'),
        },
      ]
    : [];

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={displayLoading}>
      <DashboardLayout>
        <DashboardSection>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div>
              <h1 className={typography.pageTitle}>Dashboard</h1>
              <p className={`${typography.caption} mt-1`}>
                Financial overview, trends, and reconciliation at a glance
              </p>
            </div>
            <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
          </div>
        </DashboardSection>

        <DashboardStats stats={statsData} loading={displayLoading} />

        {metrics && !displayLoading && (
          <>
            <DashboardSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ReconciliationCard metrics={metrics} />
                <AttentionSummary attention={metrics.attention} />
              </div>
            </DashboardSection>

            <DashboardSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MonthlyAreaChart
                  data={metrics.transactionTrend}
                  title="Transactions net received"
                  subtitle="Monthly inflow from transactions"
                />
                <MonthlyAreaChart
                  data={metrics.productRefundTrend}
                  title="Product refunds"
                  subtitle="Monthly received on linked products"
                  color="#022448"
                />
                <PaidVsReceivedChart
                  data={metrics.paidVsReceivedTrend}
                  title="Paid vs received"
                  subtitle="Monthly product spend vs refunds"
                />
                <FeesTrendChart data={metrics.feesTrend} />
              </div>
            </DashboardSection>

            <DashboardSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <VendorVoidChart metrics={metrics.vendorVoidMetrics} />
                <PipelineStatusChart counts={metrics.pipelineCounts} />
              </div>
            </DashboardSection>

            <ComingSoonSection />
          </>
        )}
      </DashboardLayout>
    </PullToRefresh>
  );
};

export default DashboardPage;
