import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Portal } from '../../primitives/Portal';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Resting heights as fractions of the screen, smallest first. */
  detents?: number[];
  children: ReactNode;
  /** Called with the detent index each time the sheet settles on one. */
  onDetentChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const HANDLE_W = 40;
const HANDLE_H = 12;
/** How far ahead a flick is projected when choosing where to settle, in seconds of travel. */
const PROJECTION = 0.18;
const RUBBER = 60;

function rubber(distance: number): number {
  'worklet';
  return RUBBER * (1 - 1 / (distance / RUBBER + 1));
}

/**
 * A sheet that rests at detents. Where it settles is decided by where the flick would carry
 * it, not by where the finger let go, so a quick upward flick from the small detent goes all
 * the way up. Dragging past the top detent meets growing resistance. The backdrop darkens in
 * step with the sheet's position, and the grab handle bends into a chevron pointing the way
 * the sheet is being pulled.
 */
export function BottomSheet({
  open,
  onClose,
  detents = [0.45, 0.88],
  children,
  onDetentChange,
  style,
}: BottomSheetProps) {
  const theme = useTheme();
  const c = theme.colors;
  const screen = useWindowDimensions();
  const [mounted, setMounted] = useState(open);

  const sorted = [...detents].sort((a, b) => a - b);
  const sheetH = Math.round(screen.height * sorted[sorted.length - 1]);
  // Offsets from the fully open position: 0 is the tallest detent, sheetH is closed.
  const stops = sorted.map((d) => sheetH - Math.round(screen.height * d));
  const lowest = stops[0];

  const y = useSharedValue(sheetH);
  const start = useSharedValue(0);
  const bend = useSharedValue(0);

  const settle = useCallback(
    (index: number) => {
      haptic('light');
      onDetentChange?.(index);
    },
    [onDetentChange],
  );

  useEffect(() => {
    if (open) {
      setMounted(true);
      y.value = sheetH;
      y.value = withSpring(lowest, springs.smooth);
    } else if (mounted) {
      y.value = withTiming(sheetH, { duration: 220 }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = y.value;
    })
    .onUpdate((e) => {
      const raw = start.value + e.translationY;
      y.value = raw < 0 ? -rubber(-raw) : raw;
      // Positive bends the handle into a downward chevron, negative into an upward one.
      bend.value = Math.max(-1, Math.min(1, e.velocityY / 420));
    })
    .onEnd((e) => {
      bend.value = withSpring(0, springs.wobbly);
      const projected = y.value + e.velocityY * PROJECTION;
      // Past the lowest detent by a third of its height, the sheet closes.
      if (projected > lowest + (sheetH - lowest) * 0.35) {
        y.value = withSpring(sheetH, { ...springs.smooth, velocity: e.velocityY });
        scheduleOnRN(onClose);
        return;
      }
      let best = 0;
      for (let i = 1; i < stops.length; i += 1) {
        if (Math.abs(stops[i] - projected) < Math.abs(stops[best] - projected)) best = i;
      }
      y.value = withSpring(stops[best], { ...springs.smooth, velocity: e.velocityY });
      scheduleOnRN(settle, best);
    });

  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [sheetH, lowest], [0, 1], Extrapolation.CLAMP),
  }));
  const handle = useAnimatedProps(() => {
    const mid = HANDLE_H / 2;
    const b = bend.value * 5;
    return { d: `M 3 ${mid - b} L ${HANDLE_W / 2} ${mid + b} L ${HANDLE_W - 3} ${mid - b}` };
  });

  if (!mounted) return null;

  return (
    <Portal>
      <View style={fill} pointerEvents="box-none">
        <Animated.View style={[fill, { backgroundColor: c.scrim }, backdrop]} onTouchEnd={onClose} />
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                height: sheetH + RUBBER,
                paddingBottom: RUBBER,
                backgroundColor: c.surface,
                borderColor: c.border,
                boxShadow: theme.shadows.lg,
              },
              sheet,
              style,
            ]}
          >
            <View style={styles.handleWrap} accessibilityRole="adjustable" accessibilityLabel="Sheet handle">
              <Svg width={HANDLE_W} height={HANDLE_H}>
                <AnimatedPath
                  animatedProps={handle}
                  stroke={c.borderStrong}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </View>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -RUBBER,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
});
