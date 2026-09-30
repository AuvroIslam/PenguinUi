import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';

export type CheckboxProps = {
  value?: boolean;
  defaultValue?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
  /** Strike the label through and dim it when checked, for task lists. */
  strike?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BOX = 26;

/**
 * A checkbox that builds itself in order. The fill grows out of the centre on a bouncy
 * spring, then the check is drawn into it. Unchecking runs it backwards: the check erases
 * first, then the fill lets go. With `strike`, a line is drawn through the label in step.
 */
export function Checkbox({
  value: controlled,
  defaultValue = false,
  onChange,
  label,
  strike = false,
  disabled,
  style,
}: CheckboxProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [checked, setChecked] = useControllable(controlled, defaultValue, onChange);

  const fillLevel = useSharedValue(checked ? 1 : 0)
  const mark = useSharedValue(checked ? 1 : 0);
  const line = useSharedValue(checked ? 1 : 0);
  const first = useSharedValue(true);
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    if (first.value) {
      first.value = false;
      return;
    }
    if (checked) {
      fillLevel.value = withSpring(1, springs.bouncy);
      mark.value = withDelay(110, withTiming(1, { duration: 260, easing: easings.out }));
      line.value = withDelay(60, withTiming(1, { duration: 320, easing: easings.out }));
    } else {
      mark.value = withTiming(0, { duration: 120 });
      fillLevel.value = withDelay(90, withTiming(0, { duration: 160 }));
      line.value = withTiming(0, { duration: 200 });
    }
  }, [checked, fillLevel, mark, line, first]);

  const box = useAnimatedStyle(() => ({
    borderColor: interpolateColor(fillLevel.value, [0, 1], [c.borderStrong, c.accent]),
  }));
  const core = useAnimatedStyle(() => ({
    opacity: Math.min(1, fillLevel.value * 2),
    transform: [{ scale: fillLevel.value }],
  }));
  const strikeStyle = useAnimatedStyle(() => ({ width: labelWidth * line.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: 1 - line.value * 0.5 }));

  return (
    <PressableScale
      onPress={() => {
        haptic(checked ? 'light' : 'medium');
        setChecked(!checked);
      }}
      disabled={disabled}
      haptic={false}
      scaleTo={0.97}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      style={[styles.row, style]}
    >
      <Animated.View style={[styles.box, { backgroundColor: c.surface, borderRadius: 8 }, box]}>
        <Animated.View style={[fill, styles.core, { backgroundColor: c.accent }, core]} />
        <DrawnCheck progress={mark} size={BOX - 6} color={c.onAccent} strokeWidth={2.4} />
      </Animated.View>
      {label ? (
        <View>
          <Animated.View style={labelStyle} onLayout={(e: LayoutChangeEvent) => setLabelWidth(e.nativeEvent.layout.width)}>
            <Text variant="body">{label}</Text>
          </Animated.View>
          {strike ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.strike, { backgroundColor: c.textMuted }, strikeStyle]}
            />
          ) : null}
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start', minHeight: 44 },
  box: {
    width: BOX,
    height: BOX,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  core: { borderRadius: 6.5 },
  // The body line box is 22 high, so its middle is at 11.
  strike: { position: 'absolute', left: 0, top: 10.25, height: 1.5, borderRadius: 1 },
});
