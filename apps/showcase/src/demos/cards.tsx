import { Card, FlipCard, Glyph, SwipeDeck, Text, TiltCard, useTheme } from 'penguin-ui';
import { useState } from 'react';
import { View } from 'react-native';

import { Col } from './kit';
import type { Demo } from './types';

function CardDemo() {
  const theme = useTheme();
  const [taps, setTaps] = useState(0);
  return (
    <Col align="stretch" gap={16} style={{ paddingHorizontal: 18, paddingTop: 12 }}>
      <Card>
        <Text variant="micro" tone="muted">
          Balance
        </Text>
        <Text variant="display" style={{ marginTop: 6 }}>
          $12,480.00
        </Text>
        <Text variant="caption" tone="success" style={{ marginTop: 4 }}>
          +2.4% this month
        </Text>
      </Card>
      <Card onPress={() => setTaps((t) => t + 1)} accessibilityLabel="Pressable card">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: theme.colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Glyph name="bolt" size={22} color={theme.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label">Pressable card</Text>
            <Text variant="caption" tone="muted">
              {taps ? `Pressed ${taps} time${taps > 1 ? 's' : ''}` : 'Sinks slightly under the finger'}
            </Text>
          </View>
          <Glyph name="chevron-right" size={20} color={theme.colors.textFaint} />
        </View>
      </Card>
    </Col>
  );
}

function TiltDemo() {
  return (
    <Col style={{ paddingTop: 10 }}>
      <TiltCard style={{ width: 280, height: 360 }}>
        <View style={{ flex: 1, backgroundColor: '#1A1A22', padding: 24, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="micro" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Penguin Pass
            </Text>
            <Glyph name="sparkle" size={20} color="#FF6B35" />
          </View>
          <View>
            <Text variant="display" style={{ color: '#fff' }}>
              Member
            </Text>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
              Press anywhere and move your finger
            </Text>
          </View>
          <Text variant="label" mono style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: 3 }}>
            0042 7781 3390
          </Text>
        </View>
      </TiltCard>
    </Col>
  );
}

function FlipDemo() {
  const theme = useTheme();
  return (
    <Col gap={14} style={{ paddingTop: 10 }}>
      <FlipCard
        style={{ width: 280, height: 340 }}
        front={
          <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 10 }}>
            <Text variant="micro" tone="accent">
              Question
            </Text>
            <Text variant="title">What does a spring's damping ratio decide?</Text>
          </View>
        }
        back={
          <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 10, backgroundColor: theme.colors.primary }}>
            <Text variant="micro" tone="onPrimary" style={{ opacity: 0.6 }}>
              Answer
            </Text>
            <Text variant="heading" tone="onPrimary">
              Whether it overshoots. Below 1 it bounces, at 1 it settles fastest, above 1 it creeps in.
            </Text>
          </View>
        }
      />
      <Text variant="caption" tone="muted">
        Tap to turn, or drag it over by hand.
      </Text>
    </Col>
  );
}

const PEOPLE = [
  { id: 'a', name: 'Mara, 28', note: 'Climbs on weekends', color: '#F4581C' },
  { id: 'b', name: 'Theo, 31', note: 'Makes very good bread', color: '#3B82F6' },
  { id: 'c', name: 'Ines, 26', note: 'Plays bass in two bands', color: '#1E9E5A' },
  { id: 'd', name: 'Kai, 29', note: 'Knows every bird call', color: '#A855F7' },
  { id: 'e', name: 'Rosa, 33', note: 'Restores old bikes', color: '#D98A0B' },
];

function SwipeDeckDemo() {
  const [round, setRound] = useState(0);
  const [last, setLast] = useState('');
  return (
    <Col align="stretch" gap={14} style={{ paddingHorizontal: 22, paddingTop: 8 }}>
      <SwipeDeck
        key={round}
        items={PEOPLE}
        keyOf={(p) => p.id}
        height={380}
        onSwipe={(p, dir) => setLast(`${dir === 'right' ? 'Liked' : 'Passed on'} ${p.name.split(',')[0]}`)}
        empty={
          <Text variant="label" tone="muted" onPress={() => setRound((r) => r + 1)}>
            That is everyone. Tap to start over.
          </Text>
        }
        renderCard={(p) => (
          <View style={{ flex: 1, backgroundColor: p.color, justifyContent: 'flex-end', padding: 22 }}>
            <Text variant="title" style={{ color: '#fff' }}>
              {p.name}
            </Text>
            <Text variant="body" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {p.note}
            </Text>
          </View>
        )}
      />
      <Text variant="caption" tone="muted" align="center">
        {last || 'Drag a card left or right'}
      </Text>
    </Col>
  );
}

export const cards: Demo[] = [
  {
    id: 'card',
    name: 'Card',
    category: 'Cards',
    summary: 'Double-bezel surface.',
    motion:
      'A sunken shell holds a raised surface with concentric radii and a hairline of light along its top edge. The pressable version sinks to 0.985 under the finger on an overdamped spring.',
    touch: 'Soft haptic on press.',
    layout: 'fill',
    Component: CardDemo,
  },
  {
    id: 'tilt-card',
    name: 'TiltCard',
    category: 'Cards',
    summary: 'Card that leans toward the finger.',
    motion:
      'Pressing a point pushes that point away, up to 10 degrees on each axis under perspective, and the card lifts slightly. A soft glare slides to the side tilted toward the light. Letting go rocks it back on a wobbly spring.',
    Component: TiltDemo,
  },
  {
    id: 'flip-card',
    name: 'FlipCard',
    category: 'Cards',
    summary: 'Two-sided card.',
    motion:
      'Turns over on a slow spring and dips slightly at the halfway point, as if lifted to make room. It can be dragged through the turn by hand and settles on the nearer face, or the one a flick was heading for.',
    touch: 'Light haptic when it lands on a new face.',
    Component: FlipDemo,
  },
  {
    id: 'swipe-deck',
    name: 'SwipeDeck',
    category: 'Cards',
    summary: 'Swipeable card stack.',
    motion:
      'The top card follows the finger and leans about the point it was grabbed, so one held low leans the other way. A stamp fades in on the side it is heading for, and the card beneath rises and grows into place. Past the line it flies off at the speed it was thrown.',
    touch: 'Light haptic crossing the line, medium when a card is sent.',
    layout: 'fill',
    Component: SwipeDeckDemo,
  },
];
