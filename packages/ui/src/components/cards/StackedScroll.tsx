import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type StackedScrollProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  cardHeight?: number;
  /** How much of each pinned card stays visible above the next. */
  peek?: number;
  gap?: number;
  /** Space above the first pinned card. */
  top?: number;
  style?: StyleProp<ViewStyle>;
};

function StackCard({
  index,
  count,
  scrollY,
  cardHeight,
  peek,
  gap,
  top,
  children,
}: {
  index: number;
  count: number;
  scrollY: SharedValue<number>;
  cardHeight: number;
  peek: number;
  gap: number;
  top: number;
  children: ReactNode;
}) {
  const theme = useTheme();
  const natural = top + index * (cardHeight + gap);
  const pin = top + index * peek;
  // Scroll offset at which this card reaches its pinned place.
  const pinsAt = natural - pin;
  const step = cardHeight + gap - peek;

  const card = useAnimatedStyle(() => {
    const y = scrollY.value;
    const held = Math.max(0, y - pinsAt);
    // How many cards have landed on top of this one, fractionally.
    const covered = Math.min(count - 1 - index, Math.max(0, held / step));
    return {
      transform: [{ translateY: held }, { scale: 1 - Math.min(covered, 3) * 0.055 }],
    };
  });
  const shade = useAnimatedStyle(() => {
    const held = Math.max(0, scrollY.value - pinsAt);
    const covered = Math.min(count - 1 - index, Math.max(0, held / step));
    return { opacity: Math.min(0.55, covered * 0.2) };
  });

  return (
    <Animated.View
      style={[
        styles.card,
        { height: cardHeight, marginBottom: gap, borderRadius: theme.radii.xl, boxShadow: theme.shadows.md },
        card,
      ]}
    >
      {children}
      <Animated.View pointerEvents="none" style={[fill, { backgroundColor: theme.colors.background }, shade]} />
    </Animated.View>
  );
}

/**
 * Cards that pile up as you scroll. Each card scrolls in normally, sticks when it reaches
 * the top of the stack, and is then covered by the next one, stepping back and dimming a
 * little more with each card that lands on it, so the stack keeps a visible edge of every
 * card it holds. Scrolling back peels them off in reverse.
 */
export function StackedScroll<T>({
  items,
  keyOf,
  renderItem,
  cardHeight = 260,
  peek = 16,
  gap = 16,
  top = 12,
  style,
}: StackedScrollProps<T>) {
  const scrollY = useSharedValue(0);
  const [viewport, setViewport] = useState(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // Room after the last card, so it can scroll all the way up to its pinned place.
  const tail = Math.max(0, viewport - cardHeight - top - (items.length - 1) * peek - gap);

  return (
    <View style={[styles.wrap, style]} onLayout={(e: LayoutChangeEvent) => setViewport(e.nativeEvent.layout.height)}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top, paddingBottom: tail }}
      >
        {items.map((item, i) => (
          <StackCard
            key={keyOf(item)}
            index={i}
            count={items.length}
            scrollY={scrollY}
            cardHeight={cardHeight}
            peek={peek}
            gap={gap}
            top={top}
          >
            {renderItem(item, i)}
          </StackCard>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignSelf: 'stretch', overflow: 'hidden' },
  // Scaled about its top edge, so the strip that peeks out above the next card stays put.
  card: { overflow: 'hidden', transformOrigin: 'center top' },
});
