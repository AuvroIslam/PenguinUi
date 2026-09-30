import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { useShake } from '../../motion/shake';
import { springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { bareInput, fill, passThrough } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type OTPStatus = 'idle' | 'error' | 'success';

export type OTPInputProps = {
  /** Number of cells. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once when every cell is filled. */
  onComplete?: (code: string) => void;
  /** Report the result of checking the code. Error shakes the row, success ripples through it. */
  status?: OTPStatus;
  /** Accept letters as well as digits. */
  alphanumeric?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

type CellProps = {
  char: string;
  index: number;
  active: boolean;
  status: OTPStatus;
};

function Cell({ char, index, active, status }: CellProps) {
  const theme = useTheme();
  const c = theme.colors;

  const pop = useSharedValue(char ? 1 : 0);
  const ring = useSharedValue(0);
  const caret = useSharedValue(0);
  const wave = useSharedValue(1);

  useEffect(() => {
    pop.value = char
      ? withSequence(withTiming(0, { duration: 0 }), withSpring(1, springs.bouncy))
      : withTiming(0, { duration: 100 });
  }, [char, pop]);

  useEffect(() => {
    ring.value = withTiming(active ? 1 : 0, { duration: 140 });
  }, [active, ring]);

  useEffect(() => {
    if (active && !char) {
      caret.value = withRepeat(
        withSequence(withTiming(1, { duration: 0 }), withTiming(1, { duration: 480 }), withTiming(0, { duration: 0 }), withTiming(0, { duration: 480 })),
        -1,
      );
    } else {
      caret.value = withTiming(0, { duration: 80 });
    }
  }, [active, char, caret]);

  useEffect(() => {
    if (status !== 'success') return;
    wave.value = withDelay(
      index * 55,
      withSequence(withTiming(1.12, { duration: 130 }), withSpring(1, springs.bouncy)),
    );
  }, [status, index, wave]);

  const digit = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.6),
    transform: [{ scale: 0.5 + 0.5 * pop.value }],
  }));
  const cell = useAnimatedStyle(() => ({ transform: [{ scale: wave.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value }));
  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }));

  const tone = status === 'error' ? c.danger : status === 'success' ? c.success : c.accent;

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          backgroundColor: c.surface,
          borderColor: status === 'idle' ? c.border : tone,
          borderRadius: theme.radii.md,
        },
        cell,
      ]}
    >
      <Animated.View
        style={[fill, passThrough, styles.ring, { borderColor: tone, borderRadius: theme.radii.md }, ringStyle]}
      />
      <Animated.View style={digit}>
        <Text variant="title" mono>
          {char}
        </Text>
      </Animated.View>
      <Animated.View style={[passThrough, styles.caret, { backgroundColor: c.accent }, caretStyle]} />
    </Animated.View>
  );
}

/**
 * One-time code entry. A single hidden input drives a row of cells, so paste, autofill from
 * SMS and the delete key all behave the way the platform expects. The active cell carries a
 * ring and a blinking caret, digits pop in as they arrive, a wrong code shakes the row and a
 * right one ripples through it.
 */
export function OTPInput({
  length = 6,
  value: controlled,
  defaultValue = '',
  onChange,
  onComplete,
  status = 'idle',
  alphanumeric = false,
  autoFocus,
  disabled,
  style,
}: OTPInputProps) {
  const [value, setValue] = useControllable(controlled, defaultValue, onChange);
  const [focused, setFocused] = useState(false);
  const { shake, style: shakeStyle } = useShake();
  const input = useRef<TextInput>(null);

  const previousStatus = useRef<OTPStatus>('idle');
  useEffect(() => {
    if (status === previousStatus.current) return;
    previousStatus.current = status;
    if (status === 'error') {
      shake();
      haptic('error');
    } else if (status === 'success') {
      haptic('success');
    }
  }, [status, shake]);

  const handleChange = (raw: string) => {
    const clean = (alphanumeric ? raw.replace(/[^a-z0-9]/gi, '') : raw.replace(/\D/g, '')).slice(0, length);
    if (clean === value) return;
    if (clean.length > value.length) haptic('selection');
    setValue(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Animated.View style={[styles.row, style, shakeStyle]}>
      {Array.from({ length }, (_, i) => (
        <Cell
          key={i}
          index={i}
          char={value[i] ?? ''}
          active={focused && !disabled && i === activeIndex}
          status={status}
        />
      ))}
      <TextInput
        ref={input}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        autoFocus={autoFocus}
        maxLength={length}
        keyboardType={alphanumeric ? 'default' : 'number-pad'}
        autoCapitalize={alphanumeric ? 'characters' : 'none'}
        autoCorrect={false}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        caretHidden
        accessibilityLabel={`Enter ${length} character code`}
        style={[fill, bareInput, styles.hidden]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
  cell: {
    width: 46,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ring: { borderWidth: 1.5 },
  caret: { position: 'absolute', width: 2, height: 24, borderRadius: 1 },
  // Invisible but on top, so a tap anywhere in the row focuses it.
  hidden: { opacity: 0, color: 'transparent', fontSize: 1 },
});
