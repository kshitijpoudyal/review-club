import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTimeRange } from '../../utils/dashboardMetrics';
import { typography } from '../../utils/typography';

const OPTIONS: { value: DashboardTimeRange; label: string }[] = [
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: 'YTD', label: 'YTD' },
  { value: 'All', label: 'All' },
];

interface TimeRangeToggleProps {
  value: DashboardTimeRange;
  onChange: (range: DashboardTimeRange) => void;
}

export const TimeRangeToggle: React.FC<TimeRangeToggleProps> = ({ value, onChange }) => (
  <Tabs value={value} onValueChange={(v) => onChange(v as DashboardTimeRange)}>
    <TabsList className="h-auto rounded-full bg-secondary/80 p-0.5">
      {OPTIONS.map((opt) => (
        <TabsTrigger
          key={opt.value}
          value={opt.value}
          className={`${typography.captionStrong} rounded-full px-3 py-1.5 hover:text-foreground data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-none`}
        >
          {opt.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);
