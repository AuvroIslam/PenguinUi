import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type TooltipProps = {
  content: string;
  children: ReactNode;
  /** Preferred side. The tooltip flips when there is not room on that side. */
  placement?: 'top' | 'bottom';
  /** How the tooltip is shown. Long press keeps a tap free for the control's own action. */
  trigger?: 'longPress' | 'press';
  /** Milliseconds before it hides on its own. */
  duration?: number;
};

const ARROW = 7;
const GAP = 8;
const EDGE = 12;

type Anchor = { x: number; y: number; width: number; height: number };

/**
 * A hint anchored to the control it describes. It grows out of its own arrow, so it seems
 * to come from the control rather than appear near it, and it flips above or below and
 * slides along the edge to stay on screen while the arrow keeps pointing at the anchor.
 */
export function Tooltip({ content, children, placement = 'top', trigger = 'longPress', duration = 2200 }: TooltipProps) {
  const theme = useTheme();
  const c = theme.colors;
  const screen = useWindowDimensions();
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const shown = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const hide = () => {
    clearTimeout(timer.current);
    shown.value = withTiming(0, { duration: 120 }, (done) => {
      if (done) scheduleOnRN(setAnchor, null);
    });
  };

  const show = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      haptic('selection');
      setSize(null);
      setAnchor({ x, y, width, height });
      clearTimeout(timer.current);
      timer.current = setTimeout(hide, duration);
    });
  };

  const gesture =
    trigger === 'longPress'
      ? Gesture.LongPress()
          .minDuration(320)
          .onStart(() => scheduleOnRN(show))
      : Gesture.Tap().onEnd(() => scheduleOnRN(show));

  // Placement is worked out once the bubble has been measured, then the bubble grows in.
  let left = 0;
  let top = 0;
  let below = placement === 'bottom';
  let arrowX = 0;
  if (anchor && size) {
    const roomAbove = anchor.y - GAP - ARROW - size.height > EDGE + 24;
    const roomBelow = anchor.y + anchor.height + GAP + ARROW + size.height < screen.height - EDGE;
    below = placement === 'bottom' ? roomBelow || !roomAbove : !roomAbove && roomBelow;
    const centre = anchor.x + anchor.width / 2;
    left = Math.min(Math.max(EDGE, centre - size.width / 2), screen.width - EDGE - size.width);
    top = below ? anchor.y + anchor.height + GAP + ARROW : anchor.y - GAP - ARROW - size.height;
    arrowX = Math.min(Math.max(14, centre - left), size.width - 14);
  }

  useEffect(() => {
    if (anchor && size) {
      shown.value = 0;
      shown.value = withSpring(1, springs.snappy);
    }
  }, [anchor, size, shown]);

  const bubble = useAnimatedStyle(() => ({
    opacity: Math.min(1, shown.value * 1.8),
    transform: [{ scale: 0.5 + shown.value * 0.5 }, { translateY: (1 - shown.value) * (below ? -6 : 6) }],
  }));

  return (
    <>
      {/* A gesture rather than a Pressable, so it works around children that handle their own
          presses. When the long press wins, the child's press is cancelled. */}
      <GestureDetector gesture={gesture}>
        <View ref={anchorRef} collapsable={false} accessibilityHint={content}>
          {children}
        </View>
      </GestureDetector>
      {anchor ? (
        <Portal>
          <View style={fill} pointerEvents="box-none">
            <View style={fill} onTouchStart={hide} />
            <Animated.View
              pointerEvents="none"
              onLayout={(e: LayoutChangeEvent) => {
                const { width, height } = e.nativeEvent.layout;
                if (!size) setSize({ width, height });
              }}
              style={[
                styles.bubble,
                {
                  left,
                  top,
                  maxWidth: screen.width - EDGE * 2,
                  backgroundColor: c.primary,
                  borderRadius: theme.radii.sm,
                  // Grows from the tip of the arrow.
                  // Array form: the string parser reads neither decimals nor negative values.
                  transformOrigin: [Math.round(arrowX), below ? -ARROW : Math.round((size?.height ?? 0) + ARROW), 0],
                  boxShadow: theme.shadows.md,
                },
                size ? null : styles.hidden,
                bubble,
              ]}
            >
              <Text variant="caption" weight="medium" tone="onPrimary">
                {content}
              </Text>
              <View
                style={[
                  styles.arrow,
                  {
                    left: arrowX - ARROW,
                    borderTopColor: below ? 'transparent' : c.primary,
                    borderBottomColor: below ? c.primary : 'transparent',
                    [below ? 'top' : 'bottom']: -ARROW * 2,
                  },
                ]}
              />
            </Animated.View>
          </View>
        </Portal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', paddingHorizontal: 12, paddingVertical: 8 },
  hidden: { opacity: 0 },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW,
    borderRightWidth: ARROW,
    borderTopWidth: ARROW,
    borderBottomWidth: ARROW,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
