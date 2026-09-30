import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { useControllable } from '../../utils/useControllable';
import type { TabBarItem } from './TabBar';

export type LiquidTabBarProps = {
  items: (TabBarItem & { icon: GlyphName })[];
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const HEIGHT = 64;
const NOTCH_R = 34;
const CIRCLE = 52;

/**
 * A tab bar whose top edge dips to cradle the chosen tab. The dip is a real cut in the bar's
 * outline that slides along it, following the chosen tab on a spring, while that tab's icon
 * leaves the bar and rises into a circle sitting in the dip. The notch eases in and out of
 * depth as it travels so the bar seems to flow rather than slide.
 */
export function LiquidTabBar({ items, value: controlled, defaultValue, onChange, style }: LiquidTabBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [value, setValue] = useControllable<string | undefined>(
    controlled,
    defaultValue ?? items[0]?.key,
    onChange as ((value: string | undefined) => void) | undefined,
  );
  const [width, setWidth] = useState(0);
  const index = Math.max(0, items.findIndex((i) => i.key === value));
  const cell = width / items.length;

  const centre = useSharedValue(0);
  const depth = useSharedValue(1);
  const seeded = useSharedValue(false);

  useEffect(() => {
    if (!cell) return;
    const target = cell * index + cell / 2;
    if (!seeded.value) {
      centre.value = target;
      seeded.value = true;
      return;
    }
    centre.value = withSpring(target, springs.smooth);
    // The cut flattens a little mid-journey and deepens again on arrival.
    depth.value = withSequence(withTiming(0.55, { duration: 140 }), withSpring(1, springs.bouncy));
  }, [index, cell, centre, depth, seeded]);

  const animatedProps = useAnimatedProps(() => {
    const w = width;
    const r = 16;
    const nr = NOTCH_R * (0.7 + depth.value * 0.3);
    const d = nr * depth.value + 2;
    const x = Math.min(Math.max(centre.value, nr + r), w - nr - r);
    // A bar with rounded corners whose top edge dips in a smooth bowl around x.
    const path = [
      `M 0 ${r}`,
      `Q 0 0 ${r} 0`,
      `L ${x - nr - 10} 0`,
      `C ${x - nr + 4} 0 ${x - nr + 6} ${d} ${x} ${d}`,
      `C ${x + nr - 6} ${d} ${x + nr - 4} 0 ${x + nr + 10} 0`,
      `L ${w - r} 0`,
      `Q ${w} 0 ${w} ${r}`,
      `L ${w} ${HEIGHT - r}`,
      `Q ${w} ${HEIGHT} ${w - r} ${HEIGHT}`,
      `L ${r} ${HEIGHT}`,
      `Q 0 ${HEIGHT} 0 ${HEIGHT - r}`,
      'Z',
    ].join(' ');
    return { d: path };
  });

  const circle = useAnimatedStyle(() => ({
    transform: [{ translateX: centre.value - CIRCLE / 2 }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.wrap, style]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <>
          <Svg width={width} height={HEIGHT} style={styles.svg}>
            <AnimatedPath animatedProps={animatedProps} fill={c.surfaceRaised} stroke={c.border} strokeWidth={StyleSheet.hairlineWidth} />
          </Svg>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.circle,
              { backgroundColor: c.accent, boxShadow: theme.shadows.md },
              circle,
            ]}
          >
            <RisenIcon name={items[index].icon} color={c.onAccent} keyed={items[index].key} />
          </Animated.View>
          <View style={styles.row}>
            {items.map((item, i) => {
              const active = i === index;
              return (
                <PressableScale
                  key={item.key}
                  onPress={() => {
                    if (active) return;
                    haptic('selection');
                    setValue(item.key);
                  }}
                  haptic={false}
                  scaleTo={0.9}
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: active }}
                  style={styles.tab}
                >
                  <SinkingIcon name={item.icon} active={active} color={c.textMuted} />
                </PressableScale>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

function SinkingIcon({ name, active, color }: { name: GlyphName; active: boolean; color: string }) {
  const gone = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    gone.value = withSpring(active ? 1 : 0, springs.snappy);
  }, [active, gone]);
  // The icon leaves the bar upward as its circle takes over, and returns from below.
  const animated = useAnimatedStyle(() => ({
    opacity: 1 - gone.value,
    transform: [{ translateY: interpolate(gone.value, [0, 1], [0, -18]) }, { scale: 1 - gone.value * 0.4 }],
  }));
  return (
    <Animated.View style={animated}>
      <Glyph name={name} size={24} color={color} />
    </Animated.View>
  );
}

function RisenIcon({ name, color, keyed }: { name: GlyphName; color: string; keyed: string }) {
  const rise = useSharedValue(0);
  useEffect(() => {
    rise.value = 0;
    rise.value = withSpring(1, springs.bouncy);
  }, [keyed, rise]);
  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, rise.value * 2),
    transform: [{ translateY: (1 - rise.value) * 16 }, { scale: 0.6 + rise.value * 0.4 }],
  }));
  return (
    <Animated.View style={animated}>
      <Glyph name={name} size={24} color={color} strokeWidth={2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', height: HEIGHT + CIRCLE / 2, justifyContent: 'flex-end' },
  svg: { position: 'absolute', left: 0, bottom: 0 },
  row: { flexDirection: 'row', height: HEIGHT },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
