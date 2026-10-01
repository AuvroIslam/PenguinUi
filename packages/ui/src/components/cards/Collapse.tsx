import { Children, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { springs } from '../../motion/tokens';

export type CollapseProps = {
  open: boolean;
  children: ReactNode;
  /**
   * Stagger direct children as they appear: each one fades up a beat after the one before.
   * Leave off for content that should arrive as a single block.
   */
  stagger?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Exposes the open progress (0 to 1) so a header can turn its chevron in step. */
  progress?: SharedValue<number>;
};

function Staggered({ index, count, progress, children }: { index: number; count: number; progress: SharedValue<number>; children: ReactNode }) {
  const animated = useAnimatedStyle(() => {
    // The whole cascade fits in the first 80 percent of the open, so the last child has
    // landed by the time the height spring settles.
    const slot = 0.5 / Math.max(1, count);
    const t = interpolate(progress.value, [0.2 + index * slot, 0.6 + index * slot], [0, 1], 'clamp');
    return { opacity: t, transform: [{ translateY: (1 - t) * 10 }] };
  });
  return <Animated.View style={animated}>{children}</Animated.View>;
}

/**
 * Content that opens and closes by its own height on a heavy spring. The content is laid
 * out at full size behind a clip, so text never reflows while the box grows, and with
 * `stagger` each child fades up in turn as it is uncovered.
 */
export function Collapse({ open, children, stagger = false, style, progress: external }: CollapseProps) {
  const [height, setHeight] = useState(0);
  const internal = useSharedValue(open ? 1 : 0);
  const progress = external ?? internal;

  useEffect(() => {
    progress.value = open ? withSpring(1, springs.smooth) : withTiming(0, { duration: 220 });
  }, [open, progress]);

  const clip = useAnimatedStyle(() => ({
    height: height * progress.value,
    opacity: stagger ? 1 : interpolate(progress.value, [0, 0.4], [0, 1], 'clamp'),
  }));

  const items = Children.toArray(children);

  return (
    <Animated.View style={[styles.clip, clip, style]}>
      <View style={styles.content} onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}>
        {stagger
          ? items.map((child, i) => (
              <Staggered key={i} index={i} count={items.length} progress={progress}>
                {child}
              </Staggered>
            ))
          : children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  // Absolutely placed so it always lays out at its natural height, whatever the clip is.
  content: { position: 'absolute', left: 0, right: 0, top: 0 },
});
