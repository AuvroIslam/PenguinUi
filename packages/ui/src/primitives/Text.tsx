import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import {
  fontFor,
  typeStyle,
  type FontWeightName,
  type Theme,
  type TypeVariant,
} from '../theme/tokens';

export type TextTone =
  | 'default'
  | 'muted'
  | 'faint'
  | 'accent'
  | 'onPrimary'
  | 'onAccent'
  | 'success'
  | 'warning'
  | 'danger';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  /** Overrides the weight of the variant. */
  weight?: FontWeightName;
  /** Uses the theme's mono family, with tabular figures. */
  mono?: boolean;
  align?: 'left' | 'center' | 'right';
};

export function toneColor(theme: Theme, tone: TextTone): string {
  const c = theme.colors;
  switch (tone) {
    case 'muted':
      return c.textMuted;
    case 'faint':
      return c.textFaint;
    case 'accent':
      return c.accent;
    case 'onPrimary':
      return c.onPrimary;
    case 'onAccent':
      return c.onAccent;
    case 'success':
      return c.success;
    case 'warning':
      return c.warning;
    case 'danger':
      return c.danger;
    default:
      return c.text;
  }
}

/** Themed text. Every label in the library goes through this so the type ramp stays consistent. */
export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  mono,
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typeStyle(theme, variant),
        { color: toneColor(theme, tone) },
        weight ? fontFor(theme, weight) : null,
        mono ? { fontFamily: theme.fonts.mono, fontVariant: ['tabular-nums'] } : null,
        variant === 'micro' ? { textTransform: 'uppercase' } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
