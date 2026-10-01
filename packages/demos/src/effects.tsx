import {
  AuroraBackground,
  BorderBeam,
  Button,
  Confetti,
  DotGrid,
  Glyph,
  PressableScale,
  PulseRings,
  SuccessCheck,
  Text,
  useTheme,
  type ConfettiHandle,
} from 'penguin-ui';
import { palette } from '@penguin-ui/brand';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { Col, Row } from './kit';
import type { Demo } from './types';

function PressableDemo() {
  const theme = useTheme();
  const [count, setCount] = useState(0);
  const tile = (label: string, props: object) => (
    <PressableScale
      {...props}
      onPress={() => setCount((n) => n + 1)}
      style={{
        width: 140,
        height: 110,
        borderRadius: 22,
        backgroundColor: theme.colors.surfaceSunken,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="label">{label}</Text>
    </PressableScale>
  );
  return (
    <Col gap={16}>
      <Row gap={14}>
        {tile('Default', {})}
        {tile('Deep press', { scaleTo: 0.9, haptic: 'medium' })}
      </Row>
      <Row gap={14}>
        {tile('Dims', { dimTo: 0.6, scaleTo: 0.98 })}
        {tile('Rigid', { scaleTo: 0.94, haptic: 'rigid' })}
      </Row>
      <Text variant="caption" tone="muted">
        {count} presses
      </Text>
    </Col>
  );
}

function BorderBeamDemo() {
  const theme = useTheme();
  const [on, setOn] = useState(true);
  return (
    <Col gap={20} align="stretch" style={{ paddingHorizontal: 24 }}>
      <BorderBeam radius={24} active={on}>
        <View
          style={{
            padding: 22,
            gap: 6,
            borderRadius: 24,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text variant="micro" tone="accent">
            Generating
          </Text>
          <Text variant="heading">Drafting your summary</Text>
          <Text variant="caption" tone="muted">
            The beam runs while work is in progress.
          </Text>
        </View>
      </BorderBeam>
      <Row>
        <Button size="sm" variant="secondary" onPress={() => setOn((v) => !v)}>
          {on ? 'Stop' : 'Start'}
        </Button>
      </Row>
    </Col>
  );
}

function PulseDemo() {
  const theme = useTheme();
  return (
    <Row gap={10}>
      <PulseRings size={58}>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: theme.colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Glyph name="mic" size={24} color={theme.colors.onAccent} strokeWidth={2} />
        </View>
      </PulseRings>
      <PulseRings size={18} reach={4} filled color={palette.blue} period={2000}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: palette.blue, borderWidth: 3, borderColor: palette.white }} />
      </PulseRings>
    </Row>
  );
}

function AuroraDemo() {
  return (
    <AuroraBackground style={{ height: 420, alignSelf: 'stretch', borderRadius: 24, marginHorizontal: 12 }}>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, gap: 8 }}>
        <Text variant="display">Quiet motion</Text>
        <Text variant="body" tone="muted">
          Light drifting on loops that never line up.
        </Text>
      </View>
    </AuroraBackground>
  );
}

function DotGridDemo() {
  return (
    <Col align="stretch" gap={10} style={{ paddingHorizontal: 12 }}>
      <DotGrid height={380} />
      <Text variant="caption" tone="muted" align="center">
        Tap anywhere, or hold and drag.
      </Text>
    </Col>
  );
}

function ConfettiDemo() {
  const ref = useRef<ConfettiHandle>(null);
  return (
    <View style={{ alignSelf: 'stretch', height: 420, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Text variant="title">Order placed</Text>
      <Row>
        <Button onPress={() => ref.current?.fire()}>Celebrate</Button>
      </Row>
      <Confetti ref={ref} />
    </View>
  );
}

function SuccessDemo() {
  const [run, setRun] = useState(0);
  return (
    <Col gap={24}>
      <Row gap={40}>
        <SuccessCheck play={run} />
        <SuccessCheck play={run} variant="error" />
      </Row>
      <Row>
        <Button size="sm" variant="secondary" onPress={() => setRun((r) => r + 1)}>
          Play again
        </Button>
      </Row>
    </Col>
  );
}

export const effects: Demo[] = [
  {
    id: 'pressable-scale',
    name: 'PressableScale',
    category: 'Effects',
    summary: 'The press primitive every component builds on.',
    motion:
      'Goes down on an overdamped spring so it answers before the finger settles, and comes back with one overshoot. Scale, dim and haptic are all set per use.',
    touch: 'Configurable haptic on press-in.',
    Component: PressableDemo,
  },
  {
    id: 'border-beam',
    name: 'BorderBeam',
    category: 'Effects',
    summary: 'A light that travels around a border.',
    motion:
      'Three dashes of rising strength move together along the real outline, so the head is bright, the tail fades and the corners are followed exactly. Turning it off fades it out.',
    layout: 'fill',
    Component: BorderBeamDemo,
  },
  {
    id: 'pulse-rings',
    name: 'PulseRings',
    category: 'Effects',
    summary: 'Radar-style rings.',
    motion:
      'Rings leave the centre quickly and slow as they fade. They share one clock and stay evenly spaced, so the rhythm never drifts.',
    Component: PulseDemo,
  },
  {
    id: 'aurora-background',
    name: 'AuroraBackground',
    category: 'Effects',
    summary: 'Slow colour field.',
    motion:
      'Soft blobs of light drift on Lissajous loops whose ratios never line up, breathing as they go, so the field keeps changing without visibly repeating. Edges come from radial gradients, not blur.',
    layout: 'fill',
    Component: AuroraDemo,
  },
  {
    id: 'dot-grid',
    name: 'DotGrid',
    category: 'Effects',
    summary: 'Touch-reactive dot grid.',
    motion:
      'A tap sends a ripple across the field: each dot swells, lights and is nudged outward as the wavefront passes. Holding keeps a pool of light under the finger that follows it.',
    layout: 'fill',
    Component: DotGridDemo,
  },
  {
    id: 'confetti',
    name: 'Confetti',
    category: 'Effects',
    summary: 'Celebration burst.',
    motion:
      'Pieces launch in a fan, spin and tumble like paper, drift side to side, slow against the air and fall under gravity. Each flight is a formula of time on the UI thread, so a hundred pieces cost one clock.',
    touch: 'Success haptic.',
    layout: 'fill',
    Component: ConfettiDemo,
  },
  {
    id: 'success-check',
    name: 'SuccessCheck',
    category: 'Effects',
    summary: 'Animated result mark.',
    motion:
      'The outline draws round, floods with colour, then the check draws in with a pop and a ring of sparks flies off. The error mark draws a cross and shakes once, with no sparks.',
    touch: 'Success or error haptic.',
    Component: SuccessDemo,
  },
];
