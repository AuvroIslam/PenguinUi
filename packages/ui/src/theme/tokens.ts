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
  display: { fontSize: 34, lineHeight: 38, letterSpacing: -1, weight: 'semibold' },
  title: { fontSize: 24, lineHeight: 30, letterSpacing: -0.6, weight: 'semibold' },
  heading: { fontSize: 18, lineHeight: 24, letterSpacing: -0.3, weight: 'semibold' },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: -0.1, weight: 'regular' },
  label: { fontSize: 15, lineHeight: 20, letterSpacing: -0.1, weight: 'medium' },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0, weight: 'regular' },
  micro: { fontSize: 11, lineHeight: 14, letterSpacing: 0.6, weight: 'medium' },
};

export const lightColors: ThemeColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F1F1F3',
  border: 'rgba(9, 9, 11, 0.08)',
  borderStrong: 'rgba(9, 9, 11, 0.16)',
  text: '#09090B',
  textMuted: '#6B6B76',
  textFaint: '#A1A1AA',
  primary: '#18181B',
  onPrimary: '#FAFAFA',
  accent: '#F4581C',
  onAccent: '#1C0A02',
  accentSoft: 'rgba(244, 88, 28, 0.12)',
  success: '#1E9E5A',
  successSoft: 'rgba(30, 158, 90, 0.12)',
  warning: '#D98A0B',
  warningSoft: 'rgba(217, 138, 11, 0.14)',
  danger: '#E0424A',
  dangerSoft: 'rgba(224, 66, 74, 0.12)',
  onStatus: '#FFFFFF',
  scrim: 'rgba(9, 9, 11, 0.42)',
  highlight: 'rgba(255, 255, 255, 0.9)',
  shadow: '24, 24, 32',
};

export const darkColors: ThemeColors = {
  background: '#09090B',
  surface: '#131316',
  surfaceRaised: '#1B1B1F',
  surfaceSunken: '#0E0E10',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  textFaint: '#6B6B76',
  primary: '#FAFAFA',
  onPrimary: '#09090B',
  accent: '#FF6B35',
  onAccent: '#1C0A02',
  accentSoft: 'rgba(255, 107, 53, 0.16)',
  success: '#35C27A',
  successSoft: 'rgba(53, 194, 122, 0.16)',
  warning: '#F0A92B',
  warningSoft: 'rgba(240, 169, 43, 0.16)',
  danger: '#F2555D',
  dangerSoft: 'rgba(242, 85, 93, 0.16)',
  onStatus: '#09090B',
  scrim: 'rgba(0, 0, 0, 0.6)',
  highlight: 'rgba(255, 255, 255, 0.07)',
  shadow: '0, 0, 0',
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
