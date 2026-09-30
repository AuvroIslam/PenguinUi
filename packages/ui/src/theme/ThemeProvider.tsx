import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { setHapticsEnabled } from '../motion/haptics';
import { PortalProvider } from '../primitives/Portal';
import { createTheme, type Theme, type ThemeOverrides } from './tokens';

const fallback = createTheme(false);
const ThemeContext = createContext<Theme>(fallback);

export type PenguinProviderProps = {
  /** `system` follows the device setting. */
  scheme?: 'light' | 'dark' | 'system';
  /** Accent, colour and font overrides. Keep the reference stable to avoid re-creating the theme. */
  theme?: ThemeOverrides;
  /** Set to false to silence every haptic in the library. */
  haptics?: boolean;
  children: ReactNode;
};

/**
 * Root provider. Supplies the theme, hosts overlays, and sets up gesture handling,
 * so it should wrap the whole app once.
 */
export function PenguinProvider({
  scheme = 'system',
  theme: overrides,
  haptics = true,
  children,
}: PenguinProviderProps) {
  const system = useColorScheme();
  const dark = scheme === 'system' ? system === 'dark' : scheme === 'dark';
  const theme = useMemo(() => createTheme(dark, overrides), [dark, overrides]);

  useEffect(() => {
    setHapticsEnabled(haptics);
  }, [haptics]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeContext.Provider value={theme}>
        <PortalProvider>{children}</PortalProvider>
      </ThemeContext.Provider>
    </GestureHandlerRootView>
  );
}

/** The active theme. Falls back to the light theme outside a provider. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
