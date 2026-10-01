import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type FlipCardProps = {
  front: ReactNode;
  back: ReactNode;
  /** Controlled side. */
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A two-sided card. Tap it and it turns over on a slow spring, dipping slightly at the
 * halfway point as if it were lifted to make room for the turn. It can also be turned by
 * hand: drag sideways and the card follows the finger through the flip, then settles on
 * whichever side it was let go nearer to, or the one a flick was heading for.
 */
export function FlipCard({ front, back, flipped: controlled, onFlip, radius = 24, style }: FlipCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [inner, setInner] = useState(false);
  const flipped = controlled ?? inner;
  const [width, setWidth] = useState(300);

  // 0 is the front, 1 is the back. Values in between are mid-turn.
  const turn = useSharedValue(flipped ? 1 : 0);
  const start = useSharedValue(0);
  const downX = useSharedValue(0);

  useEffect(() => {
    const target = flipped ? 1 : 0;
    // A drag can leave the card a whole turn away (at -1 or 2), which shows the same face.
    // Shift by whole turns first so the spring always takes the short way round.
    turn.value += Math.round((target - turn.value) / 2) * 2;
    turn.value = withSpring(target, springs.gentle);
  }, [flipped, turn]);

  const set = (next: boolean) => {
    haptic('light');
    setInner(next);
    onFlip?.(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin((e) => {
      start.value = turn.value;
      // Measured from where the finger went down, not from where the pan was recognised, so
      // the turn keeps up with the finger instead of trailing it by the touch slop.
      downX.value = e.absoluteX;
    })
    .onUpdate((e) => {
      // A full card width of drag is a full half turn.
      turn.value = start.value - (e.absoluteX - downX.value) / width;
    })
    .onEnd((e) => {
      const projected = turn.value - (e.velocityX / width) * 0.2;
      const side = Math.round(projected);
      // Snap to the nearest face, which may be a full turn away; then reduce to 0 or 1.
      const parity = ((side % 2) + 2) % 2 === 1;
      turn.value = withSpring(side, { ...springs.gentle, velocity: -e.velocityX / width }, (done) => {
        // Only once it has landed: if a new turn took over, leave that one running.
        if (done) turn.value = parity ? 1 : 0;
      });
      if (parity !== flipped) scheduleOnRN(set, parity);
    });
  const tap = Gesture.Tap().onEnd(() => scheduleOnRN(set, !flipped));
  const gesture = Gesture.Exclusive(pan, tap);

  const lift = (t: number) => {
    'worklet';
    return 1 - Math.abs(Math.sin(t * Math.PI)) * 0.06;
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1100 }, { rotateY: `${turn.value * 180}deg` }, { scale: lift(turn.value) }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1100 }, { rotateY: `${turn.value * 180 + 180}deg` }, { scale: lift(turn.value) }],
  }));

  const face = [styles.face, { borderRadius: radius, backgroundColor: c.surface, borderColor: c.border, boxShadow: theme.shadows.md }];

  return (
    <GestureDetector gesture={gesture}>
      <View style={style} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="button" accessibilityHint="Turns the card over">
        <Animated.View style={[face, frontStyle]}>{front}</Animated.View>
        <Animated.View style={[face, fill, backStyle]}>{back}</Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // The front grows to the card's size when it is given one, as the back does, and sets the
  // size from its content when it is not.
  face: { flexGrow: 1, overflow: 'hidden', backfaceVisibility: 'hidden', borderWidth: StyleSheet.hairlineWidth },
});

