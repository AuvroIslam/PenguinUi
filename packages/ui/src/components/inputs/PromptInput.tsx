import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputContentSizeChangeEventData,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor, typeStyle } from '../../theme/tokens';
import { bareInput, fill } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type PromptInputProps = {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  /** Called with the text when the send button is pressed. */
  onSubmit?: (text: string) => void;
  /** While true a light orbits the border and the button becomes Stop. */
  loading?: boolean;
  onStop?: () => void;
  /** Shown as the microphone action when the field is empty. Leave out to hide the mic. */
  onMic?: () => void;
  placeholder?: string;
  maxLines?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const LINE = 22;
const PAD = 14;
const RADIUS = 26;
const BUTTON = 40;

// A textarea on the web neither grows with its text nor reports a content size smaller than
// its own height, so there the text is measured directly and the height is set by hand.
const WEB = Platform.OS === 'web';

type Mode = 'mic' | 'send' | 'stop';

type DashProps = {
  phase: SharedValue<number>;
  visible: SharedValue<number>;
  perimeter: number;
  length: number;
  lag: number;
  opacity: number;
  rect: { x: number; y: number; width: number; height: number; r: number };
  color: string;
};

function BeamDash({ phase, visible, perimeter, length, lag, opacity, rect, color }: DashProps) {
  const animated = useAnimatedProps(() => ({
    strokeDashoffset: -(phase.value * perimeter) + lag,
    strokeOpacity: visible.value * opacity,
  }));

  return (
    <AnimatedRect
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      rx={rect.r}
      ry={rect.r}
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeDasharray={[length, perimeter]}
      animatedProps={animated}
    />
  );
}

/** The beam: three dashes of rising opacity travelling the border, so it reads as a comet. */
function Beam({ width, height, color, running }: { width: number; height: number; color: string; running: boolean }) {
  const phase = useSharedValue(0);
  const visible = useSharedValue(0);

  const inset = 1;
  const w = Math.max(0, width - inset * 2);
  const h = Math.max(0, height - inset * 2);
  const r = Math.min(RADIUS - inset, h / 2);
  const perimeter = 2 * (w + h - 4 * r) + 2 * Math.PI * r;

  useEffect(() => {
    visible.value = withTiming(running ? 1 : 0, { duration: 260 });
    if (running) {
      phase.value = 0;
      phase.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1);
    }
  }, [running, phase, visible]);

  if (!width || !height) return null;

  const rect = { x: inset, y: inset, width: w, height: h, r };
  // All three end at the same head point (a shorter dash is pushed forward by what it lacks),
  // so the light is faint behind and brightest at the front.
  const dashes = [
    { length: perimeter * 0.22, lag: 0, opacity: 0.25 },
    { length: perimeter * 0.12, lag: -perimeter * 0.1, opacity: 0.5 },
    { length: perimeter * 0.05, lag: -perimeter * 0.17, opacity: 1 },
  ];

  return (
    <View style={fill} pointerEvents="none">
      <Svg width={width} height={height}>
        {dashes.map((dash, i) => (
          <BeamDash key={i} phase={phase} visible={visible} perimeter={perimeter} rect={rect} color={color} {...dash} />
        ))}
      </Svg>
    </View>
  );
}

function ModeGlyph({ at, mode, children }: { at: number; mode: SharedValue<number>; children: ReactNode }) {
  // Each glyph is visible around its own stop and turns as it comes and goes.
  const animated = useAnimatedStyle(() => {
    const d = mode.value - at;
    return {
      opacity: Math.max(0, 1 - Math.abs(d) * 1.6),
      transform: [{ scale: 1 - Math.min(1, Math.abs(d)) * 0.5 }, { rotate: `${d * -70}deg` }],
    };
  });
  return <Animated.View style={[fill, styles.center, animated]}>{children}</Animated.View>;
}

/**
 * A composer for talking to a model. The field grows a line at a time on a spring. The round
 * action button changes with what there is to do: a microphone when the field is empty, a
 * send arrow once there is text, a stop square while a reply is on its way, each turning into
 * the next. While a reply loads, a comet of light runs around the border.
 */
export function PromptInput({
  value: controlled,
  defaultValue = '',
  onChangeText,
  onSubmit,
  loading = false,
  onStop,
  onMic,
  placeholder = 'Ask anything',
  maxLines = 6,
  style,
}: PromptInputProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [text, setText] = useControllable(controlled, defaultValue, onChangeText);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const [webHeight, setWebHeight] = useState(LINE);

  const minHeight = LINE + PAD * 2;
  const maxHeight = LINE * maxLines + PAD * 2;
  const grow = useSharedValue(minHeight);
  const focus = useSharedValue(0);

  const mode: Mode = loading ? 'stop' : text.trim().length > 0 ? 'send' : 'mic';
  const modeValue = useSharedValue(mode === 'mic' ? 0 : mode === 'send' ? 1 : 2);

  useEffect(() => {
    modeValue.value = withSpring(mode === 'mic' ? 0 : mode === 'send' ? 1 : 2, springs.snappy);
  }, [mode, modeValue]);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 160 });
  }, [focused, focus]);

  const onContentSize = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const next = Math.min(maxHeight, Math.max(minHeight, e.nativeEvent.contentSize.height + PAD * 2));
    grow.value = withSpring(next, springs.snappy);
  };

  useEffect(() => {
    if (!WEB) return;
    // Collapse the textarea for a moment to read how tall its text wants to be.
    const node = input.current as unknown as { style?: { height: string }; scrollHeight: number } | null;
    if (!node?.style) return;
    const kept = node.style.height;
    node.style.height = '0px';
    const content = Math.max(LINE, node.scrollHeight);
    node.style.height = kept;
    setWebHeight(Math.min(content, LINE * maxLines));
    grow.value = withSpring(Math.min(LINE * maxLines, content) + PAD * 2, springs.snappy);
  }, [text, size.width, maxLines, grow]);

  const shell = useAnimatedStyle(() => ({ height: grow.value }));
  const ring = useAnimatedStyle(() => ({ opacity: focus.value }));

  const press = () => {
    if (mode === 'stop') {
      haptic('medium');
      onStop?.();
    } else if (mode === 'send') {
      haptic('light');
      onSubmit?.(text.trim());
    } else {
      haptic('selection');
      onMic?.();
    }
  };

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

  const buttonBg = mode === 'stop' ? c.accent : c.primary;

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.shell,
        { backgroundColor: c.surface, borderColor: c.border, borderRadius: RADIUS },
        shell,
        style,
      ]}
    >
      <Animated.View pointerEvents="none" style={[fill, styles.ring, { borderColor: c.borderStrong, borderRadius: RADIUS }, ring]} />
      <TextInput
        ref={input}
        value={text}
        onChangeText={setText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onContentSizeChange={WEB ? undefined : onContentSize}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        multiline
        editable={!loading}
        selectionColor={c.accent}
        cursorColor={c.accent}
        accessibilityLabel={placeholder}
        style={[
          bareInput,
          typeStyle(theme, 'body'),
          fontFor(theme, 'regular'),
          styles.input,
          { color: c.text, lineHeight: LINE, maxHeight: maxHeight - PAD * 2 },
          WEB ? { height: webHeight } : null,
        ]}
      />
      <View style={styles.action}>
        <PressableScale
          onPress={press}
          haptic={false}
          scaleTo={0.88}
          accessibilityLabel={mode === 'stop' ? 'Stop' : mode === 'send' ? 'Send' : 'Dictate'}
          style={[
            styles.button,
            { backgroundColor: mode === 'mic' ? c.surfaceSunken : buttonBg },
          ]}
        >
          <ModeGlyph at={0} mode={modeValue}>
            <Glyph name="mic" size={20} color={c.textMuted} />
          </ModeGlyph>
          <ModeGlyph at={1} mode={modeValue}>
            <Glyph name="arrow-up" size={20} color={c.onPrimary} strokeWidth={2.2} />
          </ModeGlyph>
          <ModeGlyph at={2} mode={modeValue}>
            <Glyph name="stop" size={20} color={c.onAccent} />
          </ModeGlyph>
        </PressableScale>
      </View>
      <Beam width={size.width} height={size.height} color={c.accent} running={loading} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 18,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ring: { borderWidth: 1.5 },
  // Margin rather than padding: content size includes padding on Android, and on the web the
  // inline `bareInput` padding would override it.
  input: { flex: 1, marginVertical: PAD, textAlignVertical: 'top' },
  action: { height: LINE + PAD * 2, justifyContent: 'center' },
  button: { width: BUTTON, height: BUTTON, borderRadius: BUTTON / 2, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
