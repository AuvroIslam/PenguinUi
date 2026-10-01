import { useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { withAlpha } from '../../utils/color';

export type ActivityRing = { key: string; value: number; color: string; label?: string };

export type ActivityRingsProps = {
  /** Outermost first. A value of 1 is a closed ring; above 1 keeps going round. */
  rings: ActivityRing[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const STAGGER = 120;

function RingTrack({
  ring,
  index,
  size,
  stroke,
  gap,
}: {
  ring: ActivityRing;
  index: number;
  size: number;
  stroke: number;
  gap: number;
}) {
  const r = size / 2 - stroke / 2 - index * (stroke + gap);
  const circumference = 2 * Math.PI * r;
  const sweep = useSharedValue(0);
  const closedBefore = useRef(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Each ring sweeps in a beat after the one outside it.
    sweep.value = withDelay(index * STAGGER, withSpring(ring.value, springs.smooth));
    const closed = ring.value >= 1;
    if (closed && !closedBefore.current) {
      pulse.value = withDelay(index * STAGGER + 450, withSequence(withTiming(1.04, { duration: 140 }), withSpring(1, springs.bouncy)));
      setTimeout(() => haptic('success'), index * STAGGER + 450);
    }
    closedBefore.current = closed;
  }, [ring.value, index, sweep, pulse]);

  // Past a full turn the arc keeps going over itself; only the part beyond 1 is redrawn.
  const props = useAnimatedProps(() => {
    const v = sweep.value;
    const shown = v > 1 ? 1 : Math.max(0, v);
    return { strokeDashoffset: circumference * (1 - shown) };
  });
  const lap = useAnimatedProps(() => {
    const v = sweep.value;
    const over = v > 1 ? Math.min(1, v - 1) : 0;
    return { strokeDashoffset: circumference * (1 - over), opacity: over > 0.001 ? 1 : 0 };
  });
  const head = useAnimatedStyle(() => {
    const v = Math.max(0, sweep.value);
    const a = v * Math.PI * 2 - Math.PI / 2;
    return {
      opacity: v > 0.02 ? 1 : 0,
      transform: [{ translateX: Math.cos(a) * r }, { translateY: Math.sin(a) * r }],
    };
  });
  const wrap = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.centre, wrap]} pointerEvents="none">
      <Svg width={size} height={size} style={styles.rotate}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={withAlpha(ring.color, 0.18)} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ring.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[circumference, circumference]}
          animatedProps={props}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ring.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[circumference, circumference]}
          animatedProps={lap}
        />
      </Svg>
      {/* The leading cap carries a soft shadow, so a ring that laps itself shows its head. */}
      <Animated.View
        style={[
          styles.head,
          { width: stroke, height: stroke, borderRadius: stroke / 2, backgroundColor: ring.color, boxShadow: `0 0 ${stroke * 0.4}px rgba(0,0,0,0.35)` },
          head,
        ]}
      />
    </Animated.View>
  );
}

/**
 * Concentric progress rings. Each sweeps round on a heavy spring a beat after the one outside
 * it. A ring past its goal keeps going and laps itself, its rounded head casting a small
 * shadow so the overlap reads, and closing a ring gives it a single pulse.
 */
export function ActivityRings({ rings, size = 200, strokeWidth = 22, gap = 4, style }: ActivityRingsProps) {
  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={rings.map((r) => `${r.label ?? r.key} ${Math.round(r.value * 100)} percent`).join(', ')}
    >
      {rings.map((ring, i) => (
        <RingTrack key={ring.key} ring={ring} index={i} size={size} stroke={strokeWidth} gap={gap} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  rotate: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  head: { position: 'absolute' },
});

