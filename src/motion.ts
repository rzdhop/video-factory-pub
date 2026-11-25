/** Shared motion helpers: every layer animates with the same curves so the film feels like one object. */
export const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);
export const easeInOut = (k: number) => { const x = clamp01(k); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
/** deterministic pseudo-random in [0,1) */
export const rnd = (i: number, salt = 0) => { const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Under-damped spring, analytic (no frame loop): 0 at age 0, overshoots, settles on 1.
 *  freq in Hz, damping = how fast the bounce dies. Returns 0 before the start. */
export const springTo = (age: number, freq = 3.2, damping = 9) => {
  if (age <= 0) return 0;
  return 1 - Math.exp(-damping * age) * Math.cos(2 * Math.PI * freq * age);
};

/** Impulse: jumps to 1 at age 0 and rings back to 0 (camera punch, squash, pulse). */
export const impulse = (age: number, freq = 4, damping = 8) => {
  if (age < 0) return 0;
  return Math.exp(-damping * age) * Math.cos(2 * Math.PI * freq * age);
};

/** Smooth organic noise from three sines (hand-held camera, floating lights). */
export const wobble = (t: number, seed = 0) =>
  Math.sin(t * 0.9 + seed) * 0.55 + Math.sin(t * 2.3 + seed * 1.7 + 1) * 0.3 + Math.sin(t * 4.1 + seed * 2.9 + 2) * 0.15;
