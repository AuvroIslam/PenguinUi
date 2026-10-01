import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import Svg from 'react-native-svg';

export type ViewBox = { w: number; h: number };

/**
 * One layer of a character: a full-size SVG with the character's viewBox, inside an animated
 * view. Characters are stacks of these, so each part (a flipper, the eyes) can move with
 * view transforms, which animate the same way on iOS, Android and the web.
 */
export function Layer({
  vb,
  children,
  style,
}: {
  vb: ViewBox;
  children: ReactNode;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
}) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${vb.w} ${vb.h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/**
 * Converts a point in viewBox units to a transform origin, so a part pivots on its joint.
 * Whole percentages only: React Native's origin parser does not read decimals, and a value
 * like `55.5%` is split into extra tokens that land in the z position.
 */
export function origin(vb: ViewBox, x: number, y: number): string {
  return `${Math.round((x / vb.w) * 100)}% ${Math.round((y / vb.h) * 100)}%`;
}
