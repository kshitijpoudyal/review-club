import { Product, Vendor } from '../types/Product';
import { PayPalTransaction } from '../types/PayPalTransaction';
import { getProductStatusType, isComplete, ProductStatusType } from './productStatus';
import { getVendorName } from './vendors';

export type DashboardTimeRange = '3M' | '6M' | 'YTD' | 'All';

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  value: number;
}

export interface DualTrendPoint {
  month: string;
  label: string;
  paid: number;
  received: number;
}

export interface ReconciliationBreakdown {
  unlinkedPayPalNet: number;
  linkedProductReceived: number;
  voidWriteOffs: number;
}

export interface VendorVoidMetric {
  vendorId: string;
  vendorName: string;
  totalProducts: number;
  voidCount: number;
  voidPaidTotal: number;
  voidRate: number;
  netDelta: number;
}

export interface PipelineStatusCount {
  status: ProductStatusType;
  label: string;
  count: number;
}

export interface AttentionCounts {
  unlinkedPayPalCount: number;
  unlinkedPayPalAmount: number;
  refundPending: number;
  sendScreenshot: number;
  addReview: number;
}

export interface DashboardMetrics {
  totalProducts: number;
  completedOrders: number;
  completionRate: number;
  totalPaid: number;
  productTotalReceived: number;
  paypalNetReceived: number;
  totalFees: number;
  netDelta: number;
  reconciliationGap: number;
  reconciliation: ReconciliationBreakdown;
  unlinkedCount: number;
  paypalTrend: MonthlyTrendPoint[];
  productRefundTrend: MonthlyTrendPoint[];
  paidVsReceivedTrend: DualTrendPoint[];
  feesTrend: MonthlyTrendPoint[];
  vendorVoidMetrics: VendorVoidMetric[];
  pipelineCounts: PipelineStatusCount[];
  attention: AttentionCounts;
}

const PIPELINE_ORDER: ProductStatusType[] = [
  'order-placed',
  'add-review',
  'review-pending',
  'send-screenshot',
  'refund-pending',
  'complete',
  'void',
];

const PIPELINE_LABELS: Record<ProductStatusType, string> = {
  'order-placed': 'Order Placed',
  'add-review': 'Add Review',
  'review-pending': 'Review Pending',
  'send-screenshot': 'Send Screenshot',
  'refund-pending': 'Refund Pending',
  complete: 'Complete',
  void: 'Void',
  unknown: 'Unknown',
};

function isValidProduct(product: Product): boolean {
  return Boolean(product.item);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getTimeRangeStart(range: DashboardTimeRange, now = new Date()): Date | null {
  if (range === 'All') return null;
  const start = new Date(now);
  if (range === '3M') {
    start.setMonth(start.getMonth() - 3);
    return start;
  }
  if (range === '6M') {
    start.setMonth(start.getMonth() - 6);
    return start;
  }
  if (range === 'YTD') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
}

export function isWithinTimeRange(
  dateStr: string | null | undefined,
  range: DashboardTimeRange,
  now = new Date()
): boolean {
  if (range === 'All') return true;
  const date = parseDate(dateStr);
  if (!date) return false;
  const start = getTimeRangeStart(range, now);
  return start ? date >= start && date <= now : true;
}

function monthKey(dateStr: string): string | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function sumMonthly(
  entries: { month: string; value: number }[]
): MonthlyTrendPoint[] {
  const map = new Map<string, number>();
  for (const { month, value } of entries) {
    map.set(month, (map.get(month) ?? 0) + value);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, label: monthLabel(month), value }));
}

function sumDualMonthly(
  paidEntries: { month: string; value: number }[],
  receivedEntries: { month: string; value: number }[]
): DualTrendPoint[] {
  const months = new Set<string>();
  const paidMap = new Map<string, number>();
  const receivedMap = new Map<string, number>();

  for (const { month, value } of paidEntries) {
    months.add(month);
    paidMap.set(month, (paidMap.get(month) ?? 0) + value);
  }
  for (const { month, value } of receivedEntries) {
    months.add(month);
    receivedMap.set(month, (receivedMap.get(month) ?? 0) + value);
  }

  return [...months]
    .sort()
    .map((month) => ({
      month,
      label: monthLabel(month),
      paid: paidMap.get(month) ?? 0,
      received: receivedMap.get(month) ?? 0,
    }));
}

function filterTrendByRange(
  points: MonthlyTrendPoint[],
  range: DashboardTimeRange,
  now = new Date()
): MonthlyTrendPoint[] {
  if (range === 'All') return points;
  const start = getTimeRangeStart(range, now);
  if (!start) return points;
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  return points.filter((p) => p.month >= startKey);
}

function filterDualTrendByRange(
  points: DualTrendPoint[],
  range: DashboardTimeRange,
  now = new Date()
): DualTrendPoint[] {
  if (range === 'All') return points;
  const start = getTimeRangeStart(range, now);
  if (!start) return points;
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  return points.filter((p) => p.month >= startKey);
}

export function computeDashboardMetrics(
  products: Product[],
  transactions: PayPalTransaction[],
  vendors: Vendor[],
  range: DashboardTimeRange = 'All',
  now = new Date()
): DashboardMetrics {
  const validProducts = products.filter(isValidProduct);

  let totalPaid = 0;
  let productTotalReceived = 0;
  let netDelta = 0;
  let completedOrders = 0;
  let voidWriteOffs = 0;
  let linkedProductReceived = 0;

  const paidEntries: { month: string; value: number }[] = [];
  const refundEntries: { month: string; value: number }[] = [];

  for (const product of validProducts) {
    if (product.paid != null && !Number.isNaN(product.paid)) {
      totalPaid += product.paid;
      if (isWithinTimeRange(product.orderDate, range, now)) {
        const mk = monthKey(product.orderDate ?? '');
        if (mk) paidEntries.push({ month: mk, value: product.paid });
      }
    }

    if (product.received != null && !Number.isNaN(product.received)) {
      productTotalReceived += product.received;
    }

    if (product.delta != null && !Number.isNaN(product.delta)) {
      netDelta += product.delta;
    }

    if (isComplete(product)) completedOrders++;

    if (product.isVoid && product.paid != null && !Number.isNaN(product.paid)) {
      voidWriteOffs += product.paid;
    }

    if (
      !product.isVoid &&
      product.paypalTransactionIds?.length &&
      product.received != null &&
      !Number.isNaN(product.received)
    ) {
      linkedProductReceived += product.received;
    }

    if (
      product.received != null &&
      !Number.isNaN(product.received) &&
      product.refundReceivedAt &&
      isWithinTimeRange(product.refundReceivedAt, range, now)
    ) {
      const mk = monthKey(product.refundReceivedAt);
      if (mk) refundEntries.push({ month: mk, value: product.received });
    }
  }

  const unlinked = transactions.filter(
    (t) => !t.linkedProductIds || t.linkedProductIds.length === 0
  );
  const unlinkedPayPalNet = unlinked.reduce((s, t) => s + t.total, 0);
  const unlinkedCount = unlinked.length;

  const paypalNetReceived = transactions.reduce((s, t) => s + t.total, 0);
  const totalFees = transactions.reduce((s, t) => s + Math.abs(t.fees), 0);
  const reconciliationGap = paypalNetReceived - productTotalReceived;

  const paypalTrendRaw = sumMonthly(
    transactions
      .filter((t) => isWithinTimeRange(t.date, range, now))
      .map((t) => {
        const mk = monthKey(t.date);
        return mk ? { month: mk, value: t.total } : null;
      })
      .filter((e): e is { month: string; value: number } => e !== null)
  );

  const feesTrendRaw = sumMonthly(
    transactions
      .filter((t) => isWithinTimeRange(t.date, range, now))
      .map((t) => {
        const mk = monthKey(t.date);
        return mk ? { month: mk, value: Math.abs(t.fees) } : null;
      })
      .filter((e): e is { month: string; value: number } => e !== null)
  );

  const paidVsReceivedTrendRaw = sumDualMonthly(paidEntries, refundEntries);

  const vendorMap = new Map<
    string,
    { total: number; voidCount: number; voidPaid: number; netDelta: number }
  >();

  for (const product of validProducts) {
    const vendorId = product.vendorId ?? 'unknown';
    const entry = vendorMap.get(vendorId) ?? {
      total: 0,
      voidCount: 0,
      voidPaid: 0,
      netDelta: 0,
    };
    entry.total++;
    if (product.isVoid) {
      entry.voidCount++;
      if (product.paid != null && !Number.isNaN(product.paid)) {
        entry.voidPaid += product.paid;
      }
    }
    if (product.delta != null && !Number.isNaN(product.delta)) {
      entry.netDelta += product.delta;
    }
    vendorMap.set(vendorId, entry);
  }

  const vendorVoidMetrics: VendorVoidMetric[] = [...vendorMap.entries()]
    .map(([vendorId, data]) => ({
      vendorId,
      vendorName: getVendorName(vendors, vendorId === 'unknown' ? undefined : vendorId),
      totalProducts: data.total,
      voidCount: data.voidCount,
      voidPaidTotal: data.voidPaid,
      voidRate: data.total > 0 ? data.voidCount / data.total : 0,
      netDelta: data.netDelta,
    }))
    .sort((a, b) => b.voidPaidTotal - a.voidPaidTotal || b.voidCount - a.voidCount);

  const statusCounts = new Map<ProductStatusType, number>();
  for (const product of validProducts) {
    const status = getProductStatusType(product);
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  const pipelineCounts: PipelineStatusCount[] = PIPELINE_ORDER.filter(
    (s) => (statusCounts.get(s) ?? 0) > 0
  ).map((status) => ({
    status,
    label: PIPELINE_LABELS[status],
    count: statusCounts.get(status) ?? 0,
  }));

  const attention: AttentionCounts = {
    unlinkedPayPalCount: unlinkedCount,
    unlinkedPayPalAmount: unlinkedPayPalNet,
    refundPending: 0,
    sendScreenshot: 0,
    addReview: 0,
  };

  for (const product of validProducts) {
    if (product.isVoid) continue;
    const status = getProductStatusType(product);
    if (status === 'refund-pending') attention.refundPending++;
    else if (status === 'send-screenshot') attention.sendScreenshot++;
    else if (status === 'add-review') attention.addReview++;
  }

  const totalProducts = validProducts.length;
  const completionRate = totalProducts > 0 ? completedOrders / totalProducts : 0;

  return {
    totalProducts,
    completedOrders,
    completionRate,
    totalPaid,
    productTotalReceived,
    paypalNetReceived,
    totalFees,
    netDelta,
    reconciliationGap,
    reconciliation: {
      unlinkedPayPalNet,
      linkedProductReceived,
      voidWriteOffs,
    },
    unlinkedCount,
    paypalTrend: filterTrendByRange(paypalTrendRaw, range, now),
    productRefundTrend: filterTrendByRange(sumMonthly(refundEntries), range, now),
    paidVsReceivedTrend: filterDualTrendByRange(paidVsReceivedTrendRaw, range, now),
    feesTrend: filterTrendByRange(feesTrendRaw, range, now),
    vendorVoidMetrics,
    pipelineCounts,
    attention,
  };
}

export function getReconciliationGapColor(gap: number, unlinkedPayPalNet: number): string {
  if (Math.abs(gap) < 0.01) return 'text-[#006a68]';
  if (Math.abs(gap - unlinkedPayPalNet) < 0.01) return 'text-amber-800';
  return 'text-[#ba1a1a]';
}
