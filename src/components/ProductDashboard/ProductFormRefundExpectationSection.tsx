import React, { useEffect, useRef, useState } from 'react';
import { Product, RefundExpectation } from '../../types/Product';
import { ProductFormCurrencyInput } from './ProductFormCurrencyInput';
import { formLabelClass, formTextareaClass } from './productFormStyles';
import { typography } from '../../utils/typography';
import { formatCurrency } from '../../utils/currency';
import {
  getDefaultPayPalFee,
  getExpectedReceived,
  getProductRefundExpectation,
  getProductTax,
  getRefundExpectationSummary,
  hasRefundExpectation,
  resolveExcludedTaxAmount,
} from '../../utils/refundUtils';

interface ProductFormRefundExpectationSectionProps {
  product: Product;
  onChange: (expectation: RefundExpectation) => void;
  /** When false, disclosure resets (e.g. modal closed). */
  isActive?: boolean;
}

function parseAmount(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function shouldAutoExpandExpectation(expectation: RefundExpectation): boolean {
  return hasRefundExpectation(expectation) || Boolean(expectation.notes?.trim());
}

export const ProductFormRefundExpectationSection: React.FC<
  ProductFormRefundExpectationSectionProps
> = ({ product, onChange, isActive = true }) => {
  const expectation = getProductRefundExpectation(product);
  const expectedReceived = getExpectedReceived(product.paid, expectation);
  const feeManuallySet = useRef(false);
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);

  const isExpanded = expandedOverride ?? shouldAutoExpandExpectation(expectation);

  useEffect(() => {
    setExpandedOverride(null);
  }, [product.id]);

  useEffect(() => {
    if (!isActive) {
      setExpandedOverride(null);
    }
  }, [isActive]);

  const update = (patch: Partial<RefundExpectation>) => {
    onChange({ ...expectation, ...patch });
  };

  const handlePayPalFeeToggle = (checked: boolean) => {
    if (checked) {
      feeManuallySet.current = false;
      update({
        excludePayPalFee: true,
        paypalFeeAmount: getDefaultPayPalFee(product.paid),
      });
      return;
    }
    feeManuallySet.current = false;
    update({ excludePayPalFee: false, paypalFeeAmount: null });
  };

  const handlePayPalFeeChange = (value: string) => {
    feeManuallySet.current = true;
    update({ paypalFeeAmount: parseAmount(value) });
  };

  const toggleExpanded = () => {
    setExpandedOverride(!isExpanded);
  };

  const summaryText = getRefundExpectationSummary(expectation, product.paid);
  const checkboxClass =
    'h-4 w-4 rounded border-[rgba(196,198,207,0.65)] text-[#022448] focus:ring-[#022448]/20 shrink-0';

  const amountPrimary =
    product.paid != null && expectedReceived != null
      ? formatCurrency(expectedReceived)
      : null;

  return (
    <div className={`px-6 ${isExpanded ? 'py-5 space-y-4' : 'py-3'}`}>
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 text-left rounded-xl hover:bg-[#eae8e2]/40 -mx-2 px-2 py-1.5 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className={`${typography.label} text-[#74777f]`}>Expected refund</span>
            {amountPrimary != null ? (
              <span className={`${typography.bodyStrong} text-[#1b1c19] tabular-nums shrink-0`}>
                {amountPrimary}
              </span>
            ) : (
              <span className={`${typography.caption} text-[#74777f] shrink-0`}>
                Set amount paid
              </span>
            )}
          </div>
          {!isExpanded && (
            <p className={`${typography.caption} text-[#74777f] mt-0.5 truncate`}>
              {summaryText}
            </p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[#74777f] shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          <div className="space-y-3">
            <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_7.5rem] gap-x-3 gap-y-2 items-center">
              <input
                id="refund-exclude-tax"
                type="checkbox"
                checked={expectation.excludeTax}
                onChange={(e) => {
                  const checked = e.target.checked;
                  update({
                    excludeTax: checked,
                    taxAmount: checked
                      ? resolveExcludedTaxAmount(expectation, getProductTax(product))
                      : null,
                  });
                }}
                className={checkboxClass}
              />
              <label htmlFor="refund-exclude-tax" className="min-w-0 cursor-pointer">
                <span className={`${typography.body} text-[#1b1c19] block`}>Exclude tax</span>
                <span className={`${typography.caption} text-[#74777f] block`}>
                  Won&apos;t get sales tax back
                </span>
              </label>
              {expectation.excludeTax && (
                <div className="col-span-2 sm:col-span-1 sm:col-start-3">
                  <ProductFormCurrencyInput
                    id="refund-tax-amount"
                    value={expectation.taxAmount}
                    onChange={(value) => update({ taxAmount: parseAmount(value) })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_7.5rem] gap-x-3 gap-y-2 items-center">
              <input
                id="refund-custom-deduction-toggle"
                type="checkbox"
                checked={expectation.customDeduction !== null}
                onChange={(e) =>
                  update({
                    customDeduction: e.target.checked ? (expectation.customDeduction ?? 0) : null,
                  })
                }
                className={checkboxClass}
              />
              <label htmlFor="refund-custom-deduction-toggle" className="min-w-0 cursor-pointer">
                <span className={`${typography.body} text-[#1b1c19] block`}>Other deduction</span>
                <span className={`${typography.caption} text-[#74777f] block`}>
                  Vendor keeps a fixed amount
                </span>
              </label>
              {expectation.customDeduction != null && (
                <div className="col-span-2 sm:col-span-1 sm:col-start-3">
                  <ProductFormCurrencyInput
                    id="refund-custom-deduction"
                    value={expectation.customDeduction}
                    onChange={(value) => update({ customDeduction: parseAmount(value) })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_7.5rem] gap-x-3 gap-y-2 items-center">
              <input
                id="refund-exclude-paypal"
                type="checkbox"
                checked={expectation.excludePayPalFee}
                onChange={(e) => handlePayPalFeeToggle(e.target.checked)}
                className={checkboxClass}
              />
              <label htmlFor="refund-exclude-paypal" className="min-w-0 cursor-pointer">
                <span className={`${typography.body} text-[#1b1c19] block`}>PayPal fee</span>
                <span className={`${typography.caption} text-[#74777f] block`}>
                  Usually ~4.5% of paid
                </span>
              </label>
              {expectation.excludePayPalFee && (
                <div className="col-span-2 sm:col-span-1 sm:col-start-3">
                  <ProductFormCurrencyInput
                    id="refund-paypal-fee"
                    value={expectation.paypalFeeAmount}
                    onChange={handlePayPalFeeChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="refund-notes" className={formLabelClass}>
              Notes (optional)
            </label>
            <textarea
              id="refund-notes"
              value={expectation.notes ?? ''}
              onChange={(e) => update({ notes: e.target.value })}
              className={formTextareaClass}
              rows={2}
              placeholder="e.g. vendor confirmed no tax refund"
            />
          </div>

          {product.paid != null && expectedReceived != null && (
            <p className={`${typography.caption} text-[#74777f] tabular-nums`}>
              {formatCurrency(product.paid)} paid → {formatCurrency(expectedReceived)} expected
              {!hasRefundExpectation(expectation) && ' (full refund)'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFormRefundExpectationSection;
