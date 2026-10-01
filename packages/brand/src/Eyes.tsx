import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { Circle, Ellipse } from 'react-native-svg';

import { palette as p } from './palette';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type EyeSpec = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** The big catch-light, relative to the eye's centre. */
  glint: [number, number, number];
  /** An optional second, smaller catch-light. */
  spark?: [number, number, number];
};

type Live = {
  /** 1 open, 0.1 shut. */
  blink: SharedValue<number>;
  /** -1 to 1 each. Moves the pupil inside the eye. */
  lookX?: SharedValue<number>;
  lookY?: SharedValue<number>;
  /** 0 to 1. Widens the eye. */
  surprise?: SharedValue<number>;
  /** 0 to 1. Hides the eye, for faces that swap in another expression. */
  hidden?: SharedValue<number>;
};

/**
 * One eye, animated through its own SVG attributes rather than by transforming a layer. A
 * transformed layer is rasterised once and stretched, which on the web can smear a blink
 * into a tall bar; changing the shape's radius redraws it crisply at every frame.
 */
export function Eye({ spec, blink, lookX, lookY, surprise, hidden, stroke }: { spec: EyeSpec; stroke?: string } & Live) {
  const ball = useAnimatedProps(() => {
    const s = surprise ? surprise.value : 0;
    const h = hidden ? hidden.value : 0;
    return {
      cx: spec.cx + (lookX ? lookX.value * 4 : 0),
      cy: spec.cy + (lookY ? lookY.value * 3 : 0),
      rx: spec.rx * (1 + s * 0.12),
      ry: Math.max(0.01, spec.ry * blink.value * (1 + s * 0.18)),
      opacity: 1 - h,
    };
  });
  const glint = useAnimatedProps(() => {
    const h = hidden ? hidden.value : 0;
    return {
      cx: spec.cx + spec.glint[0] + (lookX ? lookX.value * 4 : 0),
      cy: spec.cy + spec.glint[1] * blink.value + (lookY ? lookY.value * 3 : 0),
      // Catch-lights vanish as the lid comes down, rather than squashing.
      opacity: Math.max(0, (blink.value - 0.5) * 2) * (1 - h),
    };
  });
  const spark = useAnimatedProps(() => {
    const h = hidden ? hidden.value : 0;
    const sp = spec.spark ?? [0, 0, 0];
    return {
      cx: spec.cx + sp[0] + (lookX ? lookX.value * 4 : 0),
      cy: spec.cy + sp[1] * blink.value + (lookY ? lookY.value * 3 : 0),
      opacity: Math.max(0, (blink.value - 0.5) * 2) * (1 - h),
    };
  });

  return (
    <>
      <AnimatedEllipse animatedProps={ball} fill={p.ink} stroke={stroke} strokeWidth={stroke ? 1 : 0} />
      <AnimatedCircle animatedProps={glint} r={spec.glint[2]} fill={p.white} />
      {spec.spark ? <AnimatedCircle animatedProps={spark} r={spec.spark[2]} fill={p.white} /> : null}
    </>
  );
}
