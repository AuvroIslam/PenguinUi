import { findDemo } from '@penguin-ui/demos';
import { Text, useTheme } from 'penguin-ui';
import { ScrollView, StyleSheet, View } from 'react-native';

/**
 * One component demo with nothing around it, filling the viewport. The website loads this
 * page in an iframe shaped like a phone, as `?c=<demo id>&theme=dark`, so every preview on
 * the site is the real component running, not a recording.
 */
export function Embed({ id }: { id: string }) {
  const theme = useTheme();
  const demo = findDemo(id);

  if (!demo) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <Text tone="muted">No component called {id}.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.content,
        demo.layout === 'fill' ? styles.top : styles.center,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <demo.Component />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 28 },
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { justifyContent: 'center' },
});
