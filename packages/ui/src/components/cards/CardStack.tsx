import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';

export type CardStackProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T, selected: boolean) => ReactNode;
  /** Height of one card. */
  cardHeight?: number;
  /** How much of each card shows in the stack. */
  peek?: number;
  /** Shown under the selected card, in the space the others leave. */
  renderDetail?: (item: T) => ReactNode;
  onSelect?: (item: T | null) => void;
  style?: StyleProp<ViewStyle>;
};

const PILE_PEEK = 10;
const STAGGER = 40;

function StackCard({
  y,
  scale,
  delay,
  z,
  lifted,
  height,
  onPress,
  children,
}: {
  y: number;
  scale: number;
  delay: number;
  z: number;
  lifted: boolean;
  height: number;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const ty = useSharedValue(y);
  const s = useSharedValue(scale);
  const lift = useSharedValue(1);

  useEffect(() => {
    ty.value = withDelay(delay, withSpring(y, springs.smooth));
    s.value = withDelay(delay, withSpring(scale, springs.smooth));
  }, [y, scale, delay, ty, s]);

  useEffect(() => {
    // The chosen card rises toward you for a moment as it travels, like it is being picked up.
    if (lifted) lift.value = withSequence(withTiming(1.04, { duration: 160 }), withSpring(1, springs.gentle));
  }, [lifted, lift]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: s.value * lift.value }],
  }));

  return (
    <Animated.View style={[styles.card, { height, zIndex: z, borderRadius: theme.radii.xl, boxShadow: theme.shadows.md }, animated]}>
      <PressableScale onPress={onPress} haptic={false} scaleTo={0.98} style={styles.fill}>
        {children}
      </PressableScale>
    </Animated.View>
  );
}

/**
 * A wallet-style stack. Each card shows its top edge above the next. Tapping a card lifts it
 * to the top while the others drop to the bottom edge one after another and tuck into a thin
 * pile, leaving room for the chosen card's details. Tapping the chosen card, or the pile,
 * puts everything back.
 */
export function CardStack<T>({
  items,
  keyOf,
  renderCard,
  cardHeight = 200,
  peek = 64,
  renderDetail,
  onSelect,
  style,
}: CardStackProps<T>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [height, setHeight] = useState(0);
  const stackHeight = cardHeight + peek * (items.length - 1);
  const total = Math.max(stackHeight, height);

  const choose = (index: number | null) => {
    haptic(index === null ? 'light' : 'medium');
    setSelected(index);
    onSelect?.(index === null ? null : items[index]);
  };

  return (
    <View style={[styles.wrap, { height: stackHeight }, style]} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {selected !== null && renderDetail ? (
        <View style={[styles.detail, { top: cardHeight + 16 }]}>{renderDetail(items[selected])}</View>
      ) : null}
      {items.map((item, i) => {
        let y = i * peek;
        let scale = 1;
        let delay = 0;
        let z = i;
        if (selected !== null) {
          if (i === selected) {
            y = 0;
            z = 100;
          } else {
            // Position in the pile, counting only the cards that are not chosen.
            const rank = i < selected ? i : i - 1;
            const pileCount = items.length - 1;
            y = total - cardHeight * 0.18 - (pileCount - 1 - rank) * PILE_PEEK;
            scale = 0.92 - (pileCount - 1 - rank) * 0.02;
            delay = rank * STAGGER;
            z = rank;
          }
        } else {
          // Coming back, the cards fan out from the top down.
          delay = i * (STAGGER / 2);
        }
        return (
          <StackCard
            key={keyOf(item)}
            y={y}
            scale={scale}
            delay={delay}
            z={z}
            lifted={i === selected}
            height={cardHeight}
            onPress={() => choose(selected === null ? i : null)}
          >
            {renderCard(item, i === selected)}
          </StackCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  card: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  fill: { flex: 1 },
  detail: { position: 'absolute', left: 0, right: 0 },
});
