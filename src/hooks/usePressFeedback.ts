import { useRef, useState } from 'react';
import type React from 'react';

// Presses that start on these keep their own feedback; the container stays still.
const NESTED_CONTROL = 'a, button, input, select, textarea, label, [role="menu"], [role="menuitem"]';
// Movement beyond this means the finger is scrolling, not tapping
const SLOP_PX = 10;

/**
 * Touch-down highlight for a tappable container (card, row). Shows on
 * pointer-down, not on release; cancels when the pointer moves past a small
 * slop so scrolling through a list doesn't flash every card.
 */
export function usePressFeedback(enabled: boolean) {
  const [pressed, setPressed] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);

  if (!enabled) return { pressed: false, handlers: {} };

  const release = () => {
    origin.current = null;
    setPressed(false);
  };

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || (e.target as Element).closest(NESTED_CONTROL)) return;
      origin.current = { x: e.clientX, y: e.clientY };
      setPressed(true);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const start = origin.current;
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP_PX) release();
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
  };

  return { pressed, handlers };
}
