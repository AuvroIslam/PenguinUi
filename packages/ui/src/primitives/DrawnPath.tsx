import Animated, {
  useAnimatedProps,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type DrawnStrokeProps = {
  d: string;
  /** Length of the path in viewBox units. A little over is fine; under leaves the end undrawn. */
  length: number;
  /** 0 is nothing drawn, 1 is the whole path. */
  progress: SharedValue<number>;
  color: string;
  strokeWidth?: number;
};

/** A single stroke that draws itself. Must be rendered inside an `Svg`. */
export function DrawnStroke({ d, length, progress, color, strokeWidth = 2 }: DrawnStrokeProps) {
  const animated = useAnimatedProps(() => {
    const p = progress.value < 0 ? 0 : progress.value > 1 ? 1 : progress.value;
    return {
      strokeDashoffset: length * (1 - p),
      // A round cap on a zero-length dash still paints a dot, so hide the stroke until it starts.
      strokeOpacity: p > 0.001 ? 1 : 0,
    };
  });

  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={[length, length]}
      animatedProps={animated}
    />
  );
}

type MarkProps = {
  progress: SharedValue<number>;
  size?: number;
  color: string;
  strokeWidth?: number;
};

const CHECK = 'M5 12.5l4.5 4.5L19 7.5';
const CHECK_LENGTH = 19.6;

/** A check that draws itself from its short stroke into its long one. */
export function DrawnCheck({ progress, size = 20, color, strokeWidth = 2 }: MarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <DrawnStroke d={CHECK} length={CHECK_LENGTH} progress={progress} color={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

const SLASH = 'M7 7l10 10';
const BACKSLASH = 'M17 7L7 17';
const SLASH_LENGTH = 14.3;

/** A cross drawn as two strokes, one after the other. */
export function DrawnCross({ progress, size = 20, color, strokeWidth = 2 }: MarkProps) {
  const first = useDerivedValue(() => progress.value * 2);
  const second = useDerivedValue(() => progress.value * 2 - 1);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <DrawnStroke d={SLASH} length={SLASH_LENGTH} progress={first} color={color} strokeWidth={strokeWidth} />
      <DrawnStroke d={BACKSLASH} length={SLASH_LENGTH} progress={second} color={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
