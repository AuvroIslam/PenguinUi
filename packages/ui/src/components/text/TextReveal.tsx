import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { easeOutBack, easeOutQuint, staggered } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';
import { SPACE, splitText, type SplitBy } from './split';

export type TextRevealPreset = 'rise' | 'blur' | 'scale' | 'mask' | 'fade';

export type TextRevealProps = {
  children: string;
  /** Unit that animates. Lines break on `\n`. */
  by?: SplitBy;
  preset?: TextRevealPreset;
  /** Milliseconds before the first segment starts. */
  delay?: number;
  /** Milliseconds between segments. Defaults to 22 per character, 45 per word, 90 per line. */
  stagger?: number;
  /** Milliseconds each segment takes. */
  duration?: number;
  /** Replays the reveal whenever this value changes. */
  trigger?: unknown;
  /** Drive the reveal yourself from 0 to 1, for example from scroll. Disables autoplay. */
  progress?: SharedValue<number>;
  variant?: TypeVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  onDone?: () => void;
};

const defaultStagger: Record<SplitBy, number> = { char: 22, word: 45, line: 90 };
const justify = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;

// Blur is a real filter on Android 12+ and web. iOS has no blur filter, so the preset
// falls back to its opacity and scale there.
const canBlur = Platform.OS !== 'ios';

type SegmentProps = {
  text: string;
  index: number;
  elapsed: SharedValue<number>;
  stagger: number;
  duration: number;
  preset: TextRevealPreset;
  fontSize: number;
  lineHeight: number;
  textStyle: StyleProp<TextStyle>;
};

function RevealSegment({
  text,
  index,
  elapsed,
  stagger,
  duration,
  preset,
  fontSize,
  lineHeight,
  textStyle,
}: SegmentProps) {
  const animated = useAnimatedStyle(() => {
    const raw = staggered(elapsed.value, index, stagger, duration);
    const p = easeOutQuint(raw);
    if (preset === 'fade') {
      return { opacity: p };
    }
    if (preset === 'mask') {
      return { transform: [{ translateY: (1 - p) * lineHeight * 1.1 }] };
    }
    if (preset === 'scale') {
      return { opacity: Math.min(1, raw * 2.5), transform: [{ scale: 0.55 + 0.45 * easeOutBack(raw) }] };
    }
    if (preset === 'blur') {
      const base = {
        opacity: p,
        transform: [{ translateY: (1 - p) * fontSize * 0.25 }, { scale: 1 + (1 - p) * 0.08 }],
      };
      return canBlur ? { ...base, filter: `blur(${((1 - p) * 10).toFixed(2)}px)` } : base;
    }
    return { opacity: p, transform: [{ translateY: (1 - p) * fontSize * 0.55 }] };
  });

  const content = (
    // A filter clips to the view, so the blurred glyph is given room to bleed into.
    <Animated.View style={[preset === 'blur' && canBlur ? styles.bleed : null, animated]}>
      <RNText style={textStyle}>{text}</RNText>
    </Animated.View>
  );

  return preset === 'mask' ? <View style={styles.clip}>{content}</View> : content;
}

/**
 * Reveals text by character, word or line. One clock drives every segment, so the
 * reveal can also be scrubbed by passing `progress`.
 */
export function TextReveal({
  children,
  by = 'word',
  preset = 'rise',
  delay = 0,
  stagger,
  duration = 520,
  trigger,
  progress,
  variant = 'body',
  tone = 'default',
  align = 'left',
  style,
  onDone,
}: TextRevealProps) {
  const theme = useTheme();
  const gap = stagger ?? defaultStagger[by];
  const { lines, count } = useMemo(() => splitText(children, by), [children, by]);
  const total = Math.max(0, count - 1) * gap + duration;

  const textStyle = useMemo(
    () => StyleSheet.flatten([typeStyle(theme, variant), { color: toneColor(theme, tone) }, style]),
    [theme, variant, tone, style],
  );
  const fontSize = textStyle.fontSize ?? 15;
  const lineHeight = textStyle.lineHeight ?? fontSize * 1.3;

  const clock = useSharedValue(0);
  const elapsed = useDerivedValue(() => (progress ? progress.value * total : clock.value));

  useEffect(() => {
    if (progress) return;
    clock.value = 0;
    clock.value = withDelay(
      delay,
      withTiming(total, { duration: total, easing: Easing.linear }, (finished) => {
        if (finished && onDone) scheduleOnRN(onDone);
      }),
    );
    return () => cancelAnimation(clock);
    // `onDone` is read when the animation ends; re-running the reveal for a new callback would be wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, children, by, total, delay, progress, clock]);

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={children}>
      {lines.map((line) => (
        <View key={line.key} style={[styles.line, { justifyContent: justify[align] }]}>
          {line.words.map((word) => (
            <View key={word.key} style={styles.word}>
              {word.segments.map((segment) => (
                <RevealSegment
                  key={segment.index}
                  text={segment.text}
                  index={segment.index}
                  elapsed={elapsed}
                  stagger={gap}
                  duration={duration}
                  preset={preset}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  textStyle={textStyle}
                />
              ))}
              {word.trailing ? <RNText style={textStyle}>{SPACE}</RNText> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { flexDirection: 'row' },
  clip: { overflow: 'hidden' },
  bleed: { padding: 10, margin: -10 },
});
