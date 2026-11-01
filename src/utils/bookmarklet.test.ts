import { describe, expect, it } from 'vitest';
import {
  buildAmazonBookmarkletHref,
  buildWayfairBookmarkletHref,
  buildWalmartBookmarkletHref,
} from './bookmarklet';

const PROD_ORIGIN = 'https://amazon-review-tracker.vercel.app';

describe('retailer bookmarklets', () => {
  it.each([
    ['amazon', buildAmazonBookmarkletHref],
    ['wayfair', buildWayfairBookmarkletHref],
    ['walmart', buildWalmartBookmarkletHref],
  ])('%s copies JSON, redirects to app, and skips on-page overlay', (_retailer, buildHref) => {
    const href = buildHref(PROD_ORIGIN);
    expect(href.startsWith('javascript:')).toBe(true);
    expect(href).toContain(PROD_ORIGIN);
    expect(href).toContain('/products#import=');
    expect(href).toContain('__rtCopyJson');
    expect(href).toContain('__rtHandoff');
    expect(href).toContain("window.open(url,'_blank')");
    expect(href).not.toContain('noopener');
    expect(href).not.toContain('__rtShowOverlay');
  });

  it.each([
    ['amazon', buildAmazonBookmarkletHref, 'extractOrderTax'],
    ['wayfair', buildWayfairBookmarkletHref, 'extractOrderTax'],
    ['walmart', buildWalmartBookmarkletHref, 'orderTax'],
  ])('%s extracts tax into payload', (_retailer, buildHref, taxMarker) => {
    const href = buildHref(PROD_ORIGIN);
    expect(href).toContain(taxMarker);
    expect(href).toContain('tax:');
  });
});
