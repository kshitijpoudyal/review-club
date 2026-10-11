import { useEffect, useState } from 'react';

/**
 * Custom hook to enforce a minimum loading time
 * 
 * @param isLoading - The actual loading state from your data source
 * @param minimumTime - Minimum time in milliseconds to show loading (default: 300ms)
 * @returns boolean - Whether to show loading state (enforces minimum time)
 */
export const useMinimumLoading = (isLoading: boolean, minimumTime: number = 300): boolean => {
  const [isMinimumTimePassed, setIsMinimumTimePassed] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && loadingStartTime === null) {
      // Loading started - record the start time
      const startTime = Date.now();
      setLoadingStartTime(startTime);
      setIsMinimumTimePassed(false);

      // Set timer for minimum loading time
      const timer = setTimeout(() => {
        setIsMinimumTimePassed(true);
      }, minimumTime);

      return () => clearTimeout(timer);
    } else if (!isLoading && loadingStartTime !== null) {
      // Loading finished - check if minimum time has passed
      const elapsed = Date.now() - loadingStartTime;
      
      if (elapsed >= minimumTime) {
        // Minimum time already passed, stop loading immediately
        setIsMinimumTimePassed(true);
        setLoadingStartTime(null);
      } else {
        // Wait for remaining time
        const remainingTime = minimumTime - elapsed;
        const timer = setTimeout(() => {
          setIsMinimumTimePassed(true);
          setLoadingStartTime(null);
        }, remainingTime);

        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, loadingStartTime, minimumTime]);

  // Show loading if:
  // 1. Actually loading, OR
  // 2. Minimum time hasn't passed yet
  return isLoading || (loadingStartTime !== null && !isMinimumTimePassed);
};