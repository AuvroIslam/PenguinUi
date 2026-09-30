import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useEffect } from 'react';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type SwitchProps = {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

const W = 58;
const H = 34;
const PAD = 3;
const THUMB = H - PAD * 2;
const STRETCH = 8;
const TRAVEL = W - PAD * 2 - THUMB;

/**
 * A toggle you can drag. The thumb grows wider under the finger, as if gripped, and rides a
 * spring to the other end. Dragging past halfway and letting go commits; letting go short of
 * it returns. The track colour follows the thumb, not the state, so it is always in step.
 */
export function Switch({ value: controlled, defaultValue = false, onChange, disabled, label, style }: SwitchProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [on, setOn] = useControllable(controlled, defaultValue, onChange);

  const x = useSharedValue(on ? 1 : 0);
  const grip = useSharedValue(0);
  const start = useSharedValue(0);
  const dragged = useSharedValue(false);
  const velocity = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(on ? 1 : 0, springs.snappy);
  }, [on, x]);

  const commit = (next: boolean) => {
    haptic('light');
    setOn(next);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin(() => {
      start.value = x.value;
      dragged.value = false;
      grip.value = withSpring(1, springs.press);
    })
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > 4) dragged.value = true;
      x.value = clamp(start.value + e.translationX / TRAVEL, 0, 1);
    })
    .onEnd((e) => {
      velocity.value = e.velocityX;
    })
    .onFinalize(() => {
      // Settled here rather than in onEnd, which never runs for a touch that did not move.
      // A tap flips the switch; a drag lands on whichever side the thumb is nearer, and a
      // flick can carry it across.
      const flung = Math.abs(velocity.value) > 500 ? velocity.value > 0 : x.value > 0.5;
      const next = dragged.value ? flung : start.value < 0.5;
      x.value = withSpring(next ? 1 : 0, springs.snappy);
      grip.value = withSpring(0, springs.bouncy);
      if (next !== start.value > 0.5) scheduleOnRN(commit, next);
      velocity.value = 0;
    });

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(x.value, [0, 1], [c.surfaceSunken, c.accent]),
    borderColor: interpolateColor(x.value, [0, 1], [c.borderStrong, c.accent]),
  }));

  const thumb = useAnimatedStyle(() => {
    const width = THUMB + grip.value * STRETCH;
    // Stretches toward the centre of the track, so the far edge stays at the rail.
    const left = PAD + x.value * (TRAVEL - grip.value * STRETCH);
    return { width, transform: [{ translateX: left }] };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: on, disabled }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => commit(!on)}
        style={[styles.track, track, disabled ? { opacity: 0.45 } : null, style]}
      >
        <Animated.View style={[styles.thumb, { backgroundColor: '#fff', boxShadow: theme.shadows.md }, thumb]} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, borderWidth: StyleSheet.hairlineWidth },
  thumb: { position: 'absolute', top: PAD - StyleSheet.hairlineWidth, left: 0, height: THUMB, borderRadius: THUMB / 2 },
});
