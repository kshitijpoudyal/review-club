import React from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

/** App icon: a navy squircle with the package glyph. Solid in both themes. */
export const BrandMark: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      'flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-gradient-to-b from-[#1d4b80] to-[#06284f] text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(var(--shadow-color)/0.2)]',
      className
    )}
  >
    <Package className="h-4 w-4" strokeWidth={2.1} aria-hidden="true" />
  </span>
);
