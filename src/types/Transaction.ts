export interface Transaction {
  id?: string; // Firebase document ID
  date: string;
  time: string;
  timeZone: string;
  name: string;
  type: string;
  currency: string;
  amount: number;
  fees: number;
  total: number;
  exchangeRate?: string;
  receiptId?: string;
  transactionId: string; // Unique transaction ID from the source (e.g. PayPal's own transaction ID)
  itemTitle?: string;
  linkedProductIds?: string[]; // UPDATED: Array of Product IDs for mapping multiple products
  splitPrice?: boolean; // When true, transaction total is divided equally among linked products
  productSplitAmounts?: Record<string, number> | null; // Custom net-received share per product ID
  /** Refund/payment source (e.g. "PayPal", "AmazonRefund", "WalmartRefund", "Zelle",
   * or any custom value added in Settings → Payment Methods). Optional because historical
   * docs predate this field — always read with `transaction.paymentMethod ?? 'PayPal'`. */
  paymentMethod?: string;
  createdAt?: any; // Firebase timestamp
  updatedAt?: any; // Firebase timestamp
}

export interface TransactionData {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalFees: number;
    netReceivedTotal: number;
    transactionCount: number;
  };
}
