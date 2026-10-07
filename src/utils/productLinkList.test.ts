import { describe, expect, it } from 'vitest';
import { getProductLinkList } from './productLinkList';
import { Product } from '../types/Product';

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

const ids = (products: Product[]) => products.map((p) => p.id);

describe('getProductLinkList', () => {
  it('lists refund-pending first, then all other statuses, each by most recent order date', () => {
    const products = [
      makeProduct({ id: 'screenshot-old', reviewSSSent: false, orderDate: '2026-01-05' }),
      makeProduct({ id: 'refund-old', orderDate: '2026-01-02' }),
      makeProduct({ id: 'complete-mid', received: 100, orderDate: '2026-02-01' }),
      makeProduct({ id: 'void-new', isVoid: true, orderDate: '2026-03-01' }),
      makeProduct({ id: 'refund-new', orderDate: '2026-02-10' }),
      makeProduct({ id: 'review-undated', reviewLive: false, reviewSSSent: false, orderDate: null }),
    ];

    expect(ids(getProductLinkList(products))).toEqual([
      'refund-new',
      'refund-old',
      'void-new',
      'complete-mid',
      'screenshot-old',
      'review-undated',
    ]);
  });

  it('hides linked, complete, and void products when asked', () => {
    const products = [
      makeProduct({ id: 'linked' }),
      makeProduct({ id: 'complete', received: 100 }),
      makeProduct({ id: 'void', isVoid: true }),
      makeProduct({ id: 'open' }),
    ];

    const result = getProductLinkList(products, {
      linkedProductIds: ['linked'],
      hideLinked: true,
      hideVoid: true,
    });

    expect(ids(result)).toEqual(['open']);
  });

  it('searches by name, paid amount, and order number', () => {
    const products = [
      makeProduct({ id: 'a', item: 'Desk Lamp', paid: 31.5 }),
      makeProduct({ id: 'b', item: 'Kettle', orderNumber: '111-ABC' }),
    ];

    expect(ids(getProductLinkList(products, { searchTerm: ' lamp ' }))).toEqual(['a']);
    expect(ids(getProductLinkList(products, { searchTerm: '31.5' }))).toEqual(['a']);
    expect(ids(getProductLinkList(products, { searchTerm: '111-abc' }))).toEqual(['b']);
  });
});
