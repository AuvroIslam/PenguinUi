import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, Mask, Rect } from 'react-native-svg';

import { springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { useControllable } from '../../utils/useControllable';

export type ThemeToggleProps = {
  /** True for dark. */
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (dark: boolean) => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const RAYS = 8;
const CENTRE = 12;

function Ray({ index, progress, color }: { index: number; progress: SharedValue<number>; color: string }) {
  const angle = (index / RAYS) * Math.PI * 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const props = useAnimatedProps(() => {
    // Rays pull in toward the core as the moon takes over, shortening as they go.
    const p = progress.value;
    const from = 8 - p * 4;
    const to = 10.6 - p * 6.6;
    return {
      x1: CENTRE + dx * from,
      y1: CENTRE + dy * from,
      x2: CENTRE + dx * to,
      y2: CENTRE + dy * to,
      strokeOpacity: Math.max(0, 1 - p * 1.4),
    };
  });

  return <AnimatedLine animatedProps={props} stroke={color} strokeWidth={1.8} strokeLinecap="round" />;
}

/**
 * A sun that becomes a moon. The rays pull in toward the core while a disc slides across it
 * and leaves a crescent, and the whole icon makes a quarter turn. It is one continuous
 * shape driven by a single value, so stopping halfway through looks like an eclipse rather
 * than a glitch.
 */
export function ThemeToggle({ value: controlled, defaultValue = false, onChange, size = 48, style }: ThemeToggleProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [dark, setDark] = useControllable(controlled, defaultValue, onChange);

  const progress = useSharedValue(dark ? 1 : 0);
  const turn = useSharedValue(dark ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(dark ? 1 : 0, { duration: 520, easing: Easing.bezier(0.32, 0.72, 0, 1) });
    turn.value = withSpring(dark ? 1 : 0, springs.smooth);
  }, [dark, progress, turn]);

  const core = useAnimatedProps(() => ({ r: 5 + progress.value * 3.2 }));
  const bite = useAnimatedProps(() => ({
    cx: 26 - progress.value * 10.5,
    cy: 12 - progress.value * 5.5,
  }));
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 90}deg` }] }));

  const tint = dark ? c.text : c.warning;

  return (
    <PressableScale
      onPress={() => setDark(!dark)}
      haptic="light"
      scaleTo={0.9}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: dark }}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: c.surfaceSunken, borderColor: c.border },
        style,
      ]}
    >
      <Animated.View style={spin}>
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
          <Defs>
            <Mask id="bite" x="0" y="0" width="24" height="24">
              <Rect x="0" y="0" width="24" height="24" fill="#fff" />
              <AnimatedCircle animatedProps={bite} r={6.4} fill="#000" />
            </Mask>
          </Defs>
          <AnimatedCircle animatedProps={core} cx={CENTRE} cy={CENTRE} fill={tint} mask="url(#bite)" />
          {Array.from({ length: RAYS }, (_, i) => (
            <Ray key={i} index={i} progress={progress} color={tint} />
          ))}
        </Svg>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
