import { Product } from '../types/Product';
import { isComplete, isRefundPending, isVoid } from './productStatus';

export interface ProductLinkListOptions {
  searchTerm?: string;
  /** Products already linked to any transaction. */
  linkedProductIds?: string[];
  /** Hide products that are linked to a transaction or already complete. */
  hideLinked?: boolean;
  hideVoid?: boolean;
}

/** Already settled: linked to a transaction, or workflow complete. */
export function isLinkedOrComplete(product: Product, linkedProductIds: string[]): boolean {
  return linkedProductIds.includes(product.id || '') || isComplete(product);
}

function matchesSearch(product: Product, query: string): boolean {
  return [
    product.item?.toLowerCase(),
    product.paid?.toString(),
    product.orderNumber?.toLowerCase(),
  ].some((field) => field?.includes(query));
}

function getOrderTime(product: Product): number | null {
  if (!product.orderDate) return null;
  const time = new Date(product.orderDate).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Most recent order first; products without an order date go last, then by name. */
function compareByOrderDateDesc(a: Product, b: Product): number {
  const timeA = getOrderTime(a);
  const timeB = getOrderTime(b);
  if (timeA != null && timeB != null) {
    return timeB - timeA || a.item.localeCompare(b.item);
  }
  if (timeA != null) return -1;
  if (timeB != null) return 1;
  return a.item.localeCompare(b.item);
}

/**
 * Products shown in the link modal's list: refund-pending products first, then
 * every other status, each group ordered by most recent order date.
 */
export function getProductLinkList(
  products: Product[],
  { searchTerm = '', linkedProductIds = [], hideLinked = false, hideVoid = false }: ProductLinkListOptions = {}
): Product[] {
  const query = searchTerm.trim().toLowerCase();

  const visible = products.filter((product) => {
    if (hideLinked && isLinkedOrComplete(product, linkedProductIds)) return false;
    if (hideVoid && isVoid(product)) return false;
    return !query || matchesSearch(product, query);
  });

  const refundPending = visible.filter(isRefundPending).sort(compareByOrderDateDesc);
  const others = visible.filter((p) => !isRefundPending(p)).sort(compareByOrderDateDesc);
  return [...refundPending, ...others];
}
