import React, { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

// Splits a formatted stat such as "~$1,470.39", "-$1,310.95" or "86%" into the
// number and the text around it, so the number can count up.
const VALUE_PATTERN = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/;

interface AnimatedValueProps {
  value: string | number;
}

/** Counts a formatted number up to its value; non-numeric values render as-is. */
export const AnimatedValue: React.FC<AnimatedValueProps> = ({ value }) => {
  const text = String(value);
  const match = VALUE_PATTERN.exec(text);
  const target = match ? Number(match[2].replace(/,/g, '')) : NaN;
  const decimals = match?.[2].includes('.') ? match[2].split('.')[1].length : 0;

  const reduceMotion = useReducedMotion();
  const previous = useRef(0);
  const [display, setDisplay] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    if (reduceMotion) {
      setDisplay(target);
      return;
    }
    const controls = animate(previous.current, target, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    previous.current = target;
    return () => controls.stop();
  }, [target, reduceMotion]);

  if (!match || Number.isNaN(target)) return <>{text}</>;

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <>{match[1]}{formatted}{match[3]}</>;
};
