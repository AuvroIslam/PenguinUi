import { useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';
import { RollingNumber } from '../text/RollingNumber';

export type CircularProgressProps = {
  /** 0 to 1. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Small caption under the number. */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A ring that fills to its value on a heavy spring while the percentage rolls in the
 * middle. Reaching 100 percent is an event, not just a number: the ring turns to the success
 * colour, the figure gives way to a check that draws itself, and the whole ring gives a
 * single pulse.
 */
export function CircularProgress({ value, size = 140, strokeWidth = 10, label, style }: CircularProgressProps) {
  const theme = useTheme();
  const c = theme.colors;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  const complete = v >= 1;

  const fill = useSharedValue(0);
  const done = useSharedValue(complete ? 1 : 0);
  const mark = useSharedValue(complete ? 1 : 0);
  const pulse = useSharedValue(1);
  const wasComplete = useRef(complete);

  useEffect(() => {
    fill.value = withSpring(v, springs.smooth);
  }, [v, fill]);

  useEffect(() => {
    if (complete && !wasComplete.current) {
      done.value = withDelay(280, withTiming(1, { duration: 260 }));
      mark.value = withDelay(380, withTiming(1, { duration: 360, easing: easings.out }));
      pulse.value = withDelay(320, withSequence(withTiming(1.06, { duration: 140 }), withSpring(1, springs.bouncy)));
      setTimeout(() => haptic('success'), 360);
    } else if (!complete && wasComplete.current) {
      done.value = withTiming(0, { duration: 180 });
      mark.value = withTiming(0, { duration: 120 });
    }
    wasComplete.current = complete;
  }, [complete, done, mark, pulse]);

  const ring = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - fill.value),
    stroke: interpolateColor(done.value, [0, 1], [c.accent, c.success]),
  }));
  const whole = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const number = useAnimatedStyle(() => ({
    opacity: 1 - done.value,
    transform: [{ scale: 1 - done.value * 0.3 }],
  }));
  const check = useAnimatedStyle(() => ({ opacity: done.value, transform: [{ scale: 0.7 + done.value * 0.3 }] }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={[{ width: size, height: size }, whole, style]}
    >
      <Svg width={size} height={size} style={styles.ring}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surfaceSunken} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[circumference, circumference]}
          animatedProps={ring}
        />
      </Svg>
      <View style={styles.centre}>
        <Animated.View style={[styles.centre, number]}>
          <RollingNumber value={Math.round(v * 100)} suffix="%" variant="title" group={false} />
          {label ? (
            <Text variant="micro" tone="muted">
              {label}
            </Text>
          ) : null}
        </Animated.View>
        <Animated.View style={[styles.centre, check]} pointerEvents="none">
          <DrawnCheck progress={mark} size={size * 0.36} color={c.success} strokeWidth={2.4} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Rotated so the fill starts at twelve o'clock.
  ring: { transform: [{ rotate: '-90deg' }] },
  centre: { ...fill, alignItems: 'center', justifyContent: 'center' },
});
