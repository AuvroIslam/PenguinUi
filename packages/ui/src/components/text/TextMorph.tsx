import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated';

import { springs } from '../../motion/tokens';
import { toneColor, type TextTone } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { typeStyle, type TypeVariant } from '../../theme/tokens';
import { SPACE } from './split';

export type TextMorphProps = {
  children: string;
  variant?: TypeVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

const glide = LinearTransition.springify()
  .mass(springs.snappy.mass)
  .stiffness(springs.snappy.stiffness)
  .damping(springs.snappy.damping);

const arrive = FadeIn.duration(180);
const leave = FadeOut.duration(120);

/**
 * Morphs between strings. Each character is keyed by its letter and how many times that
 * letter has appeared, so letters the two strings share keep their identity and glide to
 * their new positions while the rest fade.
 */
export function TextMorph({ children, variant = 'label', tone = 'default', style }: TextMorphProps) {
  const theme = useTheme();

  const characters = useMemo(() => {
    const seen: Record<string, number> = {};
    return Array.from(children).map((ch) => {
      const id = ch.toLowerCase();
      seen[id] = (seen[id] ?? 0) + 1;
      // Each character is its own text run, and a lone regular space has no width on iOS.
      return { key: `${id}${seen[id]}`, ch: ch === ' ' ? SPACE : ch };
    });
  }, [children]);

  const textStyle = [typeStyle(theme, variant), { color: toneColor(theme, tone) }, style];

  return (
    // The first render should simply be there; only later changes animate.
    <LayoutAnimationConfig skipEntering>
      <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={children}>
        {characters.map(({ key, ch }) => (
          <Animated.Text key={key} layout={glide} entering={arrive} exiting={leave} style={textStyle}>
            {ch}
          </Animated.Text>
        ))}
      </View>
    </LayoutAnimationConfig>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
