import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';

export type CoverflowCarouselProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  itemWidth?: number;
  itemHeight?: number;
  /** Distance between the centres of neighbouring covers, as a share of the cover width. */
  spacing?: number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

const MAX_ANGLE = 58;

function Cover({
  index,
  offset,
  width,
  height,
  spacing,
  children,
}: {
  index: number;
  offset: SharedValue<number>;
  width: number;
  height: number;
  spacing: number;
  children: ReactNode;
}) {
  const theme = useTheme();

  const animated = useAnimatedStyle(() => {
    const d = index - offset.value;
    const a = Math.abs(d);
    const near = Math.min(1, a);
    // The cover in the middle gets extra room on each side, so it reads as the one in focus.
    const x = d * spacing * width + Math.sign(d) * near * width * 0.26;
    return {
      zIndex: Math.round(1000 - a * 10),
      opacity: a > 3.5 ? Math.max(0, 4.5 - a) : 1,
      transform: [
        { translateX: x },
        { perspective: 800 },
        // Covers on either side turn to face the middle.
        { rotateY: `${clamp(-d * MAX_ANGLE, -MAX_ANGLE, MAX_ANGLE)}deg` },
        { scale: 1 - Math.min(a, 3) * 0.08 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.cover,
        { width, height, marginLeft: -width / 2, borderRadius: theme.radii.lg, boxShadow: theme.shadows.lg },
        animated,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * A 3D carousel in the manner of a record shelf. The cover in the middle faces you; the
 * ones on either side turn toward it and recede, stacked in depth. Drag to flip through,
 * and a flick carries on through several before settling on one. Tap a cover to bring it
 * to the middle. Each cover that passes the centre ticks.
 */
export function CoverflowCarousel<T>({
  items,
  keyOf,
  renderItem,
  itemWidth = 160,
  itemHeight = 160,
  spacing = 0.3,
  initialIndex = 0,
  onIndexChange,
  style,
}: CoverflowCarouselProps<T>) {
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(initialIndex);
  const start = useSharedValue(0);
  const last = useSharedValue(initialIndex);
  const count = items.length;
  const step = spacing * itemWidth;

  const changed = useCallback(
    (i: number) => {
      haptic('selection');
      onIndexChange?.(i);
    },
    [onIndexChange],
  );

  useAnimatedReaction(
    () => Math.round(offset.value),
    (i, prev) => {
      if (prev !== null && i !== prev && i >= 0 && i < count && i !== last.value) {
        last.value = i;
        scheduleOnRN(changed, i);
      }
    },
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onBegin(() => {
      start.value = offset.value;
    })
    .onUpdate((e) => {
      const raw = start.value - e.translationX / step;
      // Past either end the shelf resists.
      offset.value = raw < 0 ? raw * 0.3 : raw > count - 1 ? count - 1 + (raw - count + 1) * 0.3 : raw;
    })
    .onEnd((e) => {
      const projected = offset.value - (e.velocityX / step) * 0.22;
      const target = clamp(Math.round(projected), 0, count - 1);
      offset.value = withSpring(target, { ...springs.smooth, velocity: -e.velocityX / step });
    });

  const tap = Gesture.Tap().onEnd((e) => {
    // Which cover is under the finger, measured from the middle of the shelf.
    const fromCentre = e.x - width / 2;
    const half = itemWidth / 2;
    let target = Math.round(offset.value);
    if (fromCentre > half) target += Math.ceil((fromCentre - half) / (step * 0.9));
    else if (fromCentre < -half) target -= Math.ceil((-fromCentre - half) / (step * 0.9));
    offset.value = withSpring(clamp(target, 0, count - 1), springs.smooth);
  });

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View
        style={[styles.shelf, { height: itemHeight + 40 }, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        {items.map((item, i) => (
          <Cover key={keyOf(item)} index={i} offset={offset} width={itemWidth} height={itemHeight} spacing={spacing}>
            {renderItem(item, i)}
          </Cover>
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  shelf: { alignSelf: 'stretch', justifyContent: 'center' },
  cover: { position: 'absolute', left: '50%', overflow: 'hidden' },
});
