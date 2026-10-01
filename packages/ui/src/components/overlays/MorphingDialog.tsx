import { useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type MorphingDialogProps = {
  title: string;
  subtitle?: string;
  /** Artwork shown at the top of the card. It stretches to fill, at the ratio below. */
  image: ReactNode;
  /** Width over height of the image area. */
  aspect?: number;
  /** Shown only once the card has become a dialog. */
  children?: ReactNode;
  /** Width of the card before it opens. Defaults to the width of its container. */
  width?: number;
  style?: StyleProp<ViewStyle>;
};

type Frame = { x: number; y: number; width: number; height: number };

const CARD_RADIUS = 22;
const DIALOG_RADIUS = 30;
const MARGIN = 16;
const HEADER = 74;

/**
 * A card that becomes the dialog it was showing a preview of. Its frame (position, size and
 * corner radius) springs from where it sits in the layout to the middle of the screen, the
 * artwork grows with it, and the title stays put inside it. The rest of the content opens
 * beneath only as the card arrives. Closing sends it back to its exact place in the layout.
 * The open dialog can be dragged down, shrinking as it goes, and let go to dismiss.
 */
export function MorphingDialog({ title, subtitle, image, aspect = 4 / 3, children, width, style }: MorphingDialogProps) {
  const theme = useTheme();
  const c = theme.colors;
  const screen = useWindowDimensions();
  const card = useRef<View>(null);

  const [from, setFrom] = useState<Frame | null>(null);
  const [bodyH, setBodyH] = useState(0);
  const [open, setOpen] = useState(false);

  const p = useSharedValue(0);
  const drag = useSharedValue(0);

  const toW = Math.min(screen.width - MARGIN * 2, 460);
  const toImage = toW / aspect;
  const toH = toImage + HEADER + bodyH;
  const toX = (screen.width - toW) / 2;
  const toY = Math.max(48, (screen.height - toH) / 2);

  const show = () => {
    card.current?.measureInWindow((x, y, w, h) => {
      setFrom({ x, y, width: w, height: h });
      setOpen(true);
      haptic('light');
      drag.value = 0;
      p.value = withSpring(1, springs.smooth);
    });
  };

  const hide = () => {
    p.value = withSpring(0, { ...springs.smooth, overshootClamping: true }, (done) => {
      if (done) scheduleOnRN(setOpen, false);
    });
  };

  const pan = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      drag.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (drag.value > 110 || e.velocityY > 900) {
        drag.value = withTiming(0, { duration: 260 });
        scheduleOnRN(hide);
      } else {
        drag.value = withSpring(0, springs.bouncy);
      }
    });

  const frame = useAnimatedStyle(() => {
    if (!from) return {};
    const t = p.value;
    const w = interpolate(t, [0, 1], [from.width, toW]);
    const pull = drag.value;
    return {
      left: interpolate(t, [0, 1], [from.x, toX]),
      top: interpolate(t, [0, 1], [from.y, toY]),
      width: w,
      borderRadius: interpolate(t, [0, 1], [CARD_RADIUS, DIALOG_RADIUS]),
      transform: [{ translateY: pull * 0.8 }, { scale: 1 - Math.min(0.18, pull / 1400) }],
    };
  });
  const art = useAnimatedStyle(() => {
    if (!from) return {};
    const w = interpolate(p.value, [0, 1], [from.width, toW]);
    return { height: w / aspect };
  });
  const body = useAnimatedStyle(() => {
    // Opens only once the card is most of the way there, so text never squeezes.
    const t = interpolate(p.value, [0.45, 1], [0, 1], 'clamp');
    return { height: bodyH * t, opacity: interpolate(p.value, [0.7, 1], [0, 1], 'clamp') };
  });
  const close = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.6, 1], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.6, 1], [0.6, 1], 'clamp') }],
  }));
  const backdrop = useAnimatedStyle(() => ({
    opacity: p.value * (1 - Math.min(0.6, drag.value / 400)),
  }));

  const surface = { backgroundColor: c.surface, borderColor: c.border };

  return (
    <View style={style}>
      <Pressable onPress={show} accessibilityRole="button" accessibilityLabel={title}>
        <View
          ref={card}
          collapsable={false}
          style={[styles.card, surface, { width, borderRadius: CARD_RADIUS, opacity: open ? 0 : 1 }]}
        >
          <View style={{ aspectRatio: aspect, overflow: 'hidden' }}>{image}</View>
          <Header title={title} subtitle={subtitle} />
        </View>
      </Pressable>

      {/* Measures the body at the dialog's width before the first open. */}
      <View pointerEvents="none" style={[styles.measure, { width: toW }]}>
        <View onLayout={(e: LayoutChangeEvent) => setBodyH(e.nativeEvent.layout.height)}>
          <View style={styles.body}>{children}</View>
        </View>
      </View>

      {open && from ? (
        <Portal>
          <View style={fill} pointerEvents="box-none">
            <Animated.View style={[fill, { backgroundColor: c.scrim }, backdrop]} onTouchEnd={hide} />
            <GestureDetector gesture={pan}>
              <Animated.View
                accessibilityViewIsModal
                style={[styles.dialog, surface, { boxShadow: theme.shadows.lg }, frame]}
              >
                <Animated.View style={[styles.art, art]}>{image}</Animated.View>
                <Header title={title} subtitle={subtitle} />
                <Animated.View style={[styles.bodyClip, body]}>
                  <View style={[styles.body, { width: toW }]}>{children}</View>
                </Animated.View>
                <Animated.View style={[styles.close, close]}>
                  <Pressable
                    onPress={hide}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.42)' }]}
                  >
                    <Glyph name="x" size={16} color="#fff" strokeWidth={2.2} />
                  </Pressable>
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </View>
        </Portal>
      ) : null}
    </View>
  );
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text variant="heading" numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  dialog: { position: 'absolute', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  art: { overflow: 'hidden' },
  header: { height: HEADER, paddingHorizontal: 18, justifyContent: 'center', gap: 2 },
  bodyClip: { overflow: 'hidden' },
  body: { paddingHorizontal: 18, paddingBottom: 22 },
  measure: { position: 'absolute', opacity: 0, left: -10000, top: 0 },
  close: { position: 'absolute', top: 12, right: 12 },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
