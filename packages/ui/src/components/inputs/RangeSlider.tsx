import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp, passThrough } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';
import { RollingNumber } from '../text/RollingNumber';

export type RangeValue = [number, number];

export type RangeSliderProps = {
  value?: RangeValue;
  defaultValue?: RangeValue;
  onChange?: (value: RangeValue) => void;
  onChangeEnd?: (value: RangeValue) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Smallest distance the two thumbs may be apart, in value units. */
  minGap?: number;
  format?: (value: number) => string;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const THUMB = 28;
const HIT = 52;
const TRACK = 6;

type PartProps = {
  pos: SharedValue<number>;
  index: 0 | 1;
  grabbed: SharedValue<number>;
  active: SharedValue<number>;
};

function RangeThumb({ pos, index, grabbed, active }: PartProps) {
  const theme = useTheme();
  const c = theme.colors;
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: pos.value },
      { scale: interpolate(grabbed.value === index ? active.value : 0, [0, 1], [1, 1.22]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.thumb,
        passThrough,
        { backgroundColor: c.surface, borderColor: c.borderStrong, boxShadow: theme.shadows.md },
        animated,
      ]}
    >
      <View style={[styles.core, { backgroundColor: c.accent }]} />
    </Animated.View>
  );
}

function RangeBubble({
  pos,
  index,
  grabbed,
  active,
  value,
  format,
}: PartProps & { value: number; format?: (value: number) => string }) {
  const theme = useTheme();
  const c = theme.colors;
  const animated = useAnimatedStyle(() => {
    const on = grabbed.value === index ? active.value : 0;
    return {
      opacity: Math.min(1, on * 1.4),
      transform: [
        { translateX: pos.value },
        { translateY: interpolate(on, [0, 1], [10, 0]) },
        { scale: interpolate(on, [0, 1], [0.5, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.bubbleSlot, passThrough, animated]}>
      <View style={[styles.bubble, { backgroundColor: c.primary, borderRadius: theme.radii.sm }]}>
        <RollingNumber value={value} format={format} group={false} variant="label" tone="onPrimary" />
      </View>
      <View style={[styles.caret, { backgroundColor: c.primary }]} />
    </Animated.View>
  );
}

/**
 * Two thumbs on one rail. The fill between them is the selection. Each thumb pushes against
 * the other: they cannot pass and cannot come closer than `minGap`, and when one meets the
 * other the selection squeezes and the phone ticks. The thumb nearest the finger is the one
 * that moves, so the two never fight over a touch.
 */
export function RangeSlider({
  value: controlled,
  defaultValue = [25, 75],
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  format,
  label,
  disabled,
  style,
}: RangeSliderProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable<RangeValue>(controlled, defaultValue, onChange);

  const [width, setWidth] = useState(0);
  const span = Math.max(1, width - THUMB);
  const steps = Math.max(1, Math.round((max - min) / step));
  const gapSteps = Math.ceil(minGap / step);

  // Thumb positions in pixels along the rail.
  const lo = useSharedValue(0);
  const hi = useSharedValue(0);
  const grabbed = useSharedValue(-1); // -1 none, 0 low thumb, 1 high thumb
  const active = useSharedValue(0);
  const squeeze = useSharedValue(0);
  const startX = useSharedValue(0);
  const loIndex = useSharedValue(-1);
  const hiIndex = useSharedValue(-1);
  const touching = useSharedValue(false);

  const toValue = useCallback(
    (index: number) => Math.round((min + index * step) * 1e6) / 1e6,
    [min, step],
  );

  useEffect(() => {
    if (!width || touching.value) return;
    const at = (v: number) => (clamp(v, min, max) - min) / (max - min || 1);
    lo.value = withSpring(at(value[0]) * span, springs.snappy);
    hi.value = withSpring(at(value[1]) * span, springs.snappy);
    loIndex.value = Math.round(at(value[0]) * steps);
    hiIndex.value = Math.round(at(value[1]) * steps);
  }, [value, min, max, width, span, steps, lo, hi, loIndex, hiIndex, touching]);

  const emit = useCallback(
    (a: number, b: number) => {
      haptic('selection');
      setValue([toValue(a), toValue(b)]);
    },
    [setValue, toValue],
  );
  const bump = useCallback(() => haptic('rigid'), []);
  const finish = useCallback(
    (a: number, b: number) => onChangeEnd?.([toValue(a), toValue(b)]),
    [onChangeEnd, toValue],
  );

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((e) => {
      touching.value = true;
      const touch = clamp(e.x - THUMB / 2, 0, span);
      // The nearer thumb wins. When both are stacked, the side of the touch decides.
      const toLo = Math.abs(touch - lo.value);
      const toHi = Math.abs(touch - hi.value);
      grabbed.value = toLo === toHi ? (touch < lo.value ? 0 : 1) : toLo < toHi ? 0 : 1;
      const current = grabbed.value === 0 ? lo.value : hi.value;
      startX.value = Math.abs(touch - current) > THUMB ? touch : current;
      active.value = withSpring(1, springs.bouncy);
    })
    .onUpdate((e) => {
      const gap = (gapSteps / steps) * span;
      const raw = startX.value + e.translationX;
      let pushed = false;
      if (grabbed.value === 0) {
        const limit = Math.max(0, hi.value - gap);
        pushed = raw > limit;
        lo.value = clamp(raw, 0, limit);
      } else {
        const limit = Math.min(span, lo.value + gap);
        pushed = raw < limit;
        hi.value = clamp(raw, limit, span);
      }

      if (pushed && squeeze.value === 0) {
        squeeze.value = withSequence(withTiming(1, { duration: 90 }), withSpring(0, springs.bouncy));
        scheduleOnRN(bump);
      }

      const a = Math.round((lo.value / span) * steps);
      const b = Math.round((hi.value / span) * steps);
      if (a !== loIndex.value || b !== hiIndex.value) {
        loIndex.value = a;
        hiIndex.value = b;
        scheduleOnRN(emit, a, b);
      }
    })
    .onFinalize(() => {
      touching.value = false;
      grabbed.value = -1;
      active.value = withSpring(0, springs.smooth);
      lo.value = withSpring((loIndex.value / steps) * span, springs.snappy);
      hi.value = withSpring((hiIndex.value / steps) * span, springs.snappy);
      scheduleOnRN(finish, loIndex.value, hiIndex.value);
    });

  const fillStyle = useAnimatedStyle(() => ({
    left: lo.value + THUMB / 2,
    width: Math.max(0, hi.value - lo.value),
    transform: [{ scaleY: 1 - squeeze.value * 0.4 }],
  }));

  return (
    <View
      style={[styles.wrap, disabled ? { opacity: 0.45 } : null, style]}
      accessible
      accessibilityLabel={label}
      accessibilityValue={{ text: `${format ? format(value[0]) : value[0]} to ${format ? format(value[1]) : value[1]}` }}
    >
      <GestureDetector gesture={pan}>
        <View style={styles.hit} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
          <View
            style={[
              styles.rail,
              { backgroundColor: c.surfaceSunken, borderColor: c.border },
            ]}
          />
          <Animated.View
            style={[styles.fill, passThrough, { backgroundColor: c.accent }, fillStyle]}
          />
          <RangeThumb pos={lo} index={0} grabbed={grabbed} active={active} />
          <RangeThumb pos={hi} index={1} grabbed={grabbed} active={active} />
          <RangeBubble pos={lo} index={0} grabbed={grabbed} active={active} value={value[0]} format={format} />
          <RangeBubble pos={hi} index={1} grabbed={grabbed} active={active} value={value[1]} format={format} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', paddingTop: 44 },
  hit: { height: HIT, justifyContent: 'center' },
  rail: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: TRACK,
    borderRadius: TRACK / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fill: {
    position: 'absolute',
    top: (HIT - TRACK) / 2,
    height: TRACK,
    marginLeft: 0,
    borderRadius: TRACK / 2,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: { width: 8, height: 8, borderRadius: 4 },
  bubbleSlot: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    top: -42,
    alignItems: 'center',
    transformOrigin: '50% 100%',
  },
  bubble: { minWidth: 44, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  caret: { width: 8, height: 8, marginTop: -4, transform: [{ rotate: '45deg' }] },
});
