import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp, fill } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type RatingInputProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Number of stars. */
  count?: number;
  size?: number;
  /** Tapping the current rating clears it. */
  clearable?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const STAR = 'M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8 6.9 19.5l1-5.7-4.1-4 5.7-.8z';
const GAP = 6;

type StarProps = { on: boolean; delay: number; size: number; hot: boolean };

const Star = memo(function Star({ on, delay, size, hot }: StarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const level = useSharedValue(on ? 1 : 0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    level.value = on
      ? withDelay(delay, withSequence(withTiming(0.4, { duration: 0 }), withSpring(1, springs.bouncy)))
      : withTiming(0, { duration: 130 });
  }, [on, delay, level]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, level.value * 2),
    transform: [{ scale: interpolate(level.value, [0, 1], [0.4, 1]) }, { rotate: `${(1 - level.value) * -30}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={STAR} stroke={hot ? c.accent : c.borderStrong} strokeWidth={1.5} strokeLinejoin="round" />
      </Svg>
      <Animated.View style={[fill, fillStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={STAR} fill={c.accent} stroke={c.accent} strokeWidth={1.5} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
});

/**
 * Star rating you can scrub. Lay a finger on the row and slide it: the stars fill as it
 * passes, each popping in a beat after the last, and the phone ticks for every one. Sliding
 * back un-fills them at once.
 */
export function RatingInput({
  value: controlled,
  defaultValue = 0,
  onChange,
  count = 5,
  size = 40,
  clearable = true,
  disabled,
  style,
}: RatingInputProps) {
  const [value, setValue] = useControllable(controlled, defaultValue, onChange);
  const previous = useRef(value);
  const rise = value > previous.current;
  const from = previous.current;
  useEffect(() => {
    previous.current = value;
  }, [value]);

  const pitch = size + GAP;
  const last = useSharedValue(value);
  const began = useSharedValue(0);
  const tapped = useSharedValue(0);
  const moved = useSharedValue(false);

  useEffect(() => {
    last.value = value;
  }, [value, last]);

  const set = (next: number) => {
    haptic('selection');
    setValue(next);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((e) => {
      began.value = last.value;
      moved.value = false;
      // A tap never moves, so the star under the finger is set the moment it lands.
      const next = clamp(Math.floor(e.x / pitch) + 1, 1, count);
      tapped.value = next;
      if (next !== last.value) {
        last.value = next;
        scheduleOnRN(set, next);
      }
    })
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > 6) moved.value = true;
      const next = clamp(Math.floor(e.x / pitch) + 1, 1, count);
      if (next !== last.value) {
        last.value = next;
        scheduleOnRN(set, next);
      }
    })
    .onFinalize(() => {
      // A tap on the star that is already the rating clears it. A stationary touch never
      // activates a pan, so this is decided here rather than in onEnd.
      if (clearable && !moved.value && tapped.value === began.value) {
        last.value = 0;
        scheduleOnRN(set, 0);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Rating"
        accessibilityValue={{ min: 0, max: count, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          setValue(clamp(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1), 0, count))
        }
        style={[styles.row, disabled ? { opacity: 0.45 } : null, style]}
      >
        {Array.from({ length: count }, (_, i) => (
          <Star
            key={i}
            on={i < value}
            hot={i < value}
            size={size}
            // Rising, each new star waits for the one before it.
            delay={rise ? Math.max(0, i - from) * 45 : 0}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP, alignSelf: 'center', paddingVertical: 6 },
});
