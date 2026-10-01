import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { useShake } from '../../motion/shake';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck, DrawnCross } from '../../primitives/DrawnPath';
import { useTheme } from '../../theme/ThemeProvider';

export type SuccessCheckProps = {
  /** `success` draws a check, `error` a cross. */
  variant?: 'success' | 'error';
  size?: number;
  /** Change this to play the mark again. */
  play?: number | boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SPARKS = 8;

function Spark({ index, burst, size, color }: { index: number; burst: SharedValue<number>; size: number; color: string }) {
  const a = (index / SPARKS) * Math.PI * 2 + Math.PI / SPARKS;
  const animated = useAnimatedStyle(() => {
    const t = burst.value;
    const dist = size * (0.5 + t * 0.32);
    return {
      opacity: t > 0 && t < 1 ? 1 - t : 0,
      transform: [
        { translateX: Math.cos(a) * dist },
        { translateY: Math.sin(a) * dist },
        { rotate: `${a}rad` },
        { scaleX: 1 - t * 0.7 },
      ],
    };
  });
  const w = size * 0.12;
  return (
    <Animated.View
      style={[styles.spark, { backgroundColor: color, width: w, left: size / 2 - w / 2, top: size / 2 - 1.5 }, animated]}
    />
  );
}

/**
 * A result mark in four beats. The circle's outline draws itself round, then floods with
 * colour from the centre, then the check draws in with a small pop of the whole mark, and a
 * ring of sparks flies off and fades. The error mark draws a cross instead and shakes once,
 * with no sparks: failure should be clear, not celebrated.
 */
export function SuccessCheck({ variant = 'success', size = 96, play = 0, style }: SuccessCheckProps) {
  const theme = useTheme();
  const c = theme.colors;
  const tint = variant === 'success' ? c.success : c.danger;
  const r = size / 2 - 3;
  const circumference = 2 * Math.PI * r;

  const ring = useSharedValue(0);
  const flood = useSharedValue(0);
  const mark = useSharedValue(0);
  const pop = useSharedValue(1);
  const burst = useSharedValue(0);
  const { shake, style: shakeStyle } = useShake();

  useEffect(() => {
    ring.value = 0;
    flood.value = 0;
    mark.value = 0;
    burst.value = 0;
    ring.value = withTiming(1, { duration: 420, easing: easings.out });
    flood.value = withDelay(330, withSpring(1, springs.snappy));
    mark.value = withDelay(470, withTiming(1, { duration: 340, easing: easings.out }));
    pop.value = withDelay(470, withSequence(withTiming(1.12, { duration: 140 }), withSpring(1, springs.bouncy)));
    if (variant === 'success') {
      burst.value = withDelay(520, withTiming(1, { duration: 560, easing: easings.out }));
    }
    const timer = setTimeout(() => {
      haptic(variant === 'success' ? 'success' : 'error');
      if (variant === 'error') shake();
    }, 520);
    return () => clearTimeout(timer);
  }, [play, variant, ring, flood, mark, pop, burst, shake]);

  const outline = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - ring.value) }));
  const disc = useAnimatedStyle(() => ({
    opacity: Math.min(1, flood.value * 1.5),
    transform: [{ scale: interpolate(flood.value, [0, 1], [0.2, 1]) }],
  }));
  const whole = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, shakeStyle, style]} accessibilityRole="image" accessibilityLabel={variant === 'success' ? 'Success' : 'Error'}>
      {variant === 'success'
        ? // Anchored to a full-size layer: Android does not draw the children of a zero-size view.
          Array.from({ length: SPARKS }, (_, i) => (
            <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Spark index={i} burst={burst} size={size} color={tint} />
            </View>
          ))
        : null}
      <Animated.View style={[StyleSheet.absoluteFill, styles.centre, whole]}>
        <Svg width={size} height={size} style={styles.rotate}>
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={tint}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={[circumference, circumference]}
            animatedProps={outline}
          />
        </Svg>
        <Animated.View style={[styles.disc, { width: size - 6, height: size - 6, borderRadius: size / 2, backgroundColor: tint }, disc]} />
        {variant === 'success' ? (
          <DrawnCheck progress={mark} size={size * 0.52} color={c.onStatus} strokeWidth={2.6} />
        ) : (
          <DrawnCross progress={mark} size={size * 0.46} color={c.onStatus} strokeWidth={2.6} />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  rotate: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  disc: { position: 'absolute' },
  spark: { position: 'absolute', height: 3, borderRadius: 1.5 },
});
