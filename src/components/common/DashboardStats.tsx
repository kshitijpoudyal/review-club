import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Hourglass,
  type LucideIcon,
  Package,
  PackageCheck,
  Receipt,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Unlink,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeUp, staggerChildren } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { typography } from '../../utils/typography';
import { AnimatedValue } from './AnimatedValue';

interface StatItem {
  value: string | number;
  label: string;
  className?: string;
  /** Overrides the icon inferred from the label */
  icon?: LucideIcon;
}

interface DashboardStatsProps {
  stats: StatItem[];
  loading?: boolean;
}

const ICON_BY_LABEL: Record<string, LucideIcon> = {
  'Total Products': Package,
  Completed: CheckCircle2,
  'Total Paid': CreditCard,
  Received: Wallet,
  Remaining: Hourglass,
  Fees: Receipt,
  'Net Received': Banknote,
  Transactions: ArrowLeftRight,
  Unlinked: Unlink,
  'Unlinked $': CircleDollarSign,
  'Product Received': PackageCheck,
  'Transactions Net Received': Banknote,
  'Reconciliation Gap': Scale,
  'Completion Rate': Target,
};

const isDelta = (label: string) => label.includes('Delta');
const isNegative = (value: string | number) => String(value).trim().startsWith('-');

const StatCardSkeleton = () => (
  <Card className="flex items-center gap-3 p-3">
    <Skeleton className="h-9 w-9 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-5 w-3/4" />
    </div>
  </Card>
);

const StatCard = ({ value, label, className, icon }: StatItem) => {
  const delta = isDelta(label);
  const negative = isNegative(value);
  const Icon = icon ?? (delta ? (negative ? TrendingDown : TrendingUp) : ICON_BY_LABEL[label] ?? CircleDollarSign);

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -2 }}>
      <Card className="flex h-full items-center gap-3 p-3 transition-shadow duration-200 hover:shadow-soft-lg">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            delta
              ? negative
                ? 'bg-destructive-container/60 text-destructive'
                : 'bg-brand/10 text-brand'
              : 'bg-primary/8 text-primary'
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className={`${typography.statLabel} truncate`}>{label}</div>
          <div className={cn(typography.statValue, 'truncate', className)}>
            <AnimatedValue value={value} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="page-gutter py-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-gutter py-2">
      <motion.div
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </motion.div>
    </div>
  );
};
