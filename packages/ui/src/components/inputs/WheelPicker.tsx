import { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type WheelItem<T extends string | number = string> = { label: string; value: T };

export type WheelPickerProps<T extends string | number = string> = {
  items: (WheelItem<T> | T)[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  /** Rows on the cylinder. Odd numbers centre on the selection. */
  visible?: 3 | 5 | 7;
  itemHeight?: number;
  /** Width of the wheel. Stretches to its container when left out. */
  width?: number;
  style?: StyleProp<ViewStyle>;
};

// How far around the cylinder each row sits, in radians.
const STEP_ANGLE = 0.52;

type RowProps = {
  label: string;
  index: number;
  height: number;
  scrollY: SharedValue<number>;
  selected: boolean;
  /** Stable across renders, so turning the wheel re-renders only the rows whose selection changed. */
  onPress: (index: number) => void;
};

const Row = memo(function Row({ label, index, height, scrollY, selected, onPress }: RowProps) {
  const radius = height / STEP_ANGLE;

  const animated = useAnimatedStyle(() => {
    // Signed distance from the centre, in rows.
    const d = clamp(index - scrollY.value / height, -3, 3);
    const theta = d * STEP_ANGLE;
    // Rows sit on a real cylinder: they drop toward the axis as they turn away.
    const lift = radius * Math.sin(theta) - d * height;
    const facing = Math.cos(theta);
    return {
      opacity: Math.max(0, facing * facing * facing),
      transform: [
        { perspective: 700 },
        { translateY: lift },
        { rotateX: `${-theta}rad` },
      ],
    };
  });

  return (
    <Pressable onPress={() => onPress(index)} accessibilityRole="button" accessibilityState={{ selected }}>
      <Animated.View style={[styles.row, { height }, animated]}>
        <Text variant="heading" weight="medium" numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

/**
 * A wheel picker on a real cylinder. Rows turn away from the viewer as they leave the centre,
 * dropping toward the axis and fading as they go, and the wheel snaps to a row when it
 * settles. Every row that passes the centre ticks. Tapping a row turns the wheel to it.
 */
export function WheelPicker<T extends string | number = string>({
  items,
  value: controlled,
  defaultValue,
  onChange,
  visible = 5,
  itemHeight = 44,
  width,
  style,
}: WheelPickerProps<T>) {
  const theme = useTheme();
  const c = theme.colors;

  const rows: WheelItem<T>[] = items.map((item) =>
    typeof item === 'object' ? item : { label: String(item), value: item },
  );
  const [value, setValue] = useControllable<T | undefined>(
    controlled,
    defaultValue ?? rows[0]?.value,
    onChange as ((value: T | undefined) => void) | undefined,
  );
  const selectedIndex = Math.max(0, rows.findIndex((r) => r.value === value));

  const scrollY = useSharedValue(selectedIndex * itemHeight);
  const lastIndex = useSharedValue(selectedIndex);
  const ref = useAnimatedRef<Animated.ScrollView>();

  const height = itemHeight * visible;
  const pad = (itemHeight * (visible - 1)) / 2;

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const commit = useCallback(
    (index: number) => {
      haptic('selection');
      const next = rowsRef.current[index];
      if (next) setValue(next.value);
    },
    [setValue],
  );

  const handler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    const index = clamp(Math.round(e.contentOffset.y / itemHeight), 0, rows.length - 1);
    if (index !== lastIndex.value) {
      lastIndex.value = index;
      scheduleOnRN(commit, index);
    }
  });

  // Turn the wheel when the value changes from outside.
  useEffect(() => {
    if (lastIndex.value === selectedIndex) return;
    lastIndex.value = selectedIndex;
    ref.current?.scrollTo({ y: selectedIndex * itemHeight, animated: true });
  }, [selectedIndex, itemHeight, lastIndex, ref]);

  const turnTo = useCallback(
    (index: number) => ref.current?.scrollTo({ y: index * itemHeight, animated: true }),
    [ref, itemHeight],
  );

  // `contentOffset` is not honoured on every platform, so the first position is also set by hand.
  const placed = useRef(false);
  const place = () => {
    if (placed.current) return;
    placed.current = true;
    ref.current?.scrollTo({ y: selectedIndex * itemHeight, animated: false });
  };

  return (
    <View
      style={[
        styles.wheel,
        { height, backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.lg },
        width ? { width } : null,
        style,
      ]}
    >
      {/* The selection band sits behind the rows so the centred row reads as inside it. */}
      <View
        style={[
          styles.band,
          {
            top: pad,
            height: itemHeight,
            backgroundColor: c.surfaceSunken,
            borderRadius: theme.radii.md,
          },
        ]}
      />
      <Animated.ScrollView
        ref={ref}
        onScroll={handler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: selectedIndex * itemHeight }}
        onLayout={place}
        contentContainerStyle={{ paddingVertical: pad }}
        overScrollMode="never"
        bounces={false}
      >
        {rows.map((item, i) => (
          <Row
            key={String(item.value)}
            label={item.label}
            index={i}
            height={itemHeight}
            scrollY={scrollY}
            selected={i === selectedIndex}
            onPress={turnTo}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  band: { position: 'absolute', left: 8, right: 8, pointerEvents: 'none' },
  row: { alignItems: 'center', justifyContent: 'center' },
});
