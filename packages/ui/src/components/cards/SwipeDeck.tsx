import { useLayoutEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { fill } from '../../utils/layout';

export type SwipeDirection = 'left' | 'right';

export type SwipeDeckProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onSwipe?: (item: T, direction: SwipeDirection) => void;
  /** Called once the last card has gone. */
  onEmpty?: () => void;
  /** Words stamped on the card as it leans each way. */
  stamps?: { left: string; right: string };
  /** Height of the cards. */
  height?: number;
  /** Shown when there are no cards left. */
  empty?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const VISIBLE = 3;
const STEP_SCALE = 0.05;
const STEP_Y = 14;

/**
 * A stack of cards to sort by swiping. The top card follows the finger and leans with it,
 * pivoting about the point it was grabbed, so a card held near its bottom leans the other
 * way. A stamp fades in on the side it is heading for. The card underneath rises and grows
 * into place as the top one leaves, so the stack always looks whole. Let go past the line,
 * or flick, and the card flies off with the speed it was thrown at; short of it, it rocks
 * back into place.
 */
export function SwipeDeck<T>({
  items,
  keyOf,
  renderCard,
  onSwipe,
  onEmpty,
  stamps = { left: 'NOPE', right: 'LIKE' },
  height = 420,
  empty,
  style,
}: SwipeDeckProps<T>) {
  const theme = useTheme();
  const screen = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const grabbedLow = useSharedValue(false);
  const over = useSharedValue(false);
  const threshold = screen.width * 0.28;

  // The swiped card is removed from the stack in the same frame its offset is cleared, so
  // the card beneath, which is already full size, takes its place without a flicker.
  useLayoutEffect(() => {
    x.value = 0;
    y.value = 0;
  }, [index, x, y]);

  const advance = (direction: SwipeDirection) => {
    const item = items[index];
    if (item !== undefined) onSwipe?.(item, direction);
    const next = index + 1;
    setIndex(next);
    if (next >= items.length) onEmpty?.();
  };

  const tick = () => haptic('light');
  const commit = () => haptic('medium');

  const pan = Gesture.Pan()
    .onBegin((e) => {
      grabbedLow.value = e.y > height * 0.55;
    })
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY * 0.6;
      const past = Math.abs(e.translationX) > threshold;
      if (past !== over.value) {
        over.value = past;
        if (past) scheduleOnRN(tick);
      }
    })
    .onEnd((e) => {
      over.value = false;
      const flung = Math.abs(e.velocityX) > 800;
      if (Math.abs(x.value) > threshold || flung) {
        const dir = (flung ? e.velocityX : x.value) > 0 ? 1 : -1;
        scheduleOnRN(commit);
        // Out at least as fast as it was thrown.
        const speed = Math.max(Math.abs(e.velocityX), 1400);
        const distance = screen.width * 1.4 - Math.abs(x.value);
        x.value = withTiming(dir * screen.width * 1.4, { duration: Math.max(140, (distance / speed) * 1000) }, (done) => {
          if (done) scheduleOnRN(advance, dir > 0 ? 'right' : 'left');
        });
        y.value = withTiming(y.value + e.velocityY * 0.12, { duration: 260 });
      } else {
        x.value = withSpring(0, springs.wobbly);
        y.value = withSpring(0, springs.wobbly);
      }
    });

  const visible = items.slice(index, index + VISIBLE);

  return (
    <View style={[styles.deck, { height: height + STEP_Y * (VISIBLE - 1) }, style]}>
      {visible.length === 0 ? <View style={[fill, styles.empty]}>{empty}</View> : null}
      {visible
        .map((item, i) => ({ item, i }))
        .reverse()
        .map(({ item, i }) => (
          <DeckCard
            key={keyOf(item)}
            position={i}
            x={x}
            y={y}
            grabbedLow={grabbedLow}
            threshold={threshold}
            height={height}
            stamps={stamps}
            gesture={i === 0 ? pan : undefined}
            accent={theme.colors.success}
            danger={theme.colors.danger}
          >
            {renderCard(item)}
          </DeckCard>
        ))}
    </View>
  );
}

function DeckCard({
  children,
  position,
  x,
  y,
  grabbedLow,
  threshold,
  height,
  stamps,
  gesture,
  accent,
  danger,
}: {
  children: ReactNode;
  position: number;
  x: SharedValue<number>;
  y: SharedValue<number>;
  grabbedLow: SharedValue<boolean>;
  threshold: number;
  height: number;
  stamps: { left: string; right: string };
  gesture?: ReturnType<typeof Gesture.Pan>;
  accent: string;
  danger: string;
}) {
  const theme = useTheme();
  const c = theme.colors;

  const animated = useAnimatedStyle(() => {
    if (position === 0) {
      const lean = interpolate(x.value, [-threshold * 2, 0, threshold * 2], [-14, 0, 14]);
      return {
        transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${grabbedLow.value ? -lean : lean}deg` }],
      };
    }
    // Cards beneath close the gap by however far the top card has travelled.
    const progress = interpolate(Math.abs(x.value), [0, threshold], [0, 1], Extrapolation.CLAMP);
    const p = position - progress;
    return { transform: [{ translateY: p * STEP_Y }, { scale: 1 - p * STEP_SCALE }] };
  });

  const right = useAnimatedStyle(() => ({
    opacity: position === 0 ? interpolate(x.value, [20, threshold], [0, 1], Extrapolation.CLAMP) : 0,
  }));
  const left = useAnimatedStyle(() => ({
    opacity: position === 0 ? interpolate(x.value, [-threshold, -20], [1, 0], Extrapolation.CLAMP) : 0,
  }));

  const body = (
    <Animated.View
      style={[
        styles.card,
        { height, backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.xl, boxShadow: theme.shadows.lg },
        animated,
      ]}
    >
      {children}
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampRight, { borderColor: accent }, right]}>
        <Text style={[styles.stampText, fontFor(theme, 'bold'), { color: accent }]}>{stamps.right}</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampLeft, { borderColor: danger }, left]}>
        <Text style={[styles.stampText, fontFor(theme, 'bold'), { color: danger }]}>{stamps.left}</Text>
      </Animated.View>
    </Animated.View>
  );

  return gesture ? <GestureDetector gesture={gesture}>{body}</GestureDetector> : body;
}

const styles = StyleSheet.create({
  deck: { alignSelf: 'stretch' },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    transformOrigin: 'center bottom',
  },
  empty: { alignItems: 'center', justifyContent: 'center' },
  stamp: { position: 'absolute', top: 26, borderWidth: 3, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  // Stamps sit on the side the card is moving away from, so they lead the eye.
  stampRight: { left: 22, transform: [{ rotate: '-14deg' }] },
  stampLeft: { right: 22, transform: [{ rotate: '14deg' }] },
  stampText: { fontSize: 30, lineHeight: 36, letterSpacing: 2 },
});
