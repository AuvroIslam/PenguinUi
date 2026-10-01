import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';

export type TiltCardProps = {
  children: ReactNode;
  /** Largest tilt on each axis, in degrees. */
  maxTilt?: number;
  /** Show the moving glare. */
  glare?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * A card that leans toward the finger, as if pressed down at that point. It tilts up to
 * `maxTilt` on each axis under perspective, lifts slightly, and a soft glare slides across
 * the surface to where the light would catch it. Letting go releases it on a wobbly spring,
 * so it rocks back to flat rather than snapping.
 */
export function TiltCard({ children, maxTilt = 10, glare = true, radius = 24, style }: TiltCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Finger position from -1 to 1 on each axis, 0 at the centre.
  const nx = useSharedValue(0);
  const ny = useSharedValue(0);
  const press = useSharedValue(0);

  const track = (x: number, y: number) => {
    'worklet';
    nx.value = clamp((x / Math.max(1, size.width)) * 2 - 1, -1, 1);
    ny.value = clamp((y / Math.max(1, size.height)) * 2 - 1, -1, 1);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      press.value = withSpring(1, springs.snappy);
      // Ease into the first position instead of jumping to it.
      const x = clamp((e.x / Math.max(1, size.width)) * 2 - 1, -1, 1);
      const y = clamp((e.y / Math.max(1, size.height)) * 2 - 1, -1, 1);
      nx.value = withSpring(x, springs.snappy);
      ny.value = withSpring(y, springs.snappy);
    })
    .onUpdate((e) => {
      track(e.x, e.y);
    })
    .onFinalize(() => {
      press.value = withSpring(0, springs.wobbly);
      nx.value = withSpring(0, springs.wobbly);
      ny.value = withSpring(0, springs.wobbly);
    });

  const card = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      // Pressing a point pushes that point away: the near edge dips.
      { rotateX: `${ny.value * maxTilt}deg` },
      { rotateY: `${-nx.value * maxTilt}deg` },
      { scale: 1 + press.value * 0.025 },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(e: LayoutChangeEvent) =>
          setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
        }
        style={[
          styles.card,
          { borderRadius: radius, backgroundColor: c.surface, borderColor: c.border, boxShadow: theme.shadows.lg },
          card,
          style,
        ]}
      >
        {children}
        {glare && size.width > 0 ? (
          <Glare id={id} width={size.width} height={size.height} nx={nx} ny={ny} press={press} radius={radius} />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

function Glare({
  id,
  width,
  height,
  nx,
  ny,
  press,
  radius,
}: {
  id: string;
  width: number;
  height: number;
  nx: SharedValue<number>;
  ny: SharedValue<number>;
  press: SharedValue<number>;
  radius: number;
}) {
  const span = Math.max(width, height) * 1.4;
  // The glare sits on the side that has tilted up toward the light, which is the side
  // away from the finger.
  const props = useAnimatedProps(() => ({
    x: width / 2 - span / 2 - nx.value * width * 0.45,
    y: height / 2 - span / 2 - ny.value * height * 0.45,
    opacity: press.value * 0.55,
  }));
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#fff" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <AnimatedRect width={span} height={span} fill={`url(#${id})`} animatedProps={props} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
});
