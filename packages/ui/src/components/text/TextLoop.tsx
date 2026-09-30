import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { springs } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';

export type TextLoopProps = {
  items: string[];
  /** Milliseconds each item stays. */
  interval?: number;
  /** Show a specific item and stop the timer. */
  index?: number;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
  onChange?: (index: number) => void;
};

type ItemProps = {
  text: string;
  index: number;
  count: number;
  position: SharedValue<number>;
  height: number;
  textStyle: StyleProp<TextStyle>;
};

function LoopItem({ text, index, count, position, height, textStyle }: ItemProps) {
  const animated = useAnimatedStyle(() => {
    // Signed distance from the current position, wrapped so the list is a ring.
    let distance = (((index - position.value) % count) + count) % count;
    if (distance > count / 2) distance -= count;
    return {
      opacity: Math.max(0, 1 - Math.abs(distance)),
      transform: [{ translateY: distance * height }],
    };
  });
  return (
    <Animated.Text numberOfLines={1} style={[textStyle, styles.item, animated]}>
      {text}
    </Animated.Text>
  );
}

/**
 * Cycles through words in place. The outgoing word leaves upward as the next rises, and
 * the box springs to the width of the word arriving so the text around it reflows smoothly.
 */
export function TextLoop({
  items,
  interval = 2200,
  index: controlled,
  variant = 'label',
  tone = 'default',
  style,
  onChange,
}: TextLoopProps) {
  const theme = useTheme();
  const count = items.length;
  const [internal, setInternal] = useState(0);
  const index = (controlled ?? internal) % Math.max(1, count);

  const flat = StyleSheet.flatten([typeStyle(theme, variant), { color: toneColor(theme, tone) }, style]);
  const height = flat.lineHeight ?? Math.ceil((flat.fontSize ?? 15) * 1.3);
  const textStyle = [flat, { lineHeight: height, height }];

  const [widths, setWidths] = useState<number[]>([]);
  const measured = widths.length === count && widths.every((w) => w > 0);

  const position = useSharedValue(0);
  const width = useSharedValue(0);
  const cumulative = useRef(0);
  const shown = useRef(0);
  const sized = useRef(false);

  useEffect(() => {
    if (controlled !== undefined || count < 2) return;
    const timer = setInterval(() => setInternal((i) => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [controlled, count, interval]);

  useEffect(() => {
    if (index === shown.current) return;
    const steps = (((index - shown.current) % count) + count) % count;
    shown.current = index;
    cumulative.current += steps;
    position.value = withSpring(cumulative.current, springs.bouncy);
    onChange?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count, position]);

  useEffect(() => {
    if (!measured) return;
    // The first measurement sets the width outright; after that it springs.
    width.value = sized.current ? withSpring(widths[index], springs.smooth) : widths[index];
    sized.current = true;
  }, [measured, widths, index, width]);

  const box = useAnimatedStyle(() => (width.value > 0 ? { width: width.value } : {}));

  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={items[index]}
      accessibilityLiveRegion="polite"
      style={[styles.box, { height }, box]}
    >
      {/* Off-screen copies that report each item's natural width. */}
      <View style={styles.measure}>
        {items.map((item, i) => (
          <RNText
            key={`${i}${item}`}
            numberOfLines={1}
            style={flat}
            onLayout={(event) => {
              const w = Math.ceil(event.nativeEvent.layout.width);
              setWidths((prev) => {
                if (prev[i] === w && prev.length === count) return prev;
                const next = prev.slice(0, count);
                while (next.length < count) next.push(0);
                next[i] = w;
                return next;
              });
            }}
          >
            {item}
          </RNText>
        ))}
      </View>
      {measured
        ? items.map((item, i) => (
            <LoopItem
              key={`${i}${item}`}
              text={item}
              index={i}
              count={count}
              position={position}
              height={height}
              textStyle={[textStyle, { width: widths[i] }]}
            />
          ))
        : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  item: { position: 'absolute', left: 0, top: 0 },
  measure: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4000,
    flexDirection: 'row',
    alignItems: 'flex-start',
    opacity: 0,
    pointerEvents: 'none',
  },
});
