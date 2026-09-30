import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { clamp } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type SegmentedControlProps<T extends string | number = string> = {
  options: { label: string; value: T }[] | T[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PAD = 4;
const HEIGHT = 44;

function Label({
  text,
  index,
  width,
  thumb,
}: {
  text: string;
  index: number;
  width: number;
  thumb: SharedValue<number>;
}) {
  const theme = useTheme();
  const c = theme.colors;
  // Colour follows the thumb's distance, so a label darkens as the thumb arrives.
  const animated = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(thumb.value - index * width) / width);
    return { color: interpolateColor(near, [0, 1], [c.textMuted, c.text]) };
  });

  return (
    <View style={[styles.label, { width }]} pointerEvents="none">
      <Animated.Text style={[styles.text, fontFor(theme, 'medium'), animated]} numberOfLines={1}>
        {text}
      </Animated.Text>
    </View>
  );
}

/**
 * A segmented picker with one thumb shared by every segment. It stretches while it travels,
 * leading with its front edge and trailing with its back, and settles with a little
 * overshoot. The thumb can be grabbed and dragged, and lands on the segment nearest where
 * it was let go.
 */
export function SegmentedControl<T extends string | number = string>({
  options,
  value: controlled,
  defaultValue,
  onChange,
  disabled,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  const items = options.map((o) => (typeof o === 'object' ? o : { label: String(o), value: o }));
  const [value, setValue] = useControllable<T | undefined>(
    controlled,
    defaultValue ?? items[0]?.value,
    onChange as ((value: T | undefined) => void) | undefined,
  );
  const index = Math.max(0, items.findIndex((i) => i.value === value));

  const [width, setWidth] = useState(0);
  const segment = Math.max(0, (width - PAD * 2) / items.length);

  // The thumb's leading and trailing edges are separate springs, so it stretches in transit.
  const left = useSharedValue(index * segment);
  const right = useSharedValue(index * segment + segment);
  const drag = useSharedValue(false);
  const start = useSharedValue(0);
  const current = useSharedValue(index);
  const centre = useSharedValue(index * segment);

  useEffect(() => {
    if (!segment || drag.value) return;
    current.value = index;
    const target = index * segment;
    const forward = target >= left.value;
    // The edge facing the direction of travel is the quicker one.
    left.value = withSpring(target, forward ? springs.gentle : springs.snappy);
    right.value = withSpring(target + segment, forward ? springs.snappy : springs.gentle);
    centre.value = withSpring(target, springs.snappy);
  }, [index, segment, left, right, centre, current, drag]);

  const select = (next: number) => {
    const item = items[next];
    if (!item || item.value === value) return;
    haptic('selection');
    setValue(item.value);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((e) => {
      drag.value = false;
      start.value = e.x - PAD;
    })
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > 6) drag.value = true;
      if (!drag.value) return;
      const x = clamp(start.value + e.translationX - segment / 2, 0, segment * (items.length - 1));
      left.value = x;
      right.value = x + segment;
      centre.value = x;
      const near = Math.round(x / segment);
      if (near !== current.value) {
        current.value = near;
        scheduleOnRN(select, near);
      }
    })
    .onFinalize(() => {
      // Decided here, not in onEnd, which never runs for a touch that did not move. A tap
      // goes to the segment under the finger; a drag lands where the thumb was let go.
      const next = drag.value
        ? current.value
        : clamp(Math.floor(start.value / segment), 0, items.length - 1);
      const snapped = next * segment;
      left.value = withSpring(snapped, springs.snappy);
      right.value = withSpring(snapped + segment, springs.snappy);
      centre.value = withSpring(snapped, springs.snappy);
      current.value = next;
      if (!drag.value) scheduleOnRN(select, next);
      drag.value = false;
    });

  const thumb = useAnimatedStyle(() => ({
    width: Math.max(segment * 0.5, right.value - left.value),
    transform: [{ translateX: left.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="tablist"
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.track,
          { backgroundColor: c.surfaceSunken, borderColor: c.border, borderRadius: theme.radii.pill },
          disabled ? { opacity: 0.45 } : null,
          style,
        ]}
      >
        {segment > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              { backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.pill, boxShadow: theme.shadows.sm },
              thumb,
            ]}
          />
        ) : null}
        {segment > 0
          ? items.map((item, i) => (
              <Label key={String(item.value)} text={item.label} index={i} width={segment} thumb={centre} />
            ))
          : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: HEIGHT,
    padding: PAD,
    alignSelf: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderWidth: StyleSheet.hairlineWidth },
  label: { alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, lineHeight: 18 },
});
