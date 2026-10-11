import React from 'react';
import { Input } from '@/components/ui/input';

interface ProductFormCurrencyInputProps {
  id?: string;
  value: number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const ProductFormCurrencyInput: React.FC<ProductFormCurrencyInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '0.00',
  required = false,
}) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground tabular-nums pointer-events-none">
      $
    </span>
    <Input
      id={id}
      type="number"
      step="0.01"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="pl-7 tabular-nums"
      placeholder={placeholder}
      required={required}
    />
  </div>
);

export default ProductFormCurrencyInput;
