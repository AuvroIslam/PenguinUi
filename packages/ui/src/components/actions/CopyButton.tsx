import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  LinearTransition,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { fill } from '../../utils/layout';
import { TextMorph } from '../text/TextMorph';

export type CopyButtonProps = {
  /**
   * Do the copying here. The library has no clipboard dependency of its own, so this is
   * where you call yours.
   */
  onCopy: () => void;
  label?: string;
  copiedLabel?: string;
  /** Milliseconds the confirmation is shown. */
  resetAfter?: number;
  /** Show only the icon. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const resize = LinearTransition.springify()
  .mass(springs.snappy.mass)
  .stiffness(springs.snappy.stiffness)
  .damping(springs.snappy.damping);

/**
 * Copy with confirmation. The copy glyph turns away as a check draws in its place and the
 * label morphs letter by letter, then both return.
 */
export function CopyButton({
  onCopy,
  label = 'Copy',
  copiedLabel = 'Copied',
  resetAfter = 1600,
  compact = false,
  style,
}: CopyButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const swap = useSharedValue(0);
  const check = useSharedValue(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    swap.value = withTiming(copied ? 1 : 0, { duration: 200, easing: easings.fluid });
    check.value = copied
      ? withDelay(90, withTiming(1, { duration: 300, easing: easings.out }))
      : withTiming(0, { duration: 120 });
  }, [copied, swap, check]);

  const press = () => {
    onCopy();
    haptic('success');
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), resetAfter);
  };

  const glyph = useAnimatedStyle(() => ({
    opacity: 1 - swap.value,
    transform: [
      { scale: interpolate(swap.value, [0, 1], [1, 0.5]) },
      { rotate: `${interpolate(swap.value, [0, 1], [0, -30])}deg` },
    ],
  }));

  return (
    <PressableScale
      haptic={false}
      layout={resize}
      onPress={press}
      accessibilityLabel={copied ? copiedLabel : label}
      style={[
        styles.base,
        compact ? styles.compact : styles.labelled,
        { backgroundColor: c.surfaceSunken, borderColor: c.border },
        style,
      ]}
    >
      <View style={styles.icon}>
        <Animated.View style={glyph}>
          <Glyph name="copy" size={16} color={c.text} />
        </Animated.View>
        <View style={styles.check}>
          <DrawnCheck progress={check} size={18} color={c.success} strokeWidth={2.25} />
        </View>
      </View>
      {compact ? null : (
        <TextMorph variant="caption" style={fontFor(theme, 'medium')}>
          {copied ? copiedLabel : label}
        </TextMorph>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 7,
  },
  labelled: { paddingLeft: 12, paddingRight: 15 },
  compact: { width: 38 },
  icon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  check: { ...fill, alignItems: 'center', justifyContent: 'center' },
});
