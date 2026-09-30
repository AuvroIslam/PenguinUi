import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { useControllable } from '../../utils/useControllable';

export type TabBarItem = { key: string; label: string; icon: GlyphName };

export type TabBarProps = {
  items: TabBarItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 60;
const reflow = LinearTransition.springify()
  .mass(springs.smooth.mass)
  .stiffness(springs.smooth.stiffness)
  .damping(springs.smooth.damping);

function TabIcon({ name, active, color }: { name: GlyphName; active: boolean; color: string }) {
  const bounce = useSharedValue(1);
  const first = useSharedValue(true);

  useEffect(() => {
    if (first.value) {
      first.value = false;
      return;
    }
    if (active) {
      bounce.value = withSequence(withTiming(0.7, { duration: 90 }), withSpring(1, springs.bouncy));
    }
  }, [active, bounce, first]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));

  return (
    <Animated.View style={animated}>
      <Glyph name={name} size={22} color={color} strokeWidth={active ? 2 : 1.75} />
    </Animated.View>
  );
}

/**
 * A floating pill of tabs. The chosen tab opens up to show its label while a single
 * highlight slides under it from the last choice, and its icon gives a small bounce. The
 * others close to bare icons, and the whole bar reflows on one spring so the widths never
 * jump.
 */
export function TabBar({ items, value: controlled, defaultValue, onChange, style }: TabBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable<string | undefined>(
    controlled,
    defaultValue ?? items[0]?.key,
    onChange as ((value: string | undefined) => void) | undefined,
  );
  const [layouts, setLayouts] = useState<{ x: number; width: number }[]>([]);

  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const seeded = useSharedValue(false);

  const index = Math.max(0, items.findIndex((i) => i.key === value));
  const target = layouts[index];

  useEffect(() => {
    if (!target) return;
    if (!seeded.value) {
      left.value = target.x;
      width.value = target.width;
      seeded.value = true;
      return;
    }
    // The edge in the direction of travel is the quicker one, so the highlight stretches
    // through the move instead of sliding rigidly.
    const forward = target.x + target.width >= left.value + width.value;
    left.value = withSpring(target.x, forward ? springs.gentle : springs.snappy);
    width.value = withSpring(target.width, springs.snappy);
  }, [target, left, width, seeded]);

  const highlight = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ translateX: left.value }],
  }));

  const onTabLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[i]?.x === x && prev[i]?.width === w) return prev;
      const next = prev.slice();
      next[i] = { x, width: w };
      return next;
    });
  };

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: HEIGHT / 2, boxShadow: theme.shadows.lg },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.highlight, { backgroundColor: c.primary, borderRadius: (HEIGHT - 12) / 2 }, highlight]}
      />
      {items.map((item, i) => {
        const active = item.key === value;
        const tint = active ? c.onPrimary : c.textMuted;
        return (
          <Animated.View key={item.key} layout={reflow} onLayout={onTabLayout(i)}>
            <PressableScale
              onPress={() => {
                if (active) return;
                haptic('selection');
                setValue(item.key);
              }}
              haptic={false}
              scaleTo={0.92}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={styles.tab}
            >
              <TabIcon name={item.icon} active={active} color={tint} />
              {active ? (
                <Animated.View entering={FadeIn.delay(90).duration(180)} exiting={FadeOut.duration(80)}>
                  <Text variant="label" tone="onPrimary" numberOfLines={1}>
                    {item.label}
                  </Text>
                </Animated.View>
              ) : null}
            </PressableScale>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    height: HEIGHT,
    padding: 6,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  highlight: { position: 'absolute', left: 0, top: 6, height: HEIGHT - 12 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: HEIGHT - 12,
    paddingHorizontal: 15,
  },
});
