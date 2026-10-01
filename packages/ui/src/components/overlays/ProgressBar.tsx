import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';

export type ProgressBarProps = {
  /** 0 to 1. Leave out for an indeterminate bar. */
  value?: number;
  height?: number;
  tone?: 'accent' | 'primary' | 'success';
  style?: StyleProp<ViewStyle>;
};

/**
 * A linear progress bar. With a value, the fill springs to it on a heavy spring, so jumps in
 * reported progress land softly instead of snapping, and a small glint rides the leading edge
 * while it is moving. Without a value, a segment sweeps across, stretching as it accelerates
 * through the middle and shrinking as it slows at the ends.
 */
export function ProgressBar({ value, height = 6, tone = 'accent', style }: ProgressBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const color = tone === 'primary' ? c.primary : tone === 'success' ? c.success : c.accent;
  const [width, setWidth] = useState(0);
  const indeterminate = value === undefined;

  const fill = useSharedValue(0);
  const speed = useSharedValue(0);
  const t = useSharedValue(0);

  useEffect(() => {
    if (indeterminate) return;
    const target = Math.min(1, Math.max(0, value));
    speed.value = 1;
    fill.value = withSpring(target, springs.smooth, () => {
      speed.value = withTiming(0, { duration: 200 });
    });
  }, [value, indeterminate, fill, speed]);

  useEffect(() => {
    if (!indeterminate) return;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.linear }), -1);
    return () => cancelAnimation(t);
  }, [indeterminate, t]);

  const bar = useAnimatedStyle(() => {
    if (indeterminate) {
      const p = t.value;
      // Ease the head and the tail differently, so the segment stretches in the middle.
      const head = p < 0.75 ? 1 - Math.pow(1 - p / 0.75, 2) : 1;
      const tail = p > 0.25 ? Math.pow((p - 0.25) / 0.75, 2) : 0;
      const l = tail * (width + 40) - 20;
      const r = head * (width + 40) - 20;
      return { width: Math.max(height, r - l), transform: [{ translateX: l }] };
    }
    return { width: Math.max(fill.value > 0 ? height : 0, fill.value * width), transform: [{ translateX: 0 }] };
  });
  const glint = useAnimatedStyle(() => ({ opacity: indeterminate ? 0 : speed.value * 0.9 }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: Math.round((value ?? 0) * 100) }}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: c.surfaceSunken }, style]}
    >
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: color }, bar]}>
        <Animated.View style={[styles.glint, { width: height * 3, borderRadius: height / 2 }, glint]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { alignSelf: 'stretch', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  glint: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.55)' },
});
