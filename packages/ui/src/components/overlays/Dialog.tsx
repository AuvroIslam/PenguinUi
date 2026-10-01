import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Buttons along the bottom, usually a cancel and a confirm. */
  actions?: ReactNode;
  /** Other content between the description and the actions. */
  children?: ReactNode;
  /**
   * When false, tapping outside does not close the dialog. It pulses instead, the way a
   * system alert refuses, so the tap is acknowledged rather than ignored.
   */
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A centred dialog. It arrives from slightly below and slightly small on a bouncy spring, and
 * leaves faster than it came, because a dismissal should never make you wait. A dialog that
 * cannot be dismissed from outside answers a tap on the backdrop with a small pulse.
 */
export function Dialog({ open, onClose, title, description, actions, children, dismissible = true, style }: DialogProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [mounted, setMounted] = useState(open);
  const shown = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (open) {
      setMounted(true);
      shown.value = withSpring(1, springs.bouncy);
    } else if (mounted) {
      shown.value = withTiming(0, { duration: 150 }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const outside = () => {
    if (dismissible) {
      onClose();
      return;
    }
    haptic('warning');
    pulse.value = withSequence(withTiming(1.035, { duration: 90 }), withSpring(1, springs.bouncy));
  };

  const backdrop = useAnimatedStyle(() => ({ opacity: Math.min(1, shown.value) }));
  const panel = useAnimatedStyle(() => ({
    opacity: Math.min(1, shown.value * 1.5),
    transform: [
      { translateY: interpolate(shown.value, [0, 1], [12, 0]) },
      { scale: interpolate(shown.value, [0, 1], [0.92, 1]) * pulse.value },
    ],
  }));

  if (!mounted) return null;

  return (
    <Portal>
      <View style={[fill, styles.centre]} pointerEvents="box-none">
        <Animated.View style={[fill, { backgroundColor: c.scrim }, backdrop]} onTouchEnd={outside} />
        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.panel,
            {
              backgroundColor: c.surfaceRaised,
              borderColor: c.border,
              borderRadius: theme.radii.xl,
              boxShadow: theme.shadows.lg,
            },
            panel,
            style,
          ]}
        >
          <View style={styles.text}>
            <Text variant="heading">{title}</Text>
            {description ? (
              <Text variant="body" tone="muted">
                {description}
              </Text>
            ) : null}
          </View>
          {children}
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </Animated.View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  panel: { alignSelf: 'stretch', maxWidth: 420, padding: 22, gap: 18, borderWidth: StyleSheet.hairlineWidth },
  text: { gap: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});
