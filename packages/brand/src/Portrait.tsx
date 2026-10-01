import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Bubbles, Frost, Mochi, Nori } from './Friends';
import { palette as p } from './palette';
import { Pip } from './Pip';
import type { Character } from './PolarScene';

export type PortraitProps = {
  character: Character;
  size?: number;
  /** Background disc. Each character has its own tint by default. */
  background?: string;
  style?: StyleProp<ViewStyle>;
};

// For each drawing: its viewBox width, the point in it that should sit at the centre of the
// disc (the middle of the face), and how much wider than the disc to draw it.
const FRAME: Record<Character, { vbw: number; fx: number; fy: number; scale: number; tint: string }> = {
  pip: { vbw: 200, fx: 100, fy: 112, scale: 1.55, tint: '#DCE8FF' },
  mochi: { vbw: 220, fx: 86, fy: 100, scale: 1.9, tint: '#E6EEF9' },
  frost: { vbw: 200, fx: 100, fy: 98, scale: 1.55, tint: '#E4EEFB' },
  bubbles: { vbw: 240, fx: 74, fy: 84, scale: 2.5, tint: '#D8E4FA' },
  nori: { vbw: 240, fx: 70, fy: 96, scale: 2.5, tint: '#E3EDFF' },
};

/**
 * A character's face in a round frame, for avatars. Every person in a PenguinUi demo is one
 * of the polar friends, so there are no stock faces or initials anywhere.
 */
export function Portrait({ character, size = 44, background, style }: PortraitProps) {
  const f = FRAME[character];
  const w = size * f.scale;
  // The drawing scales uniformly from its width, so one factor maps viewBox units to points.
  const k = w / f.vbw;
  const left = size / 2 - f.fx * k;
  const top = size / 2 - f.fy * k;
  const id = `portrait-${character}-${Math.round(size)}`;
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: background ?? f.tint },
        style,
      ]}
    >
      <View style={{ position: 'absolute', left, top }}>
        {character === 'pip' ? <Pip size={w} breathe={false} id={id} /> : null}
        {character === 'mochi' ? <Mochi size={w} breathe={false} id={id} /> : null}
        {character === 'frost' ? <Frost size={w} breathe={false} id={id} /> : null}
        {character === 'bubbles' ? <Bubbles size={w} breathe={false} /> : null}
        {character === 'nori' ? <Nori size={w} breathe={false} id={id} /> : null}
      </View>
    </View>
  );
}

export const characters: { key: Character; name: string; species: string; tint: string }[] = [
  { key: 'pip', name: 'Pip', species: 'penguin', tint: p.blue },
  { key: 'mochi', name: 'Mochi', species: 'seal', tint: '#B9CDEB' },
  { key: 'frost', name: 'Frost', species: 'polar bear', tint: '#DCE8F8' },
  { key: 'bubbles', name: 'Bubbles', species: 'orca', tint: p.navy },
  { key: 'nori', name: 'Nori', species: 'narwhal', tint: p.sky },
];
