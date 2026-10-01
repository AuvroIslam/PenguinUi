import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { PlayPauseButton } from './PlayPauseButton';

export type MiniPlayerProps = {
  title: string;
  artist: string;
  /** Artwork. It is drawn at both sizes, so give it something that fills its box. */
  artwork: ReactNode;
  playing: boolean;
  onTogglePlay: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  /** Shown in the expanded player between the titles and the controls, such as a scrubber. */
  children?: ReactNode;
  /** Height of the space the player expands into. */
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const PILL = 68;
const ART_SMALL = 48;
const PAD = 22;
const PILL_BUTTON = 44;
/** Width at the pill's right end taken by its play button: the button, its inset and a margin. */
const PILL_PLAY_ZONE = 12 + PILL_BUTTON + 8;

function Reveal({ p, from, children, style }: { p: SharedValue<number>; from: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  // Expanded-only content arrives late in the expansion, each block a little after the last.
  const animated = useAnimatedStyle(() => {
    const t = interpolate(p.value, [from, Math.min(1, from + 0.3)], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ translateY: (1 - t) * 16 }] };
  });
  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

/**
 * A now-playing pill that opens into the full player. A single progress value drives the
 * whole change: the pill grows into a card, the artwork grows from a thumbnail into the
 * cover, the small title gives way to the large one, and the controls arrive one row after
 * another. Tap the pill or drag it up to open; drag the card down to close, and it follows
 * the finger the whole way.
 */
export function MiniPlayer({
  title,
  artist,
  artwork,
  playing,
  onTogglePlay,
  onNext,
  onPrevious,
  children,
  height = 560,
  style,
}: MiniPlayerProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [width, setWidth] = useState(0);
  const [open, setOpen] = useState(false);
  const p = useSharedValue(0);
  const start = useSharedValue(0);
  const downY = useSharedValue(0);
  const travel = height - PILL;

  useEffect(() => {
    p.value = withSpring(open ? 1 : 0, springs.smooth);
  }, [open, p]);

  const settle = (next: boolean) => {
    haptic('light');
    setOpen(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onBegin((e) => {
      start.value = p.value;
      // Measure from where the finger went down, not from where the pan was recognised, so the
      // card's edge stays with the finger instead of trailing it by the activation distance.
      downY.value = e.absoluteY;
    })
    .onUpdate((e) => {
      p.value = Math.min(1.04, Math.max(-0.02, start.value - (e.absoluteY - downY.value) / travel));
    })
    .onEnd((e) => {
      const projected = p.value - (e.velocityY / travel) * 0.2;
      const next = projected > 0.5;
      p.value = withSpring(next ? 1 : 0, { ...springs.smooth, velocity: -e.velocityY / travel });
      scheduleOnRN(settle, next);
    });
  // A tap on the pill opens it, except on its play button, which only plays or pauses.
  const tap = Gesture.Tap().onEnd((e) => {
    if (p.value < 0.5 && e.x < width - PILL_PLAY_ZONE) scheduleOnRN(settle, true);
  });

  const big = Math.max(0, width - PAD * 2);

  const card = useAnimatedStyle(() => ({
    height: interpolate(p.value, [0, 1], [PILL, height]),
    borderRadius: interpolate(p.value, [0, 1], [PILL / 2, 32]),
  }));
  const art = useAnimatedStyle(() => {
    const size = interpolate(p.value, [0, 1], [ART_SMALL, big], Extrapolation.CLAMP);
    return {
      width: size,
      height: size * interpolate(p.value, [0, 1], [1, 0.82], Extrapolation.CLAMP),
      left: interpolate(p.value, [0, 1], [10, PAD]),
      top: interpolate(p.value, [0, 1], [10, PAD]),
      borderRadius: interpolate(p.value, [0, 1], [ART_SMALL / 2, 22]),
    };
  });
  const small = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.25], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(p.value, [0, 0.25], [0, -8], Extrapolation.CLAMP) }],
  }));
  // The text and controls hang off the artwork's bottom edge, so they ride up with it as it
  // shrinks instead of being left behind.
  const below = useAnimatedStyle(() => {
    const size = interpolate(p.value, [0, 1], [ART_SMALL, big], Extrapolation.CLAMP);
    const bottom = interpolate(p.value, [0, 1], [10, PAD]) + size * interpolate(p.value, [0, 1], [1, 0.82], Extrapolation.CLAMP);
    return { transform: [{ translateY: bottom - (PAD + big * 0.82) }] };
  });
  const handle = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0.6, 1], [0, 1], Extrapolation.CLAMP) }));

  return (
    <View style={[styles.slot, { height }, style]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        {/* Not a button itself: it holds the play and skip buttons, and a button may not
            contain buttons. The pill's titles carry the "open" action instead. */}
        <Animated.View
          accessibilityLabel="Now playing"
          style={[styles.card, { backgroundColor: c.surfaceRaised, borderColor: c.border, boxShadow: theme.shadows.lg }, card]}
        >
          <Animated.View style={[styles.art, art]}>{artwork}</Animated.View>

          <Animated.View style={[styles.small, small]} pointerEvents={open ? 'none' : 'auto'}>
            <View
              style={styles.smallText}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${title}, ${artist}. Open player`}
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={() => settle(true)}
            >
              <Text variant="label" numberOfLines={1}>
                {title}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {artist}
              </Text>
            </View>
            <PlayPauseButton playing={playing} onToggle={onTogglePlay} size={PILL_BUTTON} />
          </Animated.View>

          <Animated.View style={[styles.handle, { backgroundColor: c.borderStrong }, handle]} />

          <Animated.View style={[styles.full, { top: PAD + big * 0.82 + 22 }, below]} pointerEvents={open ? 'box-none' : 'none'}>
            <Reveal p={p} from={0.45}>
              <Text variant="title" numberOfLines={1}>
                {title}
              </Text>
              <Text variant="body" tone="muted" numberOfLines={1}>
                {artist}
              </Text>
            </Reveal>
            {children ? (
              <Reveal p={p} from={0.55}>
                {children}
              </Reveal>
            ) : null}
            <Reveal p={p} from={0.65} style={styles.controls}>
              <PressableScale onPress={onPrevious} haptic="light" scaleTo={0.85} accessibilityLabel="Previous" style={styles.skip}>
                <Glyph name="chevron-left" size={32} color={c.text} strokeWidth={2} />
              </PressableScale>
              <PlayPauseButton playing={playing} onToggle={onTogglePlay} size={66} />
              <PressableScale onPress={onNext} haptic="light" scaleTo={0.85} accessibilityLabel="Next" style={styles.skip}>
                <Glyph name="chevron-right" size={32} color={c.text} strokeWidth={2} />
              </PressableScale>
            </Reveal>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignSelf: 'stretch', justifyContent: 'flex-end' },
  card: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  art: { position: 'absolute', overflow: 'hidden' },
  small: {
    position: 'absolute',
    left: ART_SMALL + 22,
    right: 12,
    top: 0,
    height: PILL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallText: { flex: 1 },
  handle: { position: 'absolute', top: 8, alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  full: { position: 'absolute', left: PAD, right: PAD, gap: 18 },
  skip: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
});
