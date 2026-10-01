import React from 'react';
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
import { ChartCard } from './ChartCard';

const CHART_TEAL = '#006a68';
const CHART_NAVY = '#022448';
const CHART_AMBER = '#d97706';

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
    <div className="bg-white rounded-lg shadow-lg border border-[#e4e2dd] px-3 py-2 text-sm">
      <p className="font-medium text-[#74777f] mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="tabular-nums">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-[#74777f] text-sm">
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
}) => (
  <ChartCard title={title} subtitle={subtitle}>
    {data.length === 0 ? (
      <EmptyChart message={emptyMessage} />
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dd" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#74777f' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#74777f' }}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CurrencyTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            name={title}
            stroke={color}
            fill={`url(#grad-${title})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

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
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dd" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#74777f' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#74777f' }}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CurrencyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="paid"
            name="Paid"
            stroke={CHART_NAVY}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="received"
            name="Received"
            stroke={CHART_TEAL}
            strokeWidth={2}
            dot={false}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dd" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#74777f' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#74777f' }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CurrencyTooltip />} />
          <Bar dataKey="value" name="Fees" fill={CHART_AMBER} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);
