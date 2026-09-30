import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor, typeStyle } from '../../theme/tokens';
import { bareInput, fill } from '../../utils/layout';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ExpandButtonProps = {
  /** The button label, for example "Notify me". */
  children: string;
  placeholder?: string;
  /** Shown after a successful submit. */
  submittedLabel?: string;
  /** Return `false` to reject the value; the field shakes and stays open. */
  onSubmit?: (value: string) => boolean | void;
  /** Milliseconds before the button returns to its first state. `false` leaves it submitted. */
  resetAfter?: number | false;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 54;
const PAD = 26;
const SUBMIT = HEIGHT - 12;

type Stage = 'idle' | 'open' | 'done';

/**
 * A button that becomes the field it was asking for. The pill widens into an input with
 * its own submit button, then closes around a confirmation. It sits in a full-width slot,
 * so opening it moves nothing around it.
 */
export function ExpandButton({
  children,
  placeholder = 'you@example.com',
  submittedLabel = 'You are on the list',
  onSubmit,
  resetAfter = false,
  keyboardType = 'email-address',
  autoCapitalize = 'none',
  style,
}: ExpandButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [stage, setStage] = useState<Stage>('idle');
  const [value, setValue] = useState('');
  const input = useRef<TextInput>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const slot = useSharedValue(0);
  const idleWidth = useSharedValue(0);
  const doneWidth = useSharedValue(0);
  const expand = useSharedValue(0);
  const settled = useSharedValue(0);
  const shake = useSharedValue(0);
  const check = useSharedValue(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    expand.value = withSpring(stage === 'open' ? 1 : 0, springs.smooth);
    settled.value = withTiming(stage === 'done' ? 1 : 0, { duration: 240, easing: easings.fluid });
    check.value =
      stage === 'done'
        ? withDelay(220, withTiming(1, { duration: 320, easing: easings.out }))
        : withTiming(0, { duration: 100 });
    if (stage === 'open') {
      // Focus once the field has room to show a caret.
      const id = setTimeout(() => input.current?.focus(), 160);
      return () => clearTimeout(id);
    }
    input.current?.blur();
  }, [stage, expand, settled, check]);

  const open = () => {
    haptic('light');
    setStage('open');
  };

  const submit = () => {
    if (onSubmit?.(value.trim()) === false || value.trim() === '') {
      haptic('error');
      shake.value = withSequence(
        withTiming(-7, { duration: 50 }),
        withTiming(6, { duration: 55 }),
        withTiming(-4, { duration: 55 }),
        withTiming(0, { duration: 55 }),
      );
      return;
    }
    haptic('success');
    setStage('done');
    if (resetAfter !== false) {
      timer.current = setTimeout(() => {
        setValue('');
        setStage('idle');
      }, resetAfter);
    }
  };

  const pill = useAnimatedStyle(() => {
    const rest = idleWidth.value + (doneWidth.value - idleWidth.value) * settled.value;
    const base = {
      backgroundColor: interpolateColor(expand.value, [0, 1], [c.primary, c.surfaceSunken]),
      borderColor: interpolateColor(expand.value, [0, 1], ['transparent', c.borderStrong]),
      transform: [{ translateX: shake.value }],
    };
    return slot.value > 0 && rest > 0
      ? { ...base, width: interpolate(expand.value, [0, 1], [rest, slot.value]) }
      : base;
  });

  const idle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0, 0.3], [1, 0], 'clamp') * (1 - settled.value),
  }));
  const done = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0, 0.3], [1, 0], 'clamp') * settled.value,
  }));
  const field = useAnimatedStyle(() => ({
    opacity: interpolate(expand.value, [0.45, 1], [0, 1], 'clamp'),
  }));
  const send = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(expand.value, [0.5, 1], [0.3, 1], 'clamp') }],
  }));

  const labelStyle = [typeStyle(theme, 'label'), { color: c.onPrimary }];

  return (
    <View
      onLayout={(event) => {
        slot.value = event.nativeEvent.layout.width;
      }}
      style={[styles.slot, style]}
    >
      {/* Invisible copies of both labels, to learn the two resting widths. */}
      <View style={styles.measure}>
        <View
          style={styles.sizer}
          onLayout={(event) => {
            idleWidth.value = event.nativeEvent.layout.width;
          }}
        >
          <RNText numberOfLines={1} style={labelStyle}>
            {children}
          </RNText>
        </View>
        <View
          style={[styles.sizer, styles.doneRow]}
          onLayout={(event) => {
            doneWidth.value = event.nativeEvent.layout.width;
          }}
        >
          <View style={styles.checkBox} />
          <RNText numberOfLines={1} style={labelStyle}>
            {submittedLabel}
          </RNText>
        </View>
      </View>

      <Animated.View style={[styles.pill, pill]}>
        {/* Only the first state is a button. The field has its own submit button, and a
            button inside a button is invalid on web. */}
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={children}
          disabled={stage !== 'idle'}
          onPress={open}
          style={[styles.layer, { pointerEvents: stage === 'idle' ? 'auto' : 'none' }, idle]}
        >
          <RNText numberOfLines={1} style={labelStyle}>
            {children}
          </RNText>
        </AnimatedPressable>

        <Animated.View
          accessible={stage === 'done'}
          accessibilityRole="text"
          accessibilityLabel={submittedLabel}
          style={[styles.layer, styles.doneRow, { pointerEvents: 'none' }, done]}
        >
          <View style={styles.checkBox}>
            <DrawnCheck progress={check} size={20} color={c.onPrimary} strokeWidth={2.25} />
          </View>
          <RNText numberOfLines={1} style={labelStyle}>
            {submittedLabel}
          </RNText>
        </Animated.View>

        <Animated.View
          style={[styles.field, { pointerEvents: stage === 'open' ? 'auto' : 'none' }, field]}
        >
          <TextInput
            ref={input}
            value={value}
            onChangeText={setValue}
            onSubmitEditing={submit}
            onBlur={() => {
              // Leaving an empty field means the user backed out.
              if (stage === 'open' && value.trim() === '') setStage('idle');
            }}
            placeholder={placeholder}
            placeholderTextColor={c.textFaint}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            returnKeyType="send"
            editable={stage === 'open'}
            style={[styles.input, typeStyle(theme, 'body'), fontFor(theme, 'regular'), { color: c.text }]}
          />
          <Animated.View style={send}>
            <PressableScale
              scaleTo={0.9}
              accessibilityLabel="Submit"
              onPress={submit}
              style={[styles.submit, { backgroundColor: c.primary }]}
            >
              <Glyph name="arrow-right" size={18} color={c.onPrimary} />
            </PressableScale>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: HEIGHT, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  measure: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 2000,
    flexDirection: 'row',
    opacity: 0,
    pointerEvents: 'none',
  },
  sizer: { paddingHorizontal: PAD },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkBox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  pill: {
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  layer: { ...fill, alignItems: 'center', justifyContent: 'center' },
  field: { ...fill, flexDirection: 'row', alignItems: 'center', paddingLeft: 22, paddingRight: 6 },
  input: { ...bareInput, flex: 1, height: HEIGHT },
  submit: {
    width: SUBMIT,
    height: SUBMIT,
    borderRadius: SUBMIT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
