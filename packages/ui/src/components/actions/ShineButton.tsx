import { useEffect, useId, type ReactNode } from 'react';
import { StyleSheet, type GestureResponderEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { easings } from '../../motion/tokens';
import { PressableScale, type PressableScaleProps } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle } from '../../theme/tokens';

export type ShineButtonProps = Omit<PressableScaleProps, 'children' | 'pressed'> & {
  children: ReactNode;
  variant?: 'primary' | 'accent';
  /** Milliseconds between sweeps. */
  interval?: number;
  leading?: ReactNode;
  block?: boolean;
};

const HEIGHT = 50;
const BAND = 90;

function Band({
  sweep,
  width,
  color,
  id,
}: {
  sweep: SharedValue<number>;
  width: SharedValue<number>;
  color: string;
  id: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: sweep.value <= 0 || sweep.value >= 1 ? 0 : 1,
    transform: [{ translateX: -BAND + sweep.value * (width.value + BAND) }, { rotate: '18deg' }],
  }));

  return (
    <Animated.View style={[styles.band, style]}>
      <Svg width={BAND} height={HEIGHT * 3}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.34} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={BAND} height={HEIGHT * 3} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * A button that catches the light. A soft band crosses it on an interval to draw the eye
 * without the button itself moving, and once more on every press as acknowledgement.
 */
export function ShineButton({
  children,
  variant = 'primary',
  interval = 2800,
  leading,
  block = false,
  onPress,
  style,
  ...rest
}: ShineButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const bg = variant === 'accent' ? c.accent : c.primary;
  const fg = variant === 'accent' ? c.onAccent : c.onPrimary;
  // The band is the label colour: light across a dark button, dark across a light one.
  const id = `shine${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const width = useSharedValue(0);
  const idle = useSharedValue(0);
  const tap = useSharedValue(0);

  useEffect(() => {
    const travel = 900;
    idle.value = 0;
    idle.value = withRepeat(
      withSequence(
        withDelay(Math.max(0, interval - travel), withTiming(1, { duration: travel, easing: easings.fluid })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    return () => cancelAnimation(idle);
  }, [idle, interval]);

  const handlePress = (event: GestureResponderEvent) => {
    tap.value = 0;
    tap.value = withTiming(1, { duration: 650, easing: easings.fluid });
    onPress?.(event);
  };

  return (
    <PressableScale
      onPress={handlePress}
      onLayout={(event) => {
        width.value = event.nativeEvent.layout.width;
      }}
      style={[styles.base, { backgroundColor: bg, alignSelf: block ? 'stretch' : 'flex-start' }, style]}
      {...rest}
    >
      <Band sweep={idle} width={width} color={fg} id={`${id}a`} />
      <Band sweep={tap} width={width} color={fg} id={`${id}b`} />
      {leading}
      {typeof children === 'string' ? (
        <Animated.Text numberOfLines={1} style={[typeStyle(theme, 'label'), { color: fg }]}>
          {children}
        </Animated.Text>
      ) : (
        children
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: HEIGHT,
    paddingHorizontal: 26,
    borderRadius: HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    top: -HEIGHT,
    width: BAND,
    height: HEIGHT * 3,
    pointerEvents: 'none',
  },
});
