import { DEFAULT_REFUND_EXPECTATION, Product } from '../../types/Product';
import { parseBookmarkletClipboard } from '../../utils/bookmarklet';
import { getDefaultPayPalFee, getProductRefundExpectation } from '../../utils/refundUtils';

export type ImportStatus = 'idle' | 'success' | 'url-only' | 'error';

export function formatDateForInput(dateString: string): string {
  try {
    const MONTHS: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };
    const match = dateString.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/);
    if (match) {
      const month = MONTHS[match[1].toLowerCase()];
      if (month) return `${match[3]}-${month}-${match[2].padStart(2, '0')}`;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export function applyBookmarkletPayload(
  prev: Product,
  data: ReturnType<typeof parseBookmarkletClipboard>,
): Product {
  let updated: Product = {
    ...prev,
    item: data.productName || prev.item,
    url: data.productUrl || prev.url,
    imageUrl: data.imageUrl || prev.imageUrl,
    orderNumber: data.orderNumber || prev.orderNumber,
    paid: data.orderTotal ?? prev.paid,
    orderDate: data.orderDate ? formatDateForInput(data.orderDate) : prev.orderDate,
    ...(data.retailer ?? prev.retailer ? { retailer: data.retailer ?? prev.retailer } : {}),
  };

  if (data.tax != null) {
    updated = { ...updated, tax: data.tax };
    if (updated.refundExpectation == null) {
      updated = { ...updated, refundExpectation: { ...DEFAULT_REFUND_EXPECTATION } };
    }
  }

  return updated;
}

export function getClipboardImportLabel(status: ImportStatus): { icon: string; text: string } {
  if (status === 'success') return { icon: '✅', text: 'All fields filled!' };
  if (status === 'url-only') return { icon: '🔢', text: 'Order # filled — add other fields manually' };
  if (status === 'error') return { icon: '⚠️', text: 'Nothing found — copy an Amazon, Wayfair, or Walmart order first' };
  return { icon: '📋', text: 'Import from Clipboard' };
}

export function updateProductNumbers(
  product: Product,
  field: 'paid' | 'received',
  value: string,
): Product {
  const numValue = value === '' ? null : parseFloat(value);
  const updated = { ...product, [field]: numValue };
  if (updated.paid !== null && updated.received !== null) {
    updated.delta = updated.received - updated.paid;
  } else if (updated.paid !== null && updated.received === null) {
    updated.delta = -updated.paid;
  } else if (updated.paid === null && updated.received !== null) {
    updated.delta = updated.received;
  } else {
    updated.delta = null;
  }
  return updated;
}

function parseOptionalAmount(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function updateProductPaid(product: Product, value: string): Product {
  const updated = updateProductNumbers(product, 'paid', value);
  const expectation = getProductRefundExpectation(updated);
  if (!expectation.excludePayPalFee) return updated;
  return {
    ...updated,
    refundExpectation: {
      ...expectation,
      paypalFeeAmount: getDefaultPayPalFee(updated.paid),
    },
  };
}

export function updateProductTax(product: Product, value: string): Product {
  const parsed = parseOptionalAmount(value);
  let updated: Product = { ...product, tax: parsed };
  if (updated.refundExpectation == null) {
    updated = { ...updated, refundExpectation: { ...DEFAULT_REFUND_EXPECTATION } };
  }

  const expectation = getProductRefundExpectation(updated);
  if (!expectation.excludeTax) return updated;

  const priorTax = product.tax;
  const shouldSyncAmount =
    expectation.taxAmount == null ||
    (priorTax != null && expectation.taxAmount === priorTax);

  if (!shouldSyncAmount) return updated;

  return {
    ...updated,
    refundExpectation: {
      ...expectation,
      taxAmount: parsed,
    },
  };
}
