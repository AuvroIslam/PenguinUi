import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Eye openness from 1 (open) to 0.1 (shut). Blinks at a relaxed, slightly irregular pace,
 * with the occasional double blink, the way a living thing does.
 */
export function useBlink(enabled = true): SharedValue<number> {
  const open = useSharedValue(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const blink = () => {
      if (!alive) return;
      const double = Math.random() < 0.22;
      const shut = withSequence(withTiming(0.1, { duration: 70 }), withTiming(1, { duration: 120 }));
      open.value = double ? withSequence(shut, withDelay(90, shut)) : shut;
      timer = setTimeout(blink, 2200 + Math.random() * 3400);
    };
    timer = setTimeout(blink, 900 + Math.random() * 1600);
    return () => {
      alive = false;
      clearTimeout(timer);
      cancelAnimation(open);
    };
  }, [enabled, reduced, open]);

  return open;
}

/** A slow 0-to-1-and-back breath, for idle bobbing. Phase-shifted so a group never moves in step. */
export function useBreath(period = 2600, enabled = true): SharedValue<number> {
  const t = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;
    t.value = withDelay(
      Math.random() * period,
      withRepeat(withTiming(1, { duration: period / 2, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
    return () => cancelAnimation(t);
  }, [period, enabled, reduced, t]);

  return t;
}

/** A flipper wave: a few quick beats, then rest, repeating while `waving` is true. */
export function useWave(waving: boolean): SharedValue<number> {
  const angle = useSharedValue(0);

  useEffect(() => {
    if (!waving) {
      angle.value = withSpring(0, { damping: 14, stiffness: 180 });
      return;
    }
    const beat = withSequence(
      withTiming(-28, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(-6, { duration: 160, easing: Easing.inOut(Easing.quad) }),
    );
    angle.value = withRepeat(withSequence(beat, beat, beat, withTiming(0, { duration: 220 }), withDelay(900, withTiming(0, { duration: 1 }))), -1);
    return () => cancelAnimation(angle);
  }, [waving, angle]);

  return angle;
}
