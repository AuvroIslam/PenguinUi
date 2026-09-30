import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

const SHAKE = [-9, 8, -6, 5, -3, 0];

/**
 * A horizontal shake for rejecting input. Spread `style` onto an animated view and call
 * `shake` when the value is refused.
 */
export function useShake() {
  const x = useSharedValue(0);

  const shake = useCallback(() => {
    x.value = withSequence(...SHAKE.map((v) => withTiming(v, { duration: 56 })));
  }, [x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return { shake, style };
}
