import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { easings } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';
import { withAlpha } from '../../utils/color';
import { SPACE } from './split';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type HighlightTextProps = {
  children: string;
  /** The phrase inside the text to mark. */
  highlight: string;
  kind?: 'marker' | 'underline';
  /** Defaults to the accent: translucent for the marker, solid for the underline. */
  color?: string;
  delay?: number;
  duration?: number;
  /** Replays whenever this value changes. */
  trigger?: unknown;
  variant?: TypeVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
};

const justify = { left: 'flex-start', center: 'center', right: 'flex-end' } as const;

type Piece = { text: string; mark: number };
/** Pieces that sit together with no whitespace between them, so they must wrap as one. */
type Group = { pieces: Piece[]; trailing: boolean };

/**
 * Cuts the text into unbreakable groups and tags the pieces that fall inside the phrase.
 * `mark` is the piece's position among marked pieces, or -1.
 */
function build(text: string, phrase: string): { groups: Group[]; marks: number } {
  const from = phrase ? text.indexOf(phrase) : -1;
  const to = from + phrase.length;
  const groups: Group[] = [];
  let marks = 0;
  let current: Group | null = null;

  for (const match of text.matchAll(/\s+|\S+/g)) {
    const start = match.index ?? 0;
    const stop = start + match[0].length;

    if (/^\s/.test(match[0])) {
      if (current) {
        current.trailing = true;
        // A space inside the phrase belongs to the stroke, so it joins the marked piece before it.
        const last = current.pieces[current.pieces.length - 1];
        if (from >= 0 && start >= from && stop <= to && last.mark >= 0) {
          last.text += SPACE;
          current.trailing = false;
        }
      }
      current = null;
      continue;
    }

    const pieces: Piece[] = [];
    if (from < 0 || stop <= from || start >= to) {
      pieces.push({ text: match[0], mark: -1 });
    } else {
      const a = Math.max(start, from);
      const b = Math.min(stop, to);
      if (a > start) pieces.push({ text: text.slice(start, a), mark: -1 });
      pieces.push({ text: text.slice(a, b), mark: marks++ });
      if (b < stop) pieces.push({ text: text.slice(b, stop), mark: -1 });
    }
    current = { pieces, trailing: false };
    groups.push(current);
  }
  return { groups, marks };
}

/** A hand-drawn looking wave, built from smooth quadratic segments. */
function wavePath(width: number): string {
  const count = Math.max(1, Math.round(width / 7));
  const dx = width / count;
  let d = `M0 3.5 q ${dx / 2} -3 ${dx} 0`;
  for (let i = 1; i < count; i++) d += ` t ${dx} 0`;
  return d;
}

type MarkProps = {
  text: string;
  kind: 'marker' | 'underline';
  color: string;
  /** Width of the marked pieces before this one, and of all of them together. */
  before: number;
  total: number;
  progress: SharedValue<number>;
  lineHeight: number;
  textStyle: StyleProp<TextStyle>;
  /** The stroke overhangs the phrase a little at each end, but never between its pieces. */
  first: boolean;
  last: boolean;
  onWidth: (width: number) => void;
};

function Mark({
  text,
  kind,
  color,
  before,
  total,
  progress,
  lineHeight,
  textStyle,
  first,
  last,
  onWidth,
}: MarkProps) {
  const [width, setWidth] = useState(0);

  // The sweep is one continuous stroke across every marked piece: this piece fills only
  // while the stroke is passing through it.
  const fill = (value: number) => {
    'worklet';
    if (width <= 0 || total <= 0) return 0;
    const local = (value * total - before) / width;
    return local < 0 ? 0 : local > 1 ? 1 : local;
  };

  const marker = useAnimatedStyle(() => ({ transform: [{ scaleX: fill(progress.value) }] }));

  const length = width * 1.25 + 4;
  const stroke = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - fill(progress.value)) }));

  return (
    <View
      onLayout={(event) => {
        const w = event.nativeEvent.layout.width;
        setWidth(w);
        onWidth(w);
      }}
    >
      {kind === 'marker' ? (
        <Animated.View
          style={[
            styles.marker,
            {
              top: lineHeight * 0.4,
              height: lineHeight * 0.52,
              left: first ? -3 : 0,
              right: last ? -3 : 0,
              borderTopLeftRadius: first ? 3 : 0,
              borderBottomLeftRadius: first ? 3 : 0,
              borderTopRightRadius: last ? 3 : 0,
              borderBottomRightRadius: last ? 3 : 0,
              backgroundColor: color,
            },
            marker,
          ]}
        />
      ) : width > 0 ? (
        <Svg width={width} height={7} style={[styles.underline, { top: lineHeight - 3 }]}>
          <AnimatedPath
            d={wavePath(width)}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={[length, length]}
            animatedProps={stroke}
          />
        </Svg>
      ) : null}
      <RNText style={textStyle}>{text}</RNText>
    </View>
  );
}

/**
 * Marks a phrase the way a highlighter would: one stroke, from the left, that carries on
 * across word boundaries and line wraps.
 */
export function HighlightText({
  children,
  highlight,
  kind = 'marker',
  color,
  delay = 300,
  duration = 450,
  trigger,
  variant = 'body',
  tone = 'default',
  align = 'left',
  style,
}: HighlightTextProps) {
  const theme = useTheme();
  const flat = StyleSheet.flatten([typeStyle(theme, variant), { color: toneColor(theme, tone) }, style]);
  const lineHeight = flat.lineHeight ?? Math.ceil((flat.fontSize ?? 15) * 1.4);
  const tint = color ?? (kind === 'marker' ? withAlpha(theme.colors.accent, 0.3) : theme.colors.accent);

  const { groups, marks } = useMemo(() => build(children, highlight), [children, highlight]);

  const [widths, setWidths] = useState<number[]>([]);
  let total = 0;
  let ready = marks > 0;
  const offsets: number[] = [];
  for (let i = 0; i < marks; i++) {
    offsets.push(total);
    total += widths[i] ?? 0;
    if (!widths[i]) ready = false;
  }

  const progress = useSharedValue(0);
  useEffect(() => {
    if (!ready) return;
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration, easing: easings.fluid }));
    return () => cancelAnimation(progress);
  }, [ready, trigger, delay, duration, progress]);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={children}
      style={[styles.row, { justifyContent: justify[align] }]}
    >
      {groups.map((group, g) => (
        <View key={g} style={styles.group}>
          {group.pieces.map((piece, p) =>
            piece.mark < 0 ? (
              <RNText key={p} style={flat}>
                {piece.text}
              </RNText>
            ) : (
              <Mark
                key={p}
                text={piece.text}
                kind={kind}
                color={tint}
                before={offsets[piece.mark]}
                total={total}
                progress={progress}
                lineHeight={lineHeight}
                textStyle={flat}
                first={piece.mark === 0}
                last={piece.mark === marks - 1}
                onWidth={(w) =>
                  setWidths((prev) => {
                    if (prev[piece.mark] === w) return prev;
                    const next = prev.slice();
                    next[piece.mark] = w;
                    return next;
                  })
                }
              />
            ),
          )}
          {group.trailing ? <RNText style={flat}>{SPACE}</RNText> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  group: { flexDirection: 'row' },
  marker: {
    position: 'absolute',
    transformOrigin: '0% 50%',
  },
  underline: { position: 'absolute', left: 0 },
});
