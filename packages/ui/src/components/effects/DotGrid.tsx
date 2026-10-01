import { memo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { withAlpha } from '../../utils/color';

export type DotGridProps = {
  /** Distance between dot centres. */
  spacing?: number;
  dotSize?: number;
  /** Colour the dots light up to as the wave passes. */
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const SPEED = 0.36; // points per millisecond
const RIPPLE = 1500; // how long a ripple lives
const BAND = 46; // width of the wavefront
const HALO = 70; // reach of the finger's own glow
const RESET = { duration: 0 };
const TRAVEL = { duration: RIPPLE, easing: Easing.linear };

type DotProps = {
  x: number;
  y: number;
  size: number;
  ox: SharedValue<number>;
  oy: SharedValue<number>;
  wave: SharedValue<number>;
  fx: SharedValue<number>;
  fy: SharedValue<number>;
  hold: SharedValue<number>;
  rest: string;
  lit: string;
};

const Dot = memo(function Dot({ x, y, size, ox, oy, wave, fx, fy, hold, rest, lit }: DotProps) {
  const animated = useAnimatedStyle(() => {
    // The wavefront: a ring expanding from the last touch, strongest at its leading edge
    // and fading as it travels.
    const d = Math.hypot(x - ox.value, y - oy.value);
    const front = wave.value * RIPPLE * SPEED;
    const off = (d - front) / BAND;
    // Square root keeps the front bright for most of its travel, then lets it go quickly.
    const life = Math.sqrt(Math.max(0, 1 - wave.value));
    const ring = wave.value > 0 && wave.value < 1 ? Math.exp(-off * off) * life : 0;
    // While a finger rests, the dots around it stay lit, falling off with distance.
    const f = Math.hypot(x - fx.value, y - fy.value) / HALO;
    const halo = Math.exp(-f * f) * hold.value;
    const e = Math.min(1, Math.max(ring, halo));
    // Dots are nudged away from the source, so the wave reads as a push, not just a flash.
    const push = ring * 5;
    const nx = d > 0.001 ? (x - ox.value) / d : 0;
    const ny = d > 0.001 ? (y - oy.value) / d : 0;
    return {
      backgroundColor: interpolateColor(e, [0, 1], [rest, lit]),
      transform: [{ translateX: nx * push }, { translateY: ny * push }, { scale: 1 + e * 1.6 }],
    };
  });
  return <Animated.View style={[styles.dot, { left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2 }, animated]} />;
});

/**
 * A field of dots that answers touch. A tap sends a ripple out across the grid: each dot
 * swells and lights as the wavefront reaches it and is nudged outward, so it reads as a
 * push travelling through the field. Holding and dragging keeps a pool of light under the
 * finger that follows it, and letting go fires a ripple from where it lifted.
 */
export function DotGrid({ spacing = 22, dotSize = 4, color, height = 360, style }: DotGridProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [width, setWidth] = useState(0);

  const ox = useSharedValue(-1000);
  const oy = useSharedValue(-1000);
  const wave = useSharedValue(1);
  const fx = useSharedValue(-1000);
  const fy = useSharedValue(-1000);
  const hold = useSharedValue(0);

  const fire = (x: number, y: number) => {
    'worklet';
    ox.value = x;
    oy.value = y;
    // Restart from the centre, even if the last ripple is still travelling.
    wave.value = withSequence(withTiming(0, RESET), withTiming(1, TRAVEL));
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      fx.value = e.x;
      fy.value = e.y;
      hold.value = withSpring(1, springs.snappy);
      fire(e.x, e.y);
    })
    .onUpdate((e) => {
      fx.value = e.x;
      fy.value = e.y;
    })
    .onFinalize((e) => {
      hold.value = withTiming(0, { duration: 400 });
      if (Math.hypot(e.translationX, e.translationY) > 12) fire(e.x, e.y);
    });

  const cols = width ? Math.floor(width / spacing) : 0;
  const rows = Math.floor(height / spacing);
  const offX = width ? (width - (cols - 1) * spacing) / 2 : 0;
  const offY = (height - (rows - 1) * spacing) / 2;

  const dots = [];
  for (let r = 0; r < rows; r += 1) {
    for (let k = 0; k < cols; k += 1) {
      dots.push({ key: `${r}-${k}`, x: offX + k * spacing, y: offY + r * spacing });
    }
  }

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.field, { height }, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="image"
        accessibilityLabel="Interactive dot field"
      >
        {dots.map((d) => (
          <Dot
            key={d.key}
            x={d.x}
            y={d.y}
            size={dotSize}
            ox={ox}
            oy={oy}
            wave={wave}
            fx={fx}
            fy={fy}
            hold={hold}
            rest={withAlpha(c.textFaint, theme.dark ? 0.45 : 0.6)}
            lit={color ?? c.accent}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  field: { alignSelf: 'stretch', overflow: 'hidden' },
  dot: { position: 'absolute' },
});
