import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { easings } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';

export type SpinningTextProps = {
  /** The text fills the whole circle, so end it with a separator, for example "MOTION FIRST • ". */
  children: string;
  /** Distance from the centre to the baseline of the text. */
  radius?: number;
  /** Seconds per revolution. */
  period?: number;
  reverse?: boolean;
  /** Content that sits in the middle and does not spin. */
  center?: ReactNode;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

/**
 * Text set around a circle that turns continuously. A press kicks it to several times its
 * speed and it coasts back down, so the spin has momentum.
 */
export function SpinningText({
  children,
  radius = 56,
  period = 14,
  reverse = false,
  center,
  variant = 'micro',
  tone = 'default',
  style,
}: SpinningTextProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const chars = useMemo(() => Array.from(children), [children]);

  const flat = StyleSheet.flatten([typeStyle(theme, variant), { color: toneColor(theme, tone) }, style]);
  const fontSize = flat.fontSize ?? 11;
  const box = Math.ceil(fontSize * 1.6);
  const size = (radius + box) * 2;

  const rotation = useSharedValue(0);
  const boost = useSharedValue(0);
  const degreesPerMs = ((reverse ? -1 : 1) * 360) / (period * 1000);

  useFrameCallback((frame) => {
    const dt = frame.timeSincePreviousFrame ?? 16;
    rotation.value = (rotation.value + degreesPerMs * (1 + boost.value) * dt) % 360;
  }, !reduced);

  const kick = () => {
    boost.value = withSequence(
      withTiming(6, { duration: 180, easing: easings.out }),
      withTiming(0, { duration: 2200, easing: easings.out }),
    );
  };

  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Pressable
      onPressIn={kick}
      accessibilityRole="text"
      accessibilityLabel={children.trim()}
      style={{ width: size, height: size }}
    >
      <Animated.View style={[styles.ring, ring]}>
        {chars.map((ch, i) => (
          <RNText
            key={i}
            style={[
              flat,
              styles.char,
              {
                width: box,
                height: box,
                lineHeight: box,
                left: size / 2 - box / 2,
                top: size / 2 - box / 2,
                transform: [{ rotate: `${(i * 360) / chars.length}deg` }, { translateY: -radius }],
              },
            ]}
          >
            {ch}
          </RNText>
        ))}
      </Animated.View>
      {center ? <View style={styles.center}>{center}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  char: { position: 'absolute', textAlign: 'center', letterSpacing: 0 },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});
