import { actions } from './actions';
import { controls } from './controls';
import { navigation } from './navigation';
import { overlays } from './overlays';
import { cards } from './cards';
import { media } from './media';
import { inputs } from './inputs';
import { text } from './text';
import type { Demo } from './types';

export { categories, type Category, type Demo } from './types';

export const demos: Demo[] = [...actions, ...text, ...inputs, ...controls, ...navigation, ...overlays, ...cards, ...media];

export function findDemo(id: string | undefined): Demo | undefined {
  return demos.find((demo) => demo.id === id);
}
