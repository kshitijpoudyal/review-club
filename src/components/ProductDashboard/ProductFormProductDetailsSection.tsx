import React from 'react';
import { Product } from '../../types/Product';
import { ProductFormSectionHeader } from './ProductFormSectionHeader';
import { ProductFormCurrencyInput } from './ProductFormCurrencyInput';
import { formLabelClass } from './productFormStyles';
import type { Vendor } from '../../types/Product';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductFormProductDetailsSectionProps {
  product: Product;
  activeVendors: Vendor[];
  defaultVendorId: string;
  onChange: (field: keyof Product, value: string | null) => void;
  mode?: 'add' | 'edit';
  nameRequired?: boolean;
  paidRequired?: boolean;
  onPaidChange?: (value: string) => void;
}

export const ProductFormProductDetailsSection: React.FC<ProductFormProductDetailsSectionProps> = ({
  product,
  activeVendors,
  defaultVendorId,
  onChange,
  mode = 'edit',
  nameRequired = false,
  paidRequired = false,
  onPaidChange,
}) => (
  <div className="px-6 py-5 space-y-4">
    <ProductFormSectionHeader title="Product details" />

    <div>
      <label htmlFor="product-name" className={formLabelClass}>
        Name {nameRequired && <span className="text-destructive">*</span>}
      </label>
      <Textarea
        id="product-name"
        value={product.item}
        onChange={(e) => onChange('item', e.target.value)}
        rows={2}
        placeholder="Product name"
        required={nameRequired}
      />
    </div>

    {mode === 'add' ? (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="product-vendor" className={formLabelClass}>
              Vendor {nameRequired && <span className="text-destructive">*</span>}
            </label>
            <Select
              value={product.vendorId || defaultVendorId || undefined}
              onValueChange={(value) => onChange('vendorId', value)}
              required={nameRequired}
            >
              <SelectTrigger id="product-vendor">
                <SelectValue placeholder="Select a vendor..." />
              </SelectTrigger>
              <SelectContent>
                {activeVendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="product-order-date" className={formLabelClass}>Order date</label>
            <Input
              id="product-order-date"
              type="date"
              value={product.orderDate || ''}
              onChange={(e) => onChange('orderDate', e.target.value || null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="product-order-number" className={formLabelClass}>Order number</label>
            <Input
              id="product-order-number"
              type="text"
              value={product.orderNumber || ''}
              onChange={(e) => onChange('orderNumber', e.target.value || null)}
              placeholder="AMZ-..."
            />
          </div>
          <div>
            <label htmlFor="product-amount-paid" className={formLabelClass}>
              Amount paid {paidRequired && <span className="text-destructive">*</span>}
            </label>
            {onPaidChange && (
              <ProductFormCurrencyInput
                id="product-amount-paid"
                value={product.paid}
                onChange={onPaidChange}
                required={paidRequired}
              />
            )}
          </div>
        </div>
      </>
    ) : (
      <>
        <div>
          <label htmlFor="product-vendor" className={formLabelClass}>Vendor</label>
          <Select
            value={product.vendorId || defaultVendorId || undefined}
            onValueChange={(value) => onChange('vendorId', value)}
          >
            <SelectTrigger id="product-vendor">
              <SelectValue placeholder="Select a vendor..." />
            </SelectTrigger>
            <SelectContent>
              {activeVendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="product-order-date" className={formLabelClass}>Order date</label>
            <Input
              id="product-order-date"
              type="date"
              value={product.orderDate || ''}
              onChange={(e) => onChange('orderDate', e.target.value || null)}
            />
          </div>
          <div>
            <label htmlFor="product-order-number" className={formLabelClass}>Order number</label>
            <Input
              id="product-order-number"
              type="text"
              value={product.orderNumber || ''}
              onChange={(e) => onChange('orderNumber', e.target.value || null)}
              placeholder="AMZ-..."
            />
          </div>
        </div>
      </>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="min-w-0">
        <label htmlFor="product-url" className={formLabelClass}>Product URL</label>
        <Input
          id="product-url"
          type="url"
          value={product.url || ''}
          onChange={(e) => onChange('url', e.target.value || null)}
          placeholder="https://amazon.com/..."
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="product-image-url" className={formLabelClass}>Image URL</label>
        <Input
          id="product-image-url"
          type="url"
          value={product.imageUrl || ''}
          onChange={(e) => onChange('imageUrl', e.target.value || null)}
          placeholder="https://..."
        />
      </div>
    </div>

  </div>
);

export default ProductFormProductDetailsSection;
