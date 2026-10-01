import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { clamp, fill } from '../../utils/layout';

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
/** How much the card grows when it is picked up off the stack. */
const LIFT = 0.035;
/** Extra lean, in degrees per point per second of travel, and the most it can add. */
const SWING_GAIN = 0.0042;
const SWING_MAX = 10;
/** The swing's own spring, a little under critical so it rocks once as it settles. */
const SWING_STIFFNESS = 260;
const SWING_DAMPING = 20;
/**
 * Off the edge. Lightly damped, so a card let go slowly pulls away and gathers speed, one that
 * was thrown keeps its speed, and it is still moving fast as it crosses the line it stops at.
 */
const FLY = { mass: 1, stiffness: 180, damping: 14, overshootClamping: true };
const FLY_Y = { mass: 1, stiffness: 40, damping: 12 };
/** Back onto the stack, gliding in with the speed it was let go at and settling with one rock. */
const RETURN = { mass: 0.9, stiffness: 200, damping: 17 };

type Drag = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** 1 when grabbed above the middle, -1 below, which decides the way the card leans. */
  side: SharedValue<number>;
  /** The grabbed point, from the card's bottom centre, which is what the card turns about. */
  grabX: SharedValue<number>;
  grabY: SharedValue<number>;
  swing: SharedValue<number>;
  lift: SharedValue<number>;
};

/**
 * A stack of cards to sort by swiping. The top card lifts a little when it is picked up and
 * stays under the finger, turning about the point it was grabbed, so one held low leans the
 * other way. It leans further while it is moving and swings back when the finger slows, like
 * a card dragged across a table with its far end trailing, so it has weight instead of being
 * bolted to the finger. A stamp presses in on the side it is heading for, and the card beneath
 * rises and grows into place. Let go past the line, or flick, and it carries on at the speed
 * it was thrown; short of it, it glides back and rocks into place.
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
  const reduced = useReducedMotion();
  const screen = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);

  const drag: Drag = {
    x: useSharedValue(0),
    y: useSharedValue(0),
    side: useSharedValue(1),
    grabX: useSharedValue(0),
    grabY: useSharedValue(0),
    swing: useSharedValue(0),
    lift: useSharedValue(0),
  };
  const { x, y, side, grabX, grabY, swing, lift } = drag;
  const swingV = useSharedValue(0);
  const speed = useSharedValue(0);
  const lastX = useSharedValue(0);
  const downX = useSharedValue(0);
  const downY = useSharedValue(0);
  const over = useSharedValue(false);
  const leaving = useSharedValue(false);
  const threshold = screen.width * 0.28;

  // The swiped card is removed from the stack in the same frame its motion is cleared, so the
  // card beneath, which is already full size, takes its place without a flicker.
  useLayoutEffect(() => {
    x.value = 0;
    y.value = 0;
    lift.value = 0;
    swing.value = 0;
    swingV.value = 0;
    speed.value = 0;
    lastX.value = 0;
    leaving.value = false;
  }, [index, x, y, lift, swing, swingV, speed, lastX, leaving]);

  // The swing follows how fast the card is travelling, read from the card's own position each
  // frame, so it carries through the drag, the throw and the glide back alike.
  useFrameCallback((frame) => {
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    if (dt <= 0) return;
    const moved = x.value - lastX.value;
    lastX.value = x.value;
    // A jump back to the middle when the next card takes over is not motion.
    const v = Math.abs(moved) > screen.width * 0.5 ? 0 : moved / dt;
    // Smooth the raw speed: touches and frames do not arrive in step.
    speed.value += (v - speed.value) * Math.min(1, dt * 18);
    const target = clamp(speed.value * SWING_GAIN, -SWING_MAX, SWING_MAX);
    if (Math.abs(target) < 0.01 && Math.abs(swing.value) < 0.01 && Math.abs(swingV.value) < 0.05) {
      if (swing.value !== 0) swing.value = 0;
      swingV.value = 0;
      return;
    }
    swingV.value += (SWING_STIFFNESS * (target - swing.value) - SWING_DAMPING * swingV.value) * dt;
    swing.value += swingV.value * dt;
  }, !reduced);

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
      if (leaving.value) return;
      // Caught on its way back to the stack: hold it where it is.
      cancelAnimation(x);
      cancelAnimation(y);
      // A new pivot while the card is still leaning would make it jump, so keep the old one.
      if (Math.abs(x.value) < 2 && Math.abs(y.value) < 2) {
        side.value = e.y > height * 0.55 ? -1 : 1;
        grabX.value = e.x - width / 2;
        grabY.value = e.y - height;
      }
      // Measure from where the finger went down, not from where the pan was recognised, so the
      // card stays under the finger instead of trailing it by the touch slop.
      downX.value = e.absoluteX - x.value;
      downY.value = e.absoluteY - y.value;
      if (!reduced) lift.value = withSpring(1, springs.press);
    })
    .onUpdate((e) => {
      if (leaving.value) return;
      x.value = e.absoluteX - downX.value;
      y.value = e.absoluteY - downY.value;
      const past = Math.abs(x.value) > threshold;
      if (past !== over.value) {
        over.value = past;
        if (past) scheduleOnRN(tick);
      }
    })
    .onEnd((e) => {
      if (leaving.value) return;
      over.value = false;
      // A flick counts when it is quick and heading the way the card has already moved, so a
      // short throw sends the card but a tap that wobbles does not.
      const flung = Math.abs(e.velocityX) > 500 && Math.abs(x.value) > 24 && Math.sign(e.velocityX) === Math.sign(x.value);
      if (Math.abs(x.value) > threshold || flung) {
        const dir = (flung ? e.velocityX : x.value) > 0 ? 1 : -1;
        leaving.value = true;
        scheduleOnRN(commit);
        x.value = withSpring(dir * screen.width * 1.4, { ...FLY, velocity: e.velocityX }, (done) => {
          if (done) scheduleOnRN(advance, dir > 0 ? 'right' : 'left');
        });
        // It keeps the line it was thrown along rather than flattening out.
        y.value = withSpring(y.value + e.velocityY * 0.25, { ...FLY_Y, velocity: e.velocityY });
      } else {
        x.value = withSpring(0, { ...RETURN, velocity: e.velocityX });
        y.value = withSpring(0, { ...RETURN, velocity: e.velocityY });
      }
    })
    .onFinalize(() => {
      if (!leaving.value) lift.value = withSpring(0, springs.gentle);
    });

  const visible = items.slice(index, index + VISIBLE);

  return (
    <View
      style={[styles.deck, { height: height + STEP_Y * (VISIBLE - 1) }, style]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {visible.length === 0 ? <View style={[fill, styles.empty]}>{empty}</View> : null}
      {visible
        .map((item, i) => ({ item, i }))
        .reverse()
        .map(({ item, i }) => (
          <DeckCard
            key={keyOf(item)}
            position={i}
            fresh={index > 0}
            drag={drag}
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
  fresh,
  drag,
  threshold,
  height,
  stamps,
  gesture,
  accent,
  danger,
}: {
  children: ReactNode;
  position: number;
  /** Joined the stack after it was first shown, so it rises into the back of it. */
  fresh: boolean;
  drag: Drag;
  threshold: number;
  height: number;
  stamps: { left: string; right: string };
  gesture?: ReturnType<typeof Gesture.Pan>;
  accent: string;
  danger: string;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const { x, y, side, grabX, grabY, swing, lift } = drag;

  const enter = useSharedValue(fresh ? 0 : 1);
  useEffect(() => {
    if (enter.value < 1) enter.value = withSpring(1, springs.gentle);
  }, [enter]);

  const animated = useAnimatedStyle(() => {
    if (position === 0) {
      const lean = interpolate(x.value, [-threshold * 2, 0, threshold * 2], [-14, 0, 14]);
      // Turn and grow about the grabbed point rather than the bottom centre, so the point under
      // the finger stays under it: step over to it, lean, and step back.
      return {
        opacity: 1,
        transform: [
          { translateX: x.value },
          { translateY: y.value },
          { translateX: grabX.value },
          { translateY: grabY.value },
          { rotate: `${side.value * (lean + swing.value)}deg` },
          { scale: 1 + lift.value * LIFT },
          { translateX: -grabX.value },
          { translateY: -grabY.value },
        ],
      };
    }
    // Cards beneath close the gap by however far the top card has travelled, and a card new to
    // the stack rises in from one step further back.
    const progress = interpolate(Math.abs(x.value), [0, threshold], [0, 1], Extrapolation.CLAMP);
    const p = position - progress + (1 - enter.value);
    return { opacity: enter.value, transform: [{ translateY: p * STEP_Y }, { scale: 1 - p * STEP_SCALE }] };
  });

  // Each stamp fades in and presses down onto the card as it leans its way.
  const right = useAnimatedStyle(() => {
    const t = position === 0 ? interpolate(x.value, [20, threshold], [0, 1], Extrapolation.CLAMP) : 0;
    return { opacity: t, transform: [{ rotate: '-14deg' }, { scale: 1.3 - t * 0.3 }] };
  });
  const left = useAnimatedStyle(() => {
    const t = position === 0 ? interpolate(x.value, [-threshold, -20], [1, 0], Extrapolation.CLAMP) : 0;
    return { opacity: t, transform: [{ rotate: '14deg' }, { scale: 1.3 - t * 0.3 }] };
  });

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
  stampRight: { left: 22 },
  stampLeft: { right: 22 },
  stampText: { fontSize: 30, lineHeight: 36, letterSpacing: 2 },
});
