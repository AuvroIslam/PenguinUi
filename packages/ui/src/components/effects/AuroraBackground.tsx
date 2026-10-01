import { useEffect, useId, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type AuroraBackgroundProps = {
  children?: ReactNode;
  /** Colours of the drifting light. Three or four work best. */
  colors?: string[];
  /** Base colour under the light. */
  base?: string;
  /** Milliseconds for the slowest blob's loop. Others run at unrelated fractions of it. */
  period?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Each blob loops along its own Lissajous path. The ratios are chosen so the loops never
// line up, which is what keeps the field from looking like it repeats.
const PATHS = [
  { cx: 0.25, cy: 0.3, ax: 0.22, ay: 0.16, fx: 1, fy: 1.31, r: 0.62, phase: 0 },
  { cx: 0.75, cy: 0.35, ax: 0.2, ay: 0.22, fx: 0.77, fy: 1.13, r: 0.56, phase: 1.7 },
  { cx: 0.5, cy: 0.75, ax: 0.28, ay: 0.14, fx: 1.19, fy: 0.83, r: 0.66, phase: 3.1 },
  { cx: 0.15, cy: 0.8, ax: 0.18, ay: 0.2, fx: 0.91, fy: 1.47, r: 0.5, phase: 4.4 },
];

function Blob({
  clock,
  index,
  width,
  height,
  gradient,
}: {
  clock: SharedValue<number>;
  index: number;
  width: number;
  height: number;
  gradient: string;
}) {
  const p = PATHS[index % PATHS.length];
  const span = Math.max(width, height);
  const props = useAnimatedProps(() => {
    const a = clock.value * Math.PI * 2;
    return {
      cx: (p.cx + Math.sin(a * p.fx + p.phase) * p.ax) * width,
      cy: (p.cy + Math.cos(a * p.fy + p.phase) * p.ay) * height,
      // The blobs breathe a little as they drift.
      r: span * p.r * (0.92 + Math.sin(a * 2 + p.phase) * 0.08),
    };
  });
  return <AnimatedCircle fill={`url(#${gradient})`} animatedProps={props} />;
}

/**
 * A slow field of colour for a hero or a lock screen. Soft blobs of light drift on long,
 * unrelated loops and breathe as they go, blending where they overlap, so the field keeps
 * changing without ever visibly repeating. Edges are soft because each blob is a radial
 * gradient, not a blurred shape, which costs nothing per frame. Under reduced motion the
 * field is drawn once and stays still.
 */
export function AuroraBackground({
  children,
  colors: palette,
  base,
  period = 24000,
  style,
}: AuroraBackgroundProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const clock = useSharedValue(0.13);

  const tints = palette ?? (theme.dark ? ['#FF6B35', '#7C3AED', '#0EA5E9', '#DB2777'] : ['#FDBA74', '#C4B5FD', '#7DD3FC', '#F9A8D4']);
  const ground = base ?? (theme.dark ? '#08080A' : '#FFF8F2');

  useEffect(() => {
    if (reduced) return;
    clock.value = withRepeat(withTiming(clock.value + 1, { duration: period, easing: Easing.linear }), -1);
    return () => cancelAnimation(clock);
  }, [reduced, period, clock]);

  return (
    <View
      style={[styles.wrap, { backgroundColor: ground }, style]}
      onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}
    >
      {size.width > 0 ? (
        <View style={fill} pointerEvents="none">
          <Svg width={size.width} height={size.height}>
            <Defs>
              {tints.map((t, i) => (
                <RadialGradient key={i} id={`${id}${i}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={t} stopOpacity={theme.dark ? 0.55 : 0.75} />
                  <Stop offset="0.45" stopColor={t} stopOpacity={theme.dark ? 0.22 : 0.32} />
                  <Stop offset="1" stopColor={t} stopOpacity={0} />
                </RadialGradient>
              ))}
            </Defs>
            {tints.map((_, i) => (
              <Blob key={i} clock={clock} index={i} width={size.width} height={size.height} gradient={`${id}${i}`} />
            ))}
          </Svg>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});

