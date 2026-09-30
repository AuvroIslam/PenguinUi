import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { fill } from '../../utils/layout';

export type CollapsingHeaderProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Space reserved above the bar, such as the status bar inset. */
  top?: number;
  style?: StyleProp<ViewStyle>;
};

const BAR = 52;
const LARGE = 72;
const COLLAPSE = LARGE - 4;

/**
 * A large title that folds into the bar as the content scrolls. The big title shrinks and
 * slides up toward the bar's centre, the small centred title fades in just as the big one
 * leaves, and a hairline appears under the bar once content is scrolling beneath it.
 * Pulling down past the top stretches the title instead of leaving dead space.
 */
export function CollapsingHeader({ title, subtitle, children, top = 0, style }: CollapsingHeaderProps) {
  const theme = useTheme();
  const c = theme.colors;
  const y = useSharedValue(0);
  const [width, setWidth] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const big = useAnimatedStyle(() => {
    const t = interpolate(y.value, [0, COLLAPSE], [0, 1], Extrapolation.CLAMP);
    // Overscroll (y < 0) grows the title from its left edge rather than moving it.
    const stretch = y.value < 0 ? 1 + Math.min(0.35, -y.value / 420) : 1;
    return {
      opacity: 1 - Math.min(1, t * 1.6),
      transform: [
        { translateY: -t * 22 },
        { scale: interpolate(t, [0, 1], [1, 0.72]) * stretch },
      ],
    };
  });
  const small = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [COLLAPSE * 0.55, COLLAPSE], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [COLLAPSE * 0.55, COLLAPSE], [8, 0], Extrapolation.CLAMP) }],
  }));
  const rule = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [COLLAPSE - 12, COLLAPSE + 4], [0, 1], Extrapolation.CLAMP),
  }));
  const bar = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [COLLAPSE - 24, COLLAPSE], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.wrap, style]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top + BAR }}
      >
        <View style={styles.large}>
          <Animated.View style={[styles.bigWrap, big]}>
            <Text style={[styles.bigText, fontFor(theme, 'bold')]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="caption" tone="muted">
                {subtitle}
              </Text>
            ) : null}
          </Animated.View>
        </View>
        {children}
      </Animated.ScrollView>
      <View pointerEvents="none" style={[styles.bar, { height: top + BAR, width }]}>
        <Animated.View style={[fill, { backgroundColor: c.background }, bar]} />
        <Animated.View style={[styles.smallWrap, { paddingTop: top }, small]}>
          <Text variant="label" weight="semibold">
            {title}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.rule, { backgroundColor: c.border }, rule]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignSelf: 'stretch' },
  large: { height: LARGE, paddingHorizontal: 20, justifyContent: 'flex-end', paddingBottom: 6 },
  bigWrap: { transformOrigin: 'left center' },
  bigText: { fontSize: 34, lineHeight: 40, letterSpacing: -1 },
  bar: { position: 'absolute', left: 0, top: 0 },
  smallWrap: { ...fill, alignItems: 'center', justifyContent: 'center' },
  rule: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
});
