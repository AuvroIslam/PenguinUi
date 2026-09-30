import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { useControllable } from '../../utils/useControllable';

export type ChipOption<T extends string | number = string> = { label: string; value: T };

export type ChipGroupProps<T extends string | number = string> = {
  options: (ChipOption<T> | T)[];
  /** Selected values. A single-select group holds at most one. */
  value?: T[];
  defaultValue?: T[];
  onChange?: (value: T[]) => void;
  multiple?: boolean;
  style?: StyleProp<ViewStyle>;
};

const CHECK = 16;
const reflow = LinearTransition.springify()
  .mass(springs.snappy.mass)
  .stiffness(springs.snappy.stiffness)
  .damping(springs.snappy.damping);

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const fill = useSharedValue(selected ? 1 : 0);
  const mark = useSharedValue(selected ? 1 : 0);
  const slot = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(selected ? 1 : 0, { duration: 180 });
    // The check's slot opens first so the label has already moved over when the tick draws.
    slot.value = withSpring(selected ? 1 : 0, springs.snappy);
    mark.value = selected
      ? withDelay(90, withTiming(1, { duration: 240, easing: easings.out }))
      : withTiming(0, { duration: 90 });
  }, [selected, fill, mark, slot]);

  const chip = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.value, [0, 1], [c.surface, c.primary]),
    borderColor: interpolateColor(fill.value, [0, 1], [c.borderStrong, c.primary]),
  }));
  const label_ = useAnimatedStyle(() => ({
    color: interpolateColor(fill.value, [0, 1], [c.text, c.onPrimary]),
  }));
  const check = useAnimatedStyle(() => ({
    width: CHECK * slot.value,
    marginRight: 6 * slot.value,
    opacity: Math.min(1, slot.value * 1.5),
  }));

  return (
    <Animated.View layout={reflow}>
      <PressableScale
        onPress={onPress}
        haptic={false}
        scaleTo={0.94}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: selected }}
      >
        <Animated.View style={[styles.chip, { borderRadius: theme.radii.pill }, chip]}>
          <Animated.View style={[styles.check, check]}>
            <DrawnCheck progress={mark} size={CHECK} color={c.onPrimary} strokeWidth={2.4} />
          </Animated.View>
          <Animated.Text
            style={[{ fontSize: 14, lineHeight: 18 }, theme.fonts.medium ? { fontFamily: theme.fonts.medium } : { fontWeight: '500' }, label_]}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Chips for picking one thing or several. A chosen chip fills in, and as it does a slot
 * opens at its left edge, pushing the label over, and a check draws into that slot. The
 * chips around it slide to make room, so the row never jumps.
 */
export function ChipGroup<T extends string | number = string>({
  options,
  value: controlled,
  defaultValue = [],
  onChange,
  multiple = false,
  style,
}: ChipGroupProps<T>) {
  const [selected, setSelected] = useControllable<T[]>(controlled, defaultValue, onChange);
  const items = options.map((o) => (typeof o === 'object' ? o : { label: String(o), value: o }));

  const toggle = (value: T) => {
    haptic('selection');
    const has = selected.includes(value);
    if (multiple) {
      setSelected(has ? selected.filter((v) => v !== value) : [...selected, value]);
    } else {
      setSelected(has ? [] : [value]);
    }
  };

  return (
    <View style={[styles.row, style]}>
      {items.map((item) => (
        <Chip
          key={String(item.value)}
          label={item.label}
          selected={selected.includes(item.value)}
          onPress={() => toggle(item.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  check: { height: CHECK, overflow: 'hidden', alignItems: 'flex-start' },
});
