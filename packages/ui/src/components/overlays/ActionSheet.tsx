import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph, type GlyphName } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type ActionSheetAction = {
  label: string;
  onPress: () => void;
  icon?: GlyphName;
  destructive?: boolean;
};

export type ActionSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
  /** Space below the sheet, such as the bottom safe-area inset. */
  bottom?: number;
};

const ROW = 56;
const STAGGER = 30;

function Row({
  action,
  index,
  shown,
  last,
  onPick,
}: {
  action: ActionSheetAction;
  index: number;
  shown: SharedValue<number>;
  last: boolean;
  onPick: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const tint = action.destructive ? c.danger : c.text;

  // Each row trails the one above it by a fixed slice of the sheet's own travel, so the
  // stagger stays in step with the spring instead of running on a separate clock.
  const animated = useAnimatedStyle(() => {
    const t = interpolate(shown.value, [index * (STAGGER / 400), index * (STAGGER / 400) + 0.55], [0, 1], 'clamp');
    return { opacity: t, transform: [{ translateY: (1 - t) * 18 }] };
  });

  return (
    <Animated.View style={animated}>
      <PressableScale
        onPress={onPick}
        haptic="selection"
        scaleTo={0.98}
        dimTo={0.6}
        accessibilityLabel={action.label}
        style={[styles.row, !last ? { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth } : null]}
      >
        {action.icon ? <Glyph name={action.icon} size={20} color={tint} /> : null}
        <Text variant="label" style={{ color: tint, fontSize: 17 }}>
          {action.label}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

/**
 * A list of actions from the bottom edge. The sheet rides up on a heavy spring and its rows
 * rise into place one after another, tied to the sheet's own travel. Cancel sits apart so it
 * is always the same reach for the thumb. Drag the sheet down, or tap outside, to dismiss.
 */
export function ActionSheet({ open, onClose, title, message, actions, cancelLabel = 'Cancel', bottom = 0 }: ActionSheetProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [mounted, setMounted] = useState(open);
  const shown = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      drag.value = 0;
      shown.value = withSpring(1, springs.smooth);
    } else if (mounted) {
      shown.value = withTiming(0, { duration: 200 }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      drag.value = e.translationY > 0 ? e.translationY : e.translationY * 0.12;
    })
    .onEnd((e) => {
      if (drag.value > 80 || e.velocityY > 800) scheduleOnRN(onClose);
      else drag.value = withSpring(0, springs.bouncy);
    });

  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(shown.value, [0, 1], [420, 0]) + drag.value }],
  }));
  const backdrop = useAnimatedStyle(() => ({ opacity: shown.value * (1 - Math.min(0.7, drag.value / 300)) }));
  const cancel = useAnimatedStyle(() => {
    const t = interpolate(shown.value, [0.25, 0.9], [0, 1], 'clamp');
    return { opacity: t, transform: [{ translateY: (1 - t) * 24 }] };
  });

  if (!mounted) return null;

  const group = { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: theme.radii.xl };

  return (
    <Portal>
      <View style={fill} pointerEvents="box-none">
        <Animated.View style={[fill, { backgroundColor: c.scrim }, backdrop]} onTouchEnd={onClose} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, { paddingBottom: bottom + 10 }, sheet]}>
            <View style={[styles.group, group]}>
              {title || message ? (
                <View style={[styles.head, { borderBottomColor: c.border }]}>
                  {title ? (
                    <Text variant="caption" weight="semibold" tone="muted" align="center">
                      {title}
                    </Text>
                  ) : null}
                  {message ? (
                    <Text variant="caption" tone="faint" align="center">
                      {message}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {actions.map((action, i) => (
                <Row
                  key={action.label}
                  action={action}
                  index={i}
                  shown={shown}
                  last={i === actions.length - 1}
                  onPick={() => {
                    onClose();
                    action.onPress();
                  }}
                />
              ))}
            </View>
            <Animated.View style={cancel}>
              <PressableScale
                onPress={onClose}
                haptic="light"
                scaleTo={0.98}
                accessibilityLabel={cancelLabel}
                style={[styles.group, styles.row, group]}
              >
                <Text variant="label" weight="semibold" style={{ fontSize: 17 }}>
                  {cancelLabel}
                </Text>
              </PressableScale>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 10, right: 10, bottom: 0, gap: 10 },
  group: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  head: { paddingVertical: 14, paddingHorizontal: 20, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { height: ROW, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
