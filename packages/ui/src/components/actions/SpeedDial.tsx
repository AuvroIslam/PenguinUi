import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { durations, easings, springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type SpeedDialAction = {
  key: string;
  label: string;
  icon: GlyphName | ReactNode;
  onPress?: () => void;
};

export type SpeedDialProps = {
  actions: SpeedDialAction[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: 'bottom-right' | 'bottom-left';
  /** Distance from the bottom and side edges of the container. */
  inset?: number;
  /** Icon on the main button. It rotates 45 degrees when open, so a plus becomes a cross. */
  icon?: GlyphName;
  accessibilityLabel?: string;
};

const FAB = 56;
const ACTION = 46;
const GAP = 12;

function DialAction({
  action,
  index,
  count,
  open,
  side,
  onSelect,
}: {
  action: SpeedDialAction;
  index: number;
  count: number;
  open: boolean;
  side: 'left' | 'right';
  onSelect: (action: SpeedDialAction) => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const p = useSharedValue(0);

  useEffect(() => {
    // Opens nearest-first and closes furthest-first, so the stack grows from and folds into the button.
    p.value = open
      ? withDelay(index * 40, withSpring(1, springs.bouncy))
      : withDelay((count - 1 - index) * 28, withTiming(0, { duration: 140, easing: easings.fluid }));
  }, [open, index, count, p]);

  const item = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, p.value * 1.6)),
    transform: [{ translateY: (1 - p.value) * 18 }, { scale: interpolate(p.value, [0, 1], [0.6, 1]) }],
  }));

  const label = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, p.value * 2 - 0.6)),
    transform: [{ translateX: (1 - p.value) * (side === 'right' ? 10 : -10) }],
  }));

  return (
    <View style={[styles.action, { flexDirection: side === 'right' ? 'row' : 'row-reverse' }]}>
      <Animated.View
        style={[
          styles.label,
          { backgroundColor: c.surfaceRaised, borderColor: c.border, boxShadow: theme.shadows.sm },
          label,
        ]}
      >
        <Text variant="caption" weight="medium">
          {action.label}
        </Text>
      </Animated.View>
      <Animated.View style={item}>
        <PressableScale
          scaleTo={0.9}
          haptic="selection"
          accessibilityLabel={action.label}
          onPress={() => onSelect(action)}
          style={[
            styles.actionButton,
            { backgroundColor: c.surfaceRaised, borderColor: c.border, boxShadow: theme.shadows.md },
          ]}
        >
          {typeof action.icon === 'string' ? (
            <Glyph name={action.icon as GlyphName} size={20} />
          ) : (
            action.icon
          )}
        </PressableScale>
      </Animated.View>
    </View>
  );
}

/**
 * A floating action button that opens a stack of actions. Place it as the last child of
 * the screen it floats over: it fills its parent so the scrim can cover the content.
 */
export function SpeedDial({
  actions,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-right',
  inset = 20,
  icon = 'plus',
  accessibilityLabel = 'Actions',
}: SpeedDialProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useControllable(controlled, defaultOpen, onOpenChange);
  const side = placement === 'bottom-right' ? 'right' : 'left';

  const turn = useSharedValue(open ? 1 : 0);
  const dim = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    turn.value = withSpring(open ? 1 : 0, springs.bouncy);
    dim.value = withTiming(open ? 1 : 0, { duration: durations.base, easing: easings.fluid });
  }, [open, turn, dim]);

  const scrim = useAnimatedStyle(() => ({ opacity: dim.value }));
  const rotate = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(turn.value, [0, 1], [0, 45])}deg` }],
  }));

  const select = (action: SpeedDialAction) => {
    setOpen(false);
    action.onPress?.();
  };

  return (
    <View style={styles.root}>
      <Animated.View
        style={[fill, { backgroundColor: c.scrim, pointerEvents: open ? 'auto' : 'none' }, scrim]}
      >
        <Pressable style={fill} accessibilityLabel="Close actions" onPress={() => setOpen(false)} />
      </Animated.View>

      <View
        style={[
          styles.cluster,
          { bottom: inset, alignItems: side === 'right' ? 'flex-end' : 'flex-start' },
          side === 'right' ? { right: inset } : { left: inset },
        ]}
      >
        <View
          style={[
            styles.stack,
            { alignItems: side === 'right' ? 'flex-end' : 'flex-start', pointerEvents: open ? 'box-none' : 'none' },
          ]}
        >
          {actions
            .map((action, index) => (
              <DialAction
                key={action.key}
                action={action}
                index={index}
                count={actions.length}
                open={open}
                side={side}
                onSelect={select}
              />
            ))
            .reverse()}
        </View>

        <PressableScale
          scaleTo={0.92}
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(!open)}
          style={[styles.fab, { backgroundColor: c.primary, boxShadow: theme.shadows.lg }]}
        >
          <Animated.View style={rotate}>
            <Glyph name={icon} size={24} color={c.onPrimary} strokeWidth={2} />
          </Animated.View>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...fill, pointerEvents: 'box-none' },
  cluster: { position: 'absolute', pointerEvents: 'box-none' },
  stack: { marginBottom: GAP, gap: GAP },
  action: { alignItems: 'center', gap: 10, paddingHorizontal: (FAB - ACTION) / 2 },
  actionButton: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  fab: {
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
