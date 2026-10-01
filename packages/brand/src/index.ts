export * from './palette';
export * from './motion';
export * from './Pip';
export * from './Friends';
export * from './PolarScene';
export * from './Portrait';
export { Layer, origin, type ViewBox } from './Layer';
export { Eye, type EyeSpec } from './Eyes';

/** The two typefaces of the brand, keyed the way `@expo-google-fonts` exports them. */
export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  heavy: 'BricolageGrotesque_800ExtraBold',
  mono: 'MartianMono_400Regular',
  monoMedium: 'MartianMono_500Medium',
} as const;
