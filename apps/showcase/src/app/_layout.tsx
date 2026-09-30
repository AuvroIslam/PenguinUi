import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PenguinProvider, useTheme, type ThemeOverrides } from 'penguin-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar as RNStatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SchemeContext, type Scheme } from '@/scheme';

const overrides: ThemeOverrides = {
  fonts: {
    regular: 'Geist_400Regular',
    medium: 'Geist_500Medium',
    semibold: 'Geist_600SemiBold',
    bold: 'Geist_700Bold',
    mono: 'GeistMono_400Regular',
  },
};

function Screens() {
  const theme = useTheme();

  // Expo Go on Android 14 and below is not edge to edge and paints the status bar black.
  // Matching it to the page keeps the top of the screen seamless; under edge to edge this is a no-op.
  useEffect(() => {
    if (Platform.OS === 'android') RNStatusBar.setBackgroundColor(theme.colors.background);
  }, [theme.colors.background]);

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const system = useColorScheme();
  const [scheme, setScheme] = useState<Scheme>(system === 'dark' ? 'dark' : 'light');
  const toggle = useCallback(() => setScheme((s) => (s === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ scheme, toggle }), [scheme, toggle]);

  const [loaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <SchemeContext.Provider value={value}>
        <PenguinProvider scheme={scheme} theme={overrides}>
          <Screens />
        </PenguinProvider>
      </SchemeContext.Provider>
    </SafeAreaProvider>
  );
}
