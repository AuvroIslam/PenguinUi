import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';

import { easings, springs } from '../../motion/tokens';
import { DrawnStroke } from '../../primitives/DrawnPath';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { TextMorph } from '../text/TextMorph';
import { TextField, type TextFieldProps } from './TextField';

export type PasswordFieldProps = Omit<TextFieldProps, 'trailing' | 'leading' | 'secureTextEntry'> & {
  /** Show the four-segment strength meter under the field. */
  strength?: boolean;
};

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

const WORDS = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;

/**
 * A rough strength score: length, mixed case, a digit and a symbol, one point each. Under
 * eight characters it never scores above weak. It is a nudge for the person typing, not a
 * substitute for server-side policy.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length < 8) score = Math.min(score, 1);
  return Math.max(1, score) as PasswordStrength;
}

function Segment({ on, color, index }: { on: boolean; color: string; index: number }) {
  const theme = useTheme();
  const level = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    // Filling steps out in order; emptying goes at once so the meter never lags the typing.
    level.value = on
      ? withDelay(index * 60, withSpring(1, springs.snappy))
      : withTiming(0, { duration: 140 });
  }, [on, index, level]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, level.value)) * 100}%`,
  }));

  return (
    <View style={[styles.segment, { backgroundColor: theme.colors.surfaceSunken }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

const SLASH = 'M4 4l16 16';

function VisibilityToggle({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const strike = useSharedValue(hidden ? 1 : 0);

  useEffect(() => {
    strike.value = withTiming(hidden ? 1 : 0, { duration: 240, easing: easings.out });
  }, [hidden, strike]);

  const tint = theme.colors.textMuted;

  return (
    <PressableScale
      onPress={onToggle}
      scaleTo={0.86}
      haptic="selection"
      accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
      hitSlop={6}
      style={styles.eye}
    >
      <Glyph name="eye" size={22} color={tint} />
      <View style={styles.strike} pointerEvents="none">
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <DrawnStroke d={SLASH} length={22.7} progress={strike} color={tint} strokeWidth={1.75} />
        </Svg>
      </View>
    </PressableScale>
  );
}

/**
 * A password field with a visibility toggle and a strength meter. The toggle draws a strike
 * through the eye when the text is hidden. The meter fills segment by segment and shifts
 * from red to green, and its word morphs in place.
 */
export function PasswordField({
  strength = true,
  value,
  defaultValue,
  onChangeText,
  helper,
  ...rest
}: PasswordFieldProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [hidden, setHidden] = useState(true);
  const [inner, setInner] = useState(defaultValue ?? '');
  const text = value ?? inner;

  const score = passwordStrength(text);
  const color = score <= 1 ? c.danger : score === 2 ? c.warning : c.success;

  const meter = useSharedValue(text ? 1 : 0);
  useEffect(() => {
    meter.value = withTiming(text ? 1 : 0, { duration: 180 });
  }, [text, meter]);
  const meterStyle = useAnimatedStyle(() => ({ opacity: meter.value }));

  return (
    <View style={styles.wrap}>
      <TextField
        {...rest}
        value={value}
        defaultValue={defaultValue}
        helper={strength ? undefined : helper}
        secureTextEntry={hidden}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        onChangeText={(next) => {
          setInner(next);
          onChangeText?.(next);
        }}
        trailing={<VisibilityToggle hidden={hidden} onToggle={() => setHidden((h) => !h)} />}
      />
      {strength ? (
        <Animated.View style={[styles.meter, rest.error ? null : styles.meterTucked, meterStyle]} pointerEvents="none">
          <View style={styles.segments}>
            {[1, 2, 3, 4].map((n) => (
              <Segment key={n} on={score >= n} color={color} index={n - 1} />
            ))}
          </View>
          <View style={styles.word}>
            <TextMorph variant="caption" tone={score <= 1 ? 'danger' : score === 2 ? 'warning' : 'success'}>
              {WORDS[score] || WORDS[1]}
            </TextMorph>
          </View>
        </Animated.View>
      ) : null}
      {strength && helper ? (
        <Text variant="caption" tone="muted" style={styles.helper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  eye: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  strike: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  // With no message showing, the meter takes the slot the message would have used.
  meterTucked: { marginTop: -14 },
  segments: { flex: 1, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  word: { width: 48, alignItems: 'flex-end' },
  helper: { paddingHorizontal: 4, paddingTop: 6 },
});
