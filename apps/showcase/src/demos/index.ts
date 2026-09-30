import { actions } from './actions';
import { text } from './text';
import type { Demo } from './types';

export { categories, type Category, type Demo } from './types';

export const demos: Demo[] = [...actions, ...text];

export function findDemo(id: string | undefined): Demo | undefined {
  return demos.find((demo) => demo.id === id);
}
