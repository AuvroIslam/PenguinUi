import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  makeMutable,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  /** Corner radius. `'pill'` for fully round ends, as for avatars and chips. */
  radius?: number | 'pill';
  /** While true the placeholder shows. When it turns false the children fade in in its place. */
  loading?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const BAND = 180;
const SWEEP = 1300;
const REST = 450;

// One clock for every skeleton on screen. Each placeholder works out where the band is
// relative to its own position on the screen, so a page of placeholders is crossed by a
// single sweep of light, rather than each one flickering on its own schedule.
const clock = makeMutable(0);
let users = 0;

function startClock() {
  users += 1;
  if (users > 1) return;
  clock.value = 0;
  clock.value = withRepeat(
    withSequence(
      withTiming(1, { duration: SWEEP, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      withTiming(1, { duration: REST }),
      withTiming(0, { duration: 0 }),
    ),
    -1,
  );
}

function stopClock() {
  users = Math.max(0, users - 1);
  if (users === 0) cancelAnimation(clock);
}

/**
 * A loading placeholder lit by a soft band of light. Every skeleton on the screen shares one
 * clock and measures where it sits, so the band passes over the whole layout as one sweep,
 * left to right, with a short rest before the next. With reduced motion the band is replaced
 * by a slow breathe. When `loading` turns false the real content fades in in its place.
 */
export function Skeleton({ width = '100%', height = 14, radius = 8, loading = true, children, style }: SkeletonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const screen = useWindowDimensions();
  const reduced = useReducedMotion();
  const ref = useRef<View>(null);
  const [x, setX] = useState(0);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    if (!loading) return;
    startClock();
    return stopClock;
  }, [loading]);

  const span = screen.width + BAND * 2;
  const band = useAnimatedStyle(() => ({
    transform: [{ translateX: clock.value * span - BAND - x }],
  }));
  const breathe = useAnimatedStyle(() => ({ opacity: 0.55 + Math.sin(clock.value * Math.PI) * 0.45 }));

  if (!loading) {
    return (
      <Animated.View entering={FadeIn.duration(260)} style={style}>
        {children}
      </Animated.View>
    );
  }

  const r = radius === 'pill' ? height / 2 : radius;
  const light = theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)';

  return (
    <View ref={ref} collapsable={false} onLayout={() => ref.current?.measureInWindow((wx) => setX(wx))} style={{ width }}>
    <Animated.View
      exiting={FadeOut.duration(160)}
      accessibilityLabel="Loading"
      style={[
        styles.base,
        { height, borderRadius: r, backgroundColor: c.surfaceSunken },
        reduced ? breathe : null,
        style,
      ]}
    >
      {reduced ? null : (
        <Animated.View pointerEvents="none" style={[styles.band, band]}>
          <Svg width={BAND} height="100%">
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={light} stopOpacity={0} />
                <Stop offset="0.5" stopColor={light} stopOpacity={1} />
                <Stop offset="1" stopColor={light} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={BAND} height="100%" fill={`url(#${id})`} />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  band: { position: 'absolute', top: 0, bottom: 0, left: 0, width: BAND },
});
