import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { MartianMono_400Regular, MartianMono_500Medium } from '@expo-google-fonts/martian-mono';
import { fonts } from '@penguin-ui/brand';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PenguinProvider, Toaster, useTheme, type ThemeOverrides } from 'penguin-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar as RNStatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Embed } from '@/embed';
import { SchemeContext, type Scheme } from '@/scheme';

// On the web, `?c=<demo id>` turns the app into a single bare demo for the website to frame.
const params = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const embedId = params?.get('c') ?? null;
const embedScheme: Scheme | null = embedId ? (params?.get('theme') === 'light' ? 'light' : 'dark') : null;

const overrides: ThemeOverrides = {
  fonts: {
    regular: fonts.regular,
    medium: fonts.medium,
    semibold: fonts.semibold,
    bold: fonts.bold,
    mono: fonts.mono,
  },
};

function Screens() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();


  // Expo Go on Android 14 and below is not edge to edge and paints the status bar black.
  // Matching it to the page keeps the top of the screen seamless; under edge to edge this is a no-op.
  useEffect(() => {
    if (Platform.OS === 'android') RNStatusBar.setBackgroundColor(theme.colors.background);
  }, [theme.colors.background]);

  if (embedId) {
    return (
      <>
        <Embed id={embedId} />
        <Toaster top={12} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
      <Toaster top={insets.top} />
    </>
  );
}

export default function RootLayout() {
  const system = useColorScheme();
  const [scheme, setScheme] = useState<Scheme>(embedScheme ?? (system === 'dark' ? 'dark' : 'light'));
  const toggle = useCallback(() => setScheme((s) => (s === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ scheme, toggle }), [scheme, toggle]);

  const [loaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    MartianMono_400Regular,
    MartianMono_500Medium,
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
