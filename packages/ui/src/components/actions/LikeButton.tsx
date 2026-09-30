import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { easeOutCubic, easings, springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { useControllable } from '../../utils/useControllable';
import { fill } from '../../utils/layout';
import { RollingNumber } from '../text/RollingNumber';

export type LikeButtonProps = {
  liked?: boolean;
  defaultLiked?: boolean;
  onChange?: (liked: boolean) => void;
  /** Shown beside the heart. Update it yourself when `onChange` fires. */
  count?: number;
  /** Size of the heart. */
  size?: number;
  /** Colour when liked. */
  color?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const HEART =
  'M12 20.5C7 16.5 4 13.6 4 9.9 4 7.2 6.1 5.2 8.6 5.2c1.4 0 2.6.7 3.4 1.8.8-1.1 2-1.8 3.4-1.8 2.5 0 4.6 2 4.6 4.7 0 3.7-3 6.6-8 10.6z';
const PARTICLES = 7;

function Particle({
  index,
  burst,
  reach,
  color,
}: {
  index: number;
  burst: SharedValue<number>;
  reach: number;
  color: string;
}) {
  // Offset by half a step so no particle leaves straight up through the heart's notch.
  const angle = ((index + 0.5) / PARTICLES) * Math.PI * 2;
  const dot = index % 2 === 0 ? 5 : 3.5;

  const style = useAnimatedStyle(() => {
    const p = burst.value;
    const distance = reach * easeOutCubic(p);
    return {
      opacity: p <= 0 || p >= 1 ? 0 : 1,
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: 1 - p * p },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.particle, { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }, style]}
    />
  );
}

/**
 * Heart toggle. Liking squashes the heart, overshoots and settles while particles and a
 * ring leave it; unliking is deliberately quiet, a dip and nothing else.
 */
export function LikeButton({
  liked: controlled,
  defaultLiked = false,
  onChange,
  count,
  size = 26,
  color,
  accessibilityLabel = 'Like',
  style,
}: LikeButtonProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.danger;
  const [liked, setLiked] = useControllable(controlled, defaultLiked, onChange);
  const box = Math.round(size * 1.7);

  const scale = useSharedValue(1);
  const filled = useSharedValue(liked ? 1 : 0);
  const burst = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (liked) {
      scale.value = withSequence(
        withTiming(0.7, { duration: 80, easing: easings.out }),
        withTiming(1.25, { duration: 150, easing: easings.out }),
        withSpring(1, springs.bouncy),
      );
      filled.value = withTiming(1, { duration: 180, easing: easings.out });
      burst.value = 0;
      burst.value = withTiming(1, { duration: 560, easing: easings.out });
    } else {
      scale.value = withSequence(withTiming(0.85, { duration: 80 }), withSpring(1, springs.snappy));
      filled.value = withTiming(0, { duration: 160 });
    }
  }, [liked, scale, filled, burst]);

  const toggle = () => {
    haptic(liked ? 'light' : 'medium');
    setLiked(!liked);
  };

  const heart = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const solid = useAnimatedStyle(() => ({
    opacity: filled.value,
    transform: [{ scale: interpolate(filled.value, [0, 1], [0.4, 1]) }],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: burst.value <= 0 ? 0 : 0.5 * (1 - burst.value),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.5, 1.15]) }],
  }));

  return (
    <Pressable
      onPress={toggle}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: liked }}
      style={[styles.row, style]}
    >
      <View style={[styles.box, { width: box, height: box }]}>
        <Animated.View style={[styles.ring, { borderRadius: box / 2, borderColor: tint }, ring]} />
        {Array.from({ length: PARTICLES }, (_, i) => (
          <Particle
            key={i}
            index={i}
            burst={burst}
            reach={box * 0.62}
            color={i % 2 === 0 ? tint : theme.colors.accent}
          />
        ))}
        <Animated.View style={heart}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
              d={HEART}
              fill="none"
              stroke={theme.colors.textMuted}
              strokeWidth={1.75}
              strokeLinejoin="round"
            />
          </Svg>
          <Animated.View style={[fill, solid]}>
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path d={HEART} fill={tint} stroke={tint} strokeWidth={1.75} strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        </Animated.View>
      </View>
      {count !== undefined ? (
        <RollingNumber value={count} variant="label" tone={liked ? 'default' : 'muted'} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  box: { alignItems: 'center', justifyContent: 'center' },
  ring: { ...fill, borderWidth: 2 },
  particle: { position: 'absolute' },
});
