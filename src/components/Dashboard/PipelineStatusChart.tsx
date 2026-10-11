import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PipelineStatusCount } from '../../utils/dashboardMetrics';
import { motion } from 'motion/react';
import { colors, statusSolid } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { ChartCard } from './ChartCard';

interface PipelineStatusChartProps {
  counts: PipelineStatusCount[];
}

const STATUS_FILTER_MAP: Record<string, string> = {
  'order-placed': 'order-placed',
  'add-review': 'add-review',
  'review-pending': 'review-pending',
  'send-screenshot': 'send-screenshot',
  'refund-pending': 'refund-pending',
  complete: 'complete',
  void: 'void',
};

// Tinted tile per stage, reusing the badge palette
const STATUS_TILE = Object.fromEntries(
  Object.entries(colors.status).map(([key, s]) => [key, `border ${s.bg} ${s.text} ${s.border}`])
) as Record<string, string>;

export const PipelineStatusChart: React.FC<PipelineStatusChartProps> = ({ counts }) => {
  const navigate = useNavigate();
  const total = counts.reduce((s, c) => s + c.count, 0);

  const handleClick = (status: string) => {
    const filter = STATUS_FILTER_MAP[status];
    if (filter) navigate(`/products?status=${filter}`);
  };

  return (
    <ChartCard title="Product pipeline" subtitle="Products by workflow stage">
      {total === 0 ? (
        <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
          No products yet
        </div>
      ) : (
        <>
          <div className="flex h-3 gap-1 mb-4">
            {counts.filter((item) => item.count > 0).map((item) => (
              <motion.div
                key={item.status}
                className={`rounded-full ${statusSolid[item.status] ?? 'bg-surface-variant'}`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / total) * 100}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                title={`${item.label}: ${item.count}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {counts.map((item) => (
              <button
                key={item.status}
                type="button"
                onClick={() => handleClick(item.status)}
                className={`text-left px-3 py-2 rounded-xl transition-transform hover:-translate-y-0.5 active:scale-[0.98] ${STATUS_TILE[item.status] ?? ''}`}
              >
                <div className={`${typography.numericStrong} text-lg`}>{item.count}</div>
                <div className={`${typography.caption} mt-0.5`}>{item.label}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  );
};
