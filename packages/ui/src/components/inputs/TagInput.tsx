import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeOut,
  LinearTransition,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
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
import { fontFor, typeStyle } from '../../theme/tokens';
import { bareInput, fill } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type TagInputProps = {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  /** Characters that commit the tag being typed, besides the return key. */
  separators?: string[];
  maxTags?: number;
  /** Return false to refuse a tag. Duplicates are always refused. */
  validate?: (tag: string) => boolean;
  style?: StyleProp<ViewStyle>;
};

const SENTINEL = '​';

const arrive = ZoomIn.springify().mass(springs.bouncy.mass).stiffness(springs.bouncy.stiffness).damping(springs.bouncy.damping);
const leave = FadeOut.duration(130);
const reflow = LinearTransition.springify()
  .mass(springs.snappy.mass)
  .stiffness(springs.snappy.stiffness)
  .damping(springs.snappy.damping);

function Tag({
  label,
  armed,
  onRemove,
}: {
  label: string;
  armed: boolean;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const wiggle = useSharedValue(0);
  const tone = useSharedValue(0);

  useEffect(() => {
    tone.value = withTiming(armed ? 1 : 0, { duration: 140 });
    if (armed) {
      wiggle.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 70 }),
        withTiming(-4, { duration: 70 }),
        withTiming(3, { duration: 60 }),
        withSpring(0, springs.bouncy),
      );
    }
  }, [armed, wiggle, tone]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: wiggle.value }, { scale: 1 + tone.value * 0.04 }],
  }));

  return (
    <Animated.View entering={arrive} exiting={leave} layout={reflow}>
      <Animated.View
        style={[
          styles.tag,
          {
            backgroundColor: armed ? c.dangerSoft : c.accentSoft,
            borderColor: armed ? c.danger : 'transparent',
            borderRadius: theme.radii.pill,
          },
          animated,
        ]}
      >
        <Text variant="label" style={{ color: armed ? c.danger : c.text }}>
          {label}
        </Text>
        <PressableScale
          onPress={onRemove}
          scaleTo={0.8}
          haptic="selection"
          hitSlop={8}
          accessibilityLabel={`Remove ${label}`}
          style={styles.remove}
        >
          <Glyph name="x" size={12} color={armed ? c.danger : c.textMuted} strokeWidth={2.2} />
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Free-text tags. A committed tag pops in on a bouncy spring and the others slide over to
 * make room. On an empty field, backspace does not delete at once: the last tag wiggles and
 * turns red to say what is about to go, and a second backspace removes it. A refused tag
 * shakes the whole field.
 */
export function TagInput({
  value: controlled,
  defaultValue = [],
  onChange,
  placeholder = 'Add a tag',
  separators = [','],
  maxTags,
  validate,
  style,
}: TagInputProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [tags, setTags] = useControllable(controlled, defaultValue, onChange);
  const [text, setText] = useState('');
  const [armed, setArmed] = useState(false);
  const [focused, setFocused] = useState(false);
  const { shake, style: shakeStyle } = useShake();
  const input = useRef<TextInput>(null);

  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withTiming(focused ? 1 : 0, { duration: 160 });
  }, [focused, ring]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value }));

  const commit = (raw: string) => {
    const tag = raw.trim();
    if (!tag) {
      setText('');
      return;
    }
    const duplicate = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (duplicate || (maxTags !== undefined && tags.length >= maxTags) || (validate && !validate(tag))) {
      shake();
      haptic('warning');
      return;
    }
    haptic('light');
    setTags([...tags, tag]);
    setText('');
    setArmed(false);
  };

  const remove = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
    setArmed(false);
  };

  const handleChange = (raw: string) => {
    // The field always holds a hidden character so that backspace on an "empty" field is a
    // real text change. Android's soft keyboards do not send a key event for it.
    if (raw === '') {
      backspace();
      return;
    }
    setArmed(false);
    const next = raw.replace(SENTINEL, '');
    const last = next[next.length - 1];
    if (last && separators.includes(last)) {
      commit(next.slice(0, -1));
      return;
    }
    setText(next);
  };

  const backspace = () => {
    if (tags.length === 0) return;
    if (armed) {
      haptic('medium');
      remove(tags.length - 1);
    } else {
      haptic('selection');
      setArmed(true);
    }
  };

  return (
    <Animated.View style={[styles.wrap, shakeStyle, style]}>
      <PressableScale
        onPress={() => input.current?.focus()}
        haptic={false}
        scaleTo={1}
        accessible={false}
        style={[
          styles.field,
          { backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.lg },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill as object,
            styles.ring,
            { borderColor: c.accent, borderRadius: theme.radii.lg },
            ringStyle,
          ]}
        />
        {tags.map((tag, i) => (
          <Tag key={tag.toLowerCase()} label={tag} armed={armed && i === tags.length - 1} onRemove={() => remove(i)} />
        ))}
        <Animated.View layout={reflow} style={styles.inputSlot}>
          <TextInput
            ref={input}
            value={SENTINEL + text}
            onChangeText={handleChange}
            onSubmitEditing={() => {
              commit(text);
              // Keeps the keyboard up so several tags can be entered in a row.
              input.current?.focus();
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setArmed(false);
            }}
            blurOnSubmit={false}
            placeholder={tags.length === 0 ? placeholder : undefined}
            placeholderTextColor={c.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            selectionColor={c.accent}
            cursorColor={c.accent}
            accessibilityLabel={placeholder}
            style={[bareInput, typeStyle(theme, 'body'), fontFor(theme, 'regular'), styles.input, { color: c.text }]}
          />
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  field: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ring: { borderWidth: 1.5 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingLeft: 14,
    paddingRight: 8,
    borderWidth: 1,
  },
  remove: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  inputSlot: { flexGrow: 1, minWidth: 96 },
  input: { height: 34, paddingHorizontal: 6 },
});
