import { Product, Retailer } from '../types/Product';

export type StoreKey = Retailer | 'other';

export function getRetailerFromUrl(url?: string | null): StoreKey {
  if (!url) return 'other';
  if (/amazon\.(com|ca|co\.uk|de|fr|it|es|in|com\.au|co\.jp)|amzn\.(to|com)|a\.co/i.test(url)) {
    return 'amazon';
  }
  if (/walmart\.com/i.test(url)) return 'walmart';
  if (/wayfair\.com/i.test(url)) return 'wayfair';
  return 'other';
}

export function getStoreFromProduct(product: Pick<Product, 'url' | 'retailer'>): StoreKey {
  const fromUrl = getRetailerFromUrl(product.url);
  if (fromUrl !== 'other') return fromUrl;
  if (product.retailer) return product.retailer;
  return 'other';
}

const STORE_BORDER_CLASSES: Record<StoreKey, string> = {
  amazon: 'border-[#FF9900]',
  walmart: 'border-[#0071DC]',
  wayfair: 'border-[#7B189F]',
  other: 'border-brand',
};

const STORE_ROW_CLASSES: Record<StoreKey, string> = {
  amazon: 'bg-store-row-amazon',
  walmart: 'bg-store-row-walmart',
  wayfair: 'bg-store-row-wayfair',
  other: 'bg-store-row-other',
};

export function getStoreBorderColor(product: Pick<Product, 'url' | 'retailer'>): string {
  return STORE_BORDER_CLASSES[getStoreFromProduct(product)];
}

export function getStoreRowColor(product: Pick<Product, 'url' | 'retailer'>): string {
  return STORE_ROW_CLASSES[getStoreFromProduct(product)];
}
