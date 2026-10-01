import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { Glyph } from '../../primitives/Glyph';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { clamp, fill } from '../../utils/layout';

export type ImageCompareProps = {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  /** Starting divider position, 0 to 1. */
  initial?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Before and after, split by a divider you drag. The divider trails the finger on a quick
 * spring, which reads as weight rather than lag, and the handle grows when grabbed. The
 * labels at each side fade as the divider covers them, so they never sit on the wrong image.
 */
export function ImageCompare({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  initial = 0.5,
  height = 320,
  style,
}: ImageCompareProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(initial);
  const grab = useSharedValue(0);

  const lift = () => haptic('light');

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      grab.value = withSpring(1, springs.bouncy);
      x.value = withSpring(clamp(e.x / width, 0, 1), springs.snappy);
      scheduleOnRN(lift);
    })
    .onUpdate((e) => {
      x.value = withSpring(clamp(e.x / width, 0, 1), springs.snappy);
    })
    .onFinalize(() => {
      grab.value = withSpring(0, springs.smooth);
    });

  const clip = useAnimatedStyle(() => ({ width: x.value * width }));
  const line = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * width - 1 }] }));
  const handle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * width - 22 }, { scale: interpolate(grab.value, [0, 1], [1, 1.22]) }],
  }));
  const leftLabel = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0.12, 0.3], [0, 1], 'clamp') }));
  const rightLabel = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0.7, 0.88], [1, 0], 'clamp') }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.frame, { height, borderRadius: theme.radii.xl }, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel="Image comparison"
      >
        <View style={fill}>{after}</View>
        {/* The before image keeps its full width inside a narrowing clip, so it never squashes. */}
        <Animated.View style={[styles.clip, clip]}>
          <View style={{ width, height }}>{before}</View>
        </Animated.View>
        <Animated.View style={[styles.label, styles.left, leftLabel]}>
          <Text variant="micro" style={styles.labelText}>
            {beforeLabel}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.label, styles.right, rightLabel]}>
          <Text variant="micro" style={styles.labelText}>
            {afterLabel}
          </Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.line, line]} />
        <Animated.View pointerEvents="none" style={[styles.handle, { top: height / 2 - 22 }, handle]}>
          <Glyph name="chevron-left" size={16} color="#111" strokeWidth={2.4} />
          <Glyph name="chevron-right" size={16} color="#111" strokeWidth={2.4} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignSelf: 'stretch' },
  clip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  line: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, backgroundColor: '#fff' },
  handle: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
  },
  label: {
    position: 'absolute',
    top: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  left: { left: 14 },
  right: { right: 14 },
  labelText: { color: '#fff' },
});
