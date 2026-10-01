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
const CORNER = 16;
// Space at each end of the row, so the circle over an end tab stays within the bar.
const INSET = 6;

/**
 * Splits a cubic whose x grows along it at the point where it crosses `at`, and returns the
 * inner control points of both halves and the split point between them:
 * [left c1, left c2, split point, right c1, right c2], each as x, y.
 */
function splitCubic(xs: number[], ys: number[], at: number) {
  'worklet';
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 20; k += 1) {
    const m = (lo + hi) / 2;
    const u = 1 - m;
    const x = u * u * u * xs[0] + 3 * u * u * m * xs[1] + 3 * u * m * m * xs[2] + m * m * m * xs[3];
    if (x < at) lo = m;
    else hi = m;
  }
  const t = (lo + hi) / 2;
  const x01 = xs[0] + (xs[1] - xs[0]) * t;
  const y01 = ys[0] + (ys[1] - ys[0]) * t;
  const x12 = xs[1] + (xs[2] - xs[1]) * t;
  const y12 = ys[1] + (ys[2] - ys[1]) * t;
  const x23 = xs[2] + (xs[3] - xs[2]) * t;
  const y23 = ys[2] + (ys[3] - ys[2]) * t;
  const x012 = x01 + (x12 - x01) * t;
  const y012 = y01 + (y12 - y01) * t;
  const x123 = x12 + (x23 - x12) * t;
  const y123 = y12 + (y23 - y12) * t;
  return [x01, y01, x012, y012, x012 + (x123 - x012) * t, y012 + (y123 - y012) * t, x123, y123, x23, y23];
}

/**
 * The bar's outline: a rectangle with rounded corners whose top edge dips in a smooth bowl
 * around x. Near an end of the bar the bowl takes the corner with it and runs off the edge,
 * so the cut always sits exactly under the circle instead of stopping short of the end tabs.
 */
function barPath(w: number, x: number, nr: number, d: number) {
  'worklet';
  const r = CORNER;
  // Each half of the bowl is one cubic, flat at the shoulder and at the bottom.
  const lx = [x - nr - 10, x - nr + 4, x - nr + 6, x];
  const ly = [0, 0, d, d];
  const rx = [x, x + nr - 6, x + nr - 4, x + nr + 10];
  const ry = [d, d, 0, 0];
  let start: string;
  let left: string;
  if (lx[0] >= r) {
    start = `M 0 ${r}`;
    left = `Q 0 0 ${r} 0 L ${lx[0]} 0 C ${lx[1]} 0 ${lx[2]} ${d} ${x} ${d}`;
  } else if (lx[0] >= 0) {
    // The shoulder reaches into the corner, which tightens to make room.
    start = `M 0 ${lx[0]}`;
    left = `Q 0 0 ${lx[0]} 0 C ${lx[1]} 0 ${lx[2]} ${d} ${x} ${d}`;
  } else {
    const s = splitCubic(lx, ly, 0);
    start = `M 0 ${s[5]}`;
    left = `C ${s[6]} ${s[7]} ${s[8]} ${s[9]} ${x} ${d}`;
  }
  let right: string;
  if (rx[3] <= w - r) {
    right = `C ${rx[1]} ${d} ${rx[2]} 0 ${rx[3]} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r}`;
  } else if (rx[3] <= w) {
    right = `C ${rx[1]} ${d} ${rx[2]} 0 ${rx[3]} 0 Q ${w} 0 ${w} ${w - rx[3]}`;
  } else {
    const s = splitCubic(rx, ry, w);
    right = `C ${s[0]} ${s[1]} ${s[2]} ${s[3]} ${w} ${s[5]}`;
  }
  return [
    start,
    left,
    right,
    `L ${w} ${HEIGHT - r}`,
    `Q ${w} ${HEIGHT} ${w - r} ${HEIGHT}`,
    `L ${r} ${HEIGHT}`,
    `Q 0 ${HEIGHT} 0 ${HEIGHT - r}`,
    'Z',
  ].join(' ');
}

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
  const cell = (width - INSET * 2) / items.length;

  const centre = useSharedValue(0);
  const depth = useSharedValue(1);
  const seeded = useSharedValue(false);

  useEffect(() => {
    if (cell <= 0) return;
    const target = INSET + cell * index + cell / 2;
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
    const nr = NOTCH_R * (0.7 + depth.value * 0.3);
    // The bowl stays centred on the circle, end tabs included.
    return { d: barPath(width, centre.value, nr, nr * depth.value + 2) };
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
  row: { flexDirection: 'row', height: HEIGHT, paddingHorizontal: INSET },
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
