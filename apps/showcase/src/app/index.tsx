import { useRouter } from 'expo-router';
import { Glyph, PressableScale, Text, useTheme } from 'penguin-ui';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categories, demos, type Category, type Demo } from '@/demos';
import { useScheme } from '@/scheme';

export default function Home() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scheme, toggle } = useScheme();
  const [query, setQuery] = useState('');
  const c = theme.colors;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? demos.filter((d) => `${d.name} ${d.summary} ${d.category}`.toLowerCase().includes(q))
      : demos;
    return categories
      .map((category: Category) => ({
        category,
        items: matches.filter((d) => d.category === category),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  const open = (demo: Demo) => router.push({ pathname: '/c/[id]', params: { id: demo.id } });

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.bar}>
        <Text variant="label" weight="semibold">
          PenguinUi
        </Text>
        <PressableScale
          onPress={toggle}
          accessibilityLabel={scheme === 'dark' ? 'Use light theme' : 'Use dark theme'}
          style={[styles.toggle, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}
        >
          <Text variant="caption" weight="medium">
            {scheme === 'dark' ? 'Light' : 'Dark'}
          </Text>
        </PressableScale>
      </View>

      <Text variant="display" style={styles.title}>
        Motion-first components.
      </Text>
      <Text tone="muted" style={styles.lede}>
        {demos.length} components for React Native. Each one has a planned micro-interaction.
      </Text>

      <View style={[styles.search, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}>
        <Glyph name="search" size={18} color={c.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search components"
          placeholderTextColor={c.textFaint}
          autoCorrect={false}
          style={[styles.input, { color: c.text, fontFamily: theme.fonts.regular }]}
        />
      </View>

      {sections.map((section) => (
        <View key={section.category} style={styles.section}>
          <View style={styles.sectionHead}>
            <Text variant="micro" tone="muted">
              {section.category}
            </Text>
            <Text variant="micro" tone="faint" mono>
              {section.items.length}
            </Text>
          </View>
          <View style={[styles.shell, { backgroundColor: c.surfaceSunken, borderColor: c.border }]}>
            <View
              style={[
                styles.core,
                { backgroundColor: c.surface, boxShadow: `inset 0 1px 0 ${c.highlight}, ${theme.shadows.sm}` },
              ]}
            >
              {section.items.map((demo, index) => (
                <PressableScale
                  key={demo.id}
                  scaleTo={0.985}
                  onPress={() => open(demo)}
                  style={[
                    styles.row,
                    index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border } : null,
                  ]}
                >
                  <View style={styles.rowText}>
                    <Text variant="label">{demo.name}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {demo.summary}
                    </Text>
                  </View>
                  <Glyph name="chevron-right" size={18} color={c.textFaint} />
                </PressableScale>
              ))}
            </View>
          </View>
        </View>
      ))}

      {sections.length === 0 ? (
        <Text tone="muted" align="center" style={styles.empty}>
          Nothing matches "{query}".
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  toggle: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 28, maxWidth: 300 },
  lede: { marginTop: 10, maxWidth: 320 },
  search: {
    marginTop: 24,
    height: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  section: { marginTop: 28 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  shell: { borderRadius: 24, padding: 5, borderWidth: StyleSheet.hairlineWidth },
  core: { borderRadius: 19, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  empty: { marginTop: 48 },
});
