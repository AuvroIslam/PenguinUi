import { memo, useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';

export type DockItem = { key: string; label: string; icon: GlyphName };

export type DockProps = {
  items: DockItem[];
  onSelect?: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

const CELL = 52;
const GAP = 6;
const PITCH = CELL + GAP;
const REACH = 1.35;
const PEAK = 0.78;
const LIFT = 16;

type IconProps = {
  item: DockItem;
  index: number;
  finger: SharedValue<number>;
  touching: SharedValue<number>;
};

const DockIcon = memo(function DockIcon({ item, index, finger, touching }: IconProps) {
  const theme = useTheme();
  const c = theme.colors;

  const animated = useAnimatedStyle(() => {
    // Distance from the finger in cells, run through a bell curve: the nearest icon grows
    // most, and its neighbours follow it down smoothly. With no finger, everything is at rest.
    const d = (finger.value - index * PITCH - CELL / 2) / PITCH;
    const bell = Math.exp(-(d * d) / (REACH * REACH)) * touching.value;
    return {
      transform: [
        { translateY: -bell * LIFT },
        { scale: 1 + bell * PEAK },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.icon,
        { backgroundColor: c.surface, borderColor: c.border, borderRadius: CELL * 0.3, boxShadow: theme.shadows.sm },
        animated,
      ]}
    >
      <Glyph name={item.icon} size={24} color={c.text} />
    </Animated.View>
  );
});

/**
 * A magnifying dock. A finger slid along the row swells each icon by how near it is, like a
 * bell curve following the finger, and lifts them as they grow. A label rides above the
 * nearest icon and the phone ticks each time the nearest one changes. Lifting the finger on
 * an icon picks it; a short tap picks the icon under it.
 */
export function Dock({ items, onSelect, style }: DockProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [nearest, setNearest] = useState(-1);
  const [width, setWidth] = useState(0);

  const finger = useSharedValue(-1000);
  const touching = useSharedValue(0);
  const lastNear = useSharedValue(-1);
  // Where the label sits. It keeps its last place while it fades out after the finger lifts.
  const tagAt = useSharedValue(0);

  const total = items.length * CELL + (items.length - 1) * GAP;
  const inset = Math.max(0, (width - total) / 2);

  const report = useCallback((index: number) => {
    setNearest(index);
    if (index >= 0) haptic('selection');
  }, []);

  const pick = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) onSelect?.(item.key);
    },
    [items, onSelect],
  );

  const nearestIndex = (x: number) => {
    'worklet';
    const i = Math.round((x - CELL / 2) / PITCH);
    return Math.max(0, Math.min(items.length - 1, i));
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      finger.value = withSpring(e.x - inset, springs.press);
      touching.value = withSpring(1, springs.snappy);
      const near = nearestIndex(e.x - inset);
      lastNear.value = near;
      tagAt.value = near;
      scheduleOnRN(report, near);
    })
    .onUpdate((e) => {
      finger.value = e.x - inset;
      const near = nearestIndex(e.x - inset);
      if (near !== lastNear.value) {
        lastNear.value = near;
        tagAt.value = withSpring(near, springs.snappy);
        scheduleOnRN(report, near);
      }
    })
    .onFinalize(() => {
      touching.value = withSpring(0, springs.bouncy);
      if (lastNear.value >= 0) scheduleOnRN(pick, lastNear.value);
      scheduleOnRN(report, -1);
      lastNear.value = -1;
    });

  const tag = useAnimatedStyle(() => ({
    opacity: touching.value,
    transform: [
      { translateX: inset + tagAt.value * PITCH + CELL / 2 - 50 },
      { translateY: -touching.value * (LIFT + 6) - 34 },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.wrap, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="toolbar"
      >
        <Animated.View pointerEvents="none" style={[styles.tag, { backgroundColor: c.primary, borderRadius: theme.radii.sm }, tag]}>
          <Text variant="caption" tone="onPrimary" weight="medium" numberOfLines={1}>
            {items[nearest]?.label ?? ''}
          </Text>
        </Animated.View>
        <View style={[styles.row, { backgroundColor: c.surfaceSunken, borderColor: c.border, borderRadius: CELL * 0.45 }]}>
          {items.map((item, i) => (
            <DockIcon key={item.key} item={item} index={i} finger={finger} touching={touching} />
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', paddingTop: 70, paddingBottom: 6 },
  row: { flexDirection: 'row', gap: GAP, padding: 8, borderWidth: StyleSheet.hairlineWidth },
  icon: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  tag: { position: 'absolute', left: 0, top: 70, width: 100, paddingVertical: 4, alignItems: 'center' },
});
