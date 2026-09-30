import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';

export type TypewriterProps = {
  /** One string, or several to type, delete and replace in turn. */
  text: string | string[];
  /** Average milliseconds per character. The real delay varies around it. */
  speed?: number;
  /** Milliseconds per character when deleting. */
  deleteSpeed?: number;
  /** Milliseconds a finished phrase is held before it is deleted. */
  pause?: number;
  /** With several phrases, start again after the last. */
  loop?: boolean;
  delay?: number;
  caret?: boolean;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
  /** Called when typing stops for good: a single phrase, or the last of a list that does not loop. */
  onDone?: () => void;
};

/**
 * Types text with a caret. Delays vary per character and stretch after punctuation,
 * which is what separates typing from a progress bar made of letters.
 */
export function Typewriter({
  text,
  speed = 70,
  deleteSpeed = 32,
  pause = 1600,
  loop = true,
  delay = 0,
  caret = true,
  variant = 'label',
  tone = 'default',
  style,
  onDone,
}: TypewriterProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const phrases = Array.isArray(text) ? text : [text];
  const signature = phrases.join('\n');

  const [typed, setTyped] = useState('');
  const [active, setActive] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const list = signature.split('\n');
    if (reduced) {
      setTyped(list[0]);
      return;
    }

    let phrase = 0;
    let shown = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    setTyped('');

    const step = () => {
      const chars = Array.from(list[phrase]);
      if (deleting) {
        shown -= 1;
        setTyped(chars.slice(0, shown).join(''));
        if (shown <= 0) {
          deleting = false;
          phrase = (phrase + 1) % list.length;
          setActive(false);
          timer = setTimeout(step, speed * 4);
        } else {
          setActive(true);
          timer = setTimeout(step, deleteSpeed);
        }
        return;
      }

      shown += 1;
      setTyped(chars.slice(0, shown).join(''));
      if (shown >= chars.length) {
        setActive(false);
        const last = phrase === list.length - 1;
        if (list.length === 1 || (last && !loop)) {
          onDoneRef.current?.();
          return;
        }
        deleting = true;
        timer = setTimeout(step, pause);
        return;
      }

      setActive(true);
      const ch = chars[shown - 1];
      const rhythm = speed * (0.55 + Math.random() * 0.9);
      const breath = /[.,!?;:]/.test(ch) ? speed * 4 : 0;
      timer = setTimeout(step, rhythm + breath);
    };

    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [signature, speed, deleteSpeed, pause, loop, delay, reduced]);

  // The caret holds steady while keys are landing and blinks once typing rests.
  const blink = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(blink);
    blink.value = 1;
    if (!active) {
      blink.value = withRepeat(
        withSequence(
          withDelay(460, withTiming(0, { duration: 90 })),
          withDelay(460, withTiming(1, { duration: 90 })),
        ),
        -1,
      );
    }
    return () => cancelAnimation(blink);
  }, [active, blink]);

  const caretStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  const flat = StyleSheet.flatten([typeStyle(theme, variant), { color: toneColor(theme, tone) }, style]);
  const fontSize = flat.fontSize ?? 15;

  return (
    <RNText accessibilityRole="text" accessibilityLabel={phrases[0]} style={flat}>
      {typed}
      {caret ? (
        <Animated.View
          style={[
            {
              width: Math.max(1.5, fontSize / 11),
              height: fontSize * 1.05,
              marginLeft: 2,
              borderRadius: 1,
              backgroundColor: theme.colors.accent,
              transform: [{ translateY: fontSize * 0.16 }],
            },
            caretStyle,
          ]}
        />
      ) : null}
    </RNText>
  );
}
