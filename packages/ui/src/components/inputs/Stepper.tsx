import { useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { useShake } from '../../motion/shake';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';
import { RollingNumber } from '../text/RollingNumber';

export type StepperProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Formats the value. Digits in the result still roll. */
  format?: (value: number) => string;
  /** Accessibility label for the whole control. */
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const HOLD_DELAY = 380;
const START_INTERVAL = 200;
const MIN_INTERVAL = 55;

/**
 * Increment and decrement. The number rolls in the direction it moved. Holding a button
 * repeats, and repeats faster the longer it is held. At a bound the number shakes and the
 * repeat stops.
 */
export function Stepper({
  value: controlled,
  defaultValue = 0,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  format,
  label,
  disabled,
  style,
}: StepperProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable(controlled, defaultValue, onChange);
  const { shake, style: shakeStyle } = useShake();

  // The repeat loop runs outside React's render cycle, so it reads the value from a ref.
  const current = useRef(value);
  current.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = () => clearTimeout(timer.current);
  useEffect(() => stop, []);

  /** Returns false when the value is already at the bound in that direction. */
  const move = (direction: 1 | -1): boolean => {
    const next = Math.round(clamp(current.current + direction * step, min, max) * 1e6) / 1e6;
    if (next === current.current) {
      shake();
      haptic('warning');
      return false;
    }
    current.current = next;
    setValue(next);
    haptic('selection');
    return true;
  };

  const start = (direction: 1 | -1) => {
    stop();
    if (!move(direction)) return;
    let interval = START_INTERVAL;
    const tick = () => {
      if (!move(direction)) return;
      interval = Math.max(MIN_INTERVAL, interval * 0.86);
      timer.current = setTimeout(tick, interval);
    };
    timer.current = setTimeout(tick, HOLD_DELAY);
  };

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format ? format(value) : String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') move(1);
        else if (e.nativeEvent.actionName === 'decrement') move(-1);
      }}
      style={[
        styles.pill,
        { backgroundColor: c.surfaceSunken, borderColor: c.border, borderRadius: theme.radii.pill },
        disabled ? { opacity: 0.45 } : null,
        style,
      ]}
    >
      <StepButton icon="minus" dim={atMin} disabled={disabled} label="Decrease" onStart={() => start(-1)} onEnd={stop} />
      <Animated.View style={[styles.value, shakeStyle]}>
        <RollingNumber value={value} format={format} variant="heading" group={false} />
      </Animated.View>
      <StepButton icon="plus" dim={atMax} disabled={disabled} label="Increase" onStart={() => start(1)} onEnd={stop} />
    </View>
  );
}

function StepButton({
  icon,
  dim,
  disabled,
  label,
  onStart,
  onEnd,
}: {
  icon: 'minus' | 'plus';
  dim: boolean;
  disabled?: boolean;
  label: string;
  onStart: () => void;
  onEnd: () => void;
}) {
  const theme = useTheme();
  const rest = useSharedValue(dim ? 0.35 : 1);

  useEffect(() => {
    rest.value = withTiming(dim ? 0.35 : 1, { duration: 160 });
  }, [dim, rest]);

  const faded = useAnimatedStyle(() => ({ opacity: rest.value }));

  return (
    <PressableScale
      accessibilityLabel={label}
      disabled={disabled}
      haptic={false}
      scaleTo={0.86}
      onPressIn={onStart}
      onPressOut={onEnd}
      style={[styles.button, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <Animated.View style={faded}>
        <Glyph name={icon} size={20} color={theme.colors.text} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'center',
  },
  value: { minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
