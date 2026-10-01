import { Transaction } from '../types/Transaction';

type ShareTransaction = Pick<
  Transaction,
  'total' | 'linkedProductIds' | 'splitPrice' | 'productSplitAmounts'
>;

export function getTransactionProductShare(transaction: ShareTransaction, productId: string): number {
  const linkedIds = transaction.linkedProductIds || [];
  const custom = transaction.productSplitAmounts?.[productId];
  if (custom != null && !Number.isNaN(custom)) {
    return custom;
  }
  if (transaction.splitPrice && linkedIds.length > 1) {
    return transaction.total / linkedIds.length;
  }
  return transaction.total;
}
