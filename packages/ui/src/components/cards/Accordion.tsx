import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { Collapse } from './Collapse';

export type AccordionItem = { key: string; title: string; content: ReactNode };

export type AccordionProps = {
  items: AccordionItem[];
  /** Allow more than one section open at a time. */
  multiple?: boolean;
  defaultOpen?: string[];
  /**
   * `joined` keeps the sections in one block. `detached` lifts the open section out of the
   * block, with a gap opening above and below it and its corners rounding out.
   */
  variant?: 'joined' | 'detached';
  style?: StyleProp<ViewStyle>;
};

const GAP = 10;

function Section({
  item,
  open,
  first,
  last,
  detached,
  prevOpen,
  nextOpen,
  onToggle,
}: {
  item: AccordionItem;
  open: boolean;
  first: boolean;
  last: boolean;
  detached: boolean;
  prevOpen: boolean;
  nextOpen: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const progress = useSharedValue(open ? 1 : 0);
  const apartAbove = detached && !first && (open || prevOpen);
  const apartBelow = detached && !last && (open || nextOpen);
  const apart = useSharedValue(apartAbove ? 1 : 0);
  const below = useSharedValue(apartBelow ? 1 : 0);

  // In the detached variant a section steps away from the one above whenever either of
  // them is open, so the open section always floats on its own.
  useEffect(() => {
    apart.value = withSpring(apartAbove ? 1 : 0, springs.smooth);
    below.value = withSpring(apartBelow ? 1 : 0, springs.smooth);
  }, [apartAbove, apartBelow, apart, below]);

  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 180}deg` }] }));
  const box = useAnimatedStyle(() => {
    const r = theme.radii.lg;
    const a = apart.value;
    // Corners facing a neighbour are square while joined and round out as the gap opens.
    const b = below.value;
    return {
      marginTop: a * GAP,
      borderTopLeftRadius: first ? r : r * a,
      borderTopRightRadius: first ? r : r * a,
      borderBottomLeftRadius: last ? r : r * b,
      borderBottomRightRadius: last ? r : r * b,
    };
  });

  return (
    <Animated.View
      style={[
        styles.section,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          // A section that has stepped away needs its own top edge; joined ones share the
          // bottom edge of the section above.
          borderTopWidth: first || apartAbove ? StyleSheet.hairlineWidth : 0,
        },
        box,
      ]}
    >
      <PressableScale
        onPress={onToggle}
        haptic={false}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={item.title}
        style={styles.header}
      >
        <Text variant="label" style={styles.title}>
          {item.title}
        </Text>
        <Animated.View style={chevron}>
          <Glyph name="chevron-down" size={18} color={c.textMuted} />
        </Animated.View>
      </PressableScale>
      <Collapse open={open} progress={progress}>
        <View style={styles.body}>
          {typeof item.content === 'string' ? (
            <Text variant="body" tone="muted">
              {item.content}
            </Text>
          ) : (
            item.content
          )}
        </View>
      </Collapse>
    </Animated.View>
  );
}

/**
 * Collapsible sections. A section springs open by its own height, the chevron turns in step,
 * and the content fades in as it is uncovered. In the `detached` variant the open section
 * also separates from its neighbours, so the one being read stands on its own.
 */
export function Accordion({ items, multiple = false, defaultOpen = [], variant = 'joined', style }: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);

  const toggle = (key: string) => {
    haptic('selection');
    setOpen((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return multiple ? [...prev, key] : [key];
    });
  };

  return (
    <View style={[styles.wrap, style]}>
      {items.map((item, i) => (
        <Section
          key={item.key}
          item={item}
          open={open.includes(item.key)}
          prevOpen={i > 0 && open.includes(items[i - 1].key)}
          nextOpen={i < items.length - 1 && open.includes(items[i + 1].key)}
          first={i === 0}
          last={i === items.length - 1}
          detached={variant === 'detached'}
          onToggle={() => toggle(item.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  section: { borderWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
  title: { flex: 1 },
  body: { paddingHorizontal: 18, paddingBottom: 18 },
});
