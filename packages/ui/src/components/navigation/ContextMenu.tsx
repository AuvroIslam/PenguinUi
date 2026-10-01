import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type ContextMenuItem = {
  key: string;
  label: string;
  icon?: GlyphName;
  destructive?: boolean;
};

export type ContextMenuProps = {
  children: ReactNode;
  items: ContextMenuItem[];
  onSelect: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

const MENU_W = 220;
const ROW = 48;
const PAD = 6;
const EDGE = 12;

type Frame = { x: number; y: number; width: number; height: number };

/**
 * A long-press menu. Pressing lifts the item toward you, and past the hold threshold the
 * backdrop dims and a menu scales out from the item's own corner. Keep the finger down and
 * slide across the rows to pick one by letting go on it, or lift and tap. The menu opens
 * above or below the item, whichever has room, and aligns to the side with room.
 */
export function ContextMenu({ children, items, onSelect, style }: ContextMenuProps) {
  const theme = useTheme();
  const c = theme.colors;
  const screen = useWindowDimensions();
  const box = useRef<View>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [open, setOpen] = useState(false);

  const lift = useSharedValue(0);
  const show = useSharedValue(0);
  const hover = useSharedValue(-1);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const menuTop = useSharedValue(0);
  const menuLeft = useSharedValue(0);

  const menuH = items.length * ROW + PAD * 2;

  const begin = () => {
    box.current?.measureInWindow((x, y, width, height) => {
      const below = y + height + 10 + menuH <= screen.height - 80;
      const top = below ? y + height + 10 : Math.max(EDGE, y - 10 - menuH);
      const right = x + width / 2 > screen.width / 2;
      const left = right ? Math.max(EDGE, x + width - MENU_W) : Math.min(x, screen.width - MENU_W - EDGE);
      menuTop.value = top;
      menuLeft.value = left;
      // The menu grows from the corner nearest the item.
      originX.value = right ? MENU_W : 0;
      originY.value = below ? 0 : menuH;
      setFrame({ x, y, width, height });
      setOpen(true);
      haptic('medium');
      show.value = withSpring(1, springs.smooth);
    });
  };

  const close = (pick?: number) => {
    show.value = withTiming(0, { duration: 160 });
    lift.value = withSpring(0, springs.bouncy);
    hover.value = -1;
    setTimeout(() => setOpen(false), 180);
    if (pick !== undefined && items[pick]) {
      haptic('selection');
      onSelect(items[pick].key);
    }
  };

  const rowAt = (absY: number) => {
    'worklet';
    const i = Math.floor((absY - menuTop.value - PAD) / ROW);
    return i >= 0 && i < items.length ? i : -1;
  };
  const tick = () => haptic('selection');

  const press = Gesture.LongPress()
    .minDuration(380)
    .onBegin(() => {
      lift.value = withSpring(1, springs.press);
    })
    .onStart(() => {
      scheduleOnRN(begin);
    })
    .onFinalize((_e, success) => {
      if (!success) lift.value = withSpring(0, springs.bouncy);
    });

  const slide = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_e, state) => {
      if (show.value > 0.5) state.activate();
    })
    .onUpdate((e) => {
      const i = rowAt(e.absoluteY);
      if (i !== hover.value) {
        hover.value = i;
        if (i >= 0) scheduleOnRN(tick);
      }
    })
    .onEnd(() => {
      scheduleOnRN(close, hover.value >= 0 ? hover.value : undefined);
    });

  const gesture = Gesture.Simultaneous(press, slide);

  const backdrop = useAnimatedStyle(() => ({ opacity: show.value }));
  const lifted = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(lift.value, [0, 1], [1, 1.04]) }],
  }));
  const menu = useAnimatedStyle(() => ({
    opacity: Math.min(1, show.value * 1.6),
    top: menuTop.value,
    left: menuLeft.value,
    // Array form: the string parser reads neither decimals nor negative values.
    transformOrigin: [Math.round(originX.value), Math.round(originY.value), 0],
    transform: [{ scale: interpolate(show.value, [0, 1], [0.6, 1]) }],
  }));

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View ref={box as never} style={[style, lifted]}>
          {children}
        </Animated.View>
      </GestureDetector>
      {open && frame ? (
        <Portal>
          <View style={fill} pointerEvents="box-none">
            <Animated.View
              style={[fill, { backgroundColor: c.scrim }, backdrop]}
              onTouchEnd={() => {
                if (show.value > 0.9) close();
              }}
            />
            <Animated.View
              style={[
                styles.menu,
                {
                  width: MENU_W,
                  backgroundColor: c.surfaceRaised,
                  borderColor: c.border,
                  borderRadius: theme.radii.lg,
                  boxShadow: theme.shadows.lg,
                },
                menu,
              ]}
            >
              {items.map((item, i) => (
                <MenuRow key={item.key} item={item} index={i} hover={hover} show={show} onPress={() => close(i)} />
              ))}
            </Animated.View>
          </View>
        </Portal>
      ) : null}
    </>
  );
}

function MenuRow({
  item,
  index,
  hover,
  show,
  onPress,
}: {
  onPress: () => void;
  item: ContextMenuItem;
  index: number;
  hover: { value: number };
  show: { value: number };
}) {
  const theme = useTheme();
  const c = theme.colors;
  const tint = item.destructive ? c.danger : c.text;

  const row = useAnimatedStyle(() => {
    // Rows arrive one after another: each waits for the menu to be a little further open.
    const arrive = Math.min(1, Math.max(0, (show.value - index * 0.08) / 0.6));
    return {
      opacity: arrive,
      transform: [{ translateY: (1 - arrive) * 8 }],
      backgroundColor:
        hover.value === index ? (item.destructive ? c.dangerSoft : c.surfaceSunken) : 'transparent',
    };
  });

  return (
    <Pressable onPress={onPress} accessibilityRole="menuitem" accessibilityLabel={item.label}>
      <Animated.View style={[styles.row, { borderRadius: theme.radii.md }, row]}>
        <Text variant="label" style={{ color: tint }}>
          {item.label}
        </Text>
        {item.icon ? <Glyph name={item.icon} size={20} color={tint} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: { position: 'absolute', padding: PAD, borderWidth: StyleSheet.hairlineWidth },
  row: {
    height: ROW,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
