import { Children, isValidElement, useEffect, useRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import { springs } from '../../motion/tokens';

export type StaggerPreset = 'rise' | 'scale' | 'fade' | 'slide';

export type StaggerListProps = {
  /** Each child needs a stable `key`, so additions and removals animate the right row. */
  children: ReactNode;
  preset?: StaggerPreset;
  /** Milliseconds between one child's entrance and the next on first mount. */
  interval?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

const reflow = LinearTransition.springify()
  .mass(springs.smooth.mass)
  .stiffness(springs.smooth.stiffness)
  .damping(springs.smooth.damping);

function entering(preset: StaggerPreset, delay: number) {
  const s = springs.gentle;
  switch (preset) {
    case 'scale':
      return ZoomIn.delay(delay).springify().mass(springs.bouncy.mass).stiffness(springs.bouncy.stiffness).damping(springs.bouncy.damping);
    case 'fade':
      return FadeIn.delay(delay).duration(420);
    case 'slide':
      return FadeInRight.delay(delay).springify().mass(s.mass).stiffness(s.stiffness).damping(s.damping);
    default:
      return FadeInDown.delay(delay).springify().mass(s.mass).stiffness(s.stiffness).damping(s.damping);
  }
}

function exiting(preset: StaggerPreset) {
  if (preset === 'scale') return ZoomOut.duration(180);
  if (preset === 'slide') return FadeOutLeft.duration(200);
  return FadeOut.duration(160);
}

/**
 * A group that arrives in order. On first mount each child enters a beat after the one
 * before, using one of four presets. After that the list keeps moving like one surface: a
 * new child enters on its own, a removed one leaves, and every other child slides to its
 * new place on a spring instead of jumping.
 */
export function StaggerList({ children, preset = 'rise', interval = 55, gap = 10, style }: StaggerListProps) {
  // Only the first render staggers. Later additions should arrive at once.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const initial = !mounted.current;

  const items = Children.toArray(children).filter(isValidElement);

  return (
    <View style={[{ gap }, style]}>
      {items.map((child, i) => (
        <Animated.View
          key={child.key ?? i}
          entering={entering(preset, initial ? i * interval : 0)}
          exiting={exiting(preset)}
          layout={reflow}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
}
