import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { useShake } from '../../motion/shake';
import { springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor, typeStyle } from '../../theme/tokens';
import { bareInput, fill, passThrough } from '../../utils/layout';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholder'> & {
  label: string;
  /** Guidance under the field. Replaced by `error` while there is one. */
  helper?: string;
  /** Marks the field invalid and replaces the helper. */
  error?: string;
  /** Node before the text, such as an icon. */
  leading?: ReactNode;
  /** Node after the text, such as a clear button. */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 58;
const FLOAT_SCALE = 0.78;
const FLOAT_LIFT = -11;

/**
 * A text field whose label sits in the field until there is something to label, then lifts
 * out of the way on a spring. A ring fades in on focus. An error shakes the field, turns the
 * ring red and drops the message in underneath.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    helper,
    error,
    leading,
    trailing,
    value,
    defaultValue,
    onChangeText,
    onFocus,
    onBlur,
    editable = true,
    style,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const c = theme.colors;

  const [inner, setInner] = useState(defaultValue ?? '');
  const text = value ?? inner;
  const [focused, setFocused] = useState(false);
  const [labelWidth, setLabelWidth] = useState(0);
  const lifted = focused || text.length > 0;

  const float = useSharedValue(lifted ? 1 : 0);
  const focus = useSharedValue(focused ? 1 : 0);
  const invalid = useSharedValue(error ? 1 : 0);
  const { shake, style: shakeStyle } = useShake();

  useEffect(() => {
    float.value = withSpring(lifted ? 1 : 0, springs.snappy);
  }, [lifted, float]);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 160 });
  }, [focused, focus]);

  const hadError = useRef(false);
  useEffect(() => {
    invalid.value = withTiming(error ? 1 : 0, { duration: 200 });
    if (error && !hadError.current) {
      shake();
      haptic('error');
    }
    hadError.current = !!error;
  }, [error, invalid, shake]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(labelWidth * (1 - FLOAT_SCALE)) / 2 * float.value },
      { translateY: interpolate(float.value, [0, 1], [0, FLOAT_LIFT]) },
      { scale: interpolate(float.value, [0, 1], [1, FLOAT_SCALE]) },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: Math.max(focus.value, invalid.value),
    borderColor: interpolateColor(invalid.value, [0, 1], [c.accent, c.danger]),
  }));

  const inset = leading ? 44 : 16;
  const labelColor = error ? c.danger : focused ? c.accent : c.textMuted;

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[
          styles.field,
          { backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.md },
          shakeStyle,
        ]}
      >
        <Animated.View
          style={[fill, passThrough, styles.ring, { borderRadius: theme.radii.md }, ringStyle]}
        />
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <Animated.View
          onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
          style={[styles.label, passThrough, { left: inset }, labelStyle]}
        >
          <Text variant="body" numberOfLines={1} style={{ color: labelColor }}>
            {label}
          </Text>
        </Animated.View>
        <TextInput
          ref={ref}
          {...rest}
          value={value}
          defaultValue={defaultValue}
          editable={editable}
          accessibilityLabel={label}
          onChangeText={(next) => {
            setInner(next);
            onChangeText?.(next);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          selectionColor={c.accent}
          cursorColor={c.accent}
          style={[
            bareInput,
            typeStyle(theme, 'body'),
            fontFor(theme, 'regular'),
            styles.input,
            { color: c.text, paddingLeft: inset, paddingRight: trailing ? 44 : 16 },
          ]}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </Animated.View>

      <View style={styles.message}>
        {error ? (
          <Animated.View key={error} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(120)}>
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          </Animated.View>
        ) : helper ? (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
            <Text variant="caption" tone="muted">
              {helper}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  field: {
    height: HEIGHT,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  ring: { borderWidth: 1.5 },
  label: { position: 'absolute', top: 0, height: HEIGHT, justifyContent: 'center' },
  input: { height: HEIGHT, paddingTop: 20, paddingBottom: 0 },
  leading: { position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center' },
  trailing: { position: 'absolute', right: 6, top: 0, bottom: 0, justifyContent: 'center' },
  message: { minHeight: 20, paddingHorizontal: 4, paddingTop: 6 },
});
