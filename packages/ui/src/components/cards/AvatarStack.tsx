import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';

export type AvatarPerson = { key: string; name: string; color?: string };

export type AvatarStackProps = {
  people: AvatarPerson[];
  size?: number;
  /** Avatars shown before the rest are summed up as "+N". */
  max?: number;
  style?: StyleProp<ViewStyle>;
};

const FAN_GAP = 10;
const OVERLAP = 0.7;

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function Bubble({
  index,
  count,
  x,
  delay,
  size,
  open,
  children,
  label,
  color,
}: {
  index: number;
  count: number;
  x: number;
  delay: number;
  size: number;
  open: boolean;
  children: ReactNode;
  label?: string;
  color: string;
}) {
  const theme = useTheme();
  const pos = useSharedValue(x);
  const grow = useSharedValue(0);
  const name = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    grow.value = withSpring(1, springs.bouncy);
  }, [grow]);
  useEffect(() => {
    pos.value = withDelay(delay, withSpring(x, springs.snappy));
  }, [x, delay, pos]);
  useEffect(() => {
    name.value = open ? withDelay(delay + 80, withTiming(1, { duration: 200 })) : withTiming(0, { duration: 100 });
  }, [open, delay, name]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value }, { scale: grow.value }],
  }));
  const caption = useAnimatedStyle(() => ({
    opacity: name.value,
    transform: [{ translateY: (1 - name.value) * -6 }],
  }));

  return (
    <Animated.View style={[styles.slot, { zIndex: count - index, width: size }, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            // The ring is the page colour, so overlapping avatars look cut out of each other.
            borderColor: theme.colors.surface,
          },
        ]}
      >
        {children}
      </View>
      {label ? (
        <Animated.View style={[styles.caption, { width: size + FAN_GAP }, caption]}>
          <Text variant="micro" tone="muted" numberOfLines={1} align="center">
            {label}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/**
 * Overlapping avatars. Tap the row and it fans open, each avatar sliding out a beat after
 * the one before and showing its name; tap again and they close back up. A new person
 * scales in at the front and pushes everyone else along on a spring. Anyone past `max`
 * is counted in a final "+N" bubble.
 */
export function AvatarStack({ people, size = 44, max = 5, style }: AvatarStackProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);

  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const pitch = open ? size + FAN_GAP : size * OVERLAP;
  const total = shown.length + (extra > 0 ? 1 : 0);
  const width = (total - 1) * pitch + size;

  const palette = [c.accent, '#3B82F6', '#1E9E5A', '#A855F7', '#D98A0B', '#E0424A', '#0EA5A4', '#6366F1'];
  // Colours are handed out in order of first appearance and then kept, so a person's colour
  // never changes when someone joins, and neighbours only repeat once the palette runs out.
  const colours = useRef(new Map<string, string>());
  for (const p of people) {
    if (!colours.current.has(p.key)) colours.current.set(p.key, palette[colours.current.size % palette.length]);
  }

  return (
    <PressableScale
      onPress={() => {
        haptic('light');
        setOpen((o) => !o);
      }}
      haptic={false}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={`${people.length} people`}
      accessibilityState={{ expanded: open }}
      style={[{ width: width + 4, height: size + (open ? 22 : 0) }, styles.row, style]}
    >
      {shown.map((p, i) => (
        <Bubble
          key={p.key}
          index={i}
          count={total}
          x={i * pitch}
          delay={open ? i * 35 : (total - 1 - i) * 25}
          size={size}
          open={open}
          label={p.name.split(' ')[0]}
          color={p.color ?? colours.current.get(p.key) ?? palette[0]}
        >
          <Text style={[{ color: '#fff', fontSize: size * 0.36, lineHeight: size * 0.44 }, fontFor(theme, 'semibold')]}>
            {initials(p.name)}
          </Text>
        </Bubble>
      ))}
      {extra > 0 ? (
        <Bubble
          key="more"
          index={shown.length}
          count={total}
          x={shown.length * pitch}
          delay={open ? shown.length * 35 : 0}
          size={size}
          open={open}
          color={c.surfaceSunken}
        >
          <Text variant="caption" weight="semibold" tone="muted">
            +{extra}
          </Text>
        </Bubble>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { alignSelf: 'center' },
  slot: { position: 'absolute', left: 0, top: 0, alignItems: 'center' },
  avatar: { borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  caption: { marginTop: 4, alignItems: 'center' },
});
