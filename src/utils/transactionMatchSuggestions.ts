import { Product } from '../types/Product';
import { Transaction } from '../types/Transaction';
import { getProductStatusType, ProductStatusType } from './productStatus';
import { getExpectedReceivedForProduct } from './refundUtils';

export interface TransactionMatchSuggestion {
  product: Product;
  /** Expected net refund for the product after its configured deductions. */
  expected: number;
  /** Absolute distance between the transaction's net received and `expected`. */
  diff: number;
  isExact: boolean;
}

const EXACT_TOLERANCE = 0.01;
const MIN_CUTOFF = 25;
const CUTOFF_RATE = 0.25;

/** Products closest to a refund come first when amounts tie. */
const STATUS_RANK: Partial<Record<ProductStatusType, number>> = {
  'refund-pending': 0,
  'send-screenshot': 1,
  'review-pending': 2,
};
const DEFAULT_STATUS_RANK = 3;

function getStatusRank(product: Product): number {
  return STATUS_RANK[getProductStatusType(product)] ?? DEFAULT_STATUS_RANK;
}

/** Furthest a transaction may be from the expected refund and still be suggested. */
function getMaxDiff(expected: number): number {
  return Math.max(MIN_CUTOFF, expected * CUTOFF_RATE);
}

/**
 * Suggests unlinked products still awaiting a refund whose expected refund is
 * closest to the transaction's net received amount.
 */
export function getTransactionMatchSuggestions(
  transaction: Transaction,
  products: Product[],
  linkedProductIds: string[] = [],
  limit = 2
): TransactionMatchSuggestion[] {
  const linkedSet = new Set(linkedProductIds);
  const suggestions: TransactionMatchSuggestion[] = [];

  for (const product of products) {
    if (!product.id || linkedSet.has(product.id)) continue;
    if (product.isVoid || product.received != null) continue;

    const expected = getExpectedReceivedForProduct(product);
    if (expected == null) continue;

    const diff = Math.round(Math.abs(transaction.total - expected) * 100) / 100;
    if (diff > getMaxDiff(expected)) continue;

    suggestions.push({ product, expected, diff, isExact: diff < EXACT_TOLERANCE });
  }

  return suggestions
    .sort(
      (a, b) =>
        a.diff - b.diff ||
        getStatusRank(a.product) - getStatusRank(b.product) ||
        (a.product.orderDate ?? '').localeCompare(b.product.orderDate ?? '')
    )
    .slice(0, limit);
}
