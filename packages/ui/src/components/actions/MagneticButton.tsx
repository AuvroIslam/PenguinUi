import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle } from '../../theme/tokens';
import { clamp } from '../../utils/layout';

export type MagneticButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  /** Furthest the button travels from rest, in points. */
  range?: number;
  /** Fraction of the finger's movement the button follows. */
  pull?: number;
  variant?: 'primary' | 'secondary' | 'accent';
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A press that wanders further than this is treated as a drag and does not fire.
const SLOP = 28;

/**
 * A button that leans toward the finger. The body follows part of the drag and the label
 * follows a little more, so the label appears to float above the surface. Letting go
 * sends it home on a loose spring.
 */
export function MagneticButton({
  children,
  onPress,
  range = 14,
  pull = 0.35,
  variant = 'primary',
  accessibilityLabel,
  disabled,
  style,
}: MagneticButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const colors =
    variant === 'accent'
      ? { bg: c.accent, fg: c.onAccent, border: 'transparent' }
      : variant === 'secondary'
        ? { bg: c.surfaceSunken, fg: c.text, border: c.border }
        : { bg: c.primary, fg: c.onPrimary, border: 'transparent' };

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const press = useSharedValue(0);

  const fire = () => onPress?.();

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin(() => {
      press.value = withSpring(1, springs.press);
      scheduleOnRN(haptic, 'light');
    })
    .onChange((event) => {
      tx.value = clamp(event.translationX * pull, -range, range);
      ty.value = clamp(event.translationY * pull, -range, range);
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) < SLOP && Math.abs(event.translationY) < SLOP) {
        scheduleOnRN(fire);
      }
    })
    .onFinalize(() => {
      press.value = withSpring(0, springs.bouncy);
      tx.value = withSpring(0, springs.wobbly);
      ty.value = withSpring(0, springs.wobbly);
    });

  const body = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: interpolate(press.value, [0, 1], [1, 0.97]) },
    ],
  }));

  // The label travels further than the body it sits on, which reads as depth.
  const label = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value * 0.45 }, { translateY: ty.value * 0.45 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={fire}
        style={[
          styles.base,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            opacity: disabled ? 0.45 : 1,
          },
          style,
          body,
        ]}
      >
        <Animated.View style={[styles.content, label]}>
          {typeof children === 'string' ? (
            <Animated.Text numberOfLines={1} style={[typeStyle(theme, 'label'), { color: colors.fg }]}>
              {children}
            </Animated.Text>
          ) : (
            children
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    paddingHorizontal: 30,
    borderRadius: 27,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
