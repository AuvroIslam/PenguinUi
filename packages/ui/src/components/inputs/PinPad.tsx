import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { useShake } from '../../motion/shake';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';

export type PinPadProps = {
  /** Number of digits in the PIN. */
  length?: number;
  /** Check the PIN. Return true if it is right. May be async; the pad ignores keys until it settles. */
  onComplete: (pin: string) => boolean | Promise<boolean>;
  /** Called after a correct PIN, once the dots have finished their wave. */
  onSuccess?: () => void;
  /** Called after every key, with the digits entered so far. */
  onChange?: (pin: string) => void;
  /** Node for the bottom-left key, such as a biometrics button. */
  extra?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

type DotProps = { filled: boolean; index: number; result: 'idle' | 'error' | 'success' };

function Dot({ filled, index, result }: DotProps) {
  const theme = useTheme();
  const c = theme.colors;
  const fillLevel = useSharedValue(filled ? 1 : 0);
  const lift = useSharedValue(0);
  const tone = useSharedValue(0);

  useEffect(() => {
    fillLevel.value = filled ? withSpring(1, springs.bouncy) : withTiming(0, { duration: 140 });
  }, [filled, fillLevel]);

  useEffect(() => {
    if (result === 'success') {
      tone.value = withTiming(1, { duration: 160 });
      lift.value = withDelay(
        index * 70,
        withSequence(withSpring(-10, springs.snappy), withSpring(0, springs.bouncy)),
      );
    } else if (result === 'error') {
      tone.value = withTiming(-1, { duration: 120 });
    } else {
      tone.value = withTiming(0, { duration: 160 });
    }
  }, [result, index, lift, tone]);

  const ring = useAnimatedStyle(() => ({
    borderColor: interpolateColor(tone.value, [-1, 0, 1], [c.danger, c.borderStrong, c.success]),
    transform: [{ translateY: lift.value }],
  }));
  const core = useAnimatedStyle(() => ({
    opacity: Math.min(1, fillLevel.value * 2),
    transform: [{ scale: fillLevel.value }],
    backgroundColor: interpolateColor(tone.value, [-1, 0, 1], [c.danger, c.text, c.success]),
  }));

  return (
    <Animated.View style={[styles.dot, ring]}>
      <Animated.View style={[styles.dotCore, core]} />
    </Animated.View>
  );
}

/**
 * PIN entry with its own keypad. Dots fill with a pop. A wrong PIN shakes the row and
 * empties the dots one after another, and a right one lifts them in a wave.
 */
export function PinPad({ length = 4, onComplete, onSuccess, onChange, extra, style }: PinPadProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<'idle' | 'error' | 'success'>('idle');
  const { shake, style: shakeStyle } = useShake();
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const update = (next: string) => {
    setPin(next);
    onChange?.(next);
  };

  const finish = async (code: string) => {
    busy.current = true;
    let ok = false;
    try {
      ok = await onComplete(code);
    } catch {
      ok = false;
    }
    if (ok) {
      setResult('success');
      haptic('success');
      later(() => onSuccess?.(), 300 + length * 70 + 250);
      return;
    }
    setResult('error');
    shake();
    haptic('error');
    // Dots empty left to right, after the shake has been seen.
    for (let i = 0; i < code.length; i += 1) {
      later(() => update(code.slice(i + 1)), 380 + i * 60);
    }
    later(() => {
      setResult('idle');
      busy.current = false;
    }, 380 + code.length * 60 + 80);
  };

  const press = (digit: string) => {
    if (busy.current || pin.length >= length) return;
    const next = pin + digit;
    update(next);
    if (next.length === length) void finish(next);
  };

  const erase = () => {
    if (busy.current || !pin) return;
    update(pin.slice(0, -1));
  };

  return (
    <View style={[styles.pad, style]}>
      <Animated.View
        style={[styles.dots, shakeStyle]}
        accessible
        accessibilityLabel={`${pin.length} of ${length} digits entered`}
      >
        {Array.from({ length }, (_, i) => (
          <Dot key={i} index={i} filled={i < pin.length} result={result} />
        ))}
      </Animated.View>

      <View style={styles.grid}>
        {KEYS.map((k) => (
          <Key key={k} onPress={() => press(k)}>
            <Text variant="display" style={styles.digit}>
              {k}
            </Text>
          </Key>
        ))}
        <View style={styles.slot}>{extra}</View>
        <Key onPress={() => press('0')}>
          <Text variant="display" style={styles.digit}>
            0
          </Text>
        </Key>
        <Key onPress={erase} plain label="Delete">
          <Glyph name="backspace" size={26} color={c.textMuted} />
        </Key>
      </View>
    </View>
  );
}

function Key({
  children,
  onPress,
  plain,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  plain?: boolean;
  label?: string;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.88}
      haptic="light"
      accessibilityLabel={label}
      style={[
        styles.key,
        plain ? null : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth },
      ]}
    >
      {children}
    </PressableScale>
  );
}

const KEY = 72;

const styles = StyleSheet.create({
  pad: { alignItems: 'center', gap: 36 },
  dots: { flexDirection: 'row', gap: 18, height: 20 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCore: { width: 15, height: 15, borderRadius: 7.5, position: 'absolute' },
  grid: { width: KEY * 3 + 24 * 2, flexDirection: 'row', flexWrap: 'wrap', gap: 14, columnGap: 24 },
  key: { width: KEY, height: KEY, borderRadius: KEY / 2, alignItems: 'center', justifyContent: 'center' },
  slot: { width: KEY, height: KEY, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 28, lineHeight: 32 },
});
