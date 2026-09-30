import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type StepProgressProps = {
  steps: string[];
  /** Zero-based index of the step in progress. Steps before it are complete. */
  current: number;
  style?: StyleProp<ViewStyle>;
};

const DOT = 30;

function Step({ label, index, current }: { label: string; index: number; current: number }) {
  const theme = useTheme();
  const c = theme.colors;
  const done = index < current;
  const active = index === current;

  const fillLevel = useSharedValue(index <= current ? 1 : 0);
  const mark = useSharedValue(done ? 1 : 0);
  const pulse = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    fillLevel.value = withTiming(index <= current ? 1 : 0, { duration: 200 });
    mark.value = done ? withDelay(120, withTiming(1, { duration: 280, easing: easings.out })) : withTiming(0, { duration: 100 });
    if (done) pop.value = withSequence(withTiming(1.18, { duration: 130 }), withSpring(1, springs.bouncy));
  }, [index, current, done, fillLevel, mark, pop]);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }), -1);
    } else {
      pulse.value = withTiming(0, { duration: 160 });
    }
  }, [active, pulse]);

  const dot = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fillLevel.value, [0, 1], [c.surface, done ? c.primary : c.accent]),
    borderColor: interpolateColor(fillLevel.value, [0, 1], [c.borderStrong, done ? c.primary : c.accent]),
    transform: [{ scale: pop.value }],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: active ? (1 - pulse.value) * 0.55 : 0,
    transform: [{ scale: 1 + pulse.value * 0.75 }],
  }));
  const number = useAnimatedStyle(() => ({ opacity: 1 - mark.value }));

  return (
    <View style={styles.step}>
      <View style={styles.dotWrap}>
        <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: c.accent }, ring]} />
        <Animated.View style={[styles.dot, dot]}>
          <Animated.View style={[fill, styles.center, number]}>
            <Text variant="caption" weight="semibold" tone={index <= current ? 'onAccent' : 'muted'}>
              {index + 1}
            </Text>
          </Animated.View>
          <DrawnCheck progress={mark} size={18} color={c.onPrimary} strokeWidth={2.6} />
        </Animated.View>
      </View>
      <Text variant="caption" tone={index <= current ? 'default' : 'muted'} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Connector({ index, current }: { index: number; current: number }) {
  const theme = useTheme();
  const c = theme.colors;
  const level = useSharedValue(index < current ? 1 : 0);

  useEffect(() => {
    // The connector fills after the step behind it completes, and empties at once going back.
    level.value = index < current ? withDelay(60, withTiming(1, { duration: 360, easing: easings.fluid })) : withTiming(0, { duration: 160 });
  }, [index, current, level]);

  const bar = useAnimatedStyle(() => ({ transform: [{ scaleX: level.value }] }));

  return (
    <View style={[styles.connector, { backgroundColor: c.border }]}>
      <Animated.View style={[styles.connectorFill, { backgroundColor: c.primary }, bar]} />
    </View>
  );
}

/**
 * Progress through a fixed set of steps. Moving forward, the step behind you redraws its
 * number as a check with a small pop, the connector to the next step fills along its length,
 * and the new step starts to pulse. Moving back undoes each of those in turn.
 */
export function StepProgress({ steps, current, style }: StepProgressProps) {
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length, now: current }} style={[styles.row, style]}>
      {steps.map((label, i) => (
        <View key={label} style={[styles.cell, i < steps.length - 1 ? styles.grow : null]}>
          <Step label={label} index={i} current={current} />
          {i < steps.length - 1 ? <Connector index={i} current={current} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'stretch', alignItems: 'flex-start', paddingHorizontal: 8 },
  cell: { flexDirection: 'row', alignItems: 'flex-start' },
  grow: { flex: 1 },
  step: { alignItems: 'center', gap: 8, width: DOT + 28, marginHorizontal: -14 },
  dotWrap: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 1.5 },
  center: { alignItems: 'center', justifyContent: 'center' },
  connector: { flex: 1, height: 3, borderRadius: 2, marginTop: DOT / 2 - 1.5, marginHorizontal: 16, overflow: 'hidden' },
  connectorFill: { ...fill, transformOrigin: 'left center' },
});
