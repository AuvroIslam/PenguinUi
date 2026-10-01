import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { TextShimmer } from '../text/TextShimmer';

export type VoiceRecordButtonProps = {
  /** Called when recording starts. Begin capturing audio here. */
  onStart?: () => void;
  /** Called with the length in milliseconds when the finger lifts normally. */
  onSend: (durationMs: number) => void;
  /** Called when the recording is thrown away by sliding to cancel. */
  onCancel?: () => void;
  /** Live input level from 0 to 1. Without it, the rings breathe on their own. */
  level?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
};

const SIZE = 52;
/** How far left the finger must travel to discard, as a share of the tray's width. */
const CANCEL_SHARE = 0.4;

function Ring({ index, active, level }: { index: number; active: SharedValue<number>; level?: SharedValue<number> }) {
  const theme = useTheme();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1);
    return () => cancelAnimation(t);
  }, [t]);

  const animated = useAnimatedStyle(() => {
    const local = (t.value + index / 3) % 1;
    const loud = level ? 0.6 + level.value * 0.9 : 1;
    return {
      opacity: active.value * (1 - local) * 0.45,
      transform: [{ scale: 1 + local * 0.9 * loud }],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.ring, { backgroundColor: theme.colors.accent }, animated]} />;
}

/**
 * Hold to record a voice message. Pressing grows the button and sets rings pulsing out of it,
 * sized by the input level when one is given. A timer counts up beside it. Slide left and a
 * cancel target is uncovered; slide far enough and the recording is thrown away, the button
 * shrinking back as the bin gives a little jump. Lifting anywhere else sends it.
 */
export function VoiceRecordButton({ onStart, onSend, onCancel, level, style }: VoiceRecordButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  const active = useSharedValue(0);
  const x = useSharedValue(0);
  const cancelled = useSharedValue(false);
  const bin = useSharedValue(1);
  const [trayWidth, setTrayWidth] = useState(240);
  const cancelAt = trayWidth * CANCEL_SHARE;

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt.current), 100);
    return () => clearInterval(id);
  }, [recording]);

  const begin = () => {
    haptic('medium');
    startedAt.current = Date.now();
    setElapsed(0);
    setRecording(true);
    onStart?.();
  };
  const finish = (cancel: boolean) => {
    setRecording(false);
    if (cancel) {
      haptic('light');
      onCancel?.();
    } else {
      haptic('light');
      onSend(Date.now() - startedAt.current);
    }
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      cancelled.value = false;
      active.value = withSpring(1, springs.bouncy);
      scheduleOnRN(begin);
    })
    .onUpdate((e) => {
      if (cancelled.value) return;
      x.value = Math.min(0, e.translationX);
      if (-x.value > cancelAt) {
        cancelled.value = true;
        bin.value = withSequence(withTiming(1.35, { duration: 120 }), withSpring(1, springs.bouncy));
        active.value = withTiming(0, { duration: 160 });
        x.value = withSpring(0, springs.smooth);
        scheduleOnRN(finish, true);
      }
    })
    .onFinalize(() => {
      if (cancelled.value) return;
      active.value = withSpring(0, springs.smooth);
      x.value = withSpring(0, springs.smooth);
      scheduleOnRN(finish, false);
    });

  const button = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scale: interpolate(active.value, [0, 1], [1, 1.45]) }],
  }));
  const tray = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ translateX: interpolate(active.value, [0, 1], [24, 0]) }],
  }));
  const hint = useAnimatedStyle(() => ({
    opacity: interpolate(-x.value, [0, cancelAt * 0.7], [1, 0], 'clamp'),
    transform: [{ translateX: x.value * 0.5 }],
  }));
  const target = useAnimatedStyle(() => {
    const p = interpolate(-x.value, [0, cancelAt], [0, 1], 'clamp');
    return { opacity: Math.max(p, active.value * 0.35), transform: [{ scale: (0.7 + p * 0.4) * bin.value }] };
  });

  const seconds = Math.floor(elapsed / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <View style={[styles.row, style]}>
      <Animated.View
        onLayout={(e) => setTrayWidth(e.nativeEvent.layout.width)}
        style={[styles.tray, { backgroundColor: c.surfaceSunken, borderColor: c.border }, tray]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.bin, { backgroundColor: c.dangerSoft }, target]}>
          <Glyph name="trash" size={18} color={c.danger} />
        </Animated.View>
        <View style={[styles.dot, { backgroundColor: c.danger }]} />
        <Text variant="label" mono>
          {time}
        </Text>
        <Animated.View style={[styles.hint, hint]}>
          <TextShimmer variant="caption">‹  Slide to cancel</TextShimmer>
        </Animated.View>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessibilityRole="button"
          accessibilityLabel="Hold to record"
          style={[styles.button, { backgroundColor: c.accent }, button]}
        >
          <Ring index={0} active={active} level={level} />
          <Ring index={1} active={active} level={level} />
          <Ring index={2} active={active} level={level} />
          <Glyph name="mic" size={24} color={c.onAccent} strokeWidth={2} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', height: SIZE + 30, gap: 10 },
  tray: {
    flex: 1,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 30,
    gap: 10,
  },
  bin: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  hint: { flex: 1, alignItems: 'flex-end' },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
});
