import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

export type ArcSpinnerProps = {
  size?: number;
  color: string;
  strokeWidth?: number;
  /** Fraction of the circle the arc covers. */
  arc?: number;
  /** Milliseconds per revolution. */
  period?: number;
};

/** A rotating arc. The small, quiet spinner used inside buttons and fields. */
export function ArcSpinner({ size = 18, color, strokeWidth = 2, arc = 0.68, period = 760 }: ArcSpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(withTiming(360, { duration: period, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rotation);
  }, [rotation, period]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[circumference * arc, circumference]}
        />
      </Svg>
    </Animated.View>
  );
}
