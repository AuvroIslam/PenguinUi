import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp, passThrough } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';
import { RollingNumber } from '../text/RollingNumber';

export type SliderProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Called once when the finger lifts. */
  onChangeEnd?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Formats the number in the bubble. */
  format?: (value: number) => string;
  /** Show the value bubble while dragging. */
  bubble?: boolean;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const THUMB = 28;
const THUMB_ACTIVE = 1.22;
const HIT = 52;
const TRACK = 6;
const MAX_STRETCH = 24;

/** Resistance past the end of the track: moves freely at first, then hardens toward a limit. */
function rubber(distance: number): number {
  'worklet';
  return MAX_STRETCH * (1 - 1 / (distance / MAX_STRETCH + 1));
}

/**
 * A slider with some weight to it. The thumb grows under the finger and a bubble springs up
 * and leans against the direction of travel. Dragging past either end does not stop dead: the
 * track stretches like a rubber band and snaps back on release.
 */
export function Slider({
  value: controlled,
  defaultValue = 0,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  format,
  bubble = true,
  label,
  disabled,
  style,
}: SliderProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable(controlled, defaultValue, onChange);

  const [width, setWidth] = useState(0);
  const span = Math.max(1, width - THUMB);

  const x = useSharedValue(0);
  const stretch = useSharedValue(0);
  const active = useSharedValue(0);
  const lean = useSharedValue(0);
  const dragging = useSharedValue(false);
  const lastIndex = useSharedValue(-1);
  const startX = useSharedValue(0);

  const steps = Math.max(1, Math.round((max - min) / step));
  const toValue = useCallback(
    (index: number) => Math.round((min + index * step) * 1e6) / 1e6,
    [min, step],
  );

  // Follow the value when it changes from outside the gesture, such as a controlled update.
  useEffect(() => {
    if (!width || dragging.value) return;
    const fraction = (clamp(value, min, max) - min) / (max - min || 1);
    x.value = withSpring(fraction * span, springs.snappy);
    lastIndex.value = Math.round(fraction * steps);
  }, [value, min, max, width, span, steps, x, dragging, lastIndex]);

  const emit = useCallback(
    (index: number) => {
      haptic('selection');
      setValue(toValue(index));
    },
    [setValue, toValue],
  );

  const finish = useCallback(
    (index: number) => onChangeEnd?.(toValue(index)),
    [onChangeEnd, toValue],
  );

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((e) => {
      dragging.value = true;
      active.value = withSpring(1, springs.bouncy);
      const touch = clamp(e.x - THUMB / 2, 0, span);
      // Grabbing the thumb drags it from where it is; touching the rail jumps the thumb there.
      startX.value = Math.abs(touch - x.value) > THUMB ? touch : x.value;
      if (startX.value !== x.value) x.value = withSpring(touch, springs.snappy);
    })
    .onUpdate((e) => {
      const raw = startX.value + e.translationX;
      const over = raw < 0 ? raw : raw > span ? raw - span : 0;
      stretch.value = over === 0 ? 0 : Math.sign(over) * rubber(Math.abs(over));
      if (over === 0 || Math.abs(e.translationX) > 3) x.value = clamp(raw, 0, span);

      lean.value = withSpring(clamp(e.velocityX * 0.012, -16, 16), springs.snappy);

      const index = Math.round((x.value / span) * steps);
      if (index !== lastIndex.value) {
        lastIndex.value = index;
        scheduleOnRN(emit, index);
      }
    })
    .onFinalize(() => {
      dragging.value = false;
      active.value = withSpring(0, springs.smooth);
      lean.value = withSpring(0, springs.wobbly);
      stretch.value = withSpring(0, springs.wobbly);
      // Settle on the step the value landed on.
      x.value = withSpring((lastIndex.value / steps) * span, springs.snappy);
      scheduleOnRN(finish, lastIndex.value);
    });

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const railStyle = useAnimatedStyle(() => {
    const s = stretch.value;
    const pulled = Math.abs(s);
    return {
      transformOrigin: s < 0 ? 'right center' : 'left center',
      transform: [{ scaleX: 1 + pulled / Math.max(span, 1) }, { scaleY: 1 - (pulled / MAX_STRETCH) * 0.35 }],
    };
  });

  // The fill lives inside the rail, so it stretches with it. Its width is given in the rail's
  // unstretched units so that it still ends under the thumb while the rail is pulled.
  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, x.value + stretch.value) / (1 + Math.abs(stretch.value) / Math.max(span, 1)),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + stretch.value },
      { scale: interpolate(active.value, [0, 1], [1, THUMB_ACTIVE]) },
    ],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, active.value * 1.4),
    transform: [
      { translateX: x.value + stretch.value },
      { translateY: interpolate(active.value, [0, 1], [10, 0]) },
      { rotate: `${lean.value}deg` },
      { scale: interpolate(active.value, [0, 1], [0.5, 1]) },
    ],
  }));

  // Screen readers adjust in single steps.
  const nudge = (direction: 1 | -1) => {
    const next = clamp(value + direction * step, min, max);
    if (next !== value) setValue(next);
  };
  const latest = useRef(nudge);
  latest.current = nudge;

  return (
    <View
      style={[styles.wrap, disabled ? { opacity: 0.45 } : null, style]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: format ? format(value) : String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => latest.current(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <GestureDetector gesture={pan}>
        <View style={styles.hit} onLayout={onLayout}>
          <Animated.View
            style={[
              styles.rail,
              { backgroundColor: c.surfaceSunken, borderColor: c.border },
              railStyle,
            ]}
          >
            <Animated.View style={[styles.fill, { backgroundColor: c.accent }, fillStyle]} />
          </Animated.View>

          <Animated.View
            style={[
              styles.thumb,
              passThrough,
              { backgroundColor: c.surface, borderColor: c.borderStrong, boxShadow: theme.shadows.md },
              thumbStyle,
            ]}
          >
            <View style={[styles.thumbCore, { backgroundColor: c.accent }]} />
          </Animated.View>

          {bubble ? (
            <Animated.View style={[styles.bubbleSlot, passThrough, bubbleStyle]}>
              <View style={[styles.bubble, { backgroundColor: c.primary, borderRadius: theme.radii.sm }]}>
                <RollingNumber
                  value={value}
                  format={format}
                  group={false}
                  variant="label"
                  tone="onPrimary"
                />
              </View>
              <View style={[styles.caret, { backgroundColor: c.primary }]} />
            </Animated.View>
          ) : null}
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
    overflow: 'visible',
  },
  // Starts with the rail and ends at the thumb's centre, so both of its ends are round.
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: TRACK / 2 },
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
  thumbCore: { width: 8, height: 8, borderRadius: 4 },
  bubbleSlot: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    top: -42,
    alignItems: 'center',
    // Pivots on the tip of the caret, so it leans like a flag on a pole.
    transformOrigin: '50% 100%',
  },
  bubble: { minWidth: 44, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  caret: { width: 8, height: 8, marginTop: -4, transform: [{ rotate: '45deg' }] },
});
