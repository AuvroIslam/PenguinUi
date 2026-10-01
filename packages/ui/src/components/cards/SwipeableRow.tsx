import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';

export type SwipeAction = {
  key: string;
  label: string;
  icon: GlyphName;
  color: string;
  onPress: () => void;
};

export type SwipeableRowProps = {
  children: ReactNode;
  /** Actions revealed by swiping left, nearest the edge last. The last one is the full-swipe action. */
  actions: SwipeAction[];
  /** Remove the row from view when the full-swipe action runs, by collapsing its height. */
  collapseOnFullSwipe?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ACTION = 76;
const FULL = 0.62;

function ActionButton({
  action,
  index,
  count,
  x,
  full,
  width,
  onPress,
}: {
  onPress: () => void;
  action: SwipeAction;
  index: number;
  count: number;
  x: SharedValue<number>;
  full: SharedValue<number>;
  width: number;
}) {
  const last = index === count - 1;

  const box = useAnimatedStyle(() => {
    const reveal = Math.max(0, -x.value);
    // Each action takes an equal share of the uncovered space, until a full swipe hands
    // all of it to the last action.
    const share = reveal / count;
    const f = full.value;
    const w = last ? share + (reveal - share) * f : share * (1 - f);
    const left = width - reveal + (last ? (reveal - w) : share * index * (1 - f));
    return { width: Math.max(0, w), transform: [{ translateX: left }] };
  });
  const icon = useAnimatedStyle(() => {
    const reveal = Math.max(0, -x.value);
    const s = interpolate(reveal, [0, ACTION * count], [0.4, 1], Extrapolation.CLAMP);
    return {
      opacity: interpolate(reveal, [ACTION * 0.4, ACTION], [0, 1], Extrapolation.CLAMP),
      transform: [{ scale: s * (last ? 1 + full.value * 0.15 : 1 - full.value) }],
    };
  });

  return (
    <Animated.View
      onTouchEnd={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={[styles.action, { backgroundColor: action.color }, box]}
    >
      <Animated.View style={[styles.actionInner, icon]}>
        <Glyph name={action.icon} size={22} color="#fff" strokeWidth={2} />
        <Text variant="micro" style={{ color: '#fff' }}>
          {action.label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * A row with actions behind it. Swiping left uncovers them, each icon growing as it is
 * revealed. Keep going past the full-swipe line and the last action floods the whole row,
 * its icon jumps forward, and the phone thumps; letting go there runs it. Short of the line
 * the row rests open on the actions, or closes if barely moved.
 */
export function SwipeableRow({ children, actions, collapseOnFullSwipe = false, style }: SwipeableRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [width, setWidth] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);

  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const full = useSharedValue(0);
  const past = useSharedValue(false);
  const collapse = useSharedValue(1);
  const openWidth = ACTION * actions.length;

  const thump = () => haptic('medium');
  const run = (i: number) => actions[i]?.onPress();

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      start.value = x.value;
    })
    .onUpdate((e) => {
      const raw = start.value + e.translationX;
      // Resist being pulled right of closed.
      x.value = raw > 0 ? raw * 0.15 : raw;
      const isPast = -x.value > width * FULL;
      if (isPast !== past.value) {
        past.value = isPast;
        full.value = withSpring(isPast ? 1 : 0, springs.snappy);
        if (isPast) scheduleOnRN(thump);
      }
    })
    .onEnd((e) => {
      if (past.value) {
        past.value = false;
        x.value = withTiming(-width, { duration: 180 }, () => {
          scheduleOnRN(run, actions.length - 1);
          if (collapseOnFullSwipe) {
            collapse.value = withTiming(0, { duration: 220 });
          } else {
            full.value = withTiming(0, { duration: 200 });
            x.value = withSpring(0, springs.smooth);
          }
        });
        return;
      }
      const projected = x.value + e.velocityX * 0.15;
      x.value = withSpring(projected < -openWidth / 2 ? -openWidth : 0, springs.smooth);
    });

  const row = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const wrap = useAnimatedStyle(() =>
    rowHeight ? { height: rowHeight * collapse.value, opacity: collapse.value } : {},
  );

  const tapAction = (i: number) => {
    x.value = withSpring(0, springs.smooth);
    actions[i]?.onPress();
  };

  return (
    <Animated.View style={[styles.wrap, wrap, style]}>
      <View
        style={styles.inner}
        onLayout={(e: LayoutChangeEvent) => {
          setWidth(e.nativeEvent.layout.width);
          if (!rowHeight) setRowHeight(e.nativeEvent.layout.height);
        }}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {width > 0
            ? actions.map((action, i) => (
                <ActionButton
                  key={action.key}
                  action={action}
                  index={i}
                  count={actions.length}
                  x={x}
                  full={full}
                  width={width}
                  onPress={() => tapAction(i)}
                />
              ))
            : null}
        </View>
        <GestureDetector gesture={pan}>
          <Animated.View style={[{ backgroundColor: c.surface }, row]}>{children}</Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', overflow: 'hidden' },
  inner: { overflow: 'hidden' },
  action: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  actionInner: { alignItems: 'center', gap: 4, width: ACTION },
});

