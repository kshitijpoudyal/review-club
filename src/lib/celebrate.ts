// A small confetti burst for finished work, launched from wherever the user
// last clicked or tapped. Loaded on demand; skipped under reduced motion.

let lastPointer = { x: 0.5, y: 0.6 };

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastPointer = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    },
    { capture: true, passive: true }
  );
}

export const celebrate = async () => {
  const { default: confetti } = await import('canvas-confetti');
  confetti({
    origin: lastPointer,
    particleCount: 70,
    spread: 75,
    startVelocity: 32,
    gravity: 1.1,
    scalar: 0.9,
    ticks: 160,
    colors: ['#006a68', '#2cbab0', '#f59e0b', '#1e3a5f', '#fbf9f3'],
    disableForReducedMotion: true,
  });
};
