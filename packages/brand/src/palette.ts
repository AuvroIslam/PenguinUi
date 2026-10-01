/**
 * The brand palette. Everything visual in PenguinUi, from the mascots to the demo scenes,
 * draws from this list so the whole project reads as one place: a cold, bright polar
 * morning, with one warm note in the penguin's beak.
 */
export const palette = {
  /** Text and the darkest marks. A navy ink, never black. */
  ink: '#0B1730',
  /** Deep sea navy: the orca, night skies, primary buttons. */
  navy: '#16264D',
  /** Pip's back. The brand blue. */
  blue: '#2F6BF0',
  blueDeep: '#2551D9',
  blueBright: '#4A84FF',
  /** Open sky and shallow water. */
  sky: '#9CC2FF',
  /** Ice: borders, shadows on snow, sunken surfaces. */
  ice: '#D5E3F5',
  frost: '#EBF1F9',
  snow: '#F4F7FB',
  white: '#FFFFFF',
  /** The one warm colour: Pip's beak and feet. Use sparingly. */
  beak: '#FF9A3C',
  beakDeep: '#E07A22',
  /** Cheeks. */
  blush: '#FFB4C6',
  /** Aurora light, for night scenes only. */
  aurora: '#3DDAB4',
  auroraBlue: '#5B8DFF',
  /** A pale lilac for dusk skies. */
  dusk: '#C9C3F2',
} as const;

export type BrandColor = keyof typeof palette;
