/**
 * Fills the parent. Defined here because `StyleSheet.absoluteFillObject` was removed from
 * React Native and the library supports versions on both sides of that change.
 */
export const fill = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
} as const;

/** Clamps on the JS or UI thread. */
export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}
