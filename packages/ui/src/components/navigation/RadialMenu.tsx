import { useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type RadialItem = { key: string; label: string; icon: GlyphName };

export type RadialMenuProps = {
  children: ReactNode;
  items: RadialItem[];
  onSelect: (key: string) => void;
  /** Distance from the finger to each item. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const ITEM = 52;
const EDGE = 8;

type Spot = { x: number; y: number; angle: number };

/**
 * A circular menu at the touch point. Hold and the items fan out around the finger from
 * where it is; the arc turns to stay on screen when the finger is near an edge. Move toward
 * an item and it grows and takes a label while the others shrink back, and letting go
 * chooses it. Letting go near the centre chooses nothing.
 */
export function RadialMenu({ children, items, onSelect, radius = 92, style }: RadialMenuProps) {
  const theme = useTheme();
  const c = theme.colors;
  const screen = useWindowDimensions();
  const [at, setAt] = useState<{ x: number; y: number; arc: number } | null>(null);

  const open = useSharedValue(0);
  const hover = useSharedValue(-1);
  const fx = useSharedValue(0);
  const fy = useSharedValue(0);
  // Item angles, in radians, as a shared array the worklets can read.
  const angles = useSharedValue<number[]>([]);

  const span = Math.min(Math.PI * 1.5, Math.max(Math.PI * 0.6, (items.length - 1) * 0.62));

  const begin = (x: number, y: number) => {
    // Aim the arc away from whichever edges are close: toward the middle of the screen.
    const toCentre = Math.atan2(screen.height / 2 - y, screen.width / 2 - x);
    const start = toCentre - span / 2;
    const list = items.map((_, i) => (items.length === 1 ? toCentre : start + (span * i) / (items.length - 1)));
    angles.value = list;
    setAt({ x, y, arc: toCentre });
    haptic('medium');
    open.value = withSpring(1, springs.bouncy);
  };

  const finish = (index: number) => {
    open.value = withTiming(0, { duration: 140 });
    hover.value = -1;
    setTimeout(() => setAt(null), 160);
    if (index >= 0 && items[index]) {
      haptic('light');
      onSelect(items[index].key);
    }
  };
  const tick = () => haptic('selection');

  const pick = (x: number, y: number) => {
    'worklet';
    const list = angles.value;
    const dx = x - fx.value;
    const dy = y - fy.value;
    const dist = Math.hypot(dx, dy);
    if (dist < 34 || list.length === 0) return -1;
    const a = Math.atan2(dy, dx);
    let best = -1;
    let bestDiff = 99;
    for (let i = 0; i < list.length; i += 1) {
      let d = Math.abs(a - list[i]);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d < bestDiff) {
        bestDiff = d;
        best = i;
      }
    }
    return bestDiff < 0.62 ? best : -1;
  };

  const gesture = Gesture.Pan()
    .activateAfterLongPress(320)
    .onStart((e) => {
      fx.value = e.absoluteX;
      fy.value = e.absoluteY;
      scheduleOnRN(begin, e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      const i = pick(e.absoluteX, e.absoluteY);
      if (i !== hover.value) {
        hover.value = i;
        if (i >= 0) scheduleOnRN(tick);
      }
    })
    .onFinalize((_e, success) => {
      if (success) scheduleOnRN(finish, hover.value);
    });

  const scrim = useAnimatedStyle(() => ({ opacity: open.value * 0.5 }));
  const hub = useAnimatedStyle(() => ({ opacity: open.value * 0.9, transform: [{ scale: open.value }] }));

  return (
    <>
      <GestureDetector gesture={gesture}>
        <View style={style}>{children}</View>
      </GestureDetector>
      {at ? (
        <Portal>
          <View style={fill} pointerEvents="none">
            <Animated.View style={[fill, { backgroundColor: c.scrim }, scrim]} />
            <View style={{ position: 'absolute', left: at.x, top: at.y }}>
              <Animated.View style={[styles.hub, { backgroundColor: c.primary }, hub]} />
              {items.map((item, i) => (
                <RadialNode
                  key={item.key}
                  item={item}
                  index={i}
                  angles={angles}
                  radius={radius}
                  open={open}
                  hover={hover}
                  clampX={at.x}
                  clampY={at.y}
                  screenW={screen.width}
                  screenH={screen.height}
                />
              ))}
            </View>
          </View>
        </Portal>
      ) : null}
    </>
  );
}

function RadialNode({
  item,
  index,
  angles,
  radius,
  open,
  hover,
  clampX,
  clampY,
  screenW,
  screenH,
}: {
  item: RadialItem;
  index: number;
  angles: SharedValue<number[]>;
  radius: number;
  open: SharedValue<number>;
  hover: SharedValue<number>;
  clampX: number;
  clampY: number;
  screenW: number;
  screenH: number;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const grow = useDerivedValue(() => withSpring(hover.value === index ? 1 : 0, springs.snappy));

  const animated = useAnimatedStyle(() => {
    const a = angles.value[index] ?? 0;
    // Items leave the finger one after another as the menu opens.
    const t = Math.min(1, Math.max(0, (open.value - index * 0.05) / 0.75));
    let x = Math.cos(a) * radius * t;
    let y = Math.sin(a) * radius * t;
    // Keep the whole item on screen.
    const ax = clampX + x;
    const ay = clampY + y;
    x += Math.min(0, screenW - EDGE - ITEM / 2 - ax) + Math.max(0, EDGE + ITEM / 2 - ax);
    y += Math.min(0, screenH - EDGE - ITEM / 2 - ay) + Math.max(0, EDGE + ITEM / 2 - ay);
    return {
      opacity: Math.min(1, t * 1.6),
      transform: [{ translateX: x - ITEM / 2 }, { translateY: y - ITEM / 2 }, { scale: interpolate(grow.value, [0, 1], [t, 1.3 * t]) }],
      backgroundColor: interpolateColor(grow.value, [0, 1], [c.surfaceRaised, c.accent]),
    };
  });

  const label = useAnimatedStyle(() => ({
    opacity: hover.value === index ? 1 : 0,
    transform: [{ translateY: hover.value === index ? 0 : 6 }],
  }));

  return (
    <Animated.View style={[styles.node, { borderColor: c.border, boxShadow: theme.shadows.md }, animated]}>
      <Glyph name={item.icon} size={22} color={c.text} />
      <Animated.View pointerEvents="none" style={[styles.label, { backgroundColor: c.primary, borderRadius: theme.radii.sm }, label]}>
        <Text variant="caption" tone="onPrimary" weight="medium" numberOfLines={1}>
          {item.label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hub: { position: 'absolute', left: -6, top: -6, width: 12, height: 12, borderRadius: 6 },
  node: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ITEM,
    height: ITEM,
    borderRadius: ITEM / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { position: 'absolute', top: -34, paddingHorizontal: 10, paddingVertical: 4, minWidth: 60, alignItems: 'center' },
});
