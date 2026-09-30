import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';

type GlyphSpec = {
  /** Stroked paths on a 24pt grid. */
  d?: string[];
  /** Filled paths. */
  fill?: string[];
  /** Stroked circles as [cx, cy, r]. */
  circles?: [number, number, number][];
  /** Filled circles as [cx, cy, r]. */
  dots?: [number, number, number][];
};

const glyphs = {
  check: { d: ['M5 12.5l4.5 4.5L19 7.5'] },
  x: { d: ['M6 6l12 12M18 6L6 18'] },
  plus: { d: ['M12 5v14M5 12h14'] },
  minus: { d: ['M5 12h14'] },
  'chevron-down': { d: ['M6 9l6 6 6-6'] },
  'chevron-up': { d: ['M6 15l6-6 6 6'] },
  'chevron-right': { d: ['M9 6l6 6-6 6'] },
  'chevron-left': { d: ['M15 6l-6 6 6 6'] },
  'arrow-right': { d: ['M5 12h14M13 6l6 6-6 6'] },
  'arrow-left': { d: ['M19 12H5M11 6l-6 6 6 6'] },
  'arrow-up': { d: ['M12 19V5M6 11l6-6 6 6'] },
  'arrow-up-right': { d: ['M7 17L17 7M8 7h9v9'] },
  search: { d: ['M16 16l4 4'], circles: [[11, 11, 6.5]] },
  heart: {
    d: [
      'M12 20.5C7 16.5 4 13.6 4 9.9 4 7.2 6.1 5.2 8.6 5.2c1.4 0 2.6.7 3.4 1.8.8-1.1 2-1.8 3.4-1.8 2.5 0 4.6 2 4.6 4.7 0 3.7-3 6.6-8 10.6z',
    ],
  },
  star: { d: ['M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8 6.9 19.5l1-5.7-4.1-4 5.7-.8z'] },
  copy: {
    d: [
      'M9 11.5A2.5 2.5 0 0 1 11.5 9h6a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 9 17.5z',
      'M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9',
    ],
  },
  mic: {
    d: ['M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z', 'M6 11.5a6 6 0 0 0 12 0', 'M12 17.5V21'],
  },
  stop: { fill: ['M8.5 7h7A1.5 1.5 0 0 1 17 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 15.5v-7A1.5 1.5 0 0 1 8.5 7z'] },
  trash: { d: ['M5 7h14', 'M10 7V5h4v2', 'M7 7l1 12h8l1-12'] },
  eye: {
    d: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z'],
    circles: [[12, 12, 3]],
  },
  lock: { d: ['M8 11V8a4 4 0 0 1 8 0v3', 'M6.5 11h11A1.5 1.5 0 0 1 19 12.5v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11z'] },
  backspace: {
    d: ['M9 6h10a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H9l-6-6 6-6z', 'M12 10l4 4M16 10l-4 4'],
  },
  bell: { d: ['M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'] },
  home: { d: ['M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z'] },
  user: { d: ['M5 20a7 7 0 0 1 14 0'], circles: [[12, 8, 3.5]] },
  sliders: {
    d: ['M4 7h10M18 7h2M4 17h2M10 17h10'],
    circles: [
      [16, 7, 2],
      [8, 17, 2],
    ],
  },
  bookmark: { d: ['M7 4h10v16l-5-4-5 4z'] },
  share: { d: ['M12 15V4M8 8l4-4 4 4', 'M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5'] },
  bolt: { d: ['M13 3L5 13.5h6L11 21l8-10.5h-6z'] },
  more: {
    dots: [
      [6, 12, 1.4],
      [12, 12, 1.4],
      [18, 12, 1.4],
    ],
  },
  play: { fill: ['M8 5.5v13l11-6.5z'] },
  pause: { fill: ['M7 5.5h3.5v13H7zM13.5 5.5H17v13h-3.5z'] },
  info: { d: ['M12 11v5'], circles: [[12, 12, 8.5]], dots: [[12, 8, 0.9]] },
  alert: { d: ['M12 4.5l8.5 15h-17z', 'M12 10.5v4'], dots: [[12, 17, 0.9]] },
  clock: { d: ['M12 7.5V12l3 2'], circles: [[12, 12, 8.5]] },
  card: { d: ['M4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9A1.5 1.5 0 0 1 4.5 6z', 'M3 10h18'] },
  music: {
    d: ['M9 17.5V6l10-2v11.5'],
    circles: [
      [6.5, 17.5, 2.5],
      [16.5, 15.5, 2.5],
    ],
  },
  sparkle: { d: ['M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z'] },
  message: { d: ['M4 6h16v10H9l-5 4z'] },
  pencil: { d: ['M4 20l1-4L16 5l3 3L8 19z'] },
  refresh: { d: ['M20 12a8 8 0 1 1-2.3-5.6', 'M20 4v4h-4'] },
  pin: { d: ['M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z'], circles: [[12, 10, 2.5]] },
  image: {
    d: ['M5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11A1.5 1.5 0 0 1 5.5 5z', 'M4 16l4.5-4.5L13 16l3-3 4 4'],
    circles: [[15, 9.5, 1.5]],
  },
  grid: { d: ['M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z'] },
  menu: { d: ['M4 8h16M4 16h16'] },
  wifi: { d: ['M4.5 10a11 11 0 0 1 15 0', 'M7.5 13.5a6.5 6.5 0 0 1 9 0'], dots: [[12, 17.5, 1.2]] },
  phone: { d: ['M6 4h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2z'] },
} satisfies Record<string, GlyphSpec>;

export type GlyphName = keyof typeof glyphs;

export type GlyphProps = {
  name: GlyphName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * The small line-icon set the library uses for its own affordances. Components take any
 * node for icons, so this is a default, not a requirement.
 */
export function Glyph({ name, size = 20, color, strokeWidth = 1.75 }: GlyphProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.text;
  const spec: GlyphSpec = glyphs[name];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {spec.d?.map((d, i) => (
        <Path
          key={`d${i}`}
          d={d}
          stroke={tint}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {spec.fill?.map((d, i) => (
        <Path key={`f${i}`} d={d} fill={tint} />
      ))}
      {spec.circles?.map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} stroke={tint} strokeWidth={strokeWidth} />
      ))}
      {spec.dots?.map(([cx, cy, r], i) => (
        <Circle key={`o${i}`} cx={cx} cy={cy} r={r} fill={tint} />
      ))}
    </Svg>
  );
}
