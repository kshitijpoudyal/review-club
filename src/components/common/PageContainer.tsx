import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared horizontal frame for the header and every page section, so their
 * edges line up at any width. The same rule is available to class strings as
 * `page-gutter` (see src/index.css).
 */
export const PageContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('page-gutter', className)} {...props} />
  )
);
PageContainer.displayName = 'PageContainer';
