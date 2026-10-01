import { actions } from './actions';
import { controls } from './controls';
import { navigation } from './navigation';
import { overlays } from './overlays';
import { inputs } from './inputs';
import { text } from './text';
import type { Demo } from './types';

export { categories, type Category, type Demo } from './types';

export const demos: Demo[] = [...actions, ...text, ...inputs, ...controls, ...navigation, ...overlays];

export function findDemo(id: string | undefined): Demo | undefined {
  return demos.find((demo) => demo.id === id);
}
