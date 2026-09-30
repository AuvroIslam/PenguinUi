import { Easing } from 'react-native-reanimated';

/**
 * Spring presets. Plain objects so they can be captured by worklets.
 * Damping ratios are noted because they decide the character more than any single number does.
 */
export const springs = {
  /** Overdamped. Press-in response: the surface should move before the finger has settled. */
  press: { mass: 0.2, stiffness: 400, damping: 22 },
  /** Critically damped and fast. Indicators, toggles, digits. */
  snappy: { mass: 0.3, stiffness: 280, damping: 18 },
  /** Ratio 0.56: one visible overshoot. Release, pop-in, success. */
  bouncy: { mass: 0.6, stiffness: 260, damping: 14 },
  /** Critically damped and slow. Cards, flips, reveals. */
  gentle: { mass: 1, stiffness: 170, damping: 26 },
  /** Heavy surface. Sheets, dialogs, shared-element morphs. */
  smooth: { mass: 1, stiffness: 220, damping: 30 },
  /** Ratio 0.45: two or three oscillations. Returning from a drag. */
  wobbly: { mass: 1, stiffness: 180, damping: 12 },
} as const;

export type SpringName = keyof typeof springs;

export const easings = {
  /** Default for timed motion. Fast start, long settle. */
  fluid: Easing.bezier(0.32, 0.72, 0, 1),
  /** Long reveals and path drawing. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Loops that reverse. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
};

export const durations = {
  fast: 160,
  base: 240,
  slow: 420,
  lazy: 700,
} as const;

/**
 * Rubber-band resistance for dragging past a bound, after the iOS scroll view.
 * `offset` is how far past the bound the finger is; `dimension` is the size of the thing dragged.
 */
export function rubberBand(offset: number, dimension: number, constant = 0.55): number {
  'worklet';
  if (dimension <= 0) return 0;
  const sign = offset < 0 ? -1 : 1;
  const x = Math.abs(offset);
  return sign * (1 - 1 / ((x * constant) / dimension + 1)) * dimension;
}

/** Where a fling would come to rest, used to choose a snap point from release velocity. */
export function project(velocity: number, deceleration = 0.998): number {
  'worklet';
  return ((velocity / 1000) * deceleration) / (1 - deceleration);
}

/** Index of the snap point closest to `value`. */
export function nearest(value: number, points: readonly number[]): number {
  'worklet';
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < points.length; i++) {
    const distance = Math.abs(points[i] - value);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}
