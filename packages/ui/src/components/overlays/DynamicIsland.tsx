import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { easings, springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { fill } from '../../utils/layout';

export type IslandState = 'idle' | 'compact' | 'expanded';

export type DynamicIslandProps = {
  state: IslandState;
  /** Content for the compact pill: a node at each end. */
  compact?: { leading?: ReactNode; trailing?: ReactNode };
  /** Content for the expanded card. */
  expanded?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Size of each state. The defaults are the proportions of the iPhone island. */
  sizes?: Partial<Record<IslandState, { width: number; height: number; radius: number }>>;
  /**
   * Fill of the island. Black by default in both themes, because it imitates the physical
   * cut-out around the camera, which is black whatever the screen shows.
   */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_SIZES: Record<IslandState, { width: number; height: number; radius: number }> = {
  idle: { width: 124, height: 36, radius: 18 },
  compact: { width: 236, height: 36, radius: 18 },
  expanded: { width: 360, height: 176, radius: 44 },
};

// Island morphs are one step livelier than the usual bouncy spring: the black shape reads
// as liquid only if it visibly overshoots and settles.
const MORPH = { mass: 0.9, stiffness: 240, damping: 17 };

/**
 * A black pill that morphs between an idle shape, a wide compact pill and an expanded card.
 * The shape's width, height and corner radius move on one lively spring. Content is handed
 * over in order: the outgoing content shrinks and fades almost at once, before the shape has
 * finished moving, and the incoming content grows in only once the shape has most of its new
 * size, so the two never overlap and nothing is ever squeezed.
 */
export function DynamicIsland({ state, compact, expanded, onPress, onLongPress, sizes, color = '#000', style }: DynamicIslandProps) {
  const [room, setRoom] = useState(Infinity);
  const size = { ...DEFAULT_SIZES, ...sizes };
  // Never wider than the space it sits in, so a narrow screen gets a narrower card, not a clipped one.
  const target = { ...size[state], width: Math.min(size[state].width, room) };

  const w = useSharedValue(target.width);
  const h = useSharedValue(target.height);
  const r = useSharedValue(target.radius);
  // One visibility value per state's content.
  const compactIn = useSharedValue(state === 'compact' ? 1 : 0);
  const expandedIn = useSharedValue(state === 'expanded' ? 1 : 0);
  const [shown, setShown] = useState<IslandState>(state);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    w.value = withSpring(target.width, MORPH);
    h.value = withSpring(target.height, MORPH);
    r.value = withSpring(target.radius, MORPH);

    const out = { duration: 110, easing: easings.fluid };
    compactIn.value = withTiming(0, out);
    expandedIn.value = withTiming(0, out);

    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(state), 110);
    const grow = { ...springs.gentle };
    if (state === 'compact') compactIn.value = withDelay(170, withSpring(1, grow));
    if (state === 'expanded') expandedIn.value = withDelay(200, withSpring(1, grow));
    return () => clearTimeout(timer.current);
  }, [state, target.width, target.height, target.radius, w, h, r, compactIn, expandedIn]);

  const shape = useAnimatedStyle(() => ({ width: w.value, height: h.value, borderRadius: r.value }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity: compactIn.value,
    transform: [{ scale: 0.8 + compactIn.value * 0.2 }],
  }));
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: expandedIn.value,
    transform: [{ scale: 0.88 + expandedIn.value * 0.12 }, { translateY: (1 - expandedIn.value) * -10 }],
  }));

  return (
    <View style={[styles.slot, style]} onLayout={(e) => setRoom(e.nativeEvent.layout.width)}>
      <PressableScale onPress={onPress} onLongPress={onLongPress} haptic={onPress || onLongPress ? 'soft' : false} scaleTo={0.97}>
        <Animated.View style={[styles.island, { backgroundColor: color }, shape]}>
          {shown === 'compact' || state === 'compact' ? (
            <Animated.View style={[styles.compact, compactStyle]} pointerEvents="box-none">
              <View style={styles.end}>{compact?.leading}</View>
              <View style={styles.end}>{compact?.trailing}</View>
            </Animated.View>
          ) : null}
          {shown === 'expanded' || state === 'expanded' ? (
            <Animated.View style={[styles.expanded, expandedStyle]} pointerEvents="box-none">
              {expanded}
            </Animated.View>
          ) : null}
        </Animated.View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', alignSelf: 'stretch' },
  island: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  compact: {
    ...fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  end: { minWidth: 24, alignItems: 'center', justifyContent: 'center' },
  expanded: { ...fill, padding: 18 },
});
