/**
 * Refund expectation helpers: configured deductions (tax, PayPal fee, custom
 * seller shortfall) and the expected net refund they produce.
 */

import {
  DEFAULT_REFUND_EXPECTATION,
  Product,
  RefundExpectation,
} from '../types/Product';

const PAYPAL_FEE_RATE = 0.045;

/** Default PayPal fee estimate (4.5% of paid). */
export function getDefaultPayPalFee(paid: number | null | undefined): number | null {
  if (paid == null || paid <= 0) return null;
  return Math.round(paid * PAYPAL_FEE_RATE * 100) / 100;
}

export function normalizeRefundExpectation(
  raw?: Partial<RefundExpectation> | null,
  legacyTax?: number | null,
  legacyNotes?: string
): RefundExpectation {
  const base = { ...DEFAULT_REFUND_EXPECTATION, ...raw };
  const hasLegacyTax = legacyTax != null && legacyTax > 0;

  return {
    excludeTax: base.excludeTax || hasLegacyTax,
    taxAmount: base.taxAmount ?? (hasLegacyTax ? legacyTax : null),
    customDeduction: base.customDeduction ?? null,
    excludePayPalFee: base.excludePayPalFee ?? false,
    paypalFeeAmount: base.paypalFeeAmount ?? null,
    notes: base.notes?.trim() || legacyNotes?.trim() || '',
  };
}

export function getProductTax(product: Product): number | null {
  const tax = product.tax;
  if (tax == null || tax <= 0) return null;
  return tax;
}

/** Tax to deduct when exclusion is enabled; prefers an explicit amount, then saved order tax. */
export function resolveExcludedTaxAmount(
  expectation: RefundExpectation,
  productTax: number | null
): number | null {
  if (expectation.taxAmount != null && expectation.taxAmount > 0) {
    return expectation.taxAmount;
  }
  return productTax;
}

export function getProductRefundExpectation(product: Product): RefundExpectation {
  if (product.refundExpectation != null) {
    return normalizeRefundExpectation(product.refundExpectation, null, product.refundNotes);
  }
  // Legacy products stored exclusion on `tax` before refundExpectation existed.
  return normalizeRefundExpectation(null, product.tax, product.refundNotes);
}

export function hasRefundExpectation(expectation: RefundExpectation): boolean {
  return (
    expectation.excludeTax ||
    (expectation.customDeduction != null && expectation.customDeduction > 0) ||
    expectation.excludePayPalFee
  );
}

/** Expected net refund after configured deductions. */
export function getExpectedReceived(
  paid: number | null | undefined,
  expectation: RefundExpectation
): number | null {
  if (paid == null) return null;

  let expected = paid;
  if (expectation.excludeTax && expectation.taxAmount != null && expectation.taxAmount > 0) {
    expected -= expectation.taxAmount;
  }
  if (expectation.customDeduction != null && expectation.customDeduction > 0) {
    expected -= expectation.customDeduction;
  }
  if (
    expectation.excludePayPalFee &&
    expectation.paypalFeeAmount != null &&
    expectation.paypalFeeAmount > 0
  ) {
    expected -= expectation.paypalFeeAmount;
  }

  return Math.max(0, Math.round(expected * 100) / 100);
}

export function getExpectedReceivedForProduct(product: Product): number | null {
  return getExpectedReceived(product.paid, getProductRefundExpectation(product));
}

export function getRefundExpectationSummary(
  expectation: RefundExpectation,
  paid: number | null | undefined
): string {
  if (!hasRefundExpectation(expectation)) {
    return 'Full refund';
  }

  const parts: string[] = [];
  if (expectation.excludeTax) {
    parts.push(
      expectation.taxAmount != null && expectation.taxAmount > 0
        ? `Tax excluded ($${expectation.taxAmount.toFixed(2)})`
        : 'Tax excluded'
    );
  }
  if (expectation.customDeduction != null && expectation.customDeduction > 0) {
    parts.push(`$${expectation.customDeduction.toFixed(2)} less`);
  }
  if (expectation.excludePayPalFee) {
    parts.push(
      expectation.paypalFeeAmount != null && expectation.paypalFeeAmount > 0
        ? `PayPal fee excluded ($${expectation.paypalFeeAmount.toFixed(2)})`
        : 'PayPal fee excluded'
    );
  }

  const expected = getExpectedReceived(paid, expectation);
  if (expected != null && paid != null && expected < paid - 0.01) {
    return parts.join(' · ');
  }

  return parts.join(' · ') || 'Full refund';
}

export function getRefundVariance(
  expected: number,
  received: number
): { variance: number; label: string } {
  const variance = Math.round((received - expected) * 100) / 100;
  if (Math.abs(variance) < 0.01) {
    return { variance: 0, label: 'Matches expected' };
  }
  if (variance < 0) {
    return {
      variance,
      label: `$${Math.abs(variance).toFixed(2)} short of expected`,
    };
  }
  return {
    variance,
    label: `$${variance.toFixed(2)} over expected`,
  };
}
