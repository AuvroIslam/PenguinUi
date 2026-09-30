import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { easeOutQuint, staggered } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';
import { SPACE, splitText } from './split';

export type FlipTextProps = {
  children: string;
  /** Milliseconds between characters. */
  stagger?: number;
  /** Milliseconds each character takes to turn. */
  duration?: number;
  delay?: number;
  /** Replays the flip whenever this value changes. */
  trigger?: unknown;
  /** Which edge the text is anchored to. Outgoing text leaves from the same anchor. */
  align?: 'left' | 'center' | 'right';
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

type CharProps = {
  ch: string;
  index: number;
  elapsed: SharedValue<number>;
  stagger: number;
  duration: number;
  leaving: boolean;
  fontSize: number;
  textStyle: StyleProp<TextStyle>;
};

function FlipChar({ ch, index, elapsed, stagger, duration, leaving, fontSize, textStyle }: CharProps) {
  const animated = useAnimatedStyle(() => {
    const p = easeOutQuint(staggered(elapsed.value, index, stagger, duration));
    // Arriving characters turn up from 90 degrees; leaving ones carry on over the top.
    const turn = leaving ? -90 * p : 90 * (1 - p);
    const lift = leaving ? -p : 1 - p;
    return {
      opacity: leaving ? 1 - p : p,
      transform: [
        { perspective: 600 },
        { translateY: lift * fontSize * 0.4 },
        { rotateX: `${turn}deg` },
      ],
    };
  });
  return <Animated.Text style={[textStyle, animated]}>{ch}</Animated.Text>;
}

const justify = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;

type LayerProps = {
  text: string;
  leaving: boolean;
  align: 'left' | 'center' | 'right';
  /** The width the outgoing text had, so it does not re-wrap inside the incoming text's box. */
  width?: number;
  stagger: number;
  duration: number;
  delay: number;
  fontSize: number;
  textStyle: StyleProp<TextStyle>;
  onFinish?: () => void;
};

function FlipLayer({
  text,
  leaving,
  align,
  width,
  stagger,
  duration,
  delay,
  fontSize,
  textStyle,
  onFinish,
}: LayerProps) {
  const { lines, count } = useMemo(() => splitText(text, 'char'), [text]);
  const total = Math.max(0, count - 1) * stagger + duration;
  const elapsed = useSharedValue(0);

  useEffect(() => {
    elapsed.value = 0;
    elapsed.value = withDelay(
      delay,
      withTiming(total, { duration: total, easing: Easing.linear }, (finished) => {
        if (finished && onFinish) scheduleOnRN(onFinish);
      }),
    );
    return () => cancelAnimation(elapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, total, delay]);

  const body = (
    <View style={width ? { width } : null}>
      {lines.map((line) => (
        <View key={line.key} style={[styles.line, { justifyContent: justify[align] }]}>
          {line.words.map((word) => (
            <View key={word.key} style={styles.word}>
              {word.segments.map((segment) => (
                <FlipChar
                  key={segment.index}
                  ch={segment.text}
                  index={segment.index}
                  elapsed={elapsed}
                  stagger={stagger}
                  duration={duration}
                  leaving={leaving}
                  fontSize={fontSize}
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

  // The outgoing layer floats over the incoming one, pinned to the same anchor.
  return leaving ? <View style={[styles.leaving, { alignItems: justify[align] }]}>{body}</View> : body;
}

/**
 * Characters roll in on the X axis, one after another. When the text changes, the old
 * characters roll out over the top while the new ones roll in beneath them.
 */
export function FlipText({
  children,
  stagger = 30,
  duration = 480,
  delay = 0,
  trigger,
  align = 'left',
  variant = 'heading',
  tone = 'default',
  style,
}: FlipTextProps) {
  const theme = useTheme();
  const flat = StyleSheet.flatten([typeStyle(theme, variant), { color: toneColor(theme, tone) }, style]);
  const fontSize = flat.fontSize ?? 18;

  const [epoch, setEpoch] = useState(0);
  const [leaving, setLeaving] = useState<{ text: string; id: number; width: number } | null>(null);
  const [width, setWidth] = useState(0);
  const [shown, setShown] = useState({ text: children, trigger });

  // Derive the outgoing layer during render so the old text never flashes as static.
  if (shown.text !== children || shown.trigger !== trigger) {
    setShown({ text: children, trigger });
    setLeaving({ text: shown.text, id: epoch, width });
    setEpoch(epoch + 1);
  }

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={children}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <FlipLayer
        key={`in${epoch}`}
        text={children}
        leaving={false}
        align={align}
        stagger={stagger}
        duration={duration}
        delay={delay}
        fontSize={fontSize}
        textStyle={flat}
      />
      {leaving ? (
        <FlipLayer
          key={`out${leaving.id}`}
          text={leaving.text}
          leaving
          align={align}
          width={leaving.width}
          stagger={stagger}
          duration={duration}
          delay={0}
          fontSize={fontSize}
          textStyle={flat}
          onFinish={() => setLeaving(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { flexDirection: 'row' },
  leaving: { position: 'absolute', left: 0, top: 0, right: 0, pointerEvents: 'none' },
});
