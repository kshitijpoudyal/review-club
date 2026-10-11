import React from 'react';
import { typography } from '../../utils/typography';

interface ProductFormSectionHeaderProps {
  title: string;
  className?: string;
}

export const ProductFormSectionHeader: React.FC<ProductFormSectionHeaderProps> = ({
  title,
  className = 'mb-3',
}) => (
  <p className={`${typography.label} text-muted-foreground ${className}`}>
    {title}
  </p>
);

export default ProductFormSectionHeader;
