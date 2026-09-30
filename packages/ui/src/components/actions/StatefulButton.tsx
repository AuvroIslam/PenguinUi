import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text as RNText, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { ArcSpinner } from '../../primitives/ArcSpinner';
import { DrawnCheck, DrawnCross } from '../../primitives/DrawnPath';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle } from '../../theme/tokens';
import { fill } from '../../utils/layout';

export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

export type StatefulButtonProps = {
  children: string;
  /**
   * Control the status yourself. Leave it out and return a promise from `onPress`,
   * and the button follows the promise instead.
   */
  status?: ButtonStatus;
  onPress?: () => void | Promise<unknown>;
  /** Milliseconds the result is shown before returning to idle, when the button runs its own status. */
  resetAfter?: number;
  variant?: 'primary' | 'accent';
  size?: 'md' | 'lg';
  /** Stretch to the width of the container. */
  block?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SHAKE = [-9, 8, -6, 5, -3, 0];

/**
 * A submit button that reports its own progress. The pill closes into a circle around a
 * spinner, the result draws itself in, and the pill opens back up. The slot it sits in keeps
 * its full size throughout, so nothing around it moves.
 */
export function StatefulButton({
  children,
  status: controlled,
  onPress,
  resetAfter = 1400,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled,
  style,
}: StatefulButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [internal, setInternal] = useState<ButtonStatus>('idle');
  const status = controlled ?? internal;

  const height = size === 'lg' ? 54 : 46;
  const padding = size === 'lg' ? 28 : 24;
  const bg = variant === 'accent' ? c.accent : c.primary;
  const fg = variant === 'accent' ? c.onAccent : c.onPrimary;

  const full = useSharedValue(0);
  const [measured, setMeasured] = useState(false);
  const morph = useSharedValue(0);
  const result = useSharedValue(0);
  const mark = useSharedValue(0);
  const shake = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    morph.value = withSpring(status === 'idle' ? 0 : 1, springs.smooth);

    if (status === 'idle' || status === 'loading') {
      result.value = withTiming(0, { duration: 200 });
      mark.value = withTiming(0, { duration: 120 });
      return;
    }

    result.value = withTiming(status === 'success' ? 1 : -1, { duration: 220 });
    mark.value = withDelay(80, withTiming(1, { duration: 320, easing: easings.out }));

    if (status === 'success') {
      pop.value = withSequence(
        withTiming(1.12, { duration: 140, easing: easings.out }),
        withSpring(1, springs.bouncy),
      );
      haptic('success');
    } else {
      shake.value = withSequence(...SHAKE.map((x) => withTiming(x, { duration: 56 })));
      haptic('error');
    }
  }, [status, morph, result, mark, shake, pop]);

  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const settle = (next: ButtonStatus) => {
    if (!mounted.current) return;
    setInternal(next);
    timer.current = setTimeout(() => {
      if (mounted.current) setInternal('idle');
    }, resetAfter);
  };

  const handlePress = () => {
    if (status !== 'idle') return;
    const pending = onPress?.() as Promise<unknown> | undefined;
    if (controlled === undefined && pending && typeof pending.then === 'function') {
      setInternal('loading');
      pending.then(
        () => settle('success'),
        () => settle('error'),
      );
    }
  };

  const pill = useAnimatedStyle(() => {
    const base = {
      backgroundColor: interpolateColor(result.value, [-1, 0, 1], [c.danger, bg, c.success]),
      transform: [{ translateX: shake.value }, { scale: pop.value }],
    };
    return full.value > 0
      ? { ...base, width: interpolate(morph.value, [0, 1], [full.value, height]) }
      : base;
  });

  const label = useAnimatedStyle(() => ({
    opacity: interpolate(morph.value, [0, 0.35], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(morph.value, [0, 1], [1, 0.9], 'clamp') }],
  }));

  const spinner = useAnimatedStyle(() => ({
    opacity: interpolate(morph.value, [0.6, 1], [0, 1], 'clamp') * (1 - Math.abs(result.value)),
  }));

  const outcome = useAnimatedStyle(() => ({ opacity: Math.abs(result.value) }));

  const labelStyle = [typeStyle(theme, 'label'), { color: fg }];

  return (
    <View
      onLayout={(event) => {
        full.value = event.nativeEvent.layout.width;
        setMeasured(true);
      }}
      style={[styles.slot, { height, alignSelf: block ? 'stretch' : 'flex-start' }, style]}
    >
      {/* Invisible copy of the label: it gives the slot its natural width. */}
      <View style={[styles.sizer, { paddingHorizontal: padding }]}>
        <RNText numberOfLines={1} style={labelStyle}>
          {children}
        </RNText>
      </View>

      <PressableScale
        onPress={handlePress}
        disabled={disabled || status !== 'idle'}
        disabledOpacity={disabled ? undefined : 1}
        accessibilityLabel={
          status === 'success' ? `${children}, done` : status === 'error' ? `${children}, failed` : children
        }
        accessibilityState={{ disabled: !!disabled, busy: status === 'loading' }}
        // Until the slot has been measured the pill simply fills it.
        style={[styles.pill, { height, borderRadius: height / 2 }, measured ? null : styles.stretch, pill]}
      >
        <Animated.Text numberOfLines={1} style={[labelStyle, styles.label, label]}>
          {children}
        </Animated.Text>

        {status !== 'idle' ? (
          <>
            <Animated.View style={[styles.layer, spinner]}>
              <ArcSpinner color={fg} size={20} />
            </Animated.View>
            <Animated.View style={[styles.layer, outcome]}>
              {status === 'error' ? (
                <DrawnCross progress={mark} size={24} color={c.onStatus} strokeWidth={2.25} />
              ) : (
                <DrawnCheck progress={mark} size={24} color={c.onStatus} strokeWidth={2.25} />
              )}
            </Animated.View>
          </>
        ) : null}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', justifyContent: 'center' },
  sizer: { opacity: 0, pointerEvents: 'none' },
  pill: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stretch: { left: 0, right: 0 },
  label: { position: 'absolute' },
  layer: { ...fill, alignItems: 'center', justifyContent: 'center' },
});
