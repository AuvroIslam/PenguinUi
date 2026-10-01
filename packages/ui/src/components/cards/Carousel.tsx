import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { PageDots } from '../navigation/PageDots';

export type CarouselProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  /** Render the artwork. It is drawn wider than its frame so it can slide inside it. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Width of each slide as a share of the carousel's width. */
  itemWidth?: number;
  height?: number;
  gap?: number;
  /** How far the artwork slides inside its frame, as a share of the frame's width. */
  parallax?: number;
  /** Show page dots under the carousel. */
  dots?: boolean;
  onIndexChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

function Slide({
  index,
  progress,
  width,
  height,
  parallax,
  children,
}: {
  index: number;
  progress: SharedValue<number>;
  width: number;
  height: number;
  parallax: number;
  children: ReactNode;
}) {
  const theme = useTheme();

  const frame = useAnimatedStyle(() => {
    const d = Math.min(1, Math.abs(progress.value - index));
    return { transform: [{ scale: 1 - d * 0.09 }], opacity: 1 - d * 0.3 };
  });
  // The artwork moves against the scroll inside its frame, so it seems to sit further back
  // than the frame does.
  const art = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - index) * width * parallax }],
  }));

  return (
    <Animated.View style={[styles.frame, { width, height, borderRadius: theme.radii.xl }, frame]}>
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: -width * parallax, width: width * (1 + parallax * 2) }, art]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

/**
 * A snapping carousel with depth. The slide in the middle is full size and the ones beside
 * it step back and fade a little, and each slide's artwork slides inside its frame against
 * the direction of the scroll, so the picture seems to sit behind the glass. The page dots
 * follow the scroll continuously.
 */
export function Carousel<T>({
  items,
  keyOf,
  renderItem,
  itemWidth = 0.78,
  height = 340,
  gap = 12,
  parallax = 0.22,
  dots = true,
  onIndexChange,
  style,
}: CarouselProps<T>) {
  const [width, setWidth] = useState(0);
  const slide = Math.round(width * itemWidth);
  const interval = slide + gap;
  const side = (width - slide) / 2;

  const x = useSharedValue(0);
  const last = useSharedValue(0);
  const progress = useDerivedValue(() => (interval > 0 ? x.value / interval : 0));

  const changed = useCallback(
    (i: number) => {
      haptic('selection');
      onIndexChange?.(i);
    },
    [onIndexChange],
  );

  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
    const i = Math.round(e.contentOffset.x / Math.max(1, interval));
    if (i !== last.value) {
      last.value = i;
      scheduleOnRN(changed, i);
    }
  });

  return (
    <View style={[styles.wrap, style]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Animated.ScrollView
          horizontal
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToInterval={interval}
          decelerationRate="fast"
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: side, gap }}
        >
          {items.map((item, i) => (
            <Slide key={keyOf(item)} index={i} progress={progress} width={slide} height={height} parallax={parallax}>
              {renderItem(item, i)}
            </Slide>
          ))}
        </Animated.ScrollView>
      ) : (
        <View style={{ height }} />
      )}
      {dots ? <PageDots count={items.length} progress={progress} style={styles.dots} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  frame: { overflow: 'hidden' },
  dots: { marginTop: 18 },
});
