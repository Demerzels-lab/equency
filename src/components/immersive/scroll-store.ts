// Module-level scroll/pointer store. The DOM provider (ScrollStage) writes it on scroll/move;
// the WebGL scene reads it inside useFrame. A plain object (not React state) so the 3D never
// re-renders React per frame and we avoid bridging context across the r3f Canvas boundary.
export const scroll = {
  p: 0, // 0..1 page scroll progress
  px: 0, // pointer x, -1..1
  py: 0, // pointer y, -1..1
};

/** Eased progress within a [start,end] band → 0..1 (for per-section scrubbing). */
export function band(p: number, start: number, end: number): number {
  return Math.max(0, Math.min(1, (p - start) / (end - start)));
}
