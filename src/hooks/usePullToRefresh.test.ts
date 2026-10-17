import { describe, expect, it } from 'vitest';
import { rubberband } from './usePullToRefresh';

describe('rubberband', () => {
  it('follows almost 1:1 near the edge', () => {
    expect(rubberband(10, 800)).toBeCloseTo(5.43, 1);
  });

  it('keeps moving but gives less the further you pull', () => {
    const a = rubberband(100, 800);
    const b = rubberband(200, 800);
    const c = rubberband(300, 800);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c - b).toBeLessThan(b - a);
  });

  it('never exceeds the dimension times the constant', () => {
    expect(rubberband(100000, 800)).toBeLessThan(800);
  });

  it('is zero with no overshoot', () => {
    expect(rubberband(0, 800)).toBe(0);
  });
});
