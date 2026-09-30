import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { useShake } from '../../motion/shake';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { useControllable } from '../../utils/useControllable';

export type AmountInputProps = {
  /** The raw entry, such as "1250.5". Digits and at most one point. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  currency?: string;
  /** Digits allowed before the decimal point. */
  maxIntegerDigits?: number;
  decimals?: number;
  /** Largest amount accepted. A key that would pass it is refused. */
  max?: number;
  style?: StyleProp<ViewStyle>;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const;

const FONT = 56;
const enter = FadeIn.duration(180);
const leave = FadeOut.duration(110);
const glide = LinearTransition.springify()
  .mass(springs.snappy.mass)
  .stiffness(springs.snappy.stiffness)
  .damping(springs.snappy.damping);

function group(integer: string): string[] {
  // Characters with thousands separators, each carrying a key that stays with its digit.
  const out: string[] = [];
  for (let i = 0; i < integer.length; i += 1) {
    if (i > 0 && (integer.length - i) % 3 === 0) out.push(',');
    out.push(integer[i]);
  }
  return out;
}

/**
 * A large amount with its own keypad. Digits rise in from below as they are typed and drop
 * out the bottom when deleted, and the row reflows on a spring as it grows. The whole amount
 * scales down to stay on one line instead of wrapping, and a key that would make the value
 * invalid shakes it and refuses.
 */
export function AmountInput({
  value: controlled,
  defaultValue = '',
  onChange,
  currency = '$',
  maxIntegerDigits = 9,
  decimals = 2,
  max,
  style,
}: AmountInputProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable(controlled, defaultValue, onChange);
  const { shake, style: shakeStyle } = useShake();

  const [available, setAvailable] = useState(0);
  const [natural, setNatural] = useState(0);
  const scale = useSharedValue(1);

  const [integer, fraction] = value.split('.');
  const hasPoint = value.includes('.');

  const chars = useMemo(() => {
    const list = group(integer || '0').map((ch, i, all) => ({
      ch,
      // Keyed from the right, so the ones digit keeps its identity as the number grows.
      key: `i${all.length - i}${ch === ',' ? 'c' : ''}`,
      faint: !integer,
    }));
    if (hasPoint) {
      list.push({ ch: '.', key: 'point', faint: false });
      (fraction ?? '').split('').forEach((ch, i) => list.push({ ch, key: `f${i}`, faint: false }));
    }
    return list;
  }, [integer, fraction, hasPoint]);

  useEffect(() => {
    if (!available || !natural) return;
    scale.value = withSpring(Math.min(1, available / natural), springs.snappy);
  }, [available, natural, scale]);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const reject = () => {
    shake();
    haptic('warning');
  };

  const press = (key: (typeof KEYS)[number]) => {
    if (key === 'back') {
      if (!value) return;
      haptic('light');
      setValue(value.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (hasPoint || decimals === 0) return reject();
      haptic('light');
      setValue(value === '' ? '0.' : `${value}.`);
      return;
    }
    if (hasPoint && (fraction ?? '').length >= decimals) return reject();
    if (!hasPoint && integer.length >= maxIntegerDigits) return reject();
    // A leading zero is replaced rather than stacked: "0" then "5" is "5".
    const next = !hasPoint && integer === '0' ? key : value + key;
    if (max !== undefined && Number(next) > max) return reject();
    haptic('light');
    setValue(next);
  };

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[styles.display, shakeStyle]}
        onLayout={(e: LayoutChangeEvent) => setAvailable(e.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={`${currency}${value || '0'}`}
      >
        <Animated.View style={[styles.row, scaleStyle]}>
          <View onLayout={(e: LayoutChangeEvent) => setNatural(e.nativeEvent.layout.width)} style={styles.measure}>
            <Text style={[styles.symbol, { color: c.textMuted }]}>{currency}</Text>
            {chars.map(({ ch, key, faint }) => (
              <Animated.View key={key} entering={enter} exiting={leave} layout={glide}>
                <Text
                  style={[
                    styles.glyph,
                    { color: faint ? c.textFaint : c.text },
                    ch === ',' || ch === '.' ? { color: faint ? c.textFaint : c.textMuted } : null,
                  ]}
                >
                  {ch}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </Animated.View>

      <View style={styles.grid}>
        {KEYS.map((k) => (
          <PressableScale
            key={k}
            onPress={() => press(k)}
            scaleTo={0.9}
            haptic={false}
            accessibilityLabel={k === 'back' ? 'Delete' : k === '.' ? 'Decimal point' : k}
            style={styles.key}
          >
            {k === 'back' ? (
              <Glyph name="backspace" size={26} color={c.textMuted} />
            ) : (
              <Text style={[styles.digit, fontFor(theme, 'medium')]}>{k}</Text>
            )}
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 12 },
  display: { height: FONT + 20, justifyContent: 'center', alignItems: 'center', overflow: 'visible' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  measure: { flexDirection: 'row', alignItems: 'flex-start' },
  symbol: { fontSize: FONT * 0.5, lineHeight: FONT, marginRight: 4, paddingTop: 2 },
  glyph: { fontSize: FONT, lineHeight: FONT + 6, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center', width: 288 },
  key: { width: 96, height: 64, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 30, lineHeight: 36 },
});
