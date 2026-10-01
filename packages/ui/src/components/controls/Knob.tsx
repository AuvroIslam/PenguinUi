import { memo, useCallback, useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';
import { RollingNumber } from '../text/RollingNumber';

export type KnobProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  /** Shown under the value. */
  label?: string;
  format?: (value: number) => string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TICKS = 41;
const SWEEP = 270;
/** Points of drag for the whole range, for the rare drag that starts right at the centre. */
const TRAVEL = 220;
const SWEEP_RAD = (SWEEP * Math.PI) / 180;

type TickProps = {
  index: number;
  radius: number;
  length: number;
  level: SharedValue<number>;
  on: string;
  off: string;
};

const Tick = memo(function Tick({ index, radius, length, level, on, off }: TickProps) {
  const fraction = index / (TICKS - 1);
  const angle = -SWEEP / 2 + fraction * SWEEP;

  const animated = useAnimatedStyle(() => {
    // Ticks under the value are lit and stand a little taller; the one at the value is tallest.
    const lit = level.value >= fraction - 1e-6;
    const near = Math.max(0, 1 - Math.abs(level.value - fraction) * (TICKS - 1));
    return {
      backgroundColor: interpolateColor(lit ? 1 : 0, [0, 1], [off, on]),
      transform: [
        { rotate: `${angle}deg` },
        { translateY: -radius - near * 3 },
        { scaleY: 1 + near * 0.6 },
      ],
    };
  });

  return <Animated.View style={[styles.tick, { height: length, top: '50%', marginTop: -length / 2 }, animated]} />;
});

/**
 * A rotary dial. A ring of ticks fills up to the current value, the tick at the value stands
 * taller than its neighbours, and the number rolls in the middle. It turns like a real dial:
 * wherever it is grabbed, the value follows the angle the finger sweeps around the centre,
 * clockwise for more. The value moves in steps and each step ticks.
 */
export function Knob({
  value: controlled,
  defaultValue = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = 200,
  label,
  format,
  disabled,
  style,
}: KnobProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable(controlled, defaultValue, onChange);

  const level = useSharedValue((clamp(value, min, max) - min) / (max - min || 1));
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const active = useSharedValue(0);
  const lastStep = useSharedValue(Math.round((value - min) / step));
  const dragging = useSharedValue(false);

  useEffect(() => {
    if (dragging.value) return;
    const target = (clamp(value, min, max) - min) / (max - min || 1);
    level.value = withSpring(target, springs.snappy);
    lastStep.value = Math.round((value - min) / step);
  }, [value, min, max, step, level, lastStep, dragging]);

  const steps = Math.max(1, Math.round((max - min) / step));
  const emit = useCallback(
    (index: number) => {
      haptic('selection');
      setValue(Math.round((min + index * step) * 1e6) / 1e6);
    },
    [min, step, setValue],
  );

  const center = size / 2;

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((e) => {
      dragging.value = true;
      lastX.value = e.x;
      lastY.value = e.y;
      active.value = withSpring(1, springs.press);
    })
    .onUpdate((e) => {
      const ax = lastX.value - center;
      const ay = lastY.value - center;
      const bx = e.x - center;
      const by = e.y - center;
      const farEnough = Math.min(Math.hypot(ax, ay), Math.hypot(bx, by)) > size * 0.12;
      // Turn by the angle swept since the last move, clockwise positive (y points down). Right
      // at the centre the angle is unreliable, so there it slides instead: right or up for more.
      const delta =
        farEnough
          ? Math.atan2(ax * by - ay * bx, ax * bx + ay * by) / SWEEP_RAD
          : (e.x - lastX.value - (e.y - lastY.value)) / TRAVEL;
      lastX.value = e.x;
      lastY.value = e.y;
      const next = clamp(level.value + delta, 0, 1);
      level.value = next;
      const index = Math.round(next * steps);
      if (index !== lastStep.value) {
        lastStep.value = index;
        scheduleOnRN(emit, index);
      }
    })
    .onFinalize(() => {
      dragging.value = false;
      level.value = withSpring(lastStep.value / steps, springs.snappy);
      active.value = withSpring(0, springs.bouncy);
    });

  const radius = size / 2 - 14;
  const cap = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - active.value * 0.03 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: format ? format(value) : String(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          setValue(clamp(value + (e.nativeEvent.actionName === 'increment' ? step : -step), min, max))
        }
        style={[{ width: size, height: size }, disabled ? { opacity: 0.45 } : null, style]}
      >
        {Array.from({ length: TICKS }, (_, i) => (
          <Tick key={i} index={i} radius={radius} length={9} level={level} on={c.accent} off={c.borderStrong} />
        ))}
        <Animated.View
          style={[
            styles.cap,
            {
              width: size - 70,
              height: size - 70,
              borderRadius: (size - 70) / 2,
              backgroundColor: c.surface,
              borderColor: c.border,
              boxShadow: theme.shadows.md,
            },
            cap,
          ]}
        >
          <RollingNumber value={value} format={format} group={false} variant="display" />
          {label ? (
            <Text variant="micro" tone="muted">
              {label}
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', left: '50%', width: 2.5, marginLeft: -1.25, borderRadius: 1.25 },
  cap: {
    position: 'absolute',
    alignSelf: 'center',
    top: 35,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
