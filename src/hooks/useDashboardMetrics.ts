import { useMemo } from 'react';
import { Product, Vendor } from '../types/Product';
import { Transaction } from '../types/Transaction';
import {
  computeDashboardMetrics,
  DashboardMetrics,
  DashboardTimeRange,
} from '../utils/dashboardMetrics';

export function useDashboardMetrics(
  products: Product[],
  transactions: Transaction[],
  vendors: Vendor[],
  timeRange: DashboardTimeRange = 'All'
): DashboardMetrics | null {
  return useMemo(() => {
    if (!products.length && !transactions.length) return null;
    return computeDashboardMetrics(products, transactions, vendors, timeRange);
  }, [products, transactions, vendors, timeRange]);
}
