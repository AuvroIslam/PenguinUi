import { isValidElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { durations, easings, springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { LoadingDots } from '../../primitives/LoadingDots';
import { PressableScale, type PressableScaleProps } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor, typeStyle, type Theme } from '../../theme/tokens';
import { withAlpha } from '../../utils/color';
import { fill } from '../../utils/layout';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableScaleProps, 'children' | 'pressed'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label. */
  leading?: ReactNode;
  /** Icon after the label, set in its own nested circle. A glyph name or any node. */
  trailing?: GlyphName | ReactNode;
  /** Replaces the label with a working indicator and blocks presses. Width is preserved. */
  loading?: boolean;
  /** Stretch to the width of the container. */
  block?: boolean;
};

const metrics = {
  sm: { height: 36, padding: 14, gap: 6, glyph: 14 },
  md: { height: 46, padding: 20, gap: 8, glyph: 16 },
  lg: { height: 54, padding: 24, gap: 10, glyph: 18 },
} as const;

function palette(theme: Theme, variant: ButtonVariant) {
  const c = theme.colors;
  switch (variant) {
    case 'secondary':
      return { bg: c.surfaceSunken, fg: c.text, border: c.border, chip: c.surface };
    case 'outline':
      return { bg: 'transparent', fg: c.text, border: c.borderStrong, chip: c.surfaceSunken };
    case 'ghost':
      return { bg: 'transparent', fg: c.text, border: 'transparent', chip: c.surfaceSunken };
    case 'accent':
      return { bg: c.accent, fg: c.onAccent, border: 'transparent', chip: withAlpha(c.onAccent, 0.12) };
    case 'danger':
      return { bg: c.danger, fg: c.onStatus, border: 'transparent', chip: withAlpha(c.onStatus, 0.18) };
    default:
      return { bg: c.primary, fg: c.onPrimary, border: 'transparent', chip: withAlpha(c.onPrimary, 0.14) };
  }
}

/**
 * Pill button. The trailing icon sits in its own circle and lags the press on a looser
 * spring, so the button has movement inside it as well as of it.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  leading,
  trailing,
  loading = false,
  block = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const m = metrics[size];
  const colors = palette(theme, variant);
  const pressed = useSharedValue(0);

  // Follows the press on a looser spring: it arrives after the button and overshoots.
  const lag = useDerivedValue(() => withSpring(pressed.value, springs.wobbly));
  const busy = useDerivedValue(() =>
    withTiming(loading ? 1 : 0, { duration: durations.base, easing: easings.fluid }),
  );

  const chipStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(lag.value, [0, 1], [0, 3]) },
      { scale: interpolate(lag.value, [0, 1], [1, 1.06]) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - busy.value,
    transform: [{ translateY: -6 * busy.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: busy.value,
    transform: [{ translateY: 6 * (1 - busy.value) }],
  }));

  const chipSize = m.height - 12;
  const hasTrailing = trailing != null && trailing !== false;

  return (
    <PressableScale
      pressed={pressed}
      disabled={disabled || loading}
      disabledOpacity={loading && !disabled ? 1 : undefined}
      accessibilityState={{ disabled: !!disabled, busy: loading }}
      style={[
        styles.base,
        {
          height: m.height,
          paddingLeft: m.padding,
          paddingRight: hasTrailing ? 6 : m.padding,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          alignSelf: block ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...rest}
    >
      <Animated.View style={[styles.content, { gap: m.gap }, contentStyle]}>
        {leading}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Animated.Text
            numberOfLines={1}
            style={[
              typeStyle(theme, size === 'sm' ? 'caption' : 'label'),
              fontFor(theme, 'medium'),
              { color: colors.fg },
            ]}
          >
            {children}
          </Animated.Text>
        ) : (
          children
        )}
        {hasTrailing ? (
          <Animated.View
            style={[
              styles.chip,
              { width: chipSize, height: chipSize, backgroundColor: colors.chip, marginLeft: 4 },
              chipStyle,
            ]}
          >
            {typeof trailing === 'string' ? (
              <Glyph name={trailing as GlyphName} size={m.glyph} color={colors.fg} />
            ) : isValidElement(trailing) ? (
              trailing
            ) : null}
          </Animated.View>
        ) : null}
      </Animated.View>

      {loading ? (
        <Animated.View style={[styles.dots, dotsStyle]}>
          <LoadingDots color={colors.fg} />
        </Animated.View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});
