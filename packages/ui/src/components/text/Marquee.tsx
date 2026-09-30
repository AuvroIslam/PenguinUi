import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { easings } from '../../motion/tokens';
import { FadeEdge } from '../../primitives/FadeEdge';
import { useTheme } from '../../theme/ThemeProvider';

export type MarqueeProps = {
  /** One set of items. It is repeated as many times as it takes to fill the width. */
  children: ReactNode;
  /** Points per second. */
  speed?: number;
  /** Space between repetitions. */
  gap?: number;
  reverse?: boolean;
  /** Ease to a stop while a finger is down. */
  pauseOnPress?: boolean;
  /** Colour the edges fade into; pass the colour behind the marquee. `false` for hard edges. */
  fade?: string | false;
  fadeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A seamless scrolling band. Speed is a value that eases rather than a switch, so pausing
 * under a finger decelerates and resuming accelerates.
 */
export function Marquee({
  children,
  speed = 36,
  gap = 24,
  reverse = false,
  pauseOnPress = true,
  fade,
  fadeWidth = 32,
  style,
}: MarqueeProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [content, setContent] = useState(0);
  const [container, setContainer] = useState(0);

  const span = useSharedValue(0);
  const offset = useSharedValue(0);
  const rate = useSharedValue(1);

  useEffect(() => {
    span.value = content > 0 ? content + gap : 0;
  }, [content, gap, span]);

  useFrameCallback((frame) => {
    if (span.value <= 0) return;
    const dt = frame.timeSincePreviousFrame ?? 16;
    offset.value = (offset.value + (speed * rate.value * dt) / 1000) % span.value;
  }, !reduced);

  const track = useAnimatedStyle(() => ({
    transform: [{ translateX: reverse ? offset.value - span.value : -offset.value }],
  }));

  const copies = content > 0 ? Math.ceil(container / (content + gap)) + 1 : 1;
  const edge = fade === undefined ? theme.colors.background : fade;

  const hold = () => {
    if (pauseOnPress) rate.value = withTiming(0, { duration: 400, easing: easings.out });
  };
  const resume = () => {
    if (pauseOnPress) rate.value = withTiming(1, { duration: 700, easing: easings.inOut });
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => setContainer(event.nativeEvent.layout.width)}
      onTouchStart={hold}
      onTouchEnd={resume}
      onTouchCancel={resume}
    >
      <Animated.View style={[styles.track, track]}>
        {Array.from({ length: copies }, (_, i) => (
          <View
            key={i}
            style={[styles.copy, { marginRight: gap }]}
            onLayout={i === 0 ? (event) => setContent(event.nativeEvent.layout.width) : undefined}
            accessibilityElementsHidden={i > 0}
            importantForAccessibility={i > 0 ? 'no-hide-descendants' : 'auto'}
          >
            {children}
          </View>
        ))}
      </Animated.View>
      {edge ? (
        <>
          <FadeEdge side="left" color={edge} size={fadeWidth} />
          <FadeEdge side="right" color={edge} size={fadeWidth} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', alignSelf: 'stretch' },
  track: { flexDirection: 'row', alignSelf: 'flex-start' },
  copy: { flexDirection: 'row', alignItems: 'center' },
});
