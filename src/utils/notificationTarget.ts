import { AppNotification } from '../types/Notification';
import { StatusFilter } from '../types/Product';

const DEFAULT_TARGET = '/products';

// Mirrors STATUS_LABELS in functions/src/index.ts — the labels the server
// puts in stuck-status notification titles.
const STATUS_LABEL_TO_FILTER: Record<string, StatusFilter> = {
  'order placed': 'order-placed',
  'add review': 'add-review',
  'review pending': 'review-pending',
  'send screenshot': 'send-screenshot',
  'refund pending': 'refund-pending',
};

function hasStatusParam(url: string): boolean {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return false;
  return new URLSearchParams(url.slice(queryIndex)).has('status');
}

/**
 * Derives the status filter a stuck-status notification refers to from its
 * title, e.g. `⏰ Stuck in "Order Placed"` → `order-placed`. Used for
 * notifications stored before the server started writing deep-link URLs.
 */
export function statusFilterFromStuckTitle(title: string): StatusFilter | null {
  const match = title.match(/"([^"]+)"/);
  if (!match) return null;
  return STATUS_LABEL_TO_FILTER[match[1].trim().toLowerCase()] ?? null;
}

function productsUrlForStatus(status: StatusFilter): string {
  return `${DEFAULT_TARGET}?status=${encodeURIComponent(status)}`;
}

/**
 * Where tapping a notification should take the user. Prefers the URL the
 * server stored. For older notifications that only point at `/products`,
 * fills in the `?status=` filter the server now writes:
 * - stuck-status → the status quoted in the title
 * - "a review may be live" → Review Pending (awaiting approval)
 */
export function getNotificationTarget(notification: Pick<AppNotification, 'kind' | 'title' | 'url'>): string {
  const url = notification.url || DEFAULT_TARGET;
  if (hasStatusParam(url)) return url;

  if (notification.kind === 'stuck_status') {
    const status = statusFilterFromStuckTitle(notification.title);
    if (status) return productsUrlForStatus(status);
  }

  if (notification.kind === 'gmail_review') {
    return productsUrlForStatus('review-pending');
  }

  return url;
}
