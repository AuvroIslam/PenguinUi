import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { haptic } from '../../motion/haptics';
import { Glyph } from '../../primitives/Glyph';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { Collapse } from './Collapse';

export type ExpandableCardProps = {
  title: string;
  subtitle?: string;
  /** Node on the left of the header, such as an icon. */
  leading?: ReactNode;
  /** Detail shown when open. Each direct child fades in a beat after the one before. */
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * A card that opens where it stands. Its height springs open on a heavy spring, the chevron
 * turns in step with the height rather than on its own timer, and the details are uncovered
 * one after another so the eye is led down the card.
 */
export function ExpandableCard({
  title,
  subtitle,
  leading,
  children,
  defaultOpen = false,
  open: controlled,
  onOpenChange,
  style,
}: ExpandableCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ?? inner;
  const progress = useSharedValue(open ? 1 : 0);

  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 180}deg` }] }));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.lg, boxShadow: theme.shadows.sm },
        style,
      ]}
    >
      <PressableScale
        onPress={() => {
          haptic('light');
          setInner(!open);
          onOpenChange?.(!open);
        }}
        haptic={false}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={styles.header}
      >
        {leading}
        <View style={styles.titles}>
          <Text variant="label">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Animated.View style={[styles.chevron, { backgroundColor: c.surfaceSunken }, chevron]}>
          <Glyph name="chevron-down" size={18} color={c.textMuted} />
        </Animated.View>
      </PressableScale>
      <Collapse open={open} stagger progress={progress}>
        {children}
      </Collapse>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', alignSelf: 'stretch' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  titles: { flex: 1, gap: 2 },
  chevron: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
