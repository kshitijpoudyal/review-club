import React from 'react';
import { typography } from '../../utils/typography';

interface DashboardSectionProps {
  children: React.ReactNode;
  title?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ 
  children, 
  title
}) => {
  return (
    <div className="page-gutter">
      {title && (
        <h2 className={`${typography.sectionTitle} mb-0`}>{title}</h2>
      )}
      {children}
    </div>
  );
};
