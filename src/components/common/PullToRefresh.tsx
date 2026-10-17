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
  const { pullDistance, pullOffset, isRefreshing } = usePullToRefresh({ onRefresh, disabled, threshold });

  const maxHeight = 56;
  // Follows the (rubber-banded) finger; never a hard stop
  const indicatorHeight = isRefreshing ? maxHeight : pullOffset * 0.75;
  const progress = Math.min(pullDistance / threshold, 1);
  const isVisible = indicatorHeight > 0;

  return (
    <div>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: indicatorHeight,
          // Tracks the finger 1:1 while pulling; settles back smoothly on release
          transition: pullDistance === 0 ? 'height 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      >
        {isVisible && (
          <div
            className="flex items-center justify-center w-9 h-9 bg-card rounded-full shadow-soft-lg"
            style={{ opacity: isRefreshing ? 1 : 0.4 + progress * 0.6 }}
          >
            <svg
              className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              style={!isRefreshing ? { transform: `rotate(${progress * 270}deg)` } : undefined}
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
