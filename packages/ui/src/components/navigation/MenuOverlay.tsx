import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { fill } from '../../utils/layout';

export type MenuLink = { key: string; label: string };

export type MenuOverlayProps = {
  links: MenuLink[];
  onSelect?: (key: string) => void;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

const BUTTON = 48;
const STAGGER = 60;

function Bars({ open, color }: { open: boolean; color: string }) {
  const p = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(open ? 1 : 0, springs.snappy);
  }, [open, p]);

  const top = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(p.value, [0, 1], [-4, 0]) }, { rotate: `${p.value * 45}deg` }],
  }));
  const bottom = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(p.value, [0, 1], [4, 0]) }, { rotate: `${p.value * -45}deg` }],
  }));

  return (
    <View style={styles.bars}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, top]} />
      <Animated.View style={[styles.bar, styles.barBottom, { backgroundColor: color }, bottom]} />
    </View>
  );
}

function Link({ label, index, reveal, onPress }: { label: string; index: number; reveal: { value: number }; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;

  // Each link rises out of a clipped box, so the text appears to come up from behind a line.
  const rise = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (reveal.value - 0.25 - (index * STAGGER) / 1000) / 0.5));
    return { transform: [{ translateY: (1 - t) * 64 }], opacity: Math.min(1, t * 2) };
  });

  return (
    <PressableScale onPress={onPress} scaleTo={0.97} haptic="light" accessibilityRole="link" accessibilityLabel={label}>
      <View style={styles.clip}>
        <Animated.View style={rise}>
          <Text style={[styles.linkText, fontFor(theme, 'semibold'), { color: c.onPrimary }]}>{label}</Text>
        </Animated.View>
      </View>
    </PressableScale>
  );
}

/**
 * A full-screen menu that opens out of its own button. The hamburger turns into a cross, and
 * a circle of the menu's colour grows from the button until it covers the screen. The links
 * then rise out of clipped boxes one after another. Closing runs backwards, faster.
 */
export function MenuOverlay({ links, onSelect, open: controlled, onOpenChange, style }: MenuOverlayProps) {
  const theme = useTheme();
  const c = theme.colors;
  const screen = useWindowDimensions();
  const button = useRef<View>(null);
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const grow = useSharedValue(0);
  const reveal = useSharedValue(0);

  const set = (next: boolean) => {
    setInner(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (open) {
      button.current?.measureInWindow((x, y, w, h) => {
        setOrigin({ x: x + w / 2, y: y + h / 2 });
        setMounted(true);
        grow.value = withTiming(1, { duration: 620, easing: easings.fluid });
        reveal.value = withTiming(1, { duration: 900, easing: easings.out });
      });
    } else {
      reveal.value = withTiming(0, { duration: 160 });
      grow.value = withDelay(60, withTiming(0, { duration: 380, easing: easings.fluid }));
      const t = setTimeout(() => setMounted(false), 460);
      return () => clearTimeout(t);
    }
  }, [open, grow, reveal]);

  // The circle must reach the farthest corner from the button.
  const reach =
    Math.hypot(Math.max(origin.x, screen.width - origin.x), Math.max(origin.y, screen.height - origin.y)) + 8;

  const disc = useAnimatedStyle(() => ({
    width: reach * 2,
    height: reach * 2,
    borderRadius: reach,
    left: origin.x - reach,
    top: origin.y - reach,
    transform: [{ scale: interpolate(grow.value, [0, 1], [BUTTON / (reach * 2), 1]) }],
  }));

  return (
    <>
      <View ref={button} collapsable={false} style={style}>
        <PressableScale
          onPress={() => {
            haptic('light');
            set(!open);
          }}
          haptic={false}
          scaleTo={0.9}
          accessibilityLabel={open ? 'Close menu' : 'Open menu'}
          accessibilityState={{ expanded: open }}
          style={[
            styles.button,
            { backgroundColor: open ? 'transparent' : c.surfaceSunken, borderColor: c.border, zIndex: 50 },
          ]}
        >
          <Bars open={open} color={open ? c.onPrimary : c.text} />
        </PressableScale>
      </View>
      {mounted ? (
        <Portal>
          <View style={fill} pointerEvents="box-none">
            <Animated.View pointerEvents="none" style={[styles.disc, { backgroundColor: c.primary }, disc]} />
            <View style={[fill, styles.content]} pointerEvents="box-none">
              {links.map((link, i) => (
                <Link
                  key={link.key}
                  label={link.label}
                  index={i}
                  reveal={reveal}
                  onPress={() => {
                    set(false);
                    onSelect?.(link.key);
                  }}
                />
              ))}
            </View>
            {/* Drawn above the disc, because the original button sits beneath it. */}
            <View
              pointerEvents="box-none"
              style={{ position: 'absolute', left: origin.x - BUTTON / 2, top: origin.y - BUTTON / 2 }}
            >
              <PressableScale
                onPress={() => {
                  haptic('light');
                  set(false);
                }}
                haptic={false}
                accessibilityLabel="Close menu"
                style={[styles.button, { borderColor: 'transparent' }]}
              >
                <Bars open color={c.onPrimary} />
              </PressableScale>
            </View>
          </View>
        </Portal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: { width: 20, height: 12, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', width: 20, height: 2, borderRadius: 1 },
  barBottom: {},
  disc: { position: 'absolute' },
  content: { justifyContent: 'center', paddingHorizontal: 32, gap: 6 },
  clip: { overflow: 'hidden', paddingVertical: 4 },
  linkText: { fontSize: 40, lineHeight: 48, letterSpacing: -1.2 },
});
