import { useEffect, useRef, useState } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';

export type TextScrambleProps = {
  children: string;
  /** Milliseconds between one character resolving and the next. */
  stagger?: number;
  /** Milliseconds every character scrambles before the first one resolves. */
  lead?: number;
  delay?: number;
  /** Characters to scramble through. */
  glyphs?: string;
  /** Replays whenever this value changes. */
  trigger?: unknown;
  /** Uses the theme's mono family, which keeps the width steady while scrambling. */
  mono?: boolean;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
  onDone?: () => void;
};

const DEFAULT_GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$+=';
const TICK = 45;

function scramble(chars: string[], from: number, glyphs: string): string {
  let out = '';
  for (let i = from; i < chars.length; i++) {
    const ch = chars[i];
    out += /\s/.test(ch) ? ch : glyphs[Math.floor(Math.random() * glyphs.length)];
  }
  return out;
}

/**
 * Decoding effect. Every character cycles through random glyphs and they lock in from
 * left to right. Characters still scrambling are drawn muted so the resolved text leads the eye.
 */
export function TextScramble({
  children,
  stagger = 28,
  lead = 240,
  delay = 0,
  glyphs = DEFAULT_GLYPHS,
  trigger,
  mono = false,
  variant = 'label',
  tone = 'default',
  style,
  onDone,
}: TextScrambleProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [resolved, setResolved] = useState(reduced ? children : '');
  const [pending, setPending] = useState('');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      setResolved(children);
      setPending('');
      return;
    }
    const chars = Array.from(children);
    const start = Date.now() + delay;
    setResolved('');
    setPending(scramble(chars, 0, glyphs));

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed < 0) return;
      const count = Math.min(chars.length, Math.max(0, Math.floor((elapsed - lead) / stagger) + 1));
      setResolved(chars.slice(0, count).join(''));
      setPending(scramble(chars, count, glyphs));
      if (count >= chars.length) {
        clearInterval(timer);
        onDoneRef.current?.();
      }
    }, TICK);

    return () => clearInterval(timer);
  }, [children, trigger, stagger, lead, delay, glyphs, reduced]);

  return (
    <RNText
      accessibilityRole="text"
      accessibilityLabel={children}
      style={[
        typeStyle(theme, variant),
        { color: toneColor(theme, tone) },
        mono ? { fontFamily: theme.fonts.mono } : null,
        style,
      ]}
    >
      {resolved}
      <RNText style={{ color: theme.colors.textFaint }}>{pending}</RNText>
    </RNText>
  );
}
