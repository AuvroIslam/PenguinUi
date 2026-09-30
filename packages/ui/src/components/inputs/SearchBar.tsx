import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor, typeStyle } from '../../theme/tokens';
import { bareInput, fill } from '../../utils/layout';
import { TextLoop } from '../text/TextLoop';

export type SearchBarProps = {
  /** Suggestions the placeholder cycles through while the field is empty. */
  placeholders?: string[];
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  /** Called after the field collapses again. */
  onCancel?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

const SIZE = 48;
const CANCEL = 76;

/**
 * Search that starts as a single button. A tap grows the circle into the full field on a
 * heavy spring, the keyboard comes up, Cancel slides in from the edge, and the placeholder
 * leafs through suggestions while there is nothing typed. Cancel reverses the whole thing.
 */
export function SearchBar({
  placeholders = ['Search'],
  value: controlled,
  onChangeText,
  onSubmit,
  onCancel,
  onExpandedChange,
  style,
}: SearchBarProps) {
  const theme = useTheme();
  const c = theme.colors;

  const [inner, setInner] = useState('');
  const text = controlled ?? inner;
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(0);
  const input = useRef<TextInput>(null);

  const progress = useSharedValue(0);
  const focus = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, springs.smooth);
  }, [open, progress]);

  const change = (next: boolean) => {
    setOpen(next);
    onExpandedChange?.(next);
  };

  const expand = () => {
    haptic('light');
    change(true);
    // Wait a frame so the input is visible before it takes focus.
    setTimeout(() => input.current?.focus(), 60);
  };

  const cancel = () => {
    haptic('selection');
    input.current?.blur();
    setInner('');
    onChangeText?.('');
    change(false);
    onCancel?.();
  };

  const fieldStyle = useAnimatedStyle(() => ({
    width: SIZE + Math.max(0, width - SIZE - CANCEL) * progress.value,
  }));
  const innerStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0.35, 1], [0, 1], 'clamp') }));
  const cancelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1], 'clamp'),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [28, 0]) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: focus.value }));

  const showSuggestion = open && text.length === 0;

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.field,
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            borderRadius: SIZE / 2,
          },
          fieldStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[fill, styles.ring, { borderColor: c.accent, borderRadius: SIZE / 2 }, ringStyle]}
        />
        <PressableScale
          onPress={open ? () => input.current?.focus() : expand}
          haptic={false}
          scaleTo={0.92}
          accessibilityLabel="Search"
          style={styles.icon}
        >
          <Glyph name="search" size={20} color={c.textMuted} />
        </PressableScale>

        <Animated.View style={[styles.body, innerStyle]} pointerEvents={open ? 'auto' : 'none'}>
          {showSuggestion ? (
            <View style={styles.suggestion} pointerEvents="none">
              <TextLoop items={placeholders} interval={2600} variant="body" tone="faint" />
            </View>
          ) : null}
          <TextInput
            ref={input}
            value={text}
            onChangeText={(next) => {
              setInner(next);
              onChangeText?.(next);
            }}
            onFocus={() => {
              focus.value = withTiming(1, { duration: 160 });
            }}
            onBlur={() => {
              focus.value = withTiming(0, { duration: 160 });
            }}
            onSubmitEditing={() => onSubmit?.(text)}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={c.accent}
            cursorColor={c.accent}
            accessibilityLabel="Search"
            style={[bareInput, typeStyle(theme, 'body'), fontFor(theme, 'regular'), styles.input, { color: c.text }]}
          />
          {text.length > 0 ? (
            <PressableScale
              onPress={() => {
                setInner('');
                onChangeText?.('');
                input.current?.focus();
              }}
              scaleTo={0.85}
              haptic="selection"
              accessibilityLabel="Clear"
              hitSlop={8}
              style={[styles.clear, { backgroundColor: c.surfaceSunken }]}
            >
              <Glyph name="x" size={14} color={c.textMuted} strokeWidth={2} />
            </PressableScale>
          ) : null}
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.cancel, cancelStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <PressableScale onPress={cancel} haptic={false} scaleTo={0.94} accessibilityLabel="Cancel search" style={styles.cancelHit}>
          <Text variant="label" tone="accent">
            Cancel
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', height: SIZE, justifyContent: 'center' },
  field: {
    height: SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  ring: { borderWidth: 1.5 },
  icon: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, height: SIZE, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  suggestion: { position: 'absolute', left: 0, right: 40, justifyContent: 'center' },
  input: { flex: 1, height: SIZE },
  clear: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancel: { position: 'absolute', right: 0, width: CANCEL, alignItems: 'flex-end' },
  cancelHit: { height: SIZE, justifyContent: 'center', paddingLeft: 12 },
});
