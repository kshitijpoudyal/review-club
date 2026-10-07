import { describe, expect, it } from 'vitest';
import { getNotificationTarget, statusFilterFromStuckTitle } from './notificationTarget';

describe('statusFilterFromStuckTitle', () => {
  it('maps the quoted status label to a filter value', () => {
    expect(statusFilterFromStuckTitle('⏰ Stuck in "Order Placed"')).toBe('order-placed');
    expect(statusFilterFromStuckTitle('⏰ Stuck in "Send Screenshot"')).toBe('send-screenshot');
  });

  it('returns null for titles without a known label', () => {
    expect(statusFilterFromStuckTitle('⚠️ Check your return window')).toBeNull();
    expect(statusFilterFromStuckTitle('⏰ Stuck in "Something Else"')).toBeNull();
  });
});

describe('getNotificationTarget', () => {
  it('uses the stored URL when it already carries a status filter', () => {
    expect(
      getNotificationTarget({ kind: 'stuck_status', title: '⏰ Stuck in "Order Placed"', url: '/products?status=add-review' })
    ).toBe('/products?status=add-review');
  });

  it('adds the status filter for legacy stuck notifications pointing at /products', () => {
    expect(
      getNotificationTarget({ kind: 'stuck_status', title: '⏰ Stuck in "Order Placed"', url: '/products' })
    ).toBe('/products?status=order-placed');
    expect(
      getNotificationTarget({ kind: 'stuck_status', title: '⏰ Stuck in "Refund Pending"', url: null })
    ).toBe('/products?status=refund-pending');
  });

  it('sends "review may be live" notifications to the Review Pending filter', () => {
    expect(
      getNotificationTarget({ kind: 'gmail_review', title: '📝 A review may be live', url: '/products' })
    ).toBe('/products?status=review-pending');
    expect(
      getNotificationTarget({ kind: 'gmail_review', title: '📝 A review may be live', url: null })
    ).toBe('/products?status=review-pending');
  });

  it('leaves other notification kinds untouched', () => {
    expect(getNotificationTarget({ kind: 'gmail_paypal', title: 'x', url: '/transactions' })).toBe('/transactions');
    expect(getNotificationTarget({ kind: 'gmail_order', title: 'x', url: null })).toBe('/products');
  });
});
