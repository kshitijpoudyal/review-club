import React from 'react';

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-4 pt-2 ${className}`}>
      {children}
    </div>
  );
};
