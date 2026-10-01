import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '../../primitives/PressableScale';
import { useTheme } from '../../theme/ThemeProvider';

export type CardProps = {
  children: ReactNode;
  /** Makes the card a button that gives a little under the finger. */
  onPress?: () => void;
  /** Corner radius of the inner surface. The outer shell's radius is derived from it. */
  radius?: number;
  /** Width of the bezel between the shell and the surface. */
  bezel?: number;
  /** Padding inside the surface. */
  padding?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A double-bezel card: a sunken outer shell holding a raised inner surface, the way a
 * machined part sits in a tray. The two radii stay concentric (the shell's is the surface's
 * plus the bezel), a hairline light catches the surface's top edge, and the shadow is soft
 * and tinted rather than grey. With `onPress` it becomes a button that sinks slightly under
 * the finger.
 */
export function Card({
  children,
  onPress,
  radius = 20,
  bezel = 5,
  padding = 18,
  accessibilityLabel,
  style,
}: CardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const outer = radius + bezel;

  const shell = (
    <View
      style={[
        styles.shell,
        { padding: bezel, borderRadius: outer, backgroundColor: c.surfaceSunken, borderColor: c.border },
        onPress ? null : style,
      ]}
    >
      <View
        style={[
          styles.core,
          {
            padding,
            borderRadius: radius,
            backgroundColor: c.surface,
            borderColor: c.border,
            boxShadow: theme.shadows.sm,
          },
        ]}
      >
        {/* The machined edge: a hairline of light along the top of the surface. */}
        <View
          pointerEvents="none"
          style={[styles.highlight, { left: radius * 0.6, right: radius * 0.6, backgroundColor: c.highlight }]}
        />
        {children}
      </View>
    </View>
  );

  if (!onPress) return shell;

  return (
    <PressableScale onPress={onPress} scaleTo={0.985} haptic="soft" accessibilityLabel={accessibilityLabel} style={style}>
      {shell}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shell: { borderWidth: StyleSheet.hairlineWidth },
  core: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  highlight: { position: 'absolute', top: 0, height: 1 },
});
