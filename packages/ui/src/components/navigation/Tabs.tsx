import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { useControllable } from '../../utils/useControllable';

export type TabItem = { key: string; label: string; content?: ReactNode };

export type TabsProps = {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

const PANEL_SPRING = { damping: 26, stiffness: 240, mass: 0.9 };

function Label({
  text,
  index,
  underline,
}: {
  text: string;
  index: number;
  underline: SharedValue<number>;
}) {
  const theme = useTheme();
  const c = theme.colors;
  // Colour follows the underline's position, so a label warms as the line reaches it.
  const animated = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(underline.value - index));
    return { color: interpolateColor(near, [0, 1], [c.textMuted, c.text]) };
  });
  return <Animated.Text style={[styles.label, fontFor(theme, 'medium'), animated]}>{text}</Animated.Text>;
}

/**
 * Tabs with panels. The underline is two edges on two springs: the one leading the move
 * goes first and the trailing one follows, so the line stretches across the gap and then
 * contracts onto the new tab. Panels slide in from the side the new tab lies on.
 */
export function Tabs({ tabs, value: controlled, defaultValue, onChange, style }: TabsProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable<string | undefined>(
    controlled,
    defaultValue ?? tabs[0]?.key,
    onChange as ((value: string | undefined) => void) | undefined,
  );
  const index = Math.max(0, tabs.findIndex((t) => t.key === value));

  const [layouts, setLayouts] = useState<{ x: number; width: number }[]>([]);
  const previous = useRef(index);
  const direction = index >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = index;
  }, [index]);

  const left = useSharedValue(0);
  const right = useSharedValue(0);
  const position = useSharedValue(index);
  const seeded = useSharedValue(false);

  const target = layouts[index];
  useEffect(() => {
    if (!target) return;
    position.value = withSpring(index, springs.snappy);
    if (!seeded.value) {
      left.value = target.x;
      right.value = target.x + target.width;
      seeded.value = true;
      return;
    }
    const forward = target.x >= left.value;
    left.value = withSpring(target.x, forward ? springs.gentle : springs.snappy);
    right.value = withSpring(target.x + target.width, forward ? springs.snappy : springs.gentle);
  }, [target, index, left, right, position, seeded]);

  const line = useAnimatedStyle(() => ({
    width: Math.max(0, right.value - left.value),
    transform: [{ translateX: left.value }],
  }));

  const onLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[i]?.x === x && prev[i]?.width === width) return prev;
      const next = prev.slice();
      next[i] = { x, width };
      return next;
    });
  };

  const active = tabs[index];
  const entering = (direction > 0 ? SlideInRight : SlideInLeft).springify()
    .damping(PANEL_SPRING.damping)
    .stiffness(PANEL_SPRING.stiffness)
    .mass(PANEL_SPRING.mass);
  const exiting = direction > 0 ? SlideOutLeft.duration(160) : SlideOutRight.duration(160);

  return (
    <View style={[styles.wrap, style]}>
      <View accessibilityRole="tablist" style={[styles.row, { borderBottomColor: c.border }]}>
        {tabs.map((tab, i) => (
          <PressableScale
            key={tab.key}
            onLayout={onLayout(i)}
            onPress={() => {
              if (i === index) return;
              haptic('selection');
              setValue(tab.key);
            }}
            haptic={false}
            scaleTo={0.95}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            style={styles.tab}
          >
            <Label text={tab.label} index={i} underline={position} />
          </PressableScale>
        ))}
        <Animated.View style={[styles.line, { backgroundColor: c.accent }, line]} />
      </View>
      <View style={styles.panels}>
        {active ? (
          <Animated.View key={active.key} entering={entering} exiting={exiting} style={styles.panel}>
            {active.content}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { paddingHorizontal: 16, height: 46, justifyContent: 'center' },
  label: { fontSize: 15, lineHeight: 20 },
  line: { position: 'absolute', left: 0, bottom: -1, height: 2.5, borderRadius: 2 },
  panels: { overflow: 'hidden', minHeight: 120 },
  panel: { paddingTop: 16 },
});
