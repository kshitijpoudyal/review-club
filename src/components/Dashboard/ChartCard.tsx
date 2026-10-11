import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { typography } from '../../utils/typography';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => (
  <Card className={cn('overflow-hidden p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg', className)}>
    <h3 className={`${typography.bodyStrong} mb-0.5`}>{title}</h3>
    {subtitle && (
      <p className={`${typography.caption} mb-3`}>{subtitle}</p>
    )}
    {!subtitle && <div className="mb-3" />}
    {children}
  </Card>
);
