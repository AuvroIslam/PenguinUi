import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';

export type PlayPauseButtonProps = {
  playing: boolean;
  onToggle: () => void;
  size?: number;
  tone?: 'primary' | 'accent';
  style?: StyleProp<ViewStyle>;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Quad = [number, number][];

// The play triangle cut down its middle into two four-sided pieces, and the two pause bars,
// each with its corners listed in the same order. Moving every corner from one set to the
// other turns the triangle into the bars as one shape, rather than swapping two icons.
const PLAY: [Quad, Quad] = [
  [
    [8, 5],
    [13.5, 8.3],
    [13.5, 15.7],
    [8, 19],
  ],
  [
    [13.5, 8.3],
    [19, 12],
    [19, 12],
    [13.5, 15.7],
  ],
];
// The rounding stroke adds a unit on every side, so the bars are drawn 5 apart to leave a
// visible gap of 3 between them; any closer and they read as one block at small sizes.
const PAUSE: [Quad, Quad] = [
  [
    [6.5, 5.5],
    [9.5, 5.5],
    [9.5, 18.5],
    [6.5, 18.5],
  ],
  [
    [14.5, 5.5],
    [17.5, 5.5],
    [17.5, 18.5],
    [14.5, 18.5],
  ],
];

function quadPath(t: number, piece: 0 | 1) {
  'worklet';
  const a = PLAY[piece];
  const b = PAUSE[piece];
  let d = '';
  for (let i = 0; i < 4; i += 1) {
    const x = a[i][0] + (b[i][0] - a[i][0]) * t;
    const y = a[i][1] + (b[i][1] - a[i][1]) * t;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d}Z`;
}

/**
 * Play and pause as one shape. The triangle splits down its middle and each half stretches
 * into a bar, so the icon changes form instead of crossfading between two pictures. The
 * corners are rounded by a stroke of the same colour, which keeps them soft at every step
 * of the morph.
 */
export function PlayPauseButton({ playing, onToggle, size = 64, tone = 'primary', style }: PlayPauseButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const t = useSharedValue(playing ? 1 : 0);

  useEffect(() => {
    t.value = withSpring(playing ? 1 : 0, springs.snappy);
  }, [playing, t]);

  const left = useAnimatedProps(() => ({ d: quadPath(t.value, 0) }));
  const right = useAnimatedProps(() => ({ d: quadPath(t.value, 1) }));
  // Optical centring: a triangle looks left-heavy when centred by its box, so play sits a
  // little to the right and slides back as it becomes the bars.
  const nudge = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - t.value) * size * 0.03 }] }));

  const bg = tone === 'accent' ? c.accent : c.primary;
  const fg = tone === 'accent' ? c.onAccent : c.onPrimary;
  const icon = size * 0.46;

  return (
    <PressableScale
      onPress={onToggle}
      haptic="light"
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause' : 'Play'}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}
    >
      <Animated.View style={nudge}>
        <Svg width={icon} height={icon} viewBox="0 0 24 24">
          <AnimatedPath animatedProps={left} fill={fg} stroke={fg} strokeWidth={2} strokeLinejoin="round" />
          <AnimatedPath animatedProps={right} fill={fg} stroke={fg} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
