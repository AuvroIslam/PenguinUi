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

/** Largest cell. Cells shrink below it when the row would not otherwise fit. */
const CELL = 52;
const GAP = 6;
const PAD = 8;
const REACH = 1.35;
const PEAK = 0.78;
const LIFT = 16;
/** Width of the box the label is centred in. */
const TAG = 100;

type IconProps = {
  item: DockItem;
  index: number;
  cell: number;
  finger: SharedValue<number>;
  touching: SharedValue<number>;
};

const DockIcon = memo(function DockIcon({ item, index, cell, finger, touching }: IconProps) {
  const theme = useTheme();
  const c = theme.colors;
  const pitch = cell + GAP;

  const animated = useAnimatedStyle(() => {
    // Distance from the finger in cells, run through a bell curve: the nearest icon grows
    // most, and its neighbours follow it down smoothly. With no finger, everything is at rest.
    const d = (finger.value - index * pitch - cell / 2) / pitch;
    const bell = Math.exp(-(d * d) / (REACH * REACH)) * touching.value;
    return {
      // The more an icon has grown, the further forward it sits, so the nearest one is never
      // covered by a smaller neighbour.
      zIndex: Math.round(bell * 100),
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
        {
          width: cell,
          height: cell,
          backgroundColor: c.surface,
          borderColor: c.border,
          borderRadius: cell * 0.3,
          boxShadow: theme.shadows.sm,
        },
        animated,
      ]}
    >
      <Glyph name={item.icon} size={Math.round((24 * cell) / CELL)} color={c.text} />
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

  const n = items.length;
  // On a narrow screen the cells shrink so the whole row, padding included, fits the width.
  const cell = width > 0 ? Math.max(1, Math.min(CELL, (width - (PAD + StyleSheet.hairlineWidth) * 2 - GAP * (n - 1)) / n)) : CELL;
  const pitch = cell + GAP;
  const total = n * cell + (n - 1) * GAP;
  // The row is centred, so this is where its first icon starts.
  const inset = (width - total) / 2;

  // The label keeps the last name while it fades out after the finger lifts.
  const report = useCallback((index: number) => {
    setNearest(index);
    haptic('selection');
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
    const i = Math.round((x - cell / 2) / pitch);
    return Math.max(0, Math.min(n - 1, i));
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
      lastNear.value = -1;
    });

  const tag = useAnimatedStyle(() => ({
    opacity: touching.value,
    transform: [
      { translateX: inset + tagAt.value * pitch + cell / 2 - TAG / 2 },
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
        <Animated.View pointerEvents="none" style={[styles.tag, tag]}>
          {/* The pill hugs the name, so a long one near the end of the row still fits on screen. */}
          <View style={[styles.pill, { backgroundColor: c.primary, borderRadius: theme.radii.sm }]}>
            <Text variant="caption" tone="onPrimary" weight="medium" numberOfLines={1}>
              {items[nearest]?.label ?? ''}
            </Text>
          </View>
        </Animated.View>
        <View style={[styles.row, { backgroundColor: c.surfaceSunken, borderColor: c.border, borderRadius: cell * 0.45 }]}>
          {items.map((item, i) => (
            <DockIcon key={item.key} item={item} index={i} cell={cell} finger={finger} touching={touching} />
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', paddingTop: 70, paddingBottom: 6 },
  row: { flexDirection: 'row', gap: GAP, padding: PAD, borderWidth: StyleSheet.hairlineWidth },
  icon: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  tag: { position: 'absolute', left: 0, top: 70, width: TAG, alignItems: 'center' },
  pill: { paddingVertical: 4, paddingHorizontal: 10, maxWidth: TAG },
});
