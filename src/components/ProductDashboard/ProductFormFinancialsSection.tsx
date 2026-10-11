import React from 'react';
import { Product } from '../../types/Product';
import { formatCurrency } from '../../utils/currency';
import { ProductFormSectionHeader } from './ProductFormSectionHeader';
import { ProductFormCurrencyInput } from './ProductFormCurrencyInput';
import { formLabelClass, FORM_CONTROL_HEIGHT } from './productFormStyles';
import { typography } from '../../utils/typography';

interface ProductFormFinancialsSectionProps {
  product: Product;
  onPaidChange: (value: string) => void;
  onReceivedChange: (value: string) => void;
  onResetDelta?: () => void;
}

function deltaDisplayClass(delta: number | null): string {
  if (delta === null) return `${typography.numericStrong} text-muted-foreground tabular-nums`;
  if (delta < 0) return `${typography.numericStrong} text-destructive tabular-nums`;
  if (delta > 0) return `${typography.numericStrong} text-brand tabular-nums`;
  return `${typography.numericStrong} text-on-surface-variant tabular-nums`;
}

export const ProductFormFinancialsSection: React.FC<ProductFormFinancialsSectionProps> = ({
  product,
  onPaidChange,
  onReceivedChange,
  onResetDelta,
}) => {
  return (
  <div className="px-6 py-5 space-y-4">
    <ProductFormSectionHeader title="Financials" />

    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="min-w-0">
        <label htmlFor="edit-amount-paid" className={formLabelClass}>Amount paid</label>
        <ProductFormCurrencyInput
          id="edit-amount-paid"
          value={product.paid}
          onChange={onPaidChange}
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="edit-amount-received" className={formLabelClass}>Amount received</label>
        <ProductFormCurrencyInput
          id="edit-amount-received"
          value={product.received}
          onChange={onReceivedChange}
        />
      </div>
      <div className="min-w-0">
        <p className={formLabelClass}>Delta</p>
        <div
          className={`${FORM_CONTROL_HEIGHT} flex items-center px-2 sm:px-3 rounded-xl bg-secondary/50 border border-input/35 ${deltaDisplayClass(product.delta)}`}
          aria-readonly="true"
        >
          {product.delta !== null ? formatCurrency(product.delta) : '—'}
        </div>
      </div>
    </div>

    {product.delta !== null && onResetDelta && (
      <button
        type="button"
        onClick={onResetDelta}
        className={`${typography.caption} text-muted-foreground hover:text-foreground underline transition-colors`}
      >
        Reset delta to null
      </button>
    )}
  </div>
  );
};

export default ProductFormFinancialsSection;
