import { Bubbles, Frost, Mochi, Nori, Pip, PolarScene, Portrait, characters, type SceneTime } from '@penguin-ui/brand';
import { Text, useTheme } from 'penguin-ui';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TIMES: SceneTime[] = ['morning', 'dawn', 'dusk', 'night', 'aurora', 'deep'];

/** The cast and their world, on one page. */
export default function Brand() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState<'idle' | 'happy' | 'surprised'>('idle');
  const lookX = useSharedValue(0);

  useEffect(() => {
    lookX.value = withRepeat(withSequence(withTiming(-1, { duration: 1400 }), withTiming(1, { duration: 1400 })), -1, true);
    const moods = ['idle', 'happy', 'surprised'] as const;
    let i = 0;
    const t = setInterval(() => setMood(moods[++i % 3]), 1800);
    return () => clearInterval(t);
  }, [lookX]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 22 }}
    >
      <Text variant="display">Meet the crew</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
        <Pip size={150} mood={mood} waving lookX={lookX} />
        <Pip size={90} mood="happy" id="pip2" />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
        <Mochi size={150} />
        <Frost size={130} />
        <Bubbles size={170} />
        <Nori size={170} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {characters.map((c) => (
          <Portrait key={c.key} character={c.key} size={52} />
        ))}
      </View>
      {TIMES.map((time, i) => (
        <PolarScene
          key={time}
          time={time}
          character={characters[i % characters.length].key}
          style={{ height: 200, borderRadius: 24 }}
        />
      ))}
    </ScrollView>
  );
}
