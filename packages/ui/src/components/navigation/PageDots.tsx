import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';

export type PageDotsProps = {
  count: number;
  /** Scroll position in pages: 0 at the first page, 1 at the second, fractional in between. */
  progress: SharedValue<number>;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const GAP = 8;

function Dot({ index, progress, size }: { index: number; progress: SharedValue<number>; size: number }) {
  const theme = useTheme();
  const c = theme.colors;

  const animated = useAnimatedStyle(() => {
    // Distance from this page, 0 when it is the current one and 1 a full page away.
    const d = Math.min(1, Math.abs(progress.value - index));
    return {
      // Both the page being left and the page being entered are partly stretched, so the
      // elongation is handed from one dot to the next as the scroll moves, never switched.
      width: interpolate(d, [0, 1], [size * 3, size]),
      backgroundColor: interpolateColor(d, [0, 1], [c.text, c.borderStrong]),
    };
  });

  return <Animated.View style={[{ height: size, borderRadius: size / 2 }, animated]} />;
}

/**
 * A page indicator driven directly by scroll position. The current dot stretches into a bar
 * and hands that length to its neighbour continuously as the page moves, so a half-swiped
 * page shows two half-stretched dots.
 */
export function PageDots({ count, progress, size = 8, style }: PageDotsProps) {
  return (
    <View accessibilityRole="progressbar" style={[styles.row, style]}>
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} index={i} progress={progress} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: GAP, alignSelf: 'center' },
});
