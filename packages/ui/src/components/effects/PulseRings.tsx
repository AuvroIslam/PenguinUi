import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';

export type PulseRingsProps = {
  /** The thing the rings come out of, such as an avatar or a location dot. */
  children?: ReactNode;
  /** Diameter of the centre. Rings start at this size. */
  size?: number;
  /** How far the rings travel, as a multiple of the centre's size. */
  reach?: number;
  rings?: number;
  color?: string;
  /** Milliseconds for one ring to travel out. */
  period?: number;
  /** Filled discs instead of outlines. */
  filled?: boolean;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

function PulseRing({
  clock,
  index,
  count,
  size,
  reach,
  color,
  filled,
}: {
  clock: SharedValue<number>;
  index: number;
  count: number;
  size: number;
  reach: number;
  color: string;
  filled: boolean;
}) {
  const animated = useAnimatedStyle(() => {
    // Evenly spaced on one clock, so the rings keep their spacing however long it runs.
    const t = (clock.value + index / count) % 1;
    // Fast out, slow to fade: the ring leaves with energy and dissolves at the edge.
    const eased = 1 - Math.pow(1 - t, 2.2);
    return {
      opacity: (1 - t) * (filled ? 0.35 : 0.7),
      transform: [{ scale: 1 + eased * (reach - 1) }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        filled ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color },
        animated,
      ]}
    />
  );
}

/**
 * Rings that pulse out of a centre like a radar or a live location. They share one clock and
 * are spaced evenly round it, so the rhythm never drifts, and each leaves quickly and slows
 * as it fades. With reduced motion the rings are hidden and the centre stays still.
 */
export function PulseRings({
  children,
  size = 56,
  reach = 2.6,
  rings = 3,
  color,
  period = 2400,
  filled = false,
  active = true,
  style,
}: PulseRingsProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.accent;
  const reduced = useReducedMotion();
  const clock = useSharedValue(0);

  useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(clock);
      return;
    }
    clock.value = 0;
    clock.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1);
    return () => cancelAnimation(clock);
  }, [active, reduced, period, clock]);

  const box = size * reach;

  return (
    <View style={[styles.box, { width: box, height: box }, style]}>
      {active && !reduced
        ? Array.from({ length: rings }, (_, i) => (
            <PulseRing key={i} clock={clock} index={i} count={rings} size={size} reach={reach} color={tint} filled={filled} />
          ))
        : null}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
});
