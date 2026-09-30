import { useCallback, useEffect, useRef, useState } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import {
  cancelAnimation,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { easings } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';
import { formatNumber } from './RollingNumber';

export type CountUpProps = {
  /** The value to count to. Changing it counts on from wherever the number currently is. */
  to: number;
  /** Where the first count starts. */
  from?: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  group?: boolean;
  prefix?: string;
  suffix?: string;
  /** Full control over the displayed string. */
  format?: (value: number) => string;
  /** Restarts the count from `from` whenever this changes. */
  trigger?: unknown;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
  onDone?: () => void;
};

/**
 * Counts to a value on an ease-out curve. The count itself runs on the UI thread; the
 * component only re-renders when the displayed string actually changes.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1200,
  delay = 0,
  decimals = 0,
  group = true,
  prefix = '',
  suffix = '',
  format,
  trigger,
  variant = 'label',
  tone = 'default',
  style,
  onDone,
}: CountUpProps) {
  const theme = useTheme();
  const value = useSharedValue(from);
  const scale = Math.pow(10, decimals);

  const formatRef = useRef(format);
  formatRef.current = format;

  const render = useCallback(
    (n: number) =>
      formatRef.current ? formatRef.current(n) : `${prefix}${formatNumber(n, decimals, group)}${suffix}`,
    [prefix, suffix, decimals, group],
  );

  const [text, setText] = useState(() => render(from));

  const show = useCallback((stepped: number) => setText(render(stepped / scale)), [render, scale]);

  useAnimatedReaction(
    () => Math.round(value.value * scale),
    (stepped, previous) => {
      if (stepped !== previous) scheduleOnRN(show, stepped);
    },
    [scale, show],
  );

  // A changed trigger rewinds to `from`; a changed target carries on from the current value.
  const lastTrigger = useRef(trigger);
  useEffect(() => {
    if (lastTrigger.current !== trigger) {
      lastTrigger.current = trigger;
      value.value = from;
    }
    value.value = withDelay(
      delay,
      withTiming(to, { duration, easing: easings.out }, (finished) => {
        if (finished && onDone) scheduleOnRN(onDone);
      }),
    );
    return () => cancelAnimation(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, trigger, duration, delay, from, value]);

  return (
    <RNText
      accessibilityRole="text"
      style={[
        typeStyle(theme, variant),
        { color: toneColor(theme, tone), fontVariant: ['tabular-nums'] },
        style,
      ]}
    >
      {text}
    </RNText>
  );
}
