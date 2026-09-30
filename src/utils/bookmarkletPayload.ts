export interface BookmarkletProduct {
  productName: string;
  productUrl: string;
  imageUrl: string;
  quantity?: number;
  price?: number | null;
}

export interface BookmarkletPayload {
  retailer?: 'amazon' | 'wayfair' | 'walmart';
  orderDate: string;
  orderNumber: string;
  orderTotal: number | null;
  tax: number | null;
  deliveryEstimate?: string | null;
  productName: string;
  productUrl: string;
  imageUrl: string;
  products?: BookmarkletProduct[];
}

export function parseBookmarkletMoney(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value * 100) / 100;
  }
  if (typeof value === 'string') {
    const match = value.match(/([\d,]+\.\d{2})/);
    if (match) {
      const parsed = parseFloat(match[1].replace(/,/g, ''));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as { value?: unknown; displayValue?: unknown };
    if (record.value != null) return parseBookmarkletMoney(record.value);
    if (typeof record.displayValue === 'string') {
      return parseBookmarkletMoney(record.displayValue);
    }
  }
  return null;
}

function inferRetailer(payload: Partial<BookmarkletPayload>): BookmarkletPayload['retailer'] {
  if (payload.retailer) return payload.retailer;
  const url = payload.productUrl || payload.products?.[0]?.productUrl || '';
  if (/amazon\.com/i.test(url)) return 'amazon';
  if (/wayfair\.com/i.test(url)) return 'wayfair';
  if (/walmart\.com/i.test(url)) return 'walmart';
  const orderNumber = payload.orderNumber || '';
  if (/^\d{3}-\d{7}-\d{7}$/.test(orderNumber)) return 'amazon';
  if (/^\d{7}-\d{8}$/.test(orderNumber)) return 'walmart';
  if (/^\d{10,}$/.test(orderNumber)) return 'wayfair';
  return undefined;
}

export function normalizeBookmarkletPayload(raw: unknown): BookmarkletPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Not an object');
  }
  const parsed = raw as Partial<BookmarkletPayload>;
  const products = Array.isArray(parsed.products) ? parsed.products : undefined;
  const first = products?.[0];
  const payload: BookmarkletPayload = {
    retailer: inferRetailer(parsed),
    orderDate: parsed.orderDate ?? '',
    orderNumber: parsed.orderNumber ?? '',
    orderTotal: parseBookmarkletMoney(parsed.orderTotal),
    tax: parseBookmarkletMoney(
      parsed.tax ?? (parsed as { orderTax?: unknown }).orderTax ?? (parsed as { estimatedTax?: unknown }).estimatedTax
    ),
    deliveryEstimate: parsed.deliveryEstimate ?? null,
    productName: parsed.productName ?? first?.productName ?? '',
    productUrl: parsed.productUrl ?? first?.productUrl ?? '',
    imageUrl: parsed.imageUrl ?? first?.imageUrl ?? '',
    ...(products?.length ? { products } : {}),
  };
  const retailer = inferRetailer(payload);
  return retailer ? { ...payload, retailer } : payload;
}

export function bookmarkletPayloadToProductFields(
  data: BookmarkletPayload,
  productIndex = 0,
): Pick<BookmarkletPayload, 'productName' | 'productUrl' | 'imageUrl'> & {
  orderDate: string;
  orderNumber: string;
  orderTotal: number | null;
  tax: number | null;
  retailer?: BookmarkletPayload['retailer'];
} {
  const item = data.products?.[productIndex];
  return {
    orderDate: data.orderDate,
    orderNumber: data.orderNumber,
    orderTotal: data.orderTotal,
    tax: data.tax,
    retailer: data.retailer,
    productName: item?.productName || data.productName,
    productUrl: item?.productUrl || data.productUrl,
    imageUrl: item?.imageUrl || data.imageUrl,
  };
}
