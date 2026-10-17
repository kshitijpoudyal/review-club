import type { Transition, Variants } from 'motion/react';

// Shared motion vocabulary so every surface moves the same way.
//
// Springs follow Apple's two-parameter model: `bounce` is the damping ratio
// (0 = critically damped, no overshoot) and `visualDuration` is the response.
// Springs start from the current on-screen value and keep velocity when
// re-targeted, so anything built on them can be interrupted mid-flight.

/** Default for UI: critically damped, settles without overshoot. */
export const springSoft: Transition = { type: 'spring', bounce: 0, visualDuration: 0.35 };

/** Small, quick changes: selection indicators, toggles, badges swapping. */
export const springSnappy: Transition = { type: 'spring', bounce: 0, visualDuration: 0.25 };

/**
 * A little overshoot. Only for motion that follows a physical gesture with
 * momentum (a flick, a throw, a drag release), never for things that just appear.
 */
export const springMomentum: Transition = { type: 'spring', bounce: 0.2, visualDuration: 0.4 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.02 } },
};

/** Route changes cross-fade with a hint of lift; no exit wait blocks input. */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: springSoft },
};

/** Only the first rows of a long list animate in; the rest appear immediately. */
export const STAGGER_LIMIT = 12;
