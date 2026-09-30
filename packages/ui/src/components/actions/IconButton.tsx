import { type ReactNode } from 'react';
import { StyleSheet, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { easings } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { PressableScale, type PressableScaleProps } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import type { Theme } from '../../theme/tokens';
import { fill } from '../../utils/layout';

export type IconButtonVariant = 'filled' | 'tonal' | 'outline' | 'ghost';

export type IconButtonProps = Omit<PressableScaleProps, 'children'> & {
  /** A glyph name or any node. */
  icon: GlyphName | ReactNode;
  /** Read by screen readers. An icon on its own says nothing. */
  label: string;
  /** Diameter. */
  size?: number;
  variant?: IconButtonVariant;
};

function palette(theme: Theme, variant: IconButtonVariant) {
  const c = theme.colors;
  switch (variant) {
    case 'filled':
      return { bg: c.primary, fg: c.onPrimary, border: 'transparent' };
    case 'outline':
      return { bg: 'transparent', fg: c.text, border: c.borderStrong };
    case 'ghost':
      return { bg: 'transparent', fg: c.text, border: 'transparent' };
    default:
      return { bg: c.surfaceSunken, fg: c.text, border: c.border };
  }
}

/**
 * Circular icon button. Releasing it sends a ring out from the edge, which confirms the
 * press after the finger has already lifted and is no longer covering the button.
 */
export function IconButton({
  icon,
  label,
  size = 44,
  variant = 'tonal',
  onPress,
  style,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const colors = palette(theme, variant);
  const ring = useSharedValue(1);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - ring.value),
    transform: [{ scale: 1 + 0.5 * ring.value }],
  }));

  const handlePress = (event: GestureResponderEvent) => {
    ring.value = 0;
    ring.value = withTiming(1, { duration: 480, easing: easings.out });
    onPress?.(event);
  };

  return (
    <PressableScale
      scaleTo={0.9}
      accessibilityLabel={label}
      onPress={handlePress}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
      {...rest}
    >
      <Animated.View
        style={[styles.ring, { borderRadius: size / 2, borderColor: colors.fg }, ringStyle]}
      />
      {typeof icon === 'string' ? (
        <Glyph name={icon as GlyphName} size={Math.round(size * 0.45)} color={colors.fg} />
      ) : (
        icon
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ring: { ...fill, borderWidth: 1.5, pointerEvents: 'none' },
});
