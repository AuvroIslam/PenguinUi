import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Bubbles, Frost, Mochi, Nori } from './Friends';
import { palette as p } from './palette';
import { Pip } from './Pip';

export type SceneTime = 'morning' | 'dawn' | 'dusk' | 'night' | 'aurora' | 'deep';
export type Character = 'pip' | 'mochi' | 'frost' | 'bubbles' | 'nori';

export type PolarSceneProps = {
  time?: SceneTime;
  /** Who is in the picture. Leave out for an empty landscape. */
  character?: Character;
  /** Character height as a share of the scene's height. */
  characterScale?: number;
  /** Mirror the landscape, so a row of scenes does not repeat itself exactly. */
  flip?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type Look = {
  sky: [string, string];
  far: string;
  berg: string;
  bergShade: string;
  sea: [string, string];
  floe: string;
  floeShade: string;
  glint: string;
};

const LOOKS: Record<Exclude<SceneTime, 'deep'>, Look> = {
  morning: {
    sky: ['#BFD8FF', '#EEF5FF'],
    far: '#D6E6FB',
    berg: '#FFFFFF',
    bergShade: '#CFE0F6',
    sea: ['#7FAAF2', '#4F7FE0'],
    floe: '#FFFFFF',
    floeShade: '#D5E3F5',
    glint: 'rgba(255,255,255,0.55)',
  },
  dawn: {
    sky: ['#FFD3C2', '#E6EDFF'],
    far: '#EBDCEB',
    berg: '#FFF8F6',
    bergShade: '#E5D2E2',
    sea: ['#9DB2EC', '#6C86D6'],
    floe: '#FFFAF8',
    floeShade: '#E6D9E8',
    glint: 'rgba(255,236,226,0.6)',
  },
  dusk: {
    sky: ['#B8B2EE', '#FFC9B4'],
    far: '#C9BFE6',
    berg: '#F4F0FF',
    bergShade: '#BFB4E2',
    sea: ['#6F78C9', '#47509E'],
    floe: '#F6F2FF',
    floeShade: '#C9C0E8',
    glint: 'rgba(255,214,200,0.5)',
  },
  night: {
    sky: ['#0B1632', '#1E2F5E'],
    far: '#22366B',
    berg: '#3A5288',
    bergShade: '#2A3E70',
    sea: ['#13234A', '#0A1430'],
    floe: '#4B64A0',
    floeShade: '#324A82',
    glint: 'rgba(150,180,255,0.25)',
  },
  aurora: {
    sky: ['#081230', '#163266'],
    far: '#1C3870',
    berg: '#4A6AAE',
    bergShade: '#2F4C8C',
    sea: ['#10275A', '#081536'],
    floe: '#5A7CC2',
    floeShade: '#3B5A9C',
    glint: 'rgba(61,218,180,0.3)',
  },
};

const STARS = [
  [34, 30, 1.2], [80, 58, 0.9], [122, 22, 1.4], [168, 46, 0.8], [214, 18, 1.1], [262, 52, 1.3],
  [306, 26, 0.9], [352, 60, 1.2], [384, 34, 0.8], [54, 92, 0.8], [240, 88, 0.7], [330, 98, 0.9],
] as const;

const FLAKES = [
  [40, 70, 1.6], [96, 120, 1.2], [150, 64, 1.4], [204, 132, 1.1], [258, 84, 1.5], [312, 140, 1.2],
  [356, 76, 1.4], [70, 168, 1.1], [228, 40, 1.2], [372, 182, 1],
] as const;

function Landscape({ time, flip, id }: { time: Exclude<SceneTime, 'deep'>; flip?: boolean; id: string }) {
  const look = LOOKS[time];
  const dark = time === 'night' || time === 'aurora';
  return (
    <>
      <Defs>
        <LinearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look.sky[0]} />
          <Stop offset="1" stopColor={look.sky[1]} />
        </LinearGradient>
        <LinearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={look.sea[0]} />
          <Stop offset="1" stopColor={look.sea[1]} />
        </LinearGradient>
        <LinearGradient id={`${id}aur`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={p.aurora} stopOpacity={0} />
          <Stop offset="0.35" stopColor={p.aurora} stopOpacity={0.85} />
          <Stop offset="0.7" stopColor={p.auroraBlue} stopOpacity={0.7} />
          <Stop offset="1" stopColor={p.auroraBlue} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={400} height={300} fill={`url(#${id}sky)`} />
      <G transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>
        {dark
          ? STARS.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#E6EEFF" opacity={0.85} />)
          : null}
        {time === 'aurora' ? (
          <G opacity={0.9}>
            <Path d="M-20 92 C 60 40 120 120 200 70 C 270 28 330 96 420 56" stroke={`url(#${id}aur)`} strokeWidth={26} fill="none" strokeLinecap="round" opacity={0.55} />
            <Path d="M-20 122 C 70 78 140 140 220 104 C 290 74 340 120 420 92" stroke={`url(#${id}aur)`} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.7} />
            <Path d="M-20 70 C 50 30 140 90 210 50 C 280 14 340 70 420 34" stroke={`url(#${id}aur)`} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.5} />
          </G>
        ) : null}
        {time === 'morning' ? (
          <>
            <Circle cx={300} cy={74} r={46} fill="#FFFFFF" opacity={0.45} />
            <Circle cx={300} cy={74} r={28} fill="#FFF6DA" />
          </>
        ) : null}
        {time === 'dawn' ? (
          <>
            <Circle cx={110} cy={168} r={70} fill="#FFE9DD" opacity={0.6} />
            <Circle cx={110} cy={168} r={40} fill="#FFC9A8" />
          </>
        ) : null}
        {time === 'dusk' ? <Circle cx={260} cy={176} r={36} fill="#FFD2BC" opacity={0.95} /> : null}
        {dark ? (
          <>
            <Circle cx={318} cy={62} r={20} fill="#F4F7FB" />
            <Circle cx={328} cy={56} r={18} fill={look.sky[0]} />
          </>
        ) : null}
        {/* Distant range */}
        <Path d="M0 196 L 34 162 L 62 182 L 104 140 L 146 178 L 178 156 L 222 186 L 262 150 L 304 180 L 340 158 L 400 188 L 400 210 L 0 210 Z" fill={look.far} />
        {/* Icebergs */}
        <Path d="M40 214 L 74 154 L 96 170 L 118 214 Z" fill={look.berg} />
        <Path d="M74 154 L 96 170 L 118 214 L 92 214 Z" fill={look.bergShade} />
        <Path d="M262 214 L 300 140 L 326 166 L 352 214 Z" fill={look.berg} />
        <Path d="M300 140 L 326 166 L 352 214 L 318 214 Z" fill={look.bergShade} />
        <Path d="M330 214 L 356 186 L 384 214 Z" fill={look.berg} />
        {/* Sea */}
        <Rect x={0} y={208} width={400} height={92} fill={`url(#${id}sea)`} />
        <Path d="M60 228 L 120 228 M 210 240 L 290 240 M 40 262 L 90 262 M 300 266 L 366 266 M 150 282 L 230 282" stroke={look.glint} strokeWidth={2.4} strokeLinecap="round" />
        {/* Floe to stand on. Under water there is nothing to stand on, so whales swim free. */}
        <Path d="M96 262 C 110 246 290 244 306 260 C 300 274 106 278 96 262 Z" fill={look.floeShade} />
        <Path d="M100 256 C 116 242 286 240 302 254 C 296 266 110 270 100 256 Z" fill={look.floe} />
        {!dark ? FLAKES.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.9} />) : null}
      </G>
    </>
  );
}

function Deep({ id }: { id: string }) {
  return (
    <>
      <Defs>
        <LinearGradient id={`${id}deep`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7FB0FF" />
          <Stop offset="0.55" stopColor="#2F5CC8" />
          <Stop offset="1" stopColor={p.navy} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={400} height={300} fill={`url(#${id}deep)`} />
      <Path d="M70 0 L 120 0 L 60 300 L 20 300 Z" fill="#FFFFFF" opacity={0.08} />
      <Path d="M190 0 L 230 0 L 200 300 L 150 300 Z" fill="#FFFFFF" opacity={0.07} />
      <Path d="M300 0 L 350 0 L 340 300 L 290 300 Z" fill="#FFFFFF" opacity={0.06} />
      <Path d="M0 0 L 400 0 L 400 18 C 340 26 280 12 200 20 C 120 28 60 14 0 22 Z" fill="#FFFFFF" opacity={0.25} />
      {[
        [60, 220, 5], [74, 196, 3], [66, 176, 2], [330, 210, 4], [342, 188, 2.6], [250, 120, 3], [140, 90, 2.4],
      ].map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.6} />
      ))}
      <Path d="M0 262 C 60 248 110 270 170 258 C 240 244 300 266 400 252 L 400 300 L 0 300 Z" fill="#14234A" />
      <Path d="M30 262 C 34 240 26 226 34 210 M 44 264 C 50 246 46 236 52 226" stroke="#1F3A78" strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M350 256 C 354 236 346 222 354 206" stroke="#1F3A78" strokeWidth={5} strokeLinecap="round" fill="none" />
    </>
  );
}

// Each character's height relative to the scene, its width over height, where its feet sit
// in the drawing (as a share of its height from the top), and the point in the landscape
// (in viewBox units) those feet go on. Land animals stand on the floe; whales swim.
const STAGE: Record<Character, { height: number; ratio: number; feet: number; groundY: number }> = {
  pip: { height: 0.5, ratio: 200 / 220, feet: 0.95, groundY: 255 },
  mochi: { height: 0.4, ratio: 220 / 180, feet: 0.93, groundY: 255 },
  frost: { height: 0.48, ratio: 1, feet: 0.95, groundY: 255 },
  bubbles: { height: 0.3, ratio: 240 / 150, feet: 0.95, groundY: 236 },
  nori: { height: 0.32, ratio: 240 / 160, feet: 0.95, groundY: 236 },
};

/**
 * A polar landscape illustration that fills whatever frame it is given. Six times of day,
 * one shared composition (a distant range, two icebergs, the sea and a floe to stand on),
 * and any of the characters standing in it. It stands in for photography everywhere in
 * PenguinUi so every demo shares one look.
 */
export function PolarScene({ time = 'morning', character, characterScale, flip, children, style }: PolarSceneProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const stage = character ? STAGE[character] : null;
  const h = stage ? size.height * (characterScale ?? stage.height) : 0;
  const w = stage ? h * stage.ratio : 0;
  // The landscape is drawn with "slice" scaling: scaled to cover, then centred. Map the
  // ground point through the same transform so the feet land on the floe at any aspect ratio.
  const scale = Math.max(size.width / 400, size.height / 300);
  const offsetY = (size.height - 300 * scale) / 2;
  const groundY = stage ? (time === 'deep' ? 190 : stage.groundY) : 0;
  const feetTop = stage ? offsetY + groundY * scale - h * stage.feet : 0;

  return (
    <View style={[styles.wrap, style]} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}>
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        {time === 'deep' ? <Deep id={id} /> : <Landscape time={time} flip={flip} id={id} />}
      </Svg>
      {stage && size.height > 0 ? (
        <View pointerEvents="none" style={[styles.actor, { top: feetTop }]}>
          {character === 'pip' ? <Pip size={w} id={`${id}p`} /> : null}
          {character === 'mochi' ? <Mochi size={w} id={`${id}m`} /> : null}
          {character === 'frost' ? <Frost size={w} id={`${id}f`} /> : null}
          {character === 'bubbles' ? <Bubbles size={w} /> : null}
          {character === 'nori' ? <Nori size={w} id={`${id}n`} /> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  actor: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});

