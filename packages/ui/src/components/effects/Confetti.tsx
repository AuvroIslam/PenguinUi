import { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';

export type ConfettiHandle = {
  /** Fire a burst. `x` and `y` are in the confetti layer's own coordinates; the default is its centre. */
  fire: (at?: { x: number; y: number }) => void;
};

export type ConfettiProps = {
  count?: number;
  colors?: string[];
  /** Milliseconds a burst lasts. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

type Piece = {
  id: string;
  vx: number;
  vy: number;
  spin: number;
  flip: number;
  sway: number;
  swayRate: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
};

/** Gravity, in points per millisecond squared. */
const GRAVITY = 0.0011;
/** Air drag, per millisecond. Sets how fast pieces lose their launch speed. */
const DRAG = 0.003;

const ConfettiPiece = memo(function ConfettiPiece({
  piece,
  t,
  origin,
  duration,
}: {
  piece: Piece;
  t: SharedValue<number>;
  origin: { x: number; y: number };
  duration: number;
}) {
  const animated = useAnimatedStyle(() => {
    // Everything is a closed-form function of time, so a piece's whole flight runs on the UI
    // thread from one clock with nothing to integrate frame by frame.
    const ms = t.value * duration;
    // Air resistance: horizontal speed decays, and the fall settles toward a terminal speed.
    const k = 1 - Math.exp(-DRAG * ms);
    const x = (piece.vx / DRAG) * k + Math.sin(ms * piece.swayRate) * piece.sway * Math.min(1, ms / 400);
    // With linear drag the fall approaches a terminal speed of GRAVITY / DRAG.
    const terminal = GRAVITY / DRAG;
    const y = terminal * ms + ((piece.vy - terminal) / DRAG) * k;
    return {
      opacity: t.value > 0.8 ? (1 - t.value) / 0.2 : 1,
      transform: [
        { translateX: origin.x + x },
        { translateY: origin.y + y },
        { rotate: `${piece.spin * ms}deg` },
        // Paper turning over: the flip makes a flat rectangle flash between full and edge-on.
        { rotateX: `${piece.flip * ms}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { width: piece.w, height: piece.h, marginLeft: -piece.w / 2, marginTop: -piece.h / 2, backgroundColor: piece.color, borderRadius: piece.round ? piece.w / 2 : 1.5 },
        animated,
      ]}
    />
  );
});

/**
 * A burst of confetti for a real achievement. Pieces launch in a fan with random speed, spin
 * and tumble, drift side to side as paper does, slow against the air and fall under gravity,
 * fading as they finish. Each piece's flight is a formula of time computed on the UI thread,
 * so a hundred pieces cost one clock. Under reduced motion it fires a haptic and nothing else.
 */
export const Confetti = forwardRef<ConfettiHandle, ConfettiProps>(function Confetti(
  { count = 80, colors = ['#2F6BF0', '#9CC2FF', '#FFFFFF', '#FF9A3C', '#3DDAB4', '#FFB4C6', '#16264D'], duration = 2600, style },
  ref,
) {
  const screen = useWindowDimensions();
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState<{ key: number; pieces: Piece[]; origin: { x: number; y: number } } | null>(null);
  const [size, setSize] = useState({ width: screen.width, height: screen.height });
  const t = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    fire(at) {
      haptic('success');
      if (reduced) return;
      const origin = at ?? { x: size.width / 2, y: size.height * 0.55 };
      const pieces: Piece[] = Array.from({ length: count }, (_, i) => {
        // A fan pointing up, wider at the edges of the burst than in its middle.
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        const speed = 0.7 + Math.random() * 0.9;
        const big = Math.random() < 0.18;
        return {
          id: `${i}`,
          vx: Math.cos(angle) * speed * 0.6,
          vy: Math.sin(angle) * speed,
          spin: (Math.random() - 0.5) * 0.9,
          flip: 0.2 + Math.random() * 0.6,
          sway: 6 + Math.random() * 14,
          swayRate: 0.004 + Math.random() * 0.006,
          w: big ? 10 : 6 + Math.random() * 3,
          h: big ? 10 : 9 + Math.random() * 7,
          color: colors[i % colors.length],
          round: big,
        };
      });
      t.value = 0;
      setBurst({ key: Date.now(), pieces, origin });
      t.value = withTiming(1, { duration, easing: Easing.linear });
    },
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {burst
        ? burst.pieces.map((p) => <ConfettiPiece key={`${burst.key}-${p.id}`} piece={p} t={t} origin={burst.origin} duration={duration} />)
        : null}
    </View>
  );
});

const styles = StyleSheet.create({
  piece: { position: 'absolute', left: 0, top: 0 },
});
