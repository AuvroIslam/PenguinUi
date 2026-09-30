import { useLocalSearchParams, useRouter } from 'expo-router';
import { Glyph, PressableScale, Text, useTheme } from 'penguin-ui';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findDemo } from '@/demos';

export default function DemoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [run, setRun] = useState(0);
  const demo = findDemo(id);
  const c = theme.colors;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <PressableScale
          onPress={back}
          scaleTo={0.9}
          accessibilityLabel="Back"
          style={[styles.round, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}
        >
          <Glyph name="chevron-left" size={20} />
        </PressableScale>
        <Text variant="label" weight="semibold">
          {demo?.name ?? 'Not found'}
        </Text>
        <PressableScale
          onPress={() => setRun((n) => n + 1)}
          scaleTo={0.9}
          accessibilityLabel="Replay"
          style={[styles.round, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}
        >
          <Glyph name="refresh" size={18} />
        </PressableScale>
      </View>

      {demo ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.shell, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}>
            <View
              style={[
                styles.stage,
                demo.layout === 'fill' ? styles.fill : styles.center,
                { backgroundColor: c.surface, boxShadow: `inset 0 1px 0 ${c.highlight}, ${theme.shadows.sm}` },
              ]}
            >
              <demo.Component key={run} />
            </View>
          </View>

          <Text style={styles.summary}>{demo.summary}</Text>

          <Text variant="micro" tone="muted" style={styles.label}>
            Motion
          </Text>
          <Text tone="muted">{demo.motion}</Text>

          {demo.touch ? (
            <>
              <Text variant="micro" tone="muted" style={styles.label}>
                Touch
              </Text>
              <Text tone="muted">{demo.touch}</Text>
            </>
          ) : null}
        </ScrollView>
      ) : (
        <Text tone="muted" align="center" style={styles.missing}>
          There is no component called "{id}".
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bar: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shell: { marginTop: 8, borderRadius: 28, padding: 6, borderWidth: StyleSheet.hairlineWidth },
  stage: { borderRadius: 22, minHeight: 380, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fill: {},
  summary: { marginTop: 22 },
  label: { marginTop: 22, marginBottom: 6 },
  missing: { marginTop: 80, paddingHorizontal: 40 },
});
