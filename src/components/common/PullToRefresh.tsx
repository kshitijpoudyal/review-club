import React from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
}) => {
  const { pullDistance, isRefreshing } = usePullToRefresh({ onRefresh, disabled, threshold });

  const maxHeight = 56;
  const indicatorHeight = isRefreshing
    ? maxHeight
    : Math.min(pullDistance * 0.5, maxHeight);
  const progress = Math.min(pullDistance / threshold, 1);
  const isVisible = indicatorHeight > 0;

  return (
    <div>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: indicatorHeight,
          transition: pullDistance === 0 && !isRefreshing ? 'height 0.2s ease-out' : 'none',
        }}
      >
        {isVisible && (
          <div className="flex items-center justify-center w-9 h-9 bg-card rounded-full shadow-md">
            <svg
              className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              style={!isRefreshing ? { transform: `rotate(${progress * 270}deg)`, transition: 'transform 0.05s linear' } : undefined}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
