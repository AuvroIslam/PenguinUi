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
/** Side padding of each tab, and the least it gives up to on a narrow screen. */
const PAD = 16;
const MIN_PAD = 6;

function Label({
  text,
  index,
  underline,
  onWidth,
}: {
  text: string;
  index: number;
  underline: SharedValue<number>;
  onWidth: (width: number) => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  // Colour follows the underline's position, so a label warms as the line reaches it.
  const animated = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(underline.value - index));
    return { color: interpolateColor(near, [0, 1], [c.textMuted, c.text]) };
  });
  return (
    <Animated.Text
      onLayout={(e) => onWidth(e.nativeEvent.layout.width)}
      style={[styles.label, fontFor(theme, 'medium'), animated]}
    >
      {text}
    </Animated.Text>
  );
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

  // The panel on screen trails the chosen tab by one render. That render gives the leaving
  // panel this move's direction, since a panel takes the exit it was last rendered with.
  const [shown, setShown] = useState(index);
  const direction = useRef(1);
  if (index !== shown) direction.current = index > shown ? 1 : -1;
  useEffect(() => {
    if (shown !== index) setShown(index);
  }, [index, shown]);

  // On a narrow screen the tabs give up some of their side padding so every label fits.
  const [rowWidth, setRowWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState<number[]>([]);
  const measured = labelWidths.filter((w) => w > 0).length === tabs.length;
  const textWidth = labelWidths.reduce((sum, w) => sum + (w || 0), 0);
  const pad =
    rowWidth > 0 && measured ? Math.max(MIN_PAD, Math.min(PAD, Math.floor((rowWidth - textWidth) / (tabs.length * 2)))) : PAD;

  const left = useSharedValue(0);
  const right = useSharedValue(0);
  const position = useSharedValue(index);

  // Tabs sit end to end, each its label plus padding on both sides. Worked out here rather
  // than measured, because a change of padding alone does not report a new layout on web.
  let targetX = -1;
  let targetW = 0;
  if (measured) {
    targetX = 0;
    for (let i = 0; i < index; i += 1) targetX += labelWidths[i] + pad * 2;
    targetW = labelWidths[index] + pad * 2;
  }
  // The index the underline was last sent to. When only the layout changed, it jumps.
  const placed = useRef(-1);
  useEffect(() => {
    if (targetX < 0) return;
    position.value = withSpring(index, springs.snappy);
    if (placed.current === -1 || placed.current === index) {
      left.value = targetX;
      right.value = targetX + targetW;
      placed.current = index;
      return;
    }
    placed.current = index;
    const forward = targetX >= left.value;
    left.value = withSpring(targetX, forward ? springs.gentle : springs.snappy);
    right.value = withSpring(targetX + targetW, forward ? springs.snappy : springs.gentle);
  }, [targetX, targetW, index, left, right, position]);

  const line = useAnimatedStyle(() => ({
    width: Math.max(0, right.value - left.value),
    transform: [{ translateX: left.value }],
  }));

  const onLabelWidth = (i: number) => (width: number) => {
    setLabelWidths((prev) => {
      if (prev[i] === width) return prev;
      const next = prev.slice();
      next[i] = width;
      return next;
    });
  };

  const active = tabs[shown] ?? tabs[index];
  const entering = (direction.current > 0 ? SlideInRight : SlideInLeft).springify()
    .damping(PANEL_SPRING.damping)
    .stiffness(PANEL_SPRING.stiffness)
    .mass(PANEL_SPRING.mass);
  const exiting = direction.current > 0 ? SlideOutLeft.duration(160) : SlideOutRight.duration(160);

  return (
    <View style={[styles.wrap, style]}>
      <View
        accessibilityRole="tablist"
        style={[styles.row, { borderBottomColor: c.border }]}
        onLayout={(e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width)}
      >
        {tabs.map((tab, i) => (
          <PressableScale
            key={tab.key}
            onPress={() => {
              if (i === index) return;
              haptic('selection');
              setValue(tab.key);
            }}
            haptic={false}
            scaleTo={0.95}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            style={[styles.tab, { paddingHorizontal: pad }]}
          >
            <Label text={tab.label} index={i} underline={position} onWidth={onLabelWidth(i)} />
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
  tab: { height: 46, justifyContent: 'center' },
  label: { fontSize: 15, lineHeight: 20 },
  line: { position: 'absolute', left: 0, bottom: -1, height: 2.5, borderRadius: 2 },
  panels: { overflow: 'hidden', minHeight: 120 },
  panel: { paddingTop: 16 },
});
