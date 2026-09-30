import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle } from '../../theme/tokens';
import { luminance, mix } from '../../utils/color';

export type PopButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  tone?: 'accent' | 'primary';
  /** Face colour. Overrides `tone`; the edge and label colours are derived from it. */
  color?: string;
  /** How far the face sits above its base, in points. */
  depth?: number;
  leading?: ReactNode;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 50;

/**
 * A button with physical depth. The face rides above a darker base and pressing drives it
 * down into the base, so the press is a change in height rather than in size.
 */
export function PopButton({
  children,
  tone = 'accent',
  color,
  depth = 5,
  leading,
  block = false,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PopButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const face = color ?? (tone === 'accent' ? c.accent : c.primary);
  const dark = luminance(face) < 0.08;
  // A near-black face has nowhere darker to go, so its edge is lifted instead.
  const edge = dark ? mix(face, '#FFFFFF', 0.26) : mix(face, '#000000', 0.3);
  const on = color
    ? luminance(face) > 0.4
      ? '#0B0B0D'
      : '#FAFAFA'
    : tone === 'accent'
      ? c.onAccent
      : c.onPrimary;

  const press = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(press.value, [0, 1], [0, depth - 1]) }],
  }));

  const down = (event: GestureResponderEvent) => {
    press.value = withSpring(1, springs.press);
    haptic('rigid');
    onPressIn?.(event);
  };
  const up = (event: GestureResponderEvent) => {
    press.value = withSpring(0, springs.bouncy);
    onPressOut?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={down}
      onPressOut={up}
      style={[
        { height: HEIGHT + depth, alignSelf: block ? 'stretch' : 'flex-start', opacity: disabled ? 0.45 : 1 },
        style,
      ]}
      {...rest}
    >
      <View style={[styles.edge, { top: depth, backgroundColor: edge }]} />
      <Animated.View
        style={[
          styles.face,
          { backgroundColor: face, boxShadow: `inset 0 1px 0 rgba(255, 255, 255, ${dark ? 0.12 : 0.28})` },
          faceStyle,
        ]}
      >
        {leading}
        {typeof children === 'string' ? (
          <RNText numberOfLines={1} style={[typeStyle(theme, 'label'), { color: on }]}>
            {children}
          </RNText>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, height: HEIGHT, borderRadius: 16 },
  face: {
    height: HEIGHT,
    paddingHorizontal: 26,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
