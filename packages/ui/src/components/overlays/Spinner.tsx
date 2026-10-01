import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';

export type SpinnerVariant = 'arc' | 'dots' | 'bars' | 'orbit' | 'pulse';

export type SpinnerProps = {
  variant?: SpinnerVariant;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TRAVEL = 0.62;

const PERIOD: Record<SpinnerVariant, number> = { arc: 1400, dots: 1100, bars: 1000, orbit: 1600, pulse: 1800 };

/** A clock that runs from 0 to 1 and wraps, for as long as the spinner is mounted. */
function useLoop(period: number) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t, period]);
  return t;
}

function Arc({ t, size, color }: { t: SharedValue<number>; size: number; color: string }) {
  const stroke = Math.max(2, size / 11);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  // The head runs ahead while the tail holds, then the tail catches up while the head holds,
  // all on top of a steady turn. That is what makes it read as breathing, not just spinning.
  const props = useAnimatedProps(() => {
    const p = t.value;
    const half = p < 0.5 ? p * 2 : (p - 0.5) * 2;
    const eased = half * half * (3 - 2 * half);
    const min = circumference * 0.08;
    const travel = circumference * TRAVEL;
    const length = p < 0.5 ? min + travel * eased : min + travel * (1 - eased);
    const tail = p < 0.5 ? 0 : travel * eased;
    return { strokeDasharray: [length, circumference], strokeDashoffset: -tail };
  });
  // Each cycle leaves the arc TRAVEL further round, so the turn per cycle makes up the rest of
  // two full turns. Without that the arc would jump back at every wrap.
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value * (720 - TRAVEL * 360)}deg` }] }));

  return (
    <Animated.View style={spin}>
      <Svg width={size} height={size}>
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          animatedProps={props}
        />
      </Svg>
    </Animated.View>
  );
}

function Dot({ t, index, size, color }: { t: SharedValue<number>; index: number; size: number; color: string }) {
  const d = size / 4.2;
  const animated = useAnimatedStyle(() => {
    // Each dot rises a third of a cycle after the one before, so the three form a wave.
    const local = (t.value - index * 0.16 + 1) % 1;
    const lift = local < 0.5 ? Math.sin(local * 2 * Math.PI) : 0;
    return { opacity: 0.35 + Math.max(0, lift) * 0.65, transform: [{ translateY: -Math.max(0, lift) * d * 0.9 }] };
  });
  return <Animated.View style={[{ width: d, height: d, borderRadius: d / 2, backgroundColor: color }, animated]} />;
}

function Bar({ t, index, size, color }: { t: SharedValue<number>; index: number; size: number; color: string }) {
  const w = size / 8;
  const animated = useAnimatedStyle(() => {
    // Offsets that are not evenly spaced keep the bars from settling into a visible pattern.
    const offsets = [0, 0.3, 0.12, 0.45, 0.22];
    const v = Math.sin((t.value + offsets[index]) * Math.PI * 2);
    return { transform: [{ scaleY: 0.35 + (v * 0.5 + 0.5) * 0.65 }] };
  });
  return <Animated.View style={[{ width: w, height: size * 0.8, borderRadius: w / 2, backgroundColor: color }, animated]} />;
}

function OrbitDot({ t, index, size, color }: { t: SharedValue<number>; index: number; size: number; color: string }) {
  const d = size / (index === 0 ? 4.5 : 6.5);
  const r = size / 2 - size / 9;
  const animated = useAnimatedStyle(() => {
    // The second dot runs on a slightly eased clock, so it falls behind and catches up.
    const p = index === 0 ? t.value : t.value - 0.18 + Math.sin(t.value * Math.PI * 2) * 0.06;
    const a = p * Math.PI * 2 - Math.PI / 2;
    return {
      opacity: index === 0 ? 1 : 0.5,
      transform: [{ translateX: Math.cos(a) * r }, { translateY: Math.sin(a) * r }],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: color }, animated]}
    />
  );
}

function Ring({ t, index, size, color }: { t: SharedValue<number>; index: number; size: number; color: string }) {
  const animated = useAnimatedStyle(() => {
    const local = (t.value + index * 0.5) % 1;
    return { opacity: (1 - local) * 0.8, transform: [{ scale: 0.25 + local * 0.75 }] };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(1.5, size / 16), borderColor: color },
        animated,
      ]}
    />
  );
}

/**
 * Loading indicators, each with its own motion: `arc` breathes its length as it turns,
 * `dots` rise in a wave, `bars` move like an equaliser, `orbit` sends one dot chasing another
 * round a circle, and `pulse` sends out rings that fade as they grow.
 */
export function Spinner({ variant = 'arc', size = 32, color, style }: SpinnerProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.text;
  const t = useLoop(PERIOD[variant]);

  let content;
  if (variant === 'arc') content = <Arc t={t} size={size} color={tint} />;
  else if (variant === 'dots')
    content = (
      <View style={[styles.row, { gap: size / 9 }]}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} t={t} index={i} size={size} color={tint} />
        ))}
      </View>
    );
  else if (variant === 'bars')
    content = (
      <View style={[styles.row, { gap: size / 14 }]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Bar key={i} t={t} index={i} size={size} color={tint} />
        ))}
      </View>
    );
  else if (variant === 'orbit')
    content = (
      <>
        <View style={[styles.track, { width: size - (size / 9) * 2, height: size - (size / 9) * 2, borderRadius: size, borderColor: tint }]} />
        <OrbitDot t={t} index={1} size={size} color={tint} />
        <OrbitDot t={t} index={0} size={size} color={tint} />
      </>
    );
  else
    content = (
      <>
        <Ring t={t} index={0} size={size} color={tint} />
        <Ring t={t} index={1} size={size} color={tint} />
        <View style={{ width: size / 4, height: size / 4, borderRadius: size, backgroundColor: tint }} />
      </>
    );

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={[styles.box, { width: size, height: size }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  track: { position: 'absolute', borderWidth: 1, opacity: 0.15 },
});
