import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { Eye } from './Eyes';
import { Layer, type ViewBox } from './Layer';
import { useBlink, useBreath } from './motion';
import { palette as p } from './palette';

export type FriendProps = {
  /** Width in points. Height follows the drawing's proportions. */
  size?: number;
  breathe?: boolean;
  /** Unique suffix for gradient ids when several of the same friend share a page. */
  id?: string;
  style?: StyleProp<ViewStyle>;
};

type Rig = { vb: ViewBox };

function useRig({ vb }: Rig, size: number, breathe: boolean) {
  const blink = useBlink();
  const breath = useBreath(3000, breathe);
  const k = size / vb.w;
  const body = useAnimatedStyle(() => ({
    transformOrigin: '50% 95%',
    transform: [{ translateY: -breath.value * 2 * k }, { scaleY: 1 + breath.value * 0.016 }],
  }));
  return { body, blink, height: (size * vb.h) / vb.w };
}

function Shell({ size, height, style, children }: { size: number; height: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return <View style={[{ width: size, height }, style]}>{children}</View>;
}

const fillAll = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };

const SEAL: Rig = { vb: { w: 220, h: 180 } };

/** Mochi, the seal pup. Lies on her belly with her round head up, all cheeks and whiskers. */
export function Mochi({ size = 160, breathe = true, id = 'mochi', style }: FriendProps) {
  const { body, blink, height } = useRig(SEAL, size, breathe);
  const vb = SEAL.vb;
  return (
    <Shell size={size} height={height} style={style}>
      <Layer vb={vb}>
        <Ellipse cx={110} cy={168} rx={86} ry={7} fill={p.ice} />
      </Layer>
      <Animated.View style={[fillAll, body]}>
        <Layer vb={vb}>
          <Defs>
            <LinearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#D9E5F6" />
              <Stop offset="1" stopColor="#B9CDEB" />
            </LinearGradient>
          </Defs>
          <Path d="M70 120 C 80 96 130 92 164 108 C 186 118 196 132 192 148 C 189 160 176 164 160 164 L 80 164 C 62 164 58 140 70 120 Z" fill="#B9CDEB" />
          <Path d="M184 140 C 198 132 210 136 212 146 C 204 148 198 152 196 160 C 192 152 188 148 184 140 Z" fill="#A9C0E4" />
          <Circle cx={86} cy={96} r={56} fill={`url(#${id}-b)`} stroke="#AFC5E8" strokeWidth={1.5} />
          <Path d="M52 140 C 40 150 42 164 58 164 C 60 156 62 150 66 144 Z" fill="#A9C0E4" />
          <Path d="M112 142 C 120 152 118 164 104 164 C 104 156 102 150 100 144 Z" fill="#A9C0E4" />
          <Ellipse cx={86} cy={112} rx={20} ry={14} fill={p.white} />
          <Path d="M80 104 C 83 101 89 101 92 104 C 91 108 88 110 86 110 C 84 110 81 108 80 104 Z" fill={p.navy} />
          <Path d="M86 110 L 86 114 M 79 116 C 83 119 89 119 93 116" stroke={p.navy} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <Circle cx={74} cy={112} r={1.1} fill="#9FB4D6" />
          <Circle cx={76} cy={117} r={1.1} fill="#9FB4D6" />
          <Circle cx={98} cy={112} r={1.1} fill="#9FB4D6" />
          <Circle cx={96} cy={117} r={1.1} fill="#9FB4D6" />
          <Ellipse cx={54} cy={108} rx={8} ry={5} fill={p.blush} opacity={0.85} />
          <Ellipse cx={118} cy={108} rx={8} ry={5} fill={p.blush} opacity={0.85} />
        </Layer>
        <Layer vb={vb}>
          <Eye spec={{ cx: 66, cy: 90, rx: 8.5, ry: 10, glint: [-3, -4.5, 3.2], spark: [2.5, 4, 1.4] }} blink={blink} />
          <Eye spec={{ cx: 106, cy: 90, rx: 8.5, ry: 10, glint: [-3, -4.5, 3.2], spark: [2.5, 4, 1.4] }} blink={blink} />
        </Layer>
      </Animated.View>
    </Shell>
  );
}

const BEAR: Rig = { vb: { w: 200, h: 200 } };

/** Frost, the polar bear cub. Round ears, a soft snout and a very calm face. */
export function Frost({ size = 160, breathe = true, id = 'frost', style }: FriendProps) {
  const { body, blink, height } = useRig(BEAR, size, breathe);
  const vb = BEAR.vb;
  const line = '#C3D5EF';
  return (
    <Shell size={size} height={height} style={style}>
      <Layer vb={vb}>
        <Ellipse cx={100} cy={190} rx={62} ry={7} fill={p.ice} />
      </Layer>
      <Animated.View style={[fillAll, body]}>
        <Layer vb={vb}>
          <Defs>
            <LinearGradient id={`${id}-h`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={p.white} />
              <Stop offset="1" stopColor="#DCE8F8" />
            </LinearGradient>
            <LinearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F2F7FE" />
              <Stop offset="1" stopColor="#D3E2F6" />
            </LinearGradient>
          </Defs>
          <Path d="M44 152 C 44 122 68 106 100 106 C 132 106 156 122 156 152 C 156 178 138 188 100 188 C 62 188 44 178 44 152 Z" fill={`url(#${id}-b)`} stroke={line} strokeWidth={1.5} />
          <Ellipse cx={74} cy={183} rx={19} ry={9} fill={p.white} stroke={line} strokeWidth={1.5} />
          <Ellipse cx={126} cy={183} rx={19} ry={9} fill={p.white} stroke={line} strokeWidth={1.5} />
          <Circle cx={54} cy={54} r={19} fill={p.white} stroke={line} strokeWidth={1.5} />
          <Circle cx={146} cy={54} r={19} fill={p.white} stroke={line} strokeWidth={1.5} />
          <Circle cx={54} cy={54} r={9.5} fill="#BCD3F5" />
          <Circle cx={146} cy={54} r={9.5} fill="#BCD3F5" />
          <Ellipse cx={100} cy={96} rx={60} ry={54} fill={`url(#${id}-h)`} stroke={line} strokeWidth={1.5} />
          <Ellipse cx={70} cy={110} rx={9} ry={5.5} fill={p.blush} opacity={0.85} />
          <Ellipse cx={130} cy={110} rx={9} ry={5.5} fill={p.blush} opacity={0.85} />
          <Ellipse cx={100} cy={114} rx={18} ry={13} fill={p.white} stroke="#D3E2F6" strokeWidth={1.2} />
          <Path d="M92 107 C 96 104 104 104 108 107 C 106 112 103 114 100 114 C 97 114 94 112 92 107 Z" fill={p.navy} />
          <Path d="M100 114 L 100 118 M 94 120 C 97 122.5 103 122.5 106 120" stroke={p.navy} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Layer>
        <Layer vb={vb}>
          <Eye spec={{ cx: 78, cy: 92, rx: 7.5, ry: 9, glint: [-2.5, -4, 2.8], spark: [2.5, 3.5, 1.2] }} blink={blink} />
          <Eye spec={{ cx: 122, cy: 92, rx: 7.5, ry: 9, glint: [-2.5, -4, 2.8], spark: [2.5, 3.5, 1.2] }} blink={blink} />
        </Layer>
      </Animated.View>
    </Shell>
  );
}

const ORCA: Rig = { vb: { w: 240, h: 150 } };

/** Bubbles, the orca. Deep navy with a white chin, the fastest swimmer of the group. */
export function Bubbles({ size = 200, breathe = true, style }: FriendProps) {
  const { body, blink, height } = useRig(ORCA, size, breathe);
  const vb = ORCA.vb;
  return (
    <Shell size={size} height={height} style={style}>
      <Layer vb={vb}>
        <Ellipse cx={120} cy={142} rx={90} ry={6} fill={p.ice} />
      </Layer>
      <Animated.View style={[fillAll, body]}>
        <Layer vb={vb}>
          <Path d="M192 84 C 208 66 226 66 230 76 C 220 80 212 86 208 96 C 220 98 228 106 226 116 C 214 114 200 106 192 96 Z" fill={p.navy} />
          <Path d="M122 46 C 126 26 136 14 148 12 C 142 26 142 38 148 50 Z" fill={p.navy} />
          <Path d="M24 94 C 24 60 66 42 116 42 C 162 42 196 62 202 90 C 208 112 188 130 150 132 L 72 132 C 40 132 24 118 24 94 Z" fill="#1E3266" />
          <Path d="M30 104 C 40 126 80 132 120 130 C 152 128 172 120 182 110 C 150 114 118 112 90 108 C 66 105 46 104 30 104 Z" fill={p.white} />
          <Path d="M74 66 C 88 60 102 64 104 72 C 100 78 88 80 78 76 C 72 74 70 70 74 66 Z" fill={p.white} />
          <Ellipse cx={52} cy={98} rx={8} ry={4.5} fill={p.blush} opacity={0.9} />
          <Path d="M30 96 C 36 101 44 101 48 97" stroke="#9FB4D6" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M100 122 C 96 136 104 146 120 144 C 114 136 112 128 114 120 Z" fill={p.navy} />
        </Layer>
        <Layer vb={vb}>
          <Eye spec={{ cx: 66, cy: 84, rx: 6.5, ry: 7.5, glint: [-2, -3, 2.4] }} blink={blink} stroke="#2A4380" />
        </Layer>
      </Animated.View>
    </Shell>
  );
}

const NARWHAL: Rig = { vb: { w: 240, h: 160 } };

/** Nori, the narwhal. Sky blue with a spiral tusk and freckles of light. */
export function Nori({ size = 200, breathe = true, id = 'nori', style }: FriendProps) {
  const { body, blink, height } = useRig(NARWHAL, size, breathe);
  const vb = NARWHAL.vb;
  return (
    <Shell size={size} height={height} style={style}>
      <Layer vb={vb}>
        <Ellipse cx={120} cy={152} rx={88} ry={6} fill={p.ice} />
      </Layer>
      <Animated.View style={[fillAll, body]}>
        <Layer vb={vb}>
          <Defs>
            <LinearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={p.sky} />
              <Stop offset="1" stopColor="#6E9BF5" />
            </LinearGradient>
          </Defs>
          <Path d="M62 66 L 12 30 L 66 58 Z" fill="#FFF4DD" stroke="#EAD8B0" strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M24 38 L 27 44 M 35 46 L 38 52 M 46 53 L 49 59" stroke="#E2CB98" strokeWidth={2} strokeLinecap="round" />
          <Path d="M196 96 C 212 80 228 80 232 88 C 222 92 214 98 210 108 C 222 110 228 118 226 126 C 214 124 202 116 196 106 Z" fill="#6E9BF5" />
          <Path d="M30 104 C 30 70 64 54 112 54 C 156 54 196 72 204 98 C 210 118 190 138 150 142 L 76 142 C 44 142 30 128 30 104 Z" fill={`url(#${id}-b)`} />
          <Circle cx={140} cy={76} r={4} fill={p.white} opacity={0.4} />
          <Circle cx={156} cy={88} r={3} fill={p.white} opacity={0.4} />
          <Circle cx={128} cy={90} r={2.5} fill={p.white} opacity={0.4} />
          <Circle cx={170} cy={78} r={2.5} fill={p.white} opacity={0.4} />
          <Path d="M36 116 C 48 134 86 140 122 138 C 152 136 170 130 180 122 C 152 124 122 124 92 120 C 70 118 50 116 36 116 Z" fill={p.white} opacity={0.94} />
          <Ellipse cx={60} cy={108} rx={8} ry={4.5} fill={p.blush} opacity={0.9} />
          <Path d="M40 108 C 45 112 52 112 56 108" stroke="#3E68C9" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M104 130 C 100 144 108 152 124 150 C 118 142 116 134 118 128 Z" fill="#5A86E8" />
        </Layer>
        <Layer vb={vb}>
          <Eye spec={{ cx: 72, cy: 94, rx: 6.5, ry: 7.5, glint: [-2, -3, 2.4] }} blink={blink} />
        </Layer>
      </Animated.View>
    </Shell>
  );
}
