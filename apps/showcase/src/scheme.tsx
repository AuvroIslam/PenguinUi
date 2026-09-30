import { createContext, useContext } from 'react';

export type Scheme = 'light' | 'dark';

export const SchemeContext = createContext<{ scheme: Scheme; toggle(): void }>({
  scheme: 'light',
  toggle() {},
});

export function useScheme() {
  return useContext(SchemeContext);
}
