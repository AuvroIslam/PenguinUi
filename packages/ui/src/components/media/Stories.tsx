import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type Story = { key: string; content: ReactNode; /** Milliseconds on screen. */ duration?: number };

export type StoriesProps = {
  stories: Story[];
  /** Header shown over the stories, such as the author. It fades away while paused. */
  header?: ReactNode;
  onEnd?: () => void;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const HOLD = 180;

function Segment({ index, current, progress }: { index: number; current: number; progress: SharedValue<number> }) {
  const fillStyle = useAnimatedStyle(() => {
    const p = index < current ? 1 : index > current ? 0 : progress.value;
    return { transform: [{ scaleX: p }] };
  });
  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fillStyle]} />
    </View>
  );
}

/**
 * A story viewer. A row of segments at the top fills over each story's own duration. Tap the
 * right side for the next story and the left for the last. Press and hold to pause: the
 * segment stops where it is, and after a moment the header and segments fade away so the
 * story can be looked at on its own. Letting go brings them back and carries on.
 */
export function Stories({ stories, header, onEnd, height = 520, style }: StoriesProps) {
  const theme = useTheme();
  const [current, setCurrent] = useState(0);
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const chrome = useSharedValue(1);
  const pressedAt = useSharedValue(0);

  // Read through a ref so the timer callback, created once per story, always sees the latest.
  const currentRef = useRef(current);
  currentRef.current = current;

  const run = () => {
    const duration = stories[currentRef.current]?.duration ?? 5000;
    const remaining = (1 - progress.value) * duration;
    progress.value = withTiming(1, { duration: remaining, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(advance);
    });
  };

  const go = (next: number) => {
    if (next < 0) {
      // Back from the first story restarts it.
      progress.value = 0;
      run();
      return;
    }
    if (next >= stories.length) {
      onEnd?.();
      return;
    }
    haptic('selection');
    setCurrent(next);
  };

  const advance = () => go(currentRef.current + 1);

  useEffect(() => {
    progress.value = 0;
    run();
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      pressedAt.value = Date.now();
      cancelAnimation(progress);
      chrome.value = withDelay(HOLD, withTiming(0, { duration: 200 }));
    })
    .onFinalize((e) => {
      const held = Date.now() - pressedAt.value;
      chrome.value = withTiming(1, { duration: 180 });
      if (held < HOLD && Math.abs(e.translationX) < 10) {
        // A tap moves on; a hold only pauses.
        scheduleOnRN(go, e.x < width * 0.3 ? current - 1 : current + 1);
      } else {
        scheduleOnRN(run);
      }
    });

  const chromeStyle = useAnimatedStyle(() => ({ opacity: chrome.value }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.frame, { height, borderRadius: theme.radii.xl }, style]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View key={stories[current]?.key} entering={FadeIn.duration(220)} style={fill}>
          {stories[current]?.content}
        </Animated.View>
        <Animated.View style={[styles.chrome, chromeStyle]} pointerEvents="none">
          <View style={styles.segments}>
            {stories.map((s, i) => (
              <Segment key={s.key} index={i} current={current} progress={progress} />
            ))}
          </View>
          {header}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignSelf: 'stretch', backgroundColor: '#000' },
  chrome: { position: 'absolute', left: 0, right: 0, top: 0, padding: 12, gap: 12 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  segmentFill: { ...fill, backgroundColor: '#fff', transformOrigin: 'left center' },
});
