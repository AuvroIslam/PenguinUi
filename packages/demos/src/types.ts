import type { ComponentType } from 'react';

export const categories = [
  'Actions',
  'Text',
  'Inputs',
  'Controls',
  'Navigation',
  'Overlays',
  'Cards',
  'Media',
  'Effects',
] as const;

export type Category = (typeof categories)[number];

export type Demo = {
  id: string;
  name: string;
  category: Category;
  /** One line on what the component is for. */
  summary: string;
  /** What moves, and how. */
  motion: string;
  /** Gestures and haptics, where the component has them. */
  touch?: string;
  /** `fill` gives the demo the full stage width with no centring. */
  layout?: 'center' | 'fill';
  Component: ComponentType;
};
