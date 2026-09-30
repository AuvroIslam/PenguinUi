import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { PageDots } from './PageDots';

export type OnboardingPage = {
  key: string;
  title: string;
  body: string;
  /** Artwork above the text. Any node; it moves slower than the text for parallax. */
  art: ReactNode;
};

export type OnboardingProps = {
  pages: OnboardingPage[];
  /** Label of the button on the last page. */
  doneLabel?: string;
  onDone: () => void;
  style?: StyleProp<ViewStyle>;
};

const BUTTON = 60;

function Page({
  page,
  index,
  width,
  x,
}: {
  page: OnboardingPage;
  index: number;
  width: number;
  x: SharedValue<number>;
}) {
  // Each layer moves at its own rate relative to the page, so the art trails the text.
  const art = useAnimatedStyle(() => {
    const d = x.value / width - index;
    return { transform: [{ translateX: d * width * 0.45 }, { scale: interpolate(Math.abs(d), [0, 1], [1, 0.85]) }], opacity: 1 - Math.min(1, Math.abs(d)) * 0.6 };
  });
  const title = useAnimatedStyle(() => {
    const d = x.value / width - index;
    return { transform: [{ translateX: d * width * 0.18 }], opacity: 1 - Math.min(1, Math.abs(d)) * 1.2 };
  });
  const body = useAnimatedStyle(() => {
    const d = x.value / width - index;
    return { transform: [{ translateX: d * width * 0.32 }], opacity: 1 - Math.min(1, Math.abs(d)) * 1.5 };
  });

  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.art, art]}>{page.art}</Animated.View>
      <Animated.View style={title}>
        <Text variant="display" align="center">
          {page.title}
        </Text>
      </Animated.View>
      <Animated.View style={body}>
        <Text variant="body" tone="muted" align="center" style={styles.bodyText}>
          {page.body}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * A paged introduction. Artwork, title and body each move at a different rate as the pages
 * scroll, so the layers slide past one another. A round next button advances the pages and,
 * on the last one, widens into a labelled call to action, its arrow giving way to the text.
 */
export function Onboarding({ pages, doneLabel = 'Get started', onDone, style }: OnboardingProps) {
  const theme = useTheme();
  const c = theme.colors;
  const { width: screenW } = useWindowDimensions();
  const [width, setWidth] = useState(screenW);
  const scroll = useRef<Animated.ScrollView>(null);
  const x = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      x.value = e.contentOffset.x;
    },
  });

  const last = index === pages.length - 1;
  // Only the count is captured below: `pages` holds React nodes, which a worklet cannot copy.
  const penultimate = pages.length - 2;
  // Fraction of the way to the last page, so the button starts widening during the swipe.
  const progress = useDerivedValue(() => Math.min(1, Math.max(0, x.value / width - penultimate)));
  const pagesScrolled = useDerivedValue(() => x.value / width);
  const toLast = useAnimatedStyle(() => ({ width: interpolate(progress.value, [0, 1], [BUTTON, 184]) }));
  const arrow = useAnimatedStyle(() => ({ opacity: 1 - progress.value, transform: [{ scale: 1 - progress.value * 0.4 }] }));
  const label = useAnimatedStyle(() => ({ opacity: Math.max(0, progress.value * 2 - 1) }));

  const go = () => {
    if (last) {
      haptic('success');
      onDone();
      return;
    }
    haptic('light');
    scroll.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View style={[styles.wrap, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        bounces={false}
      >
        {pages.map((page, i) => (
          <Page key={page.key} page={page} index={i} width={width} x={x} />
        ))}
      </Animated.ScrollView>
      <View style={styles.footer}>
        <PageDots count={pages.length} progress={pagesScrolled} />
        <Animated.View style={[styles.cta, { backgroundColor: c.primary }, toLast]}>
          <PressableScale onPress={go} haptic={false} scaleTo={0.96} accessibilityLabel={last ? doneLabel : 'Next page'} style={styles.ctaHit}>
            <Animated.View style={[styles.center, arrow]}>
              <Glyph name="arrow-right" size={24} color={c.onPrimary} strokeWidth={2} />
            </Animated.View>
            <Animated.View style={[styles.center, label]} pointerEvents="none">
              <Text variant="label" tone="onPrimary" numberOfLines={1}>
                {doneLabel}
              </Text>
            </Animated.View>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignSelf: 'stretch' },
  page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  art: { height: 210, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bodyText: { maxWidth: 300 },
  footer: { alignItems: 'center', gap: 22, paddingBottom: 24 },
  cta: { height: BUTTON, borderRadius: BUTTON / 2, overflow: 'hidden' },
  ctaHit: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
