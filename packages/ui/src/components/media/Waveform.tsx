import { memo, useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';

export type WaveformProps = {
  /** Levels from 0 to 1, one per bar. */
  samples: number[];
  /** Playback position from 0 to 1. Bars before it are filled. */
  progress?: number;
  /** Called while scrubbing and once more when the finger lifts. */
  onSeek?: (progress: number) => void;
  /** Animate the levels as if listening, for recording or a live stream. */
  live?: boolean;
  height?: number;
  barWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

const SWELL = 0.55;
const REACH = 3;

type BarProps = {
  index: number;
  level: number;
  count: number;
  height: number;
  barWidth: number;
  pitch: number;
  head: SharedValue<number>;
  finger: SharedValue<number>;
  touching: SharedValue<number>;
  clock: SharedValue<number>;
  live: boolean;
  played: string;
  rest: string;
};

const Bar = memo(function Bar({ index, level, count, height, barWidth, pitch, head, finger, touching, clock, live, played, rest }: BarProps) {
  const animated = useAnimatedStyle(() => {
    // Bars near the finger swell, falling off with distance like a lens passing over them.
    const d = (finger.value - (index * pitch + barWidth / 2)) / pitch;
    const swell = Math.exp(-(d * d) / (REACH * REACH)) * touching.value;
    // Live levels: each bar breathes on its own phase, so the row never pulses in unison.
    const wobble = live ? 0.55 + 0.45 * Math.sin(clock.value * Math.PI * 2 * (1 + (index % 5) * 0.17) + index * 1.7) : 1;
    const h = Math.max(barWidth, height * Math.max(0.08, level * wobble) * (1 + swell * SWELL));
    const filled = clamp((head.value * count - index) * 1.5, 0, 1);
    return {
      height: Math.min(height * 1.4, h),
      backgroundColor: interpolateColor(filled, [0, 1], [rest, played]),
    };
  });
  return <Animated.View style={[{ width: barWidth, borderRadius: barWidth / 2 }, animated]} />;
});

/**
 * An audio waveform you can scrub. Drag across it and the bars under the finger swell like
 * a lens is passing over them, the played colour follows, and the phone ticks as you cross
 * the bars. In `live` mode every bar breathes on its own phase, as if listening.
 */
export function Waveform({
  samples,
  progress = 0,
  onSeek,
  live = false,
  height = 56,
  barWidth = 3,
  gap = 2.5,
  style,
}: WaveformProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [width, setWidth] = useState(0);
  const pitch = barWidth + gap;
  // Fit as many bars as there is room for, resampling the levels to that count.
  const count = width ? Math.max(1, Math.floor((width + gap) / pitch)) : 0;
  const levels = Array.from({ length: count }, (_, i) => {
    const from = Math.floor((i / count) * samples.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / count) * samples.length));
    let peak = 0;
    for (let j = from; j < to; j += 1) peak = Math.max(peak, samples[j] ?? 0);
    return peak;
  });

  const head = useSharedValue(progress);
  const finger = useSharedValue(-1000);
  const touching = useSharedValue(0);
  const scrubbing = useSharedValue(false);
  const lastBar = useSharedValue(-1);
  const clock = useSharedValue(0);

  useEffect(() => {
    if (!scrubbing.value) head.value = withTiming(progress, { duration: 120 });
  }, [progress, head, scrubbing]);

  useEffect(() => {
    if (!live) {
      cancelAnimation(clock);
      return;
    }
    clock.value = 0;
    clock.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1);
    return () => cancelAnimation(clock);
  }, [live, clock]);

  const tick = () => haptic('selection');
  const seek = (p: number) => onSeek?.(p);
  const total = count * pitch - gap;

  const pan = Gesture.Pan()
    .enabled(!!onSeek)
    .minDistance(0)
    .onBegin((e) => {
      scrubbing.value = true;
      touching.value = withSpring(1, springs.snappy);
      finger.value = e.x;
      head.value = clamp(e.x / total, 0, 1);
      scheduleOnRN(seek, head.value);
    })
    .onUpdate((e) => {
      finger.value = e.x;
      head.value = clamp(e.x / total, 0, 1);
      const bar = Math.floor(e.x / pitch);
      // A tick every few bars: one per bar is a buzz, not a texture.
      if (Math.floor(bar / 3) !== Math.floor(lastBar.value / 3)) scheduleOnRN(tick);
      lastBar.value = bar;
      scheduleOnRN(seek, head.value);
    })
    .onFinalize(() => {
      scrubbing.value = false;
      touching.value = withSpring(0, springs.smooth);
      scheduleOnRN(seek, head.value);
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        style={[styles.row, { height: height * 1.4, gap }, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        {levels.map((level, i) => (
          <Bar
            key={i}
            index={i}
            level={level}
            count={count}
            height={height}
            barWidth={barWidth}
            pitch={pitch}
            head={head}
            finger={finger}
            touching={touching}
            clock={clock}
            live={live}
            played={c.accent}
            rest={c.borderStrong}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
});
