/**
 * Retailer bookmarklets scrape order pages and redirect into the Review Club PWA
 * with a URL fragment payload (#import=…). JSON is also copied to the clipboard.
 */

import { getAppOrigin } from './importHandoff';
import { buildBookmarkletHref } from './bookmarkletShared';
import {
  AMAZON_EXTRACTOR_BODY,
  WAYFAIR_EXTRACTOR_BODY,
  WALMART_EXTRACTOR_BODY,
} from './bookmarkletExtractors';
import {
  BookmarkletPayload,
  BookmarkletProduct,
  bookmarkletPayloadToProductFields,
  normalizeBookmarkletPayload,
} from './bookmarkletPayload';

export type { BookmarkletPayload, BookmarkletProduct };
export { bookmarkletPayloadToProductFields, normalizeBookmarkletPayload };

export function buildAmazonBookmarkletHref(appOrigin = getAppOrigin()): string {
  return buildBookmarkletHref(AMAZON_EXTRACTOR_BODY, appOrigin);
}

export function buildWayfairBookmarkletHref(appOrigin = getAppOrigin()): string {
  return buildBookmarkletHref(WAYFAIR_EXTRACTOR_BODY, appOrigin);
}

export function buildWalmartBookmarkletHref(appOrigin = getAppOrigin()): string {
  return buildBookmarkletHref(WALMART_EXTRACTOR_BODY, appOrigin);
}

export const BOOKMARKLET_HREF = buildAmazonBookmarkletHref();
export const WAYFAIR_BOOKMARKLET_HREF = buildWayfairBookmarkletHref();
export const WALMART_BOOKMARKLET_HREF = buildWalmartBookmarkletHref();

/** Parse clipboard text as a bookmarklet payload; throws if invalid */
export function parseBookmarkletClipboard(text: string): BookmarkletPayload {
  const trimmed = text.trim();

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    const normalized = normalizeBookmarkletPayload(parsed);
    if (!normalized.orderNumber && !normalized.productName && !normalized.orderDate) {
      throw new Error('Missing required fields');
    }
    return normalized;
  }

  const orderIdMatch = trimmed.match(/orderID=(\d{3}-\d{7}-\d{7})/i);
  if (orderIdMatch) {
    return normalizeBookmarkletPayload({
      orderDate: '',
      orderNumber: orderIdMatch[1],
      orderTotal: null,
      tax: null,
      productName: '',
      productUrl: '',
      imageUrl: '',
    });
  }

  if (/wayfair\.com/i.test(trimmed)) {
    const wayfairOrderMatch =
      trimmed.match(/order(?:Id|ID|Number)[=/](\d{8,})/i) ||
      trimmed.match(/\/(\d{10,})(?:[/?#]|$)/);
    if (wayfairOrderMatch) {
      return normalizeBookmarkletPayload({
        retailer: 'wayfair',
        orderDate: '',
        orderNumber: wayfairOrderMatch[1],
        orderTotal: null,
        tax: null,
        productName: '',
        productUrl: '',
        imageUrl: '',
      });
    }
  }

  if (/walmart\.com/i.test(trimmed)) {
    const walmartOrderMatch = trimmed.match(/\b(\d{7}-\d{8})\b/);
    if (walmartOrderMatch) {
      return normalizeBookmarkletPayload({
        retailer: 'walmart',
        orderDate: '',
        orderNumber: walmartOrderMatch[1],
        orderTotal: null,
        tax: null,
        productName: '',
        productUrl: '',
        imageUrl: '',
      });
    }
  }

  const bareWalmartMatch = trimmed.match(/^(\d{7}-\d{8})$/);
  if (bareWalmartMatch) {
    return normalizeBookmarkletPayload({
      retailer: 'walmart',
      orderDate: '',
      orderNumber: bareWalmartMatch[1],
      orderTotal: null,
      tax: null,
      productName: '',
      productUrl: '',
      imageUrl: '',
    });
  }

  const bareWayfairMatch = trimmed.match(/^\d{10,}$/);
  if (bareWayfairMatch) {
    return normalizeBookmarkletPayload({
      retailer: 'wayfair',
      orderDate: '',
      orderNumber: bareWayfairMatch[0],
      orderTotal: null,
      tax: null,
      productName: '',
      productUrl: '',
      imageUrl: '',
    });
  }

  throw new Error('Not a recognised Amazon, Wayfair, or Walmart data format');
}
