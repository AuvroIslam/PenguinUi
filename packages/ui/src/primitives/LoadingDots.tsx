import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { easings } from '../motion/tokens';

function Dot({ index, color, size }: { index: number; color: string; size: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      index * 120,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: easings.inOut }),
          withTiming(0, { duration: 320, easing: easings.inOut }),
          withTiming(0, { duration: 240 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(t);
  }, [index, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + t.value * 0.65,
    transform: [{ translateY: -t.value * size * 0.55 }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

/** Three dots that rise in a wave. The shared "working" indicator for buttons and inline states. */
export function LoadingDots({ color, size = 5 }: { color: string; size?: number }) {
  return (
    <View style={[styles.row, { gap: size * 0.8 }]}>
      <Dot index={0} color={color} size={size} />
      <Dot index={1} color={color} size={size} />
      <Dot index={2} color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
