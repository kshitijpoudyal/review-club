import { describe, expect, it } from 'vitest';
import { getTransactionMatchSuggestions } from './transactionMatchSuggestions';
import { Product } from '../types/Product';
import { Transaction } from '../types/Transaction';

function makeProduct(overrides: Partial<Product> & { id: string }): Product {
  // Defaults describe a refund-pending product: every step done, no refund yet.
  return {
    item: `Product ${overrides.id}`,
    orderDate: '2026-01-01',
    orderPlaced: true,
    orderDelivered: true,
    reviewAdded: true,
    reviewLive: true,
    reviewSSSent: true,
    paid: 100,
    received: null,
    delta: null,
    ...overrides,
  };
}

function makeTransaction(total: number): Transaction {
  return {
    date: '2026-02-01',
    time: '10:00:00',
    timeZone: 'CST',
    name: 'Some Seller',
    type: 'Payment',
    currency: 'USD',
    amount: total,
    fees: 0,
    total,
    transactionId: 'TX1',
  };
}

const ids = (suggestions: { product: Product }[]) => suggestions.map((s) => s.product.id);

describe('getTransactionMatchSuggestions', () => {
  it('matches on expected refund rather than paid', () => {
    const products = [
      makeProduct({ id: 'full', paid: 90 }),
      makeProduct({
        id: 'deducted',
        paid: 100,
        refundExpectation: {
          excludeTax: true,
          taxAmount: 5,
          customDeduction: 10,
          excludePayPalFee: false,
          paypalFeeAmount: null,
        },
      }),
    ];

    const result = getTransactionMatchSuggestions(makeTransaction(85), products);

    expect(ids(result)).toEqual(['deducted', 'full']);
    expect(result[0]).toMatchObject({ expected: 85, diff: 0, isExact: true });
    expect(result[1]).toMatchObject({ expected: 90, diff: 5, isExact: false });
  });

  it('breaks amount ties by status, then by older order date', () => {
    const products = [
      makeProduct({ id: 'review-pending', reviewLive: false, reviewSSSent: false }),
      makeProduct({ id: 'screenshot', reviewSSSent: false }),
      makeProduct({ id: 'refund-newer', orderDate: '2026-01-10' }),
      makeProduct({ id: 'refund-older', orderDate: '2026-01-02' }),
    ];

    const result = getTransactionMatchSuggestions(makeTransaction(100), products, [], 4);

    expect(ids(result)).toEqual(['refund-older', 'refund-newer', 'screenshot', 'review-pending']);
  });

  it('excludes linked, void, unpaid, and already-refunded products', () => {
    const products = [
      makeProduct({ id: 'linked' }),
      makeProduct({ id: 'void', isVoid: true }),
      makeProduct({ id: 'unpaid', paid: null }),
      makeProduct({ id: 'refunded', received: 100 }),
      makeProduct({ id: 'ok' }),
    ];

    const result = getTransactionMatchSuggestions(makeTransaction(100), products, ['linked']);

    expect(ids(result)).toEqual(['ok']);
  });

  it('drops products further than the cutoff from the transaction', () => {
    const products = [
      makeProduct({ id: 'within-floor', paid: 40 }), // $25 floor: 20 off is allowed
      makeProduct({ id: 'beyond-floor', paid: 50 }), // 30 off, cutoff 25
      makeProduct({ id: 'within-rate', paid: 200 }), // 25% of 200 = 50
    ];

    expect(ids(getTransactionMatchSuggestions(makeTransaction(20), products))).toEqual([
      'within-floor',
    ]);
    expect(ids(getTransactionMatchSuggestions(makeTransaction(150), products))).toEqual([
      'within-rate',
    ]);
    expect(getTransactionMatchSuggestions(makeTransaction(500), products)).toEqual([]);
  });

  it('returns at most the requested number of suggestions', () => {
    const products = ['a', 'b', 'c', 'd', 'e'].map((id) => makeProduct({ id }));

    expect(getTransactionMatchSuggestions(makeTransaction(100), products)).toHaveLength(2);
    expect(getTransactionMatchSuggestions(makeTransaction(100), products, [], 4)).toHaveLength(4);
  });
});
