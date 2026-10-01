import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';

export type ReorderListProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, active: boolean) => ReactNode;
  /** Called with the new order when a row is dropped somewhere new. */
  onReorder: (items: T[]) => void;
  /** Height of every row. Rows must all be this tall. */
  rowHeight?: number;
  /** Space between rows. */
  gap?: number;
  /** Corner radius of a row, so the lifted shadow follows its shape. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

type RowProps = {
  id: string;
  initialSlot: number;
  pitch: number;
  radius: number;
  count: number;
  rowHeight: number;
  order: SharedValue<Record<string, number>>;
  active: SharedValue<string>;
  onLift: (id: string) => void;
  onSlot: () => void;
  onDrop: () => void;
  children: ReactNode;
};

function Row({ id, initialSlot, pitch, radius, count, rowHeight, order, active, onLift, onSlot, onDrop, children }: RowProps) {
  const theme = useTheme();
  const top = useSharedValue(initialSlot * pitch);
  const lifted = useSharedValue(0);
  const startTop = useSharedValue(0);

  // Rows that are not being dragged follow their slot on a spring, which is what makes them
  // step out of the way as the dragged row passes.
  useAnimatedReaction(
    () => order.value[id],
    (slot, prev) => {
      if (slot === undefined || slot === prev) return;
      if (active.value !== id) top.value = withSpring(slot * pitch, springs.snappy);
    },
  );

  const gesture = Gesture.Pan()
    .activateAfterLongPress(260)
    .onStart(() => {
      active.value = id;
      startTop.value = top.value;
      lifted.value = withSpring(1, springs.snappy);
      scheduleOnRN(onLift, id);
    })
    .onUpdate((e) => {
      top.value = clamp(startTop.value + e.translationY, 0, (count - 1) * pitch);
      const target = clamp(Math.round(top.value / pitch), 0, count - 1);
      const from = order.value[id];
      if (target === from) return;
      // Move this row to the new slot and shift everything between by one.
      const next = { ...order.value };
      for (const key in next) {
        const slot = next[key];
        if (key === id) continue;
        if (target > from && slot > from && slot <= target) next[key] = slot - 1;
        if (target < from && slot < from && slot >= target) next[key] = slot + 1;
      }
      next[id] = target;
      order.value = next;
      scheduleOnRN(onSlot);
    })
    .onFinalize(() => {
      if (active.value !== id) return;
      top.value = withSpring(order.value[id] * pitch, springs.bouncy);
      lifted.value = withSpring(0, springs.smooth);
      active.value = '';
      scheduleOnRN(onDrop);
    });

  const animated = useAnimatedStyle(() => ({
    zIndex: active.value === id ? 10 : 1,
    transform: [{ translateY: top.value }, { scale: 1 + lifted.value * 0.03 }],
    boxShadow: lifted.value > 0.05 ? theme.shadows.lg : '0 0 0 rgba(0,0,0,0)',
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.row, { height: rowHeight, borderRadius: radius }, animated]}>{children}</Animated.View>
    </GestureDetector>
  );
}

/**
 * A list you reorder by hand. A long press lifts the row: it grows a touch and casts a
 * deeper shadow, and the phone gives a firm tap. Drag it, and the rows it passes step out of
 * the way on springs, ticking as each slot changes. Let go and it drops into its new slot
 * with a small bounce.
 */
export function ReorderList<T>({
  items,
  keyOf,
  renderItem,
  onReorder,
  rowHeight = 58,
  gap = 8,
  radius = 16,
  style,
}: ReorderListProps<T>) {
  const pitch = rowHeight + gap;
  const ids = items.map(keyOf);
  const order = useSharedValue<Record<string, number>>(Object.fromEntries(ids.map((id, i) => [id, i])));
  const active = useSharedValue('');
  const [lifted, setLifted] = useState<string | null>(null);

  // Take on a new order from outside, such as after onReorder has been applied.
  useEffect(() => {
    order.value = Object.fromEntries(ids.map((id, i) => [id, i]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  const onLift = (id: string) => {
    haptic('medium');
    setLifted(id);
  };
  const onSlot = () => haptic('selection');
  const onDrop = () => {
    setLifted(null);
    const slots = order.value;
    const next = [...items].sort((a, b) => slots[keyOf(a)] - slots[keyOf(b)]);
    if (next.some((item, i) => item !== items[i])) onReorder(next);
  };

  return (
    <View style={[styles.list, { height: pitch * items.length - gap }, style]}>
      {items.map((item, i) => {
        const id = keyOf(item);
        return (
          <Row
            key={id}
            id={id}
            initialSlot={i}
            pitch={pitch}
            radius={radius}
            count={items.length}
            rowHeight={rowHeight}
            order={order}
            active={active}
            onLift={onLift}
            onSlot={onSlot}
            onDrop={onDrop}
          >
            {renderItem(item, lifted === id)}
          </Row>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { alignSelf: 'stretch' },
  row: { position: 'absolute', left: 0, right: 0, top: 0 },
});
