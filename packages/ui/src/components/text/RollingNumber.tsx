import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { springs } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';

export type RollingNumberProps = {
  value: number;
  /** Fixed number of decimal places. */
  decimals?: number;
  /** Thousands separators. */
  group?: boolean;
  prefix?: string;
  suffix?: string;
  /** Full control over the displayed string. Digits roll; every other character is static. */
  format?: (value: number) => string;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const shift = LinearTransition.springify()
  .mass(springs.snappy.mass)
  .stiffness(springs.snappy.stiffness)
  .damping(springs.snappy.damping);
const arrive = FadeIn.duration(200);
const leave = FadeOut.duration(120);

export function formatNumber(value: number, decimals = 0, group = true): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole, fraction] = fixed.split('.');
  const grouped = group ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : whole;
  return `${value < 0 ? '-' : ''}${grouped}${fraction ? `.${fraction}` : ''}`;
}

type Token = { key: string; ch: string; digit: number | null };

/**
 * Keys digits by their distance from the right end, so the ones digit keeps its identity
 * when the number gains or loses a leading digit.
 */
function tokenize(display: string): Token[] {
  const chars = Array.from(display);
  const isDigit = (ch: string) => ch >= '0' && ch <= '9';
  const total = chars.filter(isDigit).length;
  let seen = 0;
  return chars.map((ch, i): Token => {
    if (isDigit(ch)) {
      seen += 1;
      return { key: `d${total - seen}`, ch, digit: Number(ch) };
    }
    if (seen === 0) return { key: `p${i}${ch}`, ch, digit: null };
    if (seen === total) return { key: `x${chars.length - i}${ch}`, ch, digit: null };
    return { key: `s${total - seen}${ch}`, ch, digit: null };
  });
}

type DigitProps = {
  digit: number;
  direction: number;
  height: number;
  textStyle: TextStyle;
};

const Digit = memo(function Digit({ digit, direction, height, textStyle }: DigitProps) {
  // `position` is cumulative, not 0 to 9: rolling 9 to 0 upward goes to 10, one step, and the
  // strip below repeats the digits so the wrap is invisible.
  const position = useSharedValue(digit);
  const target = useRef(digit);

  useEffect(() => {
    const current = ((target.current % 10) + 10) % 10;
    if (current === digit) return;
    const up = (digit - current + 10) % 10;
    const delta = direction >= 0 ? up : up - 10;
    target.current += delta;
    position.value = withSpring(target.current, Math.abs(delta) > 2 ? springs.gentle : springs.snappy);
  }, [digit, direction, position]);

  const strip = useAnimatedStyle(() => {
    const wrapped = ((position.value % 10) + 10) % 10;
    return { transform: [{ translateY: -wrapped * height }] };
  });

  return (
    <View style={[styles.column, { height }]}>
      <RNText style={[textStyle, styles.sizer]}>0</RNText>
      <Animated.View style={[styles.strip, strip]}>
        {DIGITS.map((n, i) => (
          <RNText key={i} style={[textStyle, styles.numeral, { height }]}>
            {n}
          </RNText>
        ))}
      </Animated.View>
    </View>
  );
});

/**
 * Odometer-style number. Digits roll in the direction the value moved, and the number
 * reflows on a spring when it gains or loses a digit.
 */
export function RollingNumber({
  value,
  decimals = 0,
  group = true,
  prefix = '',
  suffix = '',
  format,
  variant = 'label',
  tone = 'default',
  style,
}: RollingNumberProps) {
  const theme = useTheme();
  const display = format ? format(value) : `${prefix}${formatNumber(value, decimals, group)}${suffix}`;
  const tokens = useMemo(() => tokenize(display), [display]);

  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = value;
  }, [value]);

  const textStyle = useMemo(() => {
    const flat = StyleSheet.flatten([
      typeStyle(theme, variant),
      { color: toneColor(theme, tone) },
      style,
    ]) as TextStyle;
    const fontSize = flat.fontSize ?? 15;
    const lineHeight = flat.lineHeight ?? Math.ceil(fontSize * 1.25);
    return {
      ...flat,
      lineHeight,
      fontVariant: ['tabular-nums'],
      includeFontPadding: false,
    } as TextStyle;
  }, [theme, variant, tone, style]);

  const height = textStyle.lineHeight as number;

  return (
    <LayoutAnimationConfig skipEntering>
      <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={display}>
        {tokens.map((token) => (
          <Animated.View key={token.key} layout={shift} entering={arrive} exiting={leave}>
            {token.digit === null ? (
              <RNText style={[textStyle, { height }]}>{token.ch}</RNText>
            ) : (
              <Digit digit={token.digit} direction={direction} height={height} textStyle={textStyle} />
            )}
          </Animated.View>
        ))}
      </View>
    </LayoutAnimationConfig>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { overflow: 'hidden' },
  sizer: { opacity: 0 },
  strip: { position: 'absolute', left: 0, right: 0, top: 0 },
  numeral: { textAlign: 'center' },
});
