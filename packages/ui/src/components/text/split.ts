export type SplitBy = 'char' | 'word' | 'line';

export type Segment = {
  /** Position in the reveal order. */
  index: number;
  text: string;
};

/**
 * A word is a group that must not break across lines. `trailing` says a space follows it;
 * the space is drawn inside the word's own view so a wrapped line never starts with one.
 */
export type Word = { key: string; segments: Segment[]; trailing: boolean };

export type Line = { key: string; words: Word[] };

/**
 * The space drawn after a word. A regular space at the end of a text run is left out of
 * layout on iOS, which would close the gap between words; a non-breaking space is not.
 */
export const SPACE = ' ';

/**
 * Splits text for per-segment animation while keeping natural wrapping:
 * lines hold words, and words hold the segments that animate.
 * Lines break on `\n` only, because the break points of wrapped text are not known before layout.
 */
export function splitText(text: string, by: SplitBy): { lines: Line[]; count: number } {
  let index = 0;
  const lines = text.split('\n').map((lineText, l): Line => {
    if (by === 'line') {
      return {
        key: `l${l}`,
        words: [{ key: `l${l}w0`, trailing: false, segments: [{ index: index++, text: lineText }] }],
      };
    }
    const parts = lineText.split(/\s+/).filter((part) => part.length > 0);
    const words = parts.map((part, w): Word => {
      const segments =
        by === 'word'
          ? [{ index: index++, text: part }]
          : Array.from(part).map((ch) => ({ index: index++, text: ch }));
      return { key: `l${l}w${w}`, trailing: w < parts.length - 1, segments };
    });
    return { key: `l${l}`, words };
  });
  return { lines, count: index };
}
