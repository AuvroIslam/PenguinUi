import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type Theme } from '../../theme/tokens';
import { fill } from '../../utils/layout';
import { TextMorph } from '../text/TextMorph';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// How far past its edges a held finger may stray before the hold lets go, as on native.
const RETAIN = 20;

export type HoldToConfirmProps = {
  children: string;
  /** Label shown once the hold completes. */
  confirmedLabel?: string;
  onConfirm: () => void;
  /** Milliseconds the press must be held. */
  duration?: number;
  tone?: 'danger' | 'primary' | 'accent';
  /** Milliseconds before the button can be held again. `false` leaves it confirmed. */
  resetAfter?: number | false;
  block?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function palette(theme: Theme, tone: 'danger' | 'primary' | 'accent') {
  const c = theme.colors;
  if (tone === 'danger') return { rest: c.dangerSoft, label: c.danger, fill: c.danger, on: c.onStatus };
  if (tone === 'accent') return { rest: c.surfaceSunken, label: c.text, fill: c.accent, on: c.onAccent };
  return { rest: c.surfaceSunken, label: c.text, fill: c.primary, on: c.onPrimary };
}

/**
 * Press and hold to confirm. A fill sweeps across while the finger is down, and the label
 * changes colour exactly at the fill's edge because it is two labels and a moving clip,
 * not a crossfade. Letting go early takes the fill back.
 */
export function HoldToConfirm({
  children,
  confirmedLabel = 'Done',
  onConfirm,
  duration = 1200,
  tone = 'danger',
  resetAfter = 1800,
  block = false,
  disabled,
  style,
}: HoldToConfirmProps) {
  const theme = useTheme();
  const colors = palette(theme, tone);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const width = useSharedValue(0);
  const progress = useSharedValue(0);
  const holding = useSharedValue(false);
  const press = useSharedValue(0);
  const nudge = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => () => clearTimeout(timer.current), []);

  const complete = () => {
    // This confirms something destructive, so it must be impossible for it to fire twice.
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    haptic('success');
    pop.value = withSequence(withTiming(1.04, { duration: 120, easing: easings.out }), withSpring(1, springs.bouncy));
    press.value = withSpring(0, springs.bouncy);
    onConfirm();
    if (resetAfter !== false) {
      timer.current = setTimeout(() => {
        doneRef.current = false;
        setDone(false);
        progress.value = withTiming(0, { duration: 320, easing: easings.fluid });
      }, resetAfter);
    }
  };

  // A tick at each quarter, so the hold can be felt building without looking.
  useAnimatedReaction(
    () => Math.floor(progress.value * 4),
    (quarter, previous) => {
      if (holding.value && previous !== null && quarter > previous && quarter < 4) {
        scheduleOnRN(haptic, 'soft');
      }
    },
  );

  const start = () => {
    if (doneRef.current) return;
    holding.value = true;
    haptic('light');
    press.value = withSpring(1, springs.press);
    const remaining = duration * (1 - progress.value);
    progress.value = withTiming(
      1,
      // The hold is a safeguard, not decoration: it must take its full time even with motion reduced.
      { duration: remaining, easing: Easing.linear, reduceMotion: ReduceMotion.Never },
      (finished) => {
        if (finished) scheduleOnRN(complete);
      },
    );
  };

  const stop = () => {
    if (!holding.value) return;
    holding.value = false;
    if (doneRef.current) return;
    press.value = withSpring(0, springs.bouncy);
    if (progress.value > 0.2) {
      nudge.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
    cancelAnimation(progress);
    progress.value = withSpring(0, springs.snappy);
  };

  // Native presses let go once the finger leaves the button; react-native-web keeps them, so
  // a hold that slides away would still confirm. On web the location is relative to the button.
  const size = useRef({ width: 0, height: 0 });
  const move = (event: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = event.nativeEvent;
    const { width: w, height: h } = size.current;
    if (w > 0 && (x < -RETAIN || y < -RETAIN || x > w + RETAIN || y > h + RETAIN)) stop();
  };

  const container = useAnimatedStyle(() => ({
    transform: [
      { translateX: nudge.value },
      { scale: pop.value * interpolate(press.value, [0, 1], [1, 0.98]) },
    ],
  }));

  // The clip slides in from the left while its content slides the opposite way by the same
  // amount, so the inverted label stays put and is revealed rather than moved.
  const clip = useAnimatedStyle(() => ({
    // Hidden until measured, or the first frame would show the button already filled, and
    // hidden at rest, where pixel rounding would otherwise leave a sliver of fill at the edge.
    opacity: width.value > 0 && progress.value > 0.002 ? 1 : 0,
    transform: [{ translateX: -(1 - progress.value) * width.value }],
  }));
  const counter = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * width.value }],
  }));

  const labelStyle = typeStyle(theme, 'label');
  const label = done ? confirmedLabel : children;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={done ? undefined : 'Press and hold to confirm'}
      disabled={disabled}
      onPressIn={start}
      onPressOut={stop}
      onPressMove={Platform.OS === 'web' ? move : undefined}
      onLayout={(event) => {
        width.value = event.nativeEvent.layout.width;
        size.current = { width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height };
      }}
      style={[
        styles.base,
        {
          backgroundColor: colors.rest,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : 1,
        },
        style,
        container,
      ]}
    >
      <RNText numberOfLines={1} style={[labelStyle, { color: colors.label }]}>
        {children}
      </RNText>

      <Animated.View style={[styles.clip, clip]}>
        <Animated.View style={[styles.inverted, { backgroundColor: colors.fill }, counter]}>
          <TextMorph variant="label" style={{ color: colors.on }}>
            {label}
          </TextMorph>
        </Animated.View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clip: { ...fill, overflow: 'hidden', pointerEvents: 'none' },
  inverted: { ...fill, alignItems: 'center', justifyContent: 'center' },
});
