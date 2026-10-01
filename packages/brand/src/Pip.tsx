import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { Layer, origin, type ViewBox } from './Layer';
import { useBlink, useBreath, useWave } from './motion';
import { palette as p } from './palette';

export type PipMood = 'idle' | 'happy' | 'surprised';

export type PipProps = {
  /** Width in points. Height follows the drawing's proportions. */
  size?: number;
  mood?: PipMood;
  /** Wave the right flipper. */
  waving?: boolean;
  /** Where Pip looks, each from -1 to 1. Drive these from a pointer or a scroll. */
  lookX?: SharedValue<number>;
  lookY?: SharedValue<number>;
  /** Gentle idle breathing. */
  breathe?: boolean;
  /** Ids inside one SVG document must be unique; pass a suffix when several Pips share a page. */
  id?: string;
  style?: StyleProp<ViewStyle>;
};

const VB: ViewBox = { w: 200, h: 220 };
// Pivot points, worked out once: animated styles run on the UI thread and cannot call back
// into ordinary JavaScript functions.
const EYES = origin(VB, 100, 104);
const FLIP_L = origin(VB, 38, 122);
const FLIP_R = origin(VB, 162, 122);
const BEAK = origin(VB, 100, 116);

/**
 * Pip, the PenguinUi penguin. A round blue penguin with a white heart-shaped face, glossy
 * eyes and an orange beak. He blinks on his own, breathes when idle, can wave, can look
 * toward a point, and has a happy and a surprised face.
 */
export function Pip({ size = 160, mood = 'idle', waving = false, lookX, lookY, breathe = true, id = 'pip', style }: PipProps) {
  const blink = useBlink();
  const breath = useBreath(2800, breathe);
  const wave = useWave(waving);
  const fallbackX = useSharedValue(0);
  const fallbackY = useSharedValue(0);
  const lx = lookX ?? fallbackX;
  const ly = lookY ?? fallbackY;

  const happy = useSharedValue(mood === 'happy' ? 1 : 0);
  const surprise = useSharedValue(mood === 'surprised' ? 1 : 0);
  useEffect(() => {
    happy.value = withSpring(mood === 'happy' ? 1 : 0, { damping: 16, stiffness: 220 });
    surprise.value = withSpring(mood === 'surprised' ? 1 : 0, { damping: 12, stiffness: 260 });
  }, [mood, happy, surprise]);

  const k = size / VB.w;

  const body = useAnimatedStyle(() => ({
    transformOrigin: '50% 95%',
    transform: [
      { translateY: -breath.value * 2.2 * k },
      { scaleY: 1 + breath.value * 0.018 },
      { scaleX: 1 - breath.value * 0.008 },
      // A slight lean toward whatever he is looking at.
      { rotate: `${lx.value * 3}deg` },
    ],
  }));
  const eyes = useAnimatedStyle(() => ({
    opacity: 1 - happy.value,
    transformOrigin: EYES,
    transform: [
      { translateX: lx.value * 4.5 * k },
      { translateY: ly.value * 3.5 * k },
      { scaleY: blink.value * (1 + surprise.value * 0.18) },
      { scaleX: 1 + surprise.value * 0.12 },
    ],
  }));
  const arcs = useAnimatedStyle(() => ({ opacity: happy.value }));
  const flipL = useAnimatedStyle(() => ({
    transformOrigin: FLIP_L,
    transform: [{ rotate: `${breath.value * 3 + surprise.value * 18}deg` }],
  }));
  const flipR = useAnimatedStyle(() => ({
    transformOrigin: FLIP_R,
    transform: [{ rotate: `${wave.value - breath.value * 3 - surprise.value * 18}deg` }],
  }));
  const beak = useAnimatedStyle(() => ({
    transformOrigin: BEAK,
    transform: [{ scaleY: 1 + surprise.value * 0.35 }],
  }));

  return (
    <View style={[{ width: size, height: (size * VB.h) / VB.w }, style]}>
      <Layer vb={VB}>
        <Ellipse cx={100} cy={210} rx={58} ry={7} fill={p.ice} opacity={0.9} />
        <Ellipse cx={78} cy={203} rx={17} ry={8} fill={p.beak} />
        <Ellipse cx={122} cy={203} rx={17} ry={8} fill={p.beak} />
      </Layer>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, body]}>
        <Layer vb={VB} style={flipL}>
          <Path d="M32 116 C 14 126 8 152 14 166 C 22 160 36 146 42 130 Z" fill={p.blueDeep} />
        </Layer>
        <Layer vb={VB} style={flipR}>
          <Path d="M168 116 C 186 126 192 152 186 166 C 178 160 164 146 158 130 Z" fill={p.blueDeep} />
        </Layer>
        <Layer vb={VB}>
          <Defs>
            <LinearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={p.blueBright} />
              <Stop offset="1" stopColor={p.blueDeep} />
            </LinearGradient>
            <LinearGradient id={`${id}-belly`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={p.white} />
              <Stop offset="1" stopColor="#E4EEFF" />
            </LinearGradient>
          </Defs>
          <Path
            d="M100 26 C 150 26 176 72 176 128 C 176 180 144 204 100 204 C 56 204 24 180 24 128 C 24 72 50 26 100 26 Z"
            fill={`url(#${id}-body)`}
          />
          <Path d="M96 30 C 92 14 106 6 113 15 C 106 13 102 19 106 28 Z" fill={p.blueDeep} />
          <Path
            d="M100 72 C 110 56 142 54 150 80 C 157 102 154 122 152 140 C 148 178 126 196 100 196 C 74 196 52 178 48 140 C 46 122 43 102 50 80 C 58 54 90 56 100 72 Z"
            fill={`url(#${id}-belly)`}
          />
          <Ellipse cx={64} cy={124} rx={10} ry={6} fill={p.blush} opacity={0.8} />
          <Ellipse cx={136} cy={124} rx={10} ry={6} fill={p.blush} opacity={0.8} />
        </Layer>
        <Layer vb={VB} style={beak}>
          <Path d="M89 117 C 95 112 105 112 111 117 C 108 126 104 130 100 130 C 96 130 92 126 89 117 Z" fill={p.beak} />
          <Path d="M91 119 C 96 121 104 121 109 119" stroke={p.beakDeep} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Layer>
        <Layer vb={VB} style={eyes}>
          <Ellipse cx={78} cy={104} rx={9} ry={11} fill={p.ink} />
          <Ellipse cx={122} cy={104} rx={9} ry={11} fill={p.ink} />
          <Circle cx={75} cy={99} r={3.6} fill={p.white} />
          <Circle cx={119} cy={99} r={3.6} fill={p.white} />
          <Circle cx={81} cy={109} r={1.6} fill={p.white} />
          <Circle cx={125} cy={109} r={1.6} fill={p.white} />
        </Layer>
        <Layer vb={VB} style={arcs}>
          <Path d="M69 106 C 72 97 84 97 87 106" stroke={p.ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <Path d="M113 106 C 116 97 128 97 131 106" stroke={p.ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </Layer>
      </Animated.View>
    </View>
  );
}
