import { useEffect, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
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
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type BorderBeamProps = {
  children?: ReactNode;
  /** Corner radius of the border the beam follows. */
  radius?: number;
  color?: string;
  /** Milliseconds per lap. */
  duration?: number;
  /** Length of the bright head, as a share of the perimeter. */
  length?: number;
  /** Set false to stop the beam and fade it out. */
  active?: boolean;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Layer = { share: number; opacity: number };
// Three dashes of rising strength sharing one leading edge, so the trail is faint behind and
// bright at the head, reading as one comet.
const LAYERS: Layer[] = [
  { share: 1, opacity: 0.22 },
  { share: 0.55, opacity: 0.5 },
  { share: 0.22, opacity: 1 },
];

function Dash({
  phase,
  visible,
  perimeter,
  length,
  layer,
  rect,
  color,
  strokeWidth,
}: {
  phase: SharedValue<number>;
  visible: SharedValue<number>;
  perimeter: number;
  length: number;
  layer: Layer;
  rect: { x: number; y: number; w: number; h: number; r: number };
  color: string;
  strokeWidth: number;
}) {
  const dash = perimeter * length * layer.share;
  const animated = useAnimatedProps(() => ({
    // Each shorter dash is pushed forward by the length it lacks, so all of them end at the
    // same head point and the brightest light leads.
    strokeDashoffset: -(phase.value * perimeter) - perimeter * length * (1 - layer.share),
    strokeOpacity: visible.value * layer.opacity,
  }));
  return (
    <AnimatedRect
      x={rect.x}
      y={rect.y}
      width={rect.w}
      height={rect.h}
      rx={rect.r}
      ry={rect.r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={[dash, perimeter]}
      animatedProps={animated}
    />
  );
}

/**
 * A comet of light that travels around a rounded border. It is three dashes of rising
 * strength moving together, so the head is bright and the tail fades behind it, and it
 * follows the corners exactly because it runs along the real outline. Turning it off fades
 * it rather than stopping it dead. With reduced motion it rests as a faint static outline.
 */
export function BorderBeam({
  children,
  radius = 20,
  color,
  duration = 2600,
  length = 0.24,
  active = true,
  strokeWidth = 2,
  style,
}: BorderBeamProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.accent;
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const phase = useSharedValue(0);
  const visible = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    visible.value = withTiming(active ? 1 : 0, { duration: 300 });
    if (active && !reduced) {
      phase.value = 0;
      phase.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1);
    } else {
      cancelAnimation(phase);
    }
  }, [active, duration, reduced, phase, visible]);

  const inset = strokeWidth / 2;
  const w = Math.max(0, size.width - strokeWidth);
  const h = Math.max(0, size.height - strokeWidth);
  const r = Math.max(0, Math.min(radius - inset, h / 2, w / 2));
  const perimeter = 2 * (w + h - 4 * r) + 2 * Math.PI * r;
  const rect = { x: inset, y: inset, w, h, r };

  return (
    <View style={[{ borderRadius: radius }, style]} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}>
      {children}
      {size.width > 0 ? (
        <View style={fill} pointerEvents="none">
          <Svg width={size.width} height={size.height}>
            {reduced ? (
              <Rect x={inset} y={inset} width={w} height={h} rx={r} ry={r} fill="none" stroke={tint} strokeOpacity={active ? 0.4 : 0} strokeWidth={strokeWidth} />
            ) : (
              LAYERS.map((layer, i) => (
                <Dash key={i} phase={phase} visible={visible} perimeter={perimeter} length={length} layer={layer} rect={rect} color={tint} strokeWidth={strokeWidth} />
              ))
            )}
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

