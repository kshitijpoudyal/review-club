import { describe, expect, it } from 'vitest';
import { amazonOrderDetailsUrl, parseAmazonOrderSummary, resolveRelativeDeliveryEstimate } from './amazonOrderSummary';

// Plain-text body of the 2026-10-24 template, trimmed to the relevant part.
const NEW_TEMPLATE_TEXT = `
    Asmita, thanks for your order!
Ordered

Arriving tomorrow

1 Storage item
Kshitij - RUSTON, LA

Order #
111-2189112-9087462

Grand Total:
27.74 USD
`;

describe('parseAmazonOrderSummary', () => {
  it('reads item count and category from the new subject', () => {
    expect(parseAmazonOrderSummary('Ordered 1 item: Storage', '')).toEqual({ itemCount: 1, category: 'Storage' });
    expect(parseAmazonOrderSummary('Ordered 3 items: Kitchen & Dining', '')).toEqual({
      itemCount: 3,
      category: 'Kitchen & Dining',
    });
  });

  it('falls back to the body summary line', () => {
    expect(parseAmazonOrderSummary(undefined, NEW_TEMPLATE_TEXT)).toEqual({ itemCount: 1, category: 'Storage' });
  });

  it('ignores the old `Ordered: "..."` subject', () => {
    expect(parseAmazonOrderSummary('Ordered: "Some Product Name..."', 'Quantity: 1')).toBeNull();
  });
});

describe('resolveRelativeDeliveryEstimate', () => {
  const receivedAt = new Date('2026-10-24T15:09:15Z');

  it('resolves tomorrow and today against the received date', () => {
    expect(resolveRelativeDeliveryEstimate('tomorrow', receivedAt)).toBe('Sunday, October 25');
    expect(resolveRelativeDeliveryEstimate('today', receivedAt)).toBe('Saturday, October 24');
  });

  it('keeps a US evening order on its local day', () => {
    // 9:30pm Pacific on Oct 24 is already Oct 25 in UTC.
    expect(resolveRelativeDeliveryEstimate('tomorrow', new Date('2026-10-25T04:30:00Z'))).toBe('Sunday, October 25');
  });

  it('passes absolute estimates through untouched', () => {
    expect(resolveRelativeDeliveryEstimate('Saturday, Oct 26', receivedAt)).toBe('Saturday, Oct 26');
    expect(resolveRelativeDeliveryEstimate(null, receivedAt)).toBeNull();
  });
});

describe('amazonOrderDetailsUrl', () => {
  it('builds the order-details link', () => {
    expect(amazonOrderDetailsUrl('111-2189112-9087462')).toBe(
      'https://www.amazon.com/your-orders/order-details?orderID=111-2189112-9087462'
    );
  });
});
