import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { typography } from '../../utils/typography';

interface DashboardErrorProps {
  error: string;
  title?: string;
  additionalInfo?: React.ReactNode;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({
  error,
  title = 'Something went wrong',
  additionalInfo
}) => {
  return (
    <div className="page-gutter py-10">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-destructive/20 bg-destructive-container/40 px-6 py-8 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive-container text-destructive">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h3 className={`${typography.sectionTitle} font-display`}>{title}</h3>
        <p className={`${typography.body} mt-1 text-on-surface-variant`}>{error}</p>
        {additionalInfo && (
          <div className="mt-3">{additionalInfo}</div>
        )}
      </div>
    </div>
  );
};
