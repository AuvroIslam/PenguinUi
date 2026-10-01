import type { TextStyle } from 'react-native';

export type ThemeColors = {
  /** Page background. */
  background: string;
  /** Raised surface: cards, sheets, inputs. */
  surface: string;
  /** Surface that sits above another surface: menus, toasts. */
  surfaceRaised: string;
  /** Recessed wells: tracks, bezels, segmented backgrounds. */
  surfaceSunken: string;
  /** Hairline border. */
  border: string;
  /** Border for controls that need to read as interactive. */
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** High-contrast fill for primary actions. Ink on light, paper on dark. */
  primary: string;
  onPrimary: string;
  /** The single accent. State and emphasis only. */
  accent: string;
  onAccent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  /** Text and icons on success, warning and danger fills. */
  onStatus: string;
  /** Scrim behind overlays. */
  scrim: string;
  /** Inner top highlight that gives a surface its machined edge. */
  highlight: string;
  /** Shadow tint. Carries the background hue so shadows never read as grey smudges. */
  shadow: string;
};

export type ThemeFonts = {
  regular?: string;
  medium?: string;
  semibold?: string;
  bold?: string;
  mono?: string;
};

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold';

export type TypeVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption'
  | 'micro';

type TypeRamp = Record<
  TypeVariant,
  { fontSize: number; lineHeight: number; letterSpacing: number; weight: FontWeightName }
>;

export type Theme = {
  dark: boolean;
  colors: ThemeColors;
  radii: typeof radii;
  fonts: ThemeFonts;
  type: TypeRamp;
  shadows: { sm: string; md: string; lg: string };
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

const type: TypeRamp = {
  display: { fontSize: 34, lineHeight: 38, letterSpacing: -1, weight: 'bold' },
  title: { fontSize: 24, lineHeight: 30, letterSpacing: -0.6, weight: 'bold' },
  heading: { fontSize: 18, lineHeight: 24, letterSpacing: -0.3, weight: 'semibold' },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: -0.1, weight: 'regular' },
  label: { fontSize: 15, lineHeight: 20, letterSpacing: -0.1, weight: 'medium' },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0, weight: 'regular' },
  micro: { fontSize: 11, lineHeight: 14, letterSpacing: 0.6, weight: 'medium' },
};

// The polar palette. Neutrals carry a little of the sea's blue so nothing reads as plain grey,
// text is a deep navy ink rather than black, and the single accent is the penguin's own blue.
export const lightColors: ThemeColors = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#EBF1F9',
  border: 'rgba(16, 38, 77, 0.09)',
  borderStrong: 'rgba(16, 38, 77, 0.18)',
  text: '#0B1730',
  textMuted: '#52627D',
  textFaint: '#95A3BA',
  primary: '#0F1F42',
  onPrimary: '#F4F7FB',
  accent: '#2F6BF0',
  onAccent: '#FFFFFF',
  accentSoft: 'rgba(47, 107, 240, 0.12)',
  success: '#17A673',
  successSoft: 'rgba(23, 166, 115, 0.12)',
  warning: '#E8930C',
  warningSoft: 'rgba(232, 147, 12, 0.14)',
  danger: '#E5484D',
  dangerSoft: 'rgba(229, 72, 77, 0.12)',
  onStatus: '#FFFFFF',
  scrim: 'rgba(7, 14, 30, 0.42)',
  highlight: 'rgba(255, 255, 255, 0.9)',
  shadow: '16, 32, 68',
};

export const darkColors: ThemeColors = {
  background: '#070C18',
  surface: '#0D1526',
  surfaceRaised: '#131D33',
  surfaceSunken: '#0A111F',
  border: 'rgba(214, 228, 255, 0.08)',
  borderStrong: 'rgba(214, 228, 255, 0.16)',
  text: '#EAF1FF',
  textMuted: '#93A3BF',
  textFaint: '#5D6C88',
  primary: '#EAF1FF',
  onPrimary: '#070C18',
  accent: '#5B8DFF',
  onAccent: '#050A16',
  accentSoft: 'rgba(91, 141, 255, 0.18)',
  success: '#34C78E',
  successSoft: 'rgba(52, 199, 142, 0.16)',
  warning: '#F2AE3D',
  warningSoft: 'rgba(242, 174, 61, 0.16)',
  danger: '#F2606A',
  dangerSoft: 'rgba(242, 96, 106, 0.16)',
  onStatus: '#050A16',
  scrim: 'rgba(0, 3, 10, 0.62)',
  highlight: 'rgba(214, 228, 255, 0.07)',
  shadow: '0, 4, 16',
};

export type ThemeOverrides = {
  /** Replaces the accent. `accentSoft` is derived from it unless given in `colors`. */
  accent?: string;
  onAccent?: string;
  colors?: Partial<ThemeColors>;
  fonts?: ThemeFonts;
};

function softFrom(hex: string, alpha: number): string | undefined {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return undefined;
  const n = parseInt(match[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function createTheme(dark: boolean, overrides: ThemeOverrides = {}): Theme {
  const base = dark ? darkColors : lightColors;
  const accent = overrides.accent ?? base.accent;
  const colors: ThemeColors = {
    ...base,
    accent,
    onAccent: overrides.onAccent ?? base.onAccent,
    accentSoft:
      (overrides.accent && softFrom(overrides.accent, dark ? 0.16 : 0.12)) ?? base.accentSoft,
    ...overrides.colors,
  };
  const s = colors.shadow;
  return {
    dark,
    colors,
    radii,
    fonts: overrides.fonts ?? {},
    type,
    shadows: dark
      ? {
          sm: `0 1px 2px rgba(${s}, 0.4)`,
          md: `0 4px 14px rgba(${s}, 0.45)`,
          lg: `0 16px 40px rgba(${s}, 0.55)`,
        }
      : {
          sm: `0 1px 2px rgba(${s}, 0.06)`,
          md: `0 1px 2px rgba(${s}, 0.05), 0 6px 18px rgba(${s}, 0.07)`,
          lg: `0 2px 4px rgba(${s}, 0.04), 0 18px 44px rgba(${s}, 0.12)`,
        },
  };
}

const weights: Record<FontWeightName, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/**
 * Font style for a weight. When the theme supplies a family for that weight the family is used
 * alone, because custom fonts on Android are selected by family name, not by `fontWeight`.
 */
export function fontFor(theme: Theme, weight: FontWeightName): TextStyle {
  const family = theme.fonts[weight];
  return family ? { fontFamily: family } : { fontWeight: weights[weight] };
}

/** Text style for a step of the type ramp. */
export function typeStyle(theme: Theme, variant: TypeVariant): TextStyle {
  const t = theme.type[variant];
  return {
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    ...fontFor(theme, t.weight),
  };
}
