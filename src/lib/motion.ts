import type { Transition, Variants } from 'motion/react';

// Shared motion vocabulary so every surface moves the same way.

export const springSoft: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 };
export const springBouncy: Transition = { type: 'spring', stiffness: 420, damping: 22 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: 'easeIn' } },
};

/** Only the first rows of a long list animate in; the rest appear immediately. */
export const STAGGER_LIMIT = 12;
