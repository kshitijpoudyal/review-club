import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { VendorVoidMetric } from '../../utils/dashboardMetrics';
import { typography } from '../../utils/typography';
import { getStatsColor } from '../../utils/colors';
import { ChartCard } from './ChartCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VendorVoidChartProps {
  metrics: VendorVoidMetric[];
}

function truncateName(name: string, max = 14): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export const VendorVoidChart: React.FC<VendorVoidChartProps> = ({ metrics }) => {
  const withVoid = metrics.filter((v) => v.voidCount > 0);
  const chartData = withVoid.map((v) => ({
    name: truncateName(v.vendorName),
    fullName: v.vendorName,
    voidPaid: v.voidPaidTotal,
    voidCount: v.voidCount,
  }));

  return (
    <ChartCard
      title="Void by vendor"
      subtitle="Paid amount written off on void products"
    >
      {chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          No void products yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 13,
              }}
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : 0;
                return [
                  name === 'voidPaid' ? formatCurrency(num) : num,
                  name === 'voidPaid' ? 'Void $' : 'Void count',
                ];
              }}
              labelFormatter={(_, payload) =>
                (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ''
              }
            />
            <Bar dataKey="voidPaid" name="voidPaid" fill="hsl(var(--chart-5))" radius={[0, 6, 6, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {metrics.length > 0 && (
        <div className="mt-4 overflow-x-auto -mx-1">
          <Table className="w-full min-w-[480px] text-left">
            <TableHeader>
              <TableRow className={`${typography.captionStrong} border-b border-surface-variant`}>
                <TableHead className="py-2 pr-3 font-medium">Vendor</TableHead>
                <TableHead className="py-2 pr-3 font-medium text-right">Products</TableHead>
                <TableHead className="py-2 pr-3 font-medium text-right">Void</TableHead>
                <TableHead className="py-2 pr-3 font-medium text-right">Void $</TableHead>
                <TableHead className="py-2 pr-3 font-medium text-right">Void %</TableHead>
                <TableHead className="py-2 font-medium text-right">Net Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((v) => (
                <TableRow key={v.vendorId} className={`${typography.caption} border-b border-border/60`}>
                  <TableCell className="py-2 pr-3">{v.vendorName}</TableCell>
                  <TableCell className="py-2 pr-3 text-right tabular-nums">{v.totalProducts}</TableCell>
                  <TableCell className="py-2 pr-3 text-right tabular-nums">{v.voidCount}</TableCell>
                  <TableCell className="py-2 pr-3 text-right tabular-nums">
                    {formatCurrency(v.voidPaidTotal)}
                  </TableCell>
                  <TableCell className="py-2 pr-3 text-right tabular-nums">
                    {(v.voidRate * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell
                    className={`py-2 text-right tabular-nums ${getStatsColor('netDelta', v.netDelta)}`}
                  >
                    {formatCurrency(v.netDelta)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ChartCard>
  );
};
