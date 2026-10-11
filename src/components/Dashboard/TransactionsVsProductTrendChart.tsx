import React, { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import {
  DualTrendPoint,
  MonthlyTrendPoint,
} from '../../utils/dashboardMetrics';
import { BarChart3 } from 'lucide-react';
import { ChartCard } from './ChartCard';

// Theme-aware series colours (see --chart-* in src/index.css)
const CHART_TEAL = 'hsl(var(--chart-1))';
const CHART_NAVY = 'hsl(var(--chart-2))';
const CHART_AMBER = 'hsl(var(--chart-3))';
const GRID = 'hsl(var(--border))';
const AXIS_TICK = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
const CURSOR = { stroke: 'hsl(var(--input))', strokeDasharray: '4 4' };

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-xl shadow-navy-md border border-border/70 px-3 py-2 text-sm">
      <p className="text-caption font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 tabular-nums">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="ml-auto pl-3 font-semibold">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <BarChart3 className="h-5 w-5" strokeWidth={1.5} />
      </span>
      {message}
    </div>
  );
}

interface TrendChartProps {
  data: MonthlyTrendPoint[];
  title: string;
  subtitle?: string;
  color?: string;
  emptyMessage?: string;
}

export const MonthlyAreaChart: React.FC<TrendChartProps> = ({
  data,
  title,
  subtitle,
  color = CHART_TEAL,
  emptyMessage = 'No data for this period',
}) => {
  // SVG ids can't contain spaces, so the title is no use as a gradient id
  const gradientId = `area-${useId().replace(/:/g, '')}`;

  return (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyChart message={emptyMessage} />
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color }} stopOpacity={0.28} />
              <stop offset="100%" style={{ stopColor: color }} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CurrencyTooltip />} cursor={CURSOR} />
          <Area
            type="monotone"
            dataKey="value"
            name={title}
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={2.25}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
  );
};

interface DualLineChartProps {
  data: DualTrendPoint[];
  title: string;
  subtitle?: string;
}

export const PaidVsReceivedChart: React.FC<DualLineChartProps> = ({
  data,
  title,
  subtitle,
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyChart message="No paid or refund data for this period" />
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CurrencyTooltip />} cursor={CURSOR} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="paid"
            name="Paid"
            stroke={CHART_NAVY}
            strokeWidth={2.25}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="received"
            name="Received"
            stroke={CHART_TEAL}
            strokeWidth={2.25}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

interface FeesChartProps {
  data: MonthlyTrendPoint[];
}

export const FeesTrendChart: React.FC<FeesChartProps> = ({ data }) => (
  <ChartCard title="Transaction fees over time" subtitle="Monthly fee totals">
    {data.length === 0 ? (
      <EmptyChart message="No fee data for this period" />
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CurrencyTooltip />} cursor={CURSOR} />
          <Bar dataKey="value" name="Fees" fill={CHART_AMBER} radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);
