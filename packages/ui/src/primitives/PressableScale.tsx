import { forwardRef, type ComponentProps } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { haptic, type HapticKind } from '../motion/haptics';
import { springs } from '../motion/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  /** Scale while pressed. */
  scaleTo?: number;
  /** Opacity while pressed. */
  dimTo?: number;
  /** Haptic on press-in. `false` for none. */
  haptic?: HapticKind | false;
  /**
   * Press progress, 0 at rest and 1 when pressed. Pass your own shared value to drive
   * other animations from the same press.
   */
  pressed?: SharedValue<number>;
  /** Opacity when disabled. Set to 1 for a control that is disabled because it is busy. */
  disabledOpacity?: number;
  /** A Reanimated layout transition, for a control whose size changes with its content. */
  layout?: ComponentProps<typeof Animated.View>['layout'];
  /** Static or animated styles. */
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
};

/**
 * The press primitive. Goes down on an overdamped spring so it responds before the finger
 * has settled, and comes back with one overshoot.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  {
    scaleTo = 0.97,
    dimTo = 1,
    haptic: hapticKind = 'light',
    pressed: external,
    disabledOpacity = 0.45,
    disabled,
    onPressIn,
    onPressOut,
    style,
    children,
    ...rest
  },
  ref,
) {
  const internal = useSharedValue(0);
  const pressed = external ?? internal;
  // Folded into the animated style so a release spring that is still running
  // cannot write full opacity back over the disabled state.
  const resting = disabled ? disabledOpacity : 1;

  const animated = useAnimatedStyle(() => ({
    opacity: resting * interpolate(pressed.value, [0, 1], [1, dimTo]),
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, scaleTo]) }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    pressed.value = withSpring(1, springs.press);
    if (hapticKind) haptic(hapticKind);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    pressed.value = withSpring(0, springs.bouncy);
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animated]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});
