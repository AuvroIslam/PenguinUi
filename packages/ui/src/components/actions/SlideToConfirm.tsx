import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { Glyph } from '../../primitives/Glyph';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import type { Theme } from '../../theme/tokens';
import { withAlpha } from '../../utils/color';
import { clamp, fill } from '../../utils/layout';
import { TextShimmer } from '../text/TextShimmer';

export type SlideToConfirmProps = {
  /** The instruction on the track, for example "Slide to pay". */
  children: string;
  /** Shown once the slide completes. */
  confirmedLabel?: string;
  onConfirm: () => void;
  tone?: 'primary' | 'accent' | 'success';
  /** Milliseconds before the thumb returns. `false` leaves it confirmed. */
  resetAfter?: number | false;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 58;
const INSET = 5;
const THUMB = HEIGHT - INSET * 2;

function palette(theme: Theme, tone: 'primary' | 'accent' | 'success') {
  const c = theme.colors;
  if (tone === 'accent') return { solid: c.accent, on: c.onAccent, soft: c.accentSoft };
  if (tone === 'success') return { solid: c.success, on: c.onStatus, soft: c.successSoft };
  return { solid: c.primary, on: c.onPrimary, soft: withAlpha(c.primary, theme.dark ? 0.14 : 0.08) };
}

/**
 * Slide a thumb across a track to confirm. The thumb tracks the finger exactly, the track
 * fills behind it, and the instruction fades as it is obeyed. Past 85 percent it completes;
 * short of that it springs home.
 */
export function SlideToConfirm({
  children,
  confirmedLabel = 'Confirmed',
  onConfirm,
  tone = 'primary',
  resetAfter = 2000,
  disabled,
  style,
}: SlideToConfirmProps) {
  const theme = useTheme();
  const colors = palette(theme, tone);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const max = useSharedValue(0);
  const x = useSharedValue(0);
  const startX = useSharedValue(0);
  const downX = useSharedValue(0);
  const grab = useSharedValue(0);
  const check = useSharedValue(0);
  const locked = useSharedValue(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  const complete = () => {
    setDone(true);
    haptic('success');
    check.value = withDelay(60, withTiming(1, { duration: 320, easing: easings.out }));
    onConfirm();
    if (resetAfter !== false) {
      timer.current = setTimeout(() => {
        setDone(false);
        check.value = withTiming(0, { duration: 120 });
        x.value = withSpring(0, springs.smooth);
        locked.value = false;
      }, resetAfter);
    }
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin((event) => {
      if (locked.value) return;
      startX.value = x.value;
      // Measured from where the finger went down, not from where the pan was recognised, so
      // the thumb stays under the finger instead of trailing it by the touch slop.
      downX.value = event.absoluteX;
      grab.value = withSpring(1, springs.press);
      scheduleOnRN(haptic, 'light');
    })
    .onChange((event) => {
      if (locked.value) return;
      x.value = clamp(startX.value + event.absoluteX - downX.value, 0, max.value);
    })
    .onFinalize((event) => {
      grab.value = withSpring(0, springs.bouncy);
      if (locked.value) return;
      const far = x.value > max.value * 0.85;
      const flung = event.velocityX > 900 && x.value > max.value * 0.45;
      if (max.value > 0 && (far || flung)) {
        locked.value = true;
        x.value = withSpring(max.value, springs.snappy);
        scheduleOnRN(complete);
      } else {
        // No overshoot on the way home: the thumb would cross the end of the track and be clipped.
        x.value = withSpring(0, springs.snappy);
      }
    });

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scale: interpolate(grab.value, [0, 1], [1, 1.06]) }],
  }));

  // A full-size pill slid left by the distance still to travel: its rounded right end stays
  // wrapped around the thumb without animating a width.
  const trail = useAnimatedStyle(() => ({
    opacity: max.value > 0 ? 1 : 0,
    transform: [{ translateX: x.value - max.value }],
  }));

  const hint = useAnimatedStyle(() => {
    const p = max.value > 0 ? x.value / max.value : 0;
    return {
      opacity: interpolate(p, [0, 0.55], [1, 0], 'clamp'),
      transform: [{ translateX: p * 24 }],
    };
  });

  const arrow = useAnimatedStyle(() => ({
    opacity: 1 - check.value,
    transform: [{ translateX: interpolate(grab.value, [0, 1], [0, 2]) }],
  }));

  const confirmed = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ translateY: (1 - check.value) * 6 }],
  }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={done ? confirmedLabel : children}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => {
        // Screen reader users activate it directly; a drag is not required of them.
        if (!locked.value && !disabled) {
          locked.value = true;
          x.value = withSpring(max.value, springs.snappy);
          complete();
        }
      }}
      onLayout={(event) => {
        max.value = Math.max(0, event.nativeEvent.layout.width - THUMB - INSET * 2);
      }}
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.surfaceSunken,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.trail, { backgroundColor: colors.soft }, trail]} />

      <Animated.View style={[styles.center, styles.hint, hint]}>
        {disabled ? (
          <Text variant="label" tone="muted">
            {children}
          </Text>
        ) : (
          <TextShimmer variant="label" rest={0.45} duration={2200}>
            {children}
          </TextShimmer>
        )}
      </Animated.View>

      <Animated.View style={[styles.center, confirmed]}>
        <Text variant="label">{confirmedLabel}</Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.thumb, { backgroundColor: colors.solid }, thumb]}>
          <Animated.View style={arrow}>
            <Glyph name="arrow-right" size={20} color={colors.on} />
          </Animated.View>
          <View style={styles.check}>
            <DrawnCheck progress={check} size={22} color={colors.on} strokeWidth={2.25} />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    // Everything inside is positioned, so without this a shrink-wrapping parent collapses it.
    minWidth: 220,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trail: { ...fill, borderRadius: HEIGHT / 2 },
  center: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  // Centred in the track the thumb has not yet covered, so a long instruction does not run
  // into the thumb at rest.
  hint: { paddingLeft: THUMB + INSET },
  thumb: {
    position: 'absolute',
    left: INSET,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { ...fill, alignItems: 'center', justifyContent: 'center' },
});
