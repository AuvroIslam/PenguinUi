import { useEffect, useMemo } from 'react';
import { StyleSheet, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';
import { SPACE, splitText } from './split';

export type TextShimmerProps = {
  children: string;
  /** Milliseconds for one pass of the highlight. */
  duration?: number;
  /** Width of the highlight, in characters. */
  spread?: number;
  /** Opacity of characters the highlight is not on. */
  rest?: number;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

type CharProps = {
  ch: string;
  index: number;
  head: SharedValue<number>;
  spread: number;
  rest: number;
  textStyle: StyleProp<TextStyle>;
};

function ShimmerChar({ ch, index, head, spread, rest, textStyle }: CharProps) {
  const animated = useAnimatedStyle(() => {
    const distance = index - head.value;
    const glow = Math.exp(-(distance * distance) / (2 * spread * spread));
    return { opacity: rest + (1 - rest) * glow };
  });
  return <Animated.Text style={[textStyle, animated]}>{ch}</Animated.Text>;
}

/**
 * A label with a highlight travelling through it, for states that are working on something.
 * The highlight is a bell curve over the characters, so it has a soft leading and trailing edge.
 */
export function TextShimmer({
  children,
  duration = 1800,
  spread = 3,
  rest = 0.38,
  variant = 'label',
  tone = 'default',
  style,
}: TextShimmerProps) {
  const theme = useTheme();
  // With motion reduced the loop never runs, so the label must not be left at its dim resting opacity.
  const reduced = useReducedMotion();
  if (reduced) rest = 1;
  const { lines, count } = useMemo(() => splitText(children, 'char'), [children]);
  const textStyle = [typeStyle(theme, variant), { color: toneColor(theme, tone) }, style];

  const start = -spread * 3;
  const end = count + spread * 3;
  const head = useSharedValue(start);

  useEffect(() => {
    head.value = start;
    head.value = withRepeat(withTiming(end, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(head);
  }, [head, start, end, duration]);

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={children}>
      {lines.map((line) => (
        <View key={line.key} style={styles.line}>
          {line.words.map((word) => (
            <View key={word.key} style={styles.word}>
              {word.segments.map((segment) => (
                <ShimmerChar
                  key={segment.index}
                  ch={segment.text}
                  index={segment.index}
                  head={head}
                  spread={spread}
                  rest={rest}
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
});
