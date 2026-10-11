import React from 'react';
import { Card } from '@/components/ui/card';
import { typography } from '../../utils/typography';

interface StatCardProps {
  value: string | number;
  label: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, className = '' }) => {
  return (
    <Card className="p-5 text-center">
      <div className={`${typography.statValue} mb-1 ${className}`}>
        {value}
      </div>
      <div className={`${typography.statLabel}`}>
        {label}
      </div>
    </Card>
  );
};

export default StatCard;
