import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { ArcSpinner } from '../../primitives/ArcSpinner';
import { useTheme } from '../../theme/ThemeProvider';

export type PullToRefreshProps = {
  /** Runs when the drop is released past the threshold. The spinner stays until it settles. */
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  /** Pull distance, in points, at which the drop detaches. */
  threshold?: number;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BULB = 17;
const HOLD = 64;
/** The pull approaches this multiple of the threshold but never reaches it. */
const STRETCH = 2.6;

function rubber(d: number, limit: number) {
  'worklet';
  return limit * (1 - 1 / (d / limit + 1));
}

/**
 * Pull to refresh with a drop of liquid. Pulling down from the top draws a drop out of the
 * top edge: its neck thins and the bulb swells the further it goes. At the threshold the
 * neck snaps, the phone gives a firm tap, the bulb is left hanging on its own and turns into
 * the spinner, and the stub of the neck springs back into the edge. When the work is done
 * the spinner shrinks away and the content rises back into place.
 */
export function PullToRefresh({ onRefresh, children, threshold = 80, style, contentContainerStyle }: PullToRefreshProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [width, setWidth] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useSharedValue(0);
  const pull = useSharedValue(0);
  // Length of the drop. Follows the pull until it detaches, then springs back into the edge.
  const drip = useSharedValue(0);
  const base = useSharedValue(-1);
  const armed = useSharedValue(false);
  const busy = useSharedValue(false);
  const disc = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const finish = useCallback(() => {
    disc.value = withTiming(0, { duration: 200 });
    pull.value = withSpring(0, springs.smooth, () => {
      busy.value = false;
    });
    setRefreshing(false);
  }, [disc, pull, busy]);

  const start = useCallback(() => {
    setRefreshing(true);
    haptic('medium');
    onRefresh().then(finish, finish);
  }, [onRefresh, finish]);

  const tick = useCallback(() => haptic('rigid'), []);

  const native = Gesture.Native();
  const pan = Gesture.Pan()
    .simultaneousWithExternalGesture(native)
    .onBegin(() => {
      // Already at the top: the pull counts from the touch itself, not from wherever the
      // gesture first reported movement, which can be well past its activation slop.
      base.value = scrollY.value <= 0.5 ? 0 : -1;
      armed.value = false;
    })
    .onUpdate((e) => {
      if (busy.value) return;
      // The pull starts from wherever the content was when it reached the top, so pulling
      // down a scrolled list first scrolls it, then draws the drop.
      if (base.value < 0) {
        if (scrollY.value > 0.5 || e.translationY <= 0) return;
        base.value = e.translationY;
      }
      const raw = Math.max(0, e.translationY - base.value);
      const p = rubber(raw, threshold * STRETCH);
      pull.value = p;
      drip.value = p;
      const over = p >= threshold;
      if (over !== armed.value) {
        armed.value = over;
        if (over) scheduleOnRN(tick);
      }
    })
    .onFinalize(() => {
      if (busy.value) return;
      if (armed.value) {
        busy.value = true;
        // Detach: the bulb stays where it was and becomes the spinner, the neck retracts.
        disc.value = 1;
        drip.value = withSpring(0, springs.wobbly);
        pull.value = withSpring(HOLD, springs.smooth);
        scheduleOnRN(start);
      } else {
        pull.value = withSpring(0, springs.smooth);
        drip.value = withSpring(0, springs.smooth);
      }
    });

  const drop = useAnimatedProps(() => {
    const d = drip.value;
    const cx = width / 2;
    if (d < 1) return { d: `M 0 0 L ${width} 0 Z` };
    const progress = Math.min(1, d / threshold);
    // The bulb grows a little as it fills, and the neck thins toward the moment it snaps.
    const r = BULB * (0.55 + progress * 0.45);
    const cy = Math.max(r, d - r);
    const neck = interpolate(progress, [0, 1], [r * 0.95, 2.2]);
    const shoulder = r + 22 * (1 - progress * 0.5);
    const sy = cy - Math.sqrt(Math.max(0, r * r - neck * neck));
    return {
      d: [
        `M ${cx - shoulder} 0`,
        `C ${cx - shoulder * 0.45} 0 ${cx - neck} ${sy * 0.35} ${cx - neck} ${sy}`,
        `A ${r} ${r} 0 1 0 ${cx + neck} ${sy}`,
        `C ${cx + neck} ${sy * 0.35} ${cx + shoulder * 0.45} 0 ${cx + shoulder} 0`,
        'Z',
      ].join(' '),
    };
  });

  const content = useAnimatedStyle(() => ({ transform: [{ translateY: pull.value }] }));
  const spinner = useAnimatedStyle(() => {
    const r = BULB;
    return {
      opacity: disc.value,
      // Sits exactly where the bulb was when it let go, then rides the content up.
      transform: [{ translateY: Math.max(r, pull.value - r) - r }, { scale: disc.value }],
    };
  });

  return (
    <View style={[styles.wrap, style]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={threshold * STRETCH} style={styles.drop} pointerEvents="none">
          <AnimatedPath animatedProps={drop} fill={c.accent} />
        </Svg>
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.spinner, { left: width / 2 - BULB, backgroundColor: c.accent }, spinner]}>
        {refreshing ? <ArcSpinner size={20} color={c.onAccent} strokeWidth={2.4} /> : null}
      </Animated.View>
      <GestureDetector gesture={Gesture.Simultaneous(pan, native)}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <Animated.View style={[contentContainerStyle, content]}>{children}</Animated.View>
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignSelf: 'stretch', overflow: 'hidden' },
  drop: { position: 'absolute', top: 0, left: 0, zIndex: 2 },
  spinner: {
    position: 'absolute',
    top: 0,
    width: BULB * 2,
    height: BULB * 2,
    borderRadius: BULB,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
});
