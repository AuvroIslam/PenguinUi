import { memo, useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';
import { RollingNumber } from '../text/RollingNumber';

export type BarDatum = { label: string; value: number };

export type BarChartProps = {
  data: BarDatum[];
  height?: number;
  /** Formats values on the axis and in the bubble. */
  format?: (value: number) => string;
  /** Bar colour. Defaults to the accent. */
  color?: string;
  /** Index to highlight when nothing is being touched, such as today. */
  highlight?: number;
  style?: StyleProp<ViewStyle>;
};

const MAX_BAR = 24;
const AXIS_W = 36;
const LABEL_H = 22;
const BUBBLE_H = 30;

/** A clean upper bound for the axis: 1, 2, 2.5 or 5 times a power of ten. */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  const step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return step * p;
}

type BarProps = {
  index: number;
  value: number;
  max: number;
  plot: number;
  width: number;
  color: string;
  active: SharedValue<number>;
  highlight: number;
};

const Bar = memo(function Bar({ index, value, max, plot, width, color, active, highlight }: BarProps) {
  const grow = useSharedValue(0);
  useEffect(() => {
    // Bars rise one after another from the baseline.
    grow.value = withDelay(index * 45, withSpring(1, springs.bouncy));
  }, [index, grow, value]);

  const animated = useAnimatedStyle(() => {
    const h = Math.max(0, (value / max) * plot * grow.value);
    const focus = active.value < 0 ? highlight : active.value;
    // Touching one bar recedes the rest, so the one under the finger is the only loud mark.
    const dim = focus < 0 ? 1 : index === focus ? 1 : 0.32;
    return { height: h, opacity: interpolate(dim, [0.32, 1], [0.32, 1]) };
  });

  return (
    <View style={[styles.slot, { width }]}>
      <Animated.View style={[styles.bar, { width: Math.min(MAX_BAR, width * 0.62), backgroundColor: color }, animated]} />
    </View>
  );
});

/**
 * A bar chart that is read by touch. Bars rise from the baseline one after another on a
 * bouncy spring. Lay a finger on the chart and slide: the bar under it stays at full
 * strength while the others recede, and a value bubble glides between bars rather than
 * jumping, with the figure rolling to each new value. The phone ticks once per bar.
 */
export function BarChart({ data, height = 220, format = (v) => String(Math.round(v)), color, highlight = -1, style }: BarChartProps) {
  const theme = useTheme();
  const c = theme.colors;
  const tint = color ?? c.accent;
  const [width, setWidth] = useState(0);
  const [shown, setShown] = useState(highlight);

  const plot = height - LABEL_H - BUBBLE_H - 8;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const plotW = Math.max(0, width - AXIS_W);
  const slot = data.length ? plotW / data.length : 0;

  const active = useSharedValue(-1);
  const bubbleX = useSharedValue(highlight >= 0 ? highlight : 0);
  const bubbleOn = useSharedValue(highlight >= 0 ? 1 : 0);

  useEffect(() => {
    if (active.value >= 0) return;
    bubbleOn.value = withSpring(highlight >= 0 ? 1 : 0, springs.snappy);
    if (highlight >= 0) bubbleX.value = withSpring(highlight, springs.snappy);
    setShown(highlight);
  }, [highlight, active, bubbleOn, bubbleX]);

  const show = (i: number) => {
    setShown(i);
    if (i >= 0) haptic('selection');
  };

  useAnimatedReaction(
    () => active.value,
    (i, prev) => {
      if (i === prev) return;
      if (i >= 0) {
        bubbleX.value = withSpring(i, springs.snappy);
        bubbleOn.value = withSpring(1, springs.snappy);
      } else {
        bubbleOn.value = withSpring(highlight >= 0 ? 1 : 0, springs.smooth);
        if (highlight >= 0) bubbleX.value = withSpring(highlight, springs.smooth);
      }
      scheduleOnRN(show, i >= 0 ? i : highlight);
    },
  );

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      active.value = clamp(Math.floor((e.x - AXIS_W) / Math.max(1, slot)), 0, data.length - 1);
    })
    .onUpdate((e) => {
      active.value = clamp(Math.floor((e.x - AXIS_W) / Math.max(1, slot)), 0, data.length - 1);
    })
    .onFinalize(() => {
      active.value = -1;
    });

  const bubble = useAnimatedStyle(() => {
    const i = bubbleX.value;
    // Sit just above the bar the bubble is over, interpolating between bars as it moves.
    const lo = Math.floor(clamp(i, 0, data.length - 1));
    const hi = Math.min(data.length - 1, lo + 1);
    const t = i - lo;
    const v = (data[lo]?.value ?? 0) * (1 - t) + (data[hi]?.value ?? 0) * t;
    const top = BUBBLE_H + plot - (v / max) * plot - BUBBLE_H - 6;
    return {
      opacity: bubbleOn.value,
      transform: [
        { translateX: AXIS_W + slot * i + slot / 2 - 32 },
        { translateY: top },
        { scale: 0.85 + bubbleOn.value * 0.15 },
      ],
    };
  });

  const ticks = [0, 0.5, 1].map((f) => f * max);
  const value = data[shown]?.value ?? 0;

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[{ height }, styles.wrap, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}
      >
        {/* Gridlines: solid hairlines one step off the surface. */}
        {ticks.map((t) => {
          const y = BUBBLE_H + plot - (t / max) * plot;
          return (
            <View key={t} style={[styles.grid, { top: y, left: AXIS_W, backgroundColor: c.border }]}>
              <Text variant="micro" tone="faint" style={styles.tick}>
                {format(t)}
              </Text>
            </View>
          );
        })}
        <View style={[styles.bars, { left: AXIS_W, top: BUBBLE_H, height: plot }]}>
          {width > 0
            ? data.map((d, i) => (
                <Bar key={d.label} index={i} value={d.value} max={max} plot={plot} width={slot} color={tint} active={active} highlight={highlight} />
              ))
            : null}
        </View>
        <View style={[styles.labels, { left: AXIS_W, top: BUBBLE_H + plot + 6 }]}>
          {data.map((d, i) => (
            <View key={d.label} style={{ width: slot, alignItems: 'center' }}>
              <Text variant="micro" tone={i === shown ? 'default' : 'faint'}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>
        <Animated.View pointerEvents="none" style={[styles.bubble, { backgroundColor: c.primary }, bubble]}>
          <RollingNumber value={Math.round(value)} format={format} variant="caption" tone="onPrimary" group />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  grid: { position: 'absolute', right: 0, height: StyleSheet.hairlineWidth },
  tick: { position: 'absolute', left: -AXIS_W, top: -7, width: AXIS_W - 8, textAlign: 'right' },
  bars: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'flex-end' },
  slot: { alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  // Rounded at the data end, square at the baseline.
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  labels: { position: 'absolute', right: 0, flexDirection: 'row' },
  bubble: { position: 'absolute', left: 0, top: 0, width: 64, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
