import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export type FadeEdgeProps = {
  side: 'left' | 'right' | 'top' | 'bottom';
  /** The colour behind the content, which the edge fades into. */
  color: string;
  size?: number;
};

/**
 * A gradient from a solid colour to transparent, laid over the edge of clipped content
 * so it dissolves instead of being cut off.
 */
export function FadeEdge({ side, color, size = 32 }: FadeEdgeProps) {
  const id = `fade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const horizontal = side === 'left' || side === 'right';
  const flipped = side === 'right' || side === 'bottom';

  return (
    <Svg
      style={[styles.base, styles[side], horizontal ? { width: size } : { height: size }]}
      width={horizontal ? size : '100%'}
      height={horizontal ? '100%' : size}
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
          <Stop offset="0" stopColor={color} stopOpacity={flipped ? 0 : 1} />
          <Stop offset="1" stopColor={color} stopOpacity={flipped ? 1 : 0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', pointerEvents: 'none' },
  left: { left: 0, top: 0, bottom: 0 },
  right: { right: 0, top: 0, bottom: 0 },
  top: { top: 0, left: 0, right: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
});
