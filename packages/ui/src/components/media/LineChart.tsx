import { useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';
import { RollingNumber } from '../text/RollingNumber';

export type LinePoint = { label: string; value: number };

export type LineChartProps = {
  data: LinePoint[];
  height?: number;
  format?: (value: number) => string;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TOP = 54;
/** Horizontal inset, so the end dot and its ring are never cut by the edge. */
const INSET = 8;
const BOTTOM = 26;

/** A smooth curve through the points, using a monotone cubic so it never overshoots the data. */
function curve(points: [number, number][]) {
  if (points.length < 2) return '';
  const n = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    const a = slopes[i - 1];
    const b = slopes[i];
    return a * b <= 0 ? 0 : (a + b) / 2;
  });
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = (x1 - x0) / 3;
    d += ` C ${x0 + h} ${y0 + tangents[i] * h} ${x1 - h} ${y1 - tangents[i + 1] * h} ${x1} ${y1}`;
  }
  return d;
}

function length(points: [number, number][]) {
  // Generous upper bound on the curve's length, which is all the dash trick needs.
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return total * 1.08;
}

/**
 * A line chart that draws itself in, then the area beneath fades up under it. Lay a finger
 * on it and a cursor snaps to the nearest point, a ringed dot riding the line, while the
 * value above rolls to the figure under the finger and the date reads out beneath. The
 * phone ticks as the cursor passes each point.
 */
export function LineChart({ data, height = 240, format = (v) => String(Math.round(v)), color, style }: LineChartProps) {
  const theme = useTheme();
  const c = theme.colors;
  const tint = color ?? c.accent;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [width, setWidth] = useState(0);
  const [shown, setShown] = useState(data.length - 1);

  const plotH = height - TOP - BOTTOM;
  const values = data.map((d) => d.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.12 || 1;
  const min = lo - pad;
  const max = hi + pad;

  const points = useMemo<[number, number][]>(
    () =>
      data.map((d, i) => [
        data.length > 1 ? INSET + (i / (data.length - 1)) * (width - INSET * 2) : width / 2,
        TOP + plotH - ((d.value - min) / (max - min)) * plotH,
      ]),
    [data, width, plotH, min, max],
  );
  const line = curve(points);
  const area = points.length
    ? `${line} L ${points[points.length - 1][0]} ${TOP + plotH} L ${points[0][0]} ${TOP + plotH} Z`
    : '';
  const total = length(points);

  const draw = useSharedValue(0);
  const fill = useSharedValue(0);
  const cursor = useSharedValue(data.length - 1);
  const touching = useSharedValue(0);
  const index = useSharedValue(data.length - 1);

  useEffect(() => {
    if (!width) return;
    draw.value = 0;
    fill.value = 0;
    draw.value = withTiming(1, { duration: 1100, easing: easings.out });
    fill.value = withDelay(500, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, [width, data, draw, fill]);

  const tick = (i: number) => {
    haptic('selection');
    setShown(i);
  };
  const release = () => setShown(data.length - 1);

  useAnimatedReaction(
    () => index.value,
    (i, prev) => {
      if (prev !== null && i !== prev && touching.value > 0) scheduleOnRN(tick, i);
    },
  );

  const nearest = (x: number) => {
    'worklet';
    return clamp(Math.round(((x - INSET) / Math.max(1, width - INSET * 2)) * (data.length - 1)), 0, data.length - 1);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      touching.value = 1;
      index.value = nearest(e.x);
      cursor.value = withSpring(index.value, springs.snappy);
    })
    .onUpdate((e) => {
      index.value = nearest(e.x);
      cursor.value = withSpring(index.value, springs.snappy);
    })
    .onFinalize(() => {
      touching.value = 0;
      index.value = data.length - 1;
      cursor.value = withSpring(data.length - 1, springs.smooth);
      scheduleOnRN(release);
    });

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: total * (1 - draw.value) }));
  const areaProps = useAnimatedProps(() => ({ opacity: fill.value }));

  // The cursor's position along the curve, interpolated between the points it lies between.
  const pointAt = (t: number): [number, number] => {
    'worklet';
    const i = Math.floor(clamp(t, 0, points.length - 1));
    const j = Math.min(points.length - 1, i + 1);
    const f = t - i;
    return [points[i][0] + (points[j][0] - points[i][0]) * f, points[i][1] + (points[j][1] - points[i][1]) * f];
  };

  const dotProps = useAnimatedProps(() => {
    const [x, y] = points.length ? pointAt(cursor.value) : [0, 0];
    return { cx: x, cy: y, opacity: Math.min(1, draw.value * 1.2) };
  });
  const rule = useAnimatedStyle(() => {
    const [x] = points.length ? pointAt(cursor.value) : [0, 0];
    return { opacity: touching.value ? 1 : 0, transform: [{ translateX: x }] };
  });

  const point = data[shown];
  const first = data[0]?.value ?? 0;
  const change = point ? ((point.value - first) / (first || 1)) * 100 : 0;

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.wrap, { height }, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${data.length} points, from ${format(first)} to ${format(data[data.length - 1]?.value ?? 0)}`}
      >
        <View style={styles.readout}>
          <RollingNumber value={Math.round(point?.value ?? 0)} format={format} variant="title" group />
          <Text variant="caption" tone={change >= 0 ? 'success' : 'danger'}>
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}% · {point?.label}
          </Text>
        </View>
        {width > 0 ? (
          <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={tint} stopOpacity={0.18} />
                <Stop offset="1" stopColor={tint} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0, 0.5, 1].map((f) => (
              <Path key={f} d={`M 0 ${TOP + plotH * f} L ${width} ${TOP + plotH * f}`} stroke={c.border} strokeWidth={StyleSheet.hairlineWidth} />
            ))}
            <AnimatedPath d={area} fill={`url(#${id})`} animatedProps={areaProps} />
            <AnimatedPath
              d={line}
              stroke={tint}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={[total, total]}
              animatedProps={lineProps}
            />
            <AnimatedCircle r={5} fill={tint} stroke={c.surface} strokeWidth={2} animatedProps={dotProps} />
          </Svg>
        ) : null}
        <Animated.View pointerEvents="none" style={[styles.rule, { top: TOP, height: plotH, backgroundColor: c.borderStrong }, rule]} />
        <View style={[styles.axis, { top: TOP + plotH + 8 }]} pointerEvents="none">
          <Text variant="micro" tone="faint">
            {data[0]?.label}
          </Text>
          <Text variant="micro" tone="faint">
            {data[data.length - 1]?.label}
          </Text>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  readout: { position: 'absolute', left: 0, top: 0, gap: 0 },
  rule: { position: 'absolute', left: 0, width: StyleSheet.hairlineWidth },
  axis: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
});
