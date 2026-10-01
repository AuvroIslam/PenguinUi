import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

export type BannerProps = {
  open: boolean;
  onDismiss: () => void;
  title: string;
  description?: string;
  tone?: BannerTone;
  /** A button on the right, such as Undo or Retry. */
  action?: ReactNode;
  /** Milliseconds before it leaves on its own. `Infinity` keeps it until dismissed. */
  duration?: number;
  /** Distance from the top of the screen, such as the status bar inset. */
  top?: number;
};

const ICONS: Record<BannerTone, GlyphName> = { info: 'info', success: 'check', warning: 'alert', danger: 'alert' };

/**
 * An alert that drops from the top edge. A thin line along its bottom shrinks toward the
 * moment it will leave, so the time left is visible rather than guessed. Touching the
 * banner holds the line still; letting go resumes it. Flick it up to send it away early.
 */
export function Banner({
  open,
  onDismiss,
  title,
  description,
  tone = 'info',
  action,
  duration = 5000,
  top = 0,
}: BannerProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [mounted, setMounted] = useState(open);
  const [height, setHeight] = useState(120);

  const y = useSharedValue(-200);
  const drag = useSharedValue(0);
  const timeLeft = useSharedValue(1);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const dismiss = () => dismissRef.current();

  const tint = tone === 'success' ? c.success : tone === 'warning' ? c.warning : tone === 'danger' ? c.danger : c.accent;
  const soft = tone === 'success' ? c.successSoft : tone === 'warning' ? c.warningSoft : tone === 'danger' ? c.dangerSoft : c.accentSoft;

  const runTimer = () => {
    'worklet';
    if (duration === Infinity) return;
    timeLeft.value = withTiming(0, { duration: duration * timeLeft.value, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(dismiss);
    });
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      drag.value = 0;
      timeLeft.value = 1;
      y.value = -height - top;
      y.value = withSpring(0, springs.bouncy);
      haptic(tone === 'danger' ? 'error' : tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'light');
      runTimer();
    } else if (mounted) {
      cancelAnimation(timeLeft);
      y.value = withTiming(-height - top - 20, { duration: 220 }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      cancelAnimation(timeLeft);
    })
    .onUpdate((e) => {
      drag.value = e.translationY < 0 ? e.translationY : e.translationY * 0.2;
    })
    .onFinalize((e) => {
      if (drag.value < -36 || e.velocityY < -500) {
        scheduleOnRN(dismiss);
        return;
      }
      drag.value = withSpring(0, springs.bouncy);
      runTimer();
    });

  const banner = useAnimatedStyle(() => ({ transform: [{ translateY: y.value + drag.value }] }));
  const line = useAnimatedStyle(() => ({ transform: [{ scaleX: timeLeft.value }] }));

  if (!mounted) return null;

  return (
    <Portal>
      <View style={fill} pointerEvents="box-none">
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityRole="alert"
            onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
            style={[
              styles.banner,
              {
                top: top + 8,
                backgroundColor: c.surfaceRaised,
                borderColor: c.border,
                borderRadius: theme.radii.lg,
                boxShadow: theme.shadows.lg,
              },
              banner,
            ]}
          >
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: soft }]}>
                <Glyph name={ICONS[tone]} size={18} color={tint} strokeWidth={2.2} />
              </View>
              <View style={styles.text}>
                <Text variant="label">{title}</Text>
                {description ? (
                  <Text variant="caption" tone="muted">
                    {description}
                  </Text>
                ) : null}
              </View>
              {action}
            </View>
            {duration !== Infinity ? (
              <View style={[styles.track, { backgroundColor: c.border }]}>
                <Animated.View style={[styles.line, { backgroundColor: tint }, line]} />
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', left: 12, right: 12, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  track: { height: 3 },
  line: { ...fill, transformOrigin: 'left center' },
});
