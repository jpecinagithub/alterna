// Pure physics helpers shared by the simulators. Educational-grade models.

/** Sine wave value: V(t) = amp * sin(2π f t + phase) */
export function sine(t: number, amp: number, freq: number, phase = 0): number {
  return amp * Math.sin(2 * Math.PI * freq * t + phase);
}

/** Clamp a number to [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Linear map from one range to another. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Flux through a coil from a magnet at position x (0 = far, 1 = fully inside).
 * Smooth, monotonic — the exact curve shape is illustrative.
 */
export function fluxFromPosition(x: number): number {
  const c = clamp(x, 0, 1);
  return c * c * (3 - 2 * c); // smoothstep
}

/** Format helpers */
export function fmt(n: number, digits = 1): string {
  return n.toFixed(digits);
}
