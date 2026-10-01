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

import { SchemeContext, type Scheme } from '@/scheme';

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
  const [scheme, setScheme] = useState<Scheme>(system === 'dark' ? 'dark' : 'light');
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
