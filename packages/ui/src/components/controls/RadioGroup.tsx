import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { useControllable } from '../../utils/useControllable';

export type RadioOption<T extends string | number = string> = {
  label: string;
  value: T;
  /** A second line under the label. */
  description?: string;
};

export type RadioGroupProps<T extends string | number = string> = {
  options: RadioOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

const DOT = 24;

function Dot({ selected }: { selected: boolean }) {
  const theme = useTheme();
  const c = theme.colors;
  const core = useSharedValue(selected ? 1 : 0);
  const ring = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    core.value = selected ? withSpring(1, springs.bouncy) : withTiming(0, { duration: 120 });
    ring.value = withTiming(selected ? 1 : 0, { duration: 160 });
  }, [selected, core, ring]);

  const outer = useAnimatedStyle(() => ({
    borderColor: interpolateColor(ring.value, [0, 1], [c.borderStrong, c.accent]),
  }));
  const inner = useAnimatedStyle(() => ({
    opacity: Math.min(1, core.value * 2),
    transform: [{ scale: core.value }],
  }));

  return (
    <Animated.View style={[styles.dot, outer]}>
      <Animated.View style={[styles.core, { backgroundColor: c.accent }, inner]} />
    </Animated.View>
  );
}

/**
 * A single choice from a short list. The dot springs into the chosen row, and one highlight
 * slides from the old choice to the new one instead of each row flashing on and off. The
 * highlight takes the height of whichever row it is under, so rows can differ in height.
 */
export function RadioGroup<T extends string | number = string>({
  options,
  value: controlled,
  defaultValue,
  onChange,
  style,
}: RadioGroupProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable<T | undefined>(
    controlled,
    defaultValue,
    onChange as ((value: T | undefined) => void) | undefined,
  );
  const [layouts, setLayouts] = useState<{ y: number; height: number }[]>([]);

  const top = useSharedValue(0);
  const height = useSharedValue(0);
  const shown = useSharedValue(0);
  const seeded = useSharedValue(false);

  const index = options.findIndex((o) => o.value === value);
  const target = layouts[index];

  useEffect(() => {
    if (!target) {
      shown.value = withTiming(0, { duration: 140 });
      return;
    }
    if (!seeded.value) {
      // First placement jumps, so the highlight does not fly in from the corner on mount.
      top.value = target.y;
      height.value = target.height;
      seeded.value = true;
    } else {
      top.value = withSpring(target.y, springs.snappy);
      height.value = withSpring(target.height, springs.snappy);
    }
    shown.value = withTiming(1, { duration: 160 });
  }, [target, top, height, shown, seeded]);

  const highlight = useAnimatedStyle(() => ({
    opacity: shown.value,
    height: height.value,
    transform: [{ translateY: top.value }],
  }));

  const onRowLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { y, height: h } = e.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[i]?.y === y && prev[i]?.height === h) return prev;
      const next = prev.slice();
      next[i] = { y, height: h };
      return next;
    });
  };

  return (
    <View accessibilityRole="radiogroup" style={[styles.group, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.highlight,
          { backgroundColor: c.accentSoft, borderColor: c.accent, borderRadius: theme.radii.md },
          highlight,
        ]}
      />
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={String(option.value)}
            onLayout={onRowLayout(i)}
            onPress={() => {
              if (selected) return;
              haptic('selection');
              setValue(option.value);
            }}
            haptic={false}
            scaleTo={0.985}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={styles.row}
          >
            <Dot selected={selected} />
            <View style={styles.text}>
              <Text variant="label">{option.label}</Text>
              {option.description ? (
                <Text variant="caption" tone="muted">
                  {option.description}
                </Text>
              ) : null}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignSelf: 'stretch', gap: 4 },
  highlight: { position: 'absolute', left: 0, right: 0, top: 0, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14 },
  text: { flex: 1, gap: 2 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: { width: DOT - 11, height: DOT - 11, borderRadius: (DOT - 11) / 2 },
});
