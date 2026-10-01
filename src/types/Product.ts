export type Retailer = 'amazon' | 'walmart' | 'wayfair';
export type ReviewMediaType = 'text' | 'photo' | 'video';
export const DEFAULT_REVIEW_MEDIA_TYPE: ReviewMediaType = 'text';

export interface Vendor {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

export interface RefundExpectation {
  excludeTax: boolean;
  taxAmount: number | null;
  customDeduction: number | null;
  excludePayPalFee: boolean;
  paypalFeeAmount: number | null;
  notes?: string;
}

export const DEFAULT_REFUND_EXPECTATION: RefundExpectation = {
  excludeTax: false,
  taxAmount: null,
  customDeduction: null,
  excludePayPalFee: false,
  paypalFeeAmount: null,
  notes: '',
};

export interface Product {
  id?: string; // Firebase document ID
  item: string;
  url?: string; // Product URL
  imageUrl?: string; // Product image URL
  orderDate: string | null;
  orderNumber?: string; // Order number (not displayed in UI but searchable)
  retailer?: Retailer;
  orderPlaced: boolean;
  orderDelivered: boolean;
  reviewAdded: boolean;
  reviewLive: boolean;
  reviewSSSent: boolean;
  reviewMediaType?: ReviewMediaType;
  paid: number | null;
  received: number | null;
  delta: number | null;
  /** Sales tax paid on the order; pre-fills expected refund tax exclusion. */
  tax?: number | null;
  /** @deprecated Use refundExpectation.notes */
  refundNotes?: string;
  refundExpectation?: RefundExpectation | null;
  paypalTransactionIds?: string[];
  refundReceivedAt?: string; // ISO date when PayPal refund was linked
  isVoid?: boolean;
  vendorId?: string; // Reference to vendor ID
  lastStatus?: string; // Last computed status — used to detect transitions
  statusChangedAt?: string; // ISO date of last status change
  lastReturnReminderNotifiedAt?: string; // ISO date of last "check your return window" push sent
}

export interface ProductLinkOptions {
  completeWorkflow?: boolean;
  splitPrice?: boolean;
  customSplitAmounts?: Record<string, number>;
  keepModalOpen?: boolean;
}

export interface ProductData {
  products: Product[];
  summary: {
    totalPaid: number;
    totalReceived: number;
    netDelta: number;
  };
}

export type StatusFilter = '' | 'order-placed' | 'add-review' | 'review-pending' | 'send-screenshot' |'refund-pending' | 'complete' | 'void';
export type DeltaFilter = '' | 'positive' | 'negative' | 'zero';
export type VendorFilter = '' | string; // Empty string for all vendors, or specific vendor ID
