import { useState, useEffect, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

// Movement under this is treated as a tap or a wobble, not a pull
const SLOP_PX = 10;

/**
 * Soft boundary: the further past the edge, the less the content follows,
 * so it slows before it stops instead of hitting a wall.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function usePullToRefresh({ onRefresh, threshold = 80, disabled = false }: UsePullToRefreshOptions) {
  // Raw finger travel (decides whether to refresh) and the resisted offset (what's drawn)
  const [pullDistance, setPullDistance] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const isDragging = useRef(false);
  const pullDistanceRef = useRef(0);
  const armedRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const reset = () => {
      isDragging.current = false;
      armedRef.current = false;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      setPullOffset(0);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || isRefreshingRef.current || window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || disabled) return;
      if (window.scrollY > 0) {
        reset();
        return;
      }
      const travel = e.touches[0].clientY - startY.current - SLOP_PX;
      if (travel <= 0) {
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
          setPullOffset(0);
        }
        return;
      }
      pullDistanceRef.current = travel;
      setPullDistance(travel);
      setPullOffset(rubberband(travel, window.innerHeight));

      // A light tick the moment releasing would refresh (Android; iOS ignores it)
      const armed = travel >= threshold;
      if (armed && !armedRef.current) navigator.vibrate?.(8);
      armedRef.current = armed;
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current || disabled) return;
      const dist = pullDistanceRef.current;
      reset();

      if (dist >= threshold) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', reset);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', reset);
    };
  }, [disabled, threshold]);

  return { pullDistance, pullOffset, isRefreshing };
}
