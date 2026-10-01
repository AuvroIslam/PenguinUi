import {
  Accordion,
  AvatarStack,
  Button,
  Card,
  Carousel,
  CoverflowCarousel,
  CardStack,
  ExpandableCard,
  FlipCard,
  Glyph,
  ReorderList,
  SegmentedControl,
  StackedScroll,
  StaggerList,
  SwipeDeck,
  SwipeableRow,
  Text,
  TiltCard,
  useTheme,
  type AvatarPerson,
  type StaggerPreset,
} from 'penguin-ui';
import { PolarScene, Portrait, palette, type Character, type SceneTime } from '@penguin-ui/brand';

// Scenes dark enough to need light text on top.
const DARK_TIMES: SceneTime[] = ['night', 'aurora', 'deep'];
import { useState } from 'react';
import { View } from 'react-native';

import { Col, Row } from './kit';
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
        <PolarScene time="aurora" character="pip" characterScale={0.3} style={{ flex: 1 }}>
          <View style={{ flex: 1, padding: 22, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="micro" style={{ color: 'rgba(234,241,255,0.7)' }}>
                Colony pass
              </Text>
              <Text variant="micro" mono style={{ color: palette.aurora }}>
                No. 0042
              </Text>
            </View>
            <View>
              <Text variant="display" style={{ color: palette.white }}>
                Pip
              </Text>
              <Text variant="caption" style={{ color: 'rgba(234,241,255,0.7)', marginTop: 2 }}>
                Press and move your finger
              </Text>
            </View>
          </View>
        </PolarScene>
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

const PEOPLE: { id: string; name: string; note: string; character: Character; time: SceneTime }[] = [
  { id: 'a', name: 'Pip, 4', note: 'Slides everywhere on purpose', character: 'pip', time: 'morning' },
  { id: 'b', name: 'Mochi, 3', note: 'Naps on any flat ice', character: 'mochi', time: 'dawn' },
  { id: 'c', name: 'Frost, 6', note: 'Makes very good snow forts', character: 'frost', time: 'dusk' },
  { id: 'd', name: 'Bubbles, 9', note: 'Knows every current by name', character: 'bubbles', time: 'night' },
  { id: 'e', name: 'Nori, 7', note: 'Navigates by the aurora', character: 'nori', time: 'aurora' },
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
          <PolarScene time={p.time} character={p.character} style={{ flex: 1 }}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: 22 }}>
              <Text variant="title" style={{ color: DARK_TIMES.includes(p.time) ? palette.white : palette.ink }}>
                {p.name}
              </Text>
              <Text variant="body" style={{ color: DARK_TIMES.includes(p.time) ? 'rgba(234,241,255,0.8)' : 'rgba(11,23,48,0.7)' }}>
                {p.note}
              </Text>
            </View>
          </PolarScene>
        )}
      />
      <Text variant="caption" tone="muted" align="center">
        {last || 'Drag a card left or right'}
      </Text>
    </Col>
  );
}

const WALLET: { id: string; name: string; last: string; time: SceneTime }[] = [
  { id: 'v', name: 'Glacier Debit', last: '4821', time: 'night' },
  { id: 'm', name: 'Floe Credit', last: '0937', time: 'morning' },
  { id: 'a', name: 'Ferry pass', last: '7710', time: 'dawn' },
  { id: 'g', name: 'Fish market', last: '2264', time: 'aurora' },
];

function CardStackDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 18, paddingTop: 10 }}>
      <CardStack
        items={WALLET}
        keyOf={(c) => c.id}
        cardHeight={190}
        peek={58}
        style={{ height: 470 }}
        renderCard={(card) => (
          <PolarScene time={card.time} style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="label" style={{ color: DARK_TIMES.includes(card.time) ? palette.white : palette.ink }}>
                  {card.name}
                </Text>
                <Glyph name="card" size={20} color={DARK_TIMES.includes(card.time) ? palette.white : palette.ink} />
              </View>
              <Text
                variant="label"
                mono
                style={{ color: DARK_TIMES.includes(card.time) ? palette.white : palette.ink, letterSpacing: 3 }}
              >
                •••• {card.last}
              </Text>
            </View>
          </PolarScene>
        )}
        renderDetail={(card) => (
          <View style={{ gap: 6, paddingHorizontal: 4 }}>
            <Text variant="heading">{card.name}</Text>
            <Text variant="caption" tone="muted">
              Ending in {card.last}. Tap the card again to put it back.
            </Text>
          </View>
        )}
      />
    </Col>
  );
}

function ExpandableDemo() {
  const theme = useTheme();
  return (
    <Col align="stretch" gap={12} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <ExpandableCard
        title="Order #4821"
        subtitle="Arrives Thursday"
        leading={
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Glyph name="bolt" size={20} color={theme.colors.accent} />
          </View>
        }
      >
        {['Packed at the warehouse', 'Handed to the courier', 'Out for delivery Thursday morning'].map((line, i) => (
          <View key={line} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 14, alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < 2 ? theme.colors.success : theme.colors.borderStrong }} />
            <Text variant="body" tone={i < 2 ? 'default' : 'muted'}>
              {line}
            </Text>
          </View>
        ))}
      </ExpandableCard>
    </Col>
  );
}

const FAQ = [
  { key: 'a', title: 'Does it work with Expo Go?', content: 'Yes. Everything uses Reanimated, Gesture Handler and react-native-svg, which Expo Go includes.' },
  { key: 'b', title: 'Can I turn off haptics?', content: 'Pass haptics={false} to the provider and every component goes quiet.' },
  { key: 'c', title: 'Does it respect reduced motion?', content: 'Springs and timings follow the system setting. Loops and parallax settle to rest.' },
];

function AccordionDemo() {
  return (
    <Col align="stretch" gap={22} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <Accordion items={FAQ} defaultOpen={['a']} />
      <Accordion items={FAQ} variant="detached" />
    </Col>
  );
}

function SwipeableRowDemo() {
  const theme = useTheme();
  const [rows, setRows] = useState(['Design review', 'Weekly sync', 'Lunch with Ines', 'Dentist']);
  const [last, setLast] = useState('');
  return (
    <Col align="stretch" gap={12} style={{ paddingTop: 10 }}>
      <View style={{ borderRadius: 18, overflow: 'hidden', marginHorizontal: 12 }}>
        {rows.map((row) => (
          <SwipeableRow
            key={row}
            collapseOnFullSwipe
            actions={[
              { key: 'pin', label: 'Pin', icon: 'pin', color: theme.colors.warning, onPress: () => setLast(`Pinned ${row}`) },
              {
                key: 'del',
                label: 'Delete',
                icon: 'trash',
                color: theme.colors.danger,
                onPress: () => {
                  setLast(`Deleted ${row}`);
                  setTimeout(() => setRows((r) => r.filter((x) => x !== row)), 260);
                },
              },
            ]}
          >
            <View style={{ paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <Text variant="label">{row}</Text>
              <Text variant="caption" tone="muted">
                Swipe left. Keep going to delete.
              </Text>
            </View>
          </SwipeableRow>
        ))}
      </View>
      <Text variant="caption" tone="muted" align="center">
        {last || 'Nothing yet'}
      </Text>
    </Col>
  );
}

function ReorderDemo() {
  const theme = useTheme();
  const [items, setItems] = useState(['Wake up', 'Coffee', 'Write', 'Walk', 'Ship it']);
  return (
    <Col align="stretch" gap={10} style={{ paddingHorizontal: 16, paddingTop: 10 }}>
      <ReorderList
        items={items}
        keyOf={(s) => s}
        onReorder={setItems}
        rowHeight={58}
        renderItem={(item, active) => (
          <View
            style={{
              flex: 1,
              borderRadius: 16,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: active ? theme.colors.surfaceRaised : theme.colors.surface,
              borderWidth: 1,
              borderColor: active ? theme.colors.accent : theme.colors.border,
            }}
          >
            <Glyph name="menu" size={18} color={theme.colors.textFaint} />
            <Text variant="label">{item}</Text>
          </View>
        )}
      />
      <Text variant="caption" tone="muted" align="center">
        Press and hold a row, then drag it.
      </Text>
    </Col>
  );
}

const ACTIVITY = [
  { id: 1, who: 'Mara', what: 'commented on Onboarding v3' },
  { id: 2, who: 'Theo', what: 'shipped the new tab bar' },
  { id: 3, who: 'Ines', what: 'requested your review' },
  { id: 4, who: 'Kai', what: 'joined the motion channel' },
];

function StaggerDemo() {
  const theme = useTheme();
  const [preset, setPreset] = useState<StaggerPreset>('rise');
  const [run, setRun] = useState(0);
  const [items, setItems] = useState(ACTIVITY);
  const next = () =>
    setItems((list) => [{ id: Date.now(), who: 'Rosa', what: 'added a new component' }, ...list].slice(0, 6));
  return (
    <Col align="stretch" gap={14} style={{ paddingHorizontal: 16, paddingTop: 10 }}>
      <SegmentedControl
        options={['rise', 'scale', 'fade', 'slide']}
        value={preset}
        onChange={(v) => {
          setPreset(v as StaggerPreset);
          setItems(ACTIVITY);
          setRun((r) => r + 1);
        }}
      />
      <StaggerList key={`${preset}${run}`} preset={preset}>
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 16,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.accentSoft }} />
            <Text variant="body" style={{ flex: 1 }}>
              <Text variant="label">{item.who}</Text> {item.what}
            </Text>
            <Text
              variant="caption"
              tone="faint"
              onPress={() => setItems((list) => list.filter((x) => x.id !== item.id))}
            >
              Remove
            </Text>
          </View>
        ))}
      </StaggerList>
      <Row>
        <Button size="sm" variant="secondary" onPress={() => setRun((r) => r + 1)}>
          Replay
        </Button>
        <Button size="sm" onPress={next}>
          Add one
        </Button>
      </Row>
    </Col>
  );
}

const CHAPTERS: { id: string; n: string; title: string; time: SceneTime; character: Character }[] = [
  { id: 'a', n: '01', title: 'Plan the motion', time: 'night', character: 'bubbles' },
  { id: 'b', n: '02', title: 'Choose the spring', time: 'dawn', character: 'mochi' },
  { id: 'c', n: '03', title: 'Tie it to the finger', time: 'morning', character: 'pip' },
  { id: 'd', n: '04', title: 'Add a haptic', time: 'dusk', character: 'frost' },
  { id: 'e', n: '05', title: 'Test on a phone', time: 'aurora', character: 'nori' },
];

function StackedScrollDemo() {
  return (
    <View style={{ height: 500, alignSelf: 'stretch', paddingHorizontal: 12 }}>
      <StackedScroll
        items={CHAPTERS}
        keyOf={(c) => c.id}
        cardHeight={230}
        renderItem={(c) => (
          <PolarScene time={c.time} character={c.character} characterScale={0.38} flip style={{ flex: 1 }}>
            <View style={{ position: 'absolute', left: 0, top: 0, padding: 20 }}>
              <Text variant="micro" style={{ color: DARK_TIMES.includes(c.time) ? 'rgba(234,241,255,0.7)' : 'rgba(11,23,48,0.6)' }}>
                Step {c.n}
              </Text>
              <Text variant="title" style={{ color: DARK_TIMES.includes(c.time) ? palette.white : palette.ink }}>
                {c.title}
              </Text>
            </View>
          </PolarScene>
        )}
      />
    </View>
  );
}

const PLACES: { id: string; title: string; time: SceneTime; character: Character }[] = [
  { id: 'a', title: 'First light', time: 'dawn', character: 'mochi' },
  { id: 'b', title: 'Open water', time: 'morning', character: 'pip' },
  { id: 'c', title: 'Long dusk', time: 'dusk', character: 'frost' },
  { id: 'd', title: 'Polar night', time: 'night', character: 'bubbles' },
  { id: 'e', title: 'Green sky', time: 'aurora', character: 'nori' },
];

function CarouselDemo() {
  return (
    <Col align="stretch" style={{ paddingTop: 10 }}>
      <Carousel
        items={PLACES}
        keyOf={(p) => p.id}
        height={360}
        renderItem={(p) => (
          <PolarScene time={p.time} character={p.character} style={{ flex: 1 }}>
            <Text
              variant="title"
              style={{ position: 'absolute', left: '22%', top: 22, color: DARK_TIMES.includes(p.time) ? palette.white : palette.ink }}
            >
              {p.title}
            </Text>
          </PolarScene>
        )}
      />
    </Col>
  );
}

const ALBUMS: { id: string; title: string; time: SceneTime; character?: Character }[] = [
  { id: 'a', title: 'Low Tide', time: 'dawn' },
  { id: 'b', title: 'Ice Shelf', time: 'morning', character: 'frost' },
  { id: 'c', title: 'Night Swim', time: 'night', character: 'bubbles' },
  { id: 'd', title: 'Paper Moon', time: 'aurora', character: 'nori' },
  { id: 'e', title: 'Floe', time: 'morning', character: 'pip' },
  { id: 'f', title: 'Undertow', time: 'deep' },
  { id: 'g', title: 'North', time: 'dusk', character: 'mochi' },
];

function CoverflowDemo() {
  const [index, setIndex] = useState(3);
  return (
    <Col gap={14} align="stretch" style={{ paddingTop: 20 }}>
      <CoverflowCarousel
        items={ALBUMS}
        keyOf={(a) => a.id}
        initialIndex={3}
        onIndexChange={setIndex}
        renderItem={(a) => <PolarScene time={a.time} character={a.character} style={{ flex: 1 }} />}
      />
      <Text variant="heading" align="center">
        {ALBUMS[index].title}
      </Text>
      <Text variant="caption" tone="muted" align="center">
        Drag or tap a cover
      </Text>
    </Col>
  );
}

const CREW: { name: string; character: Character; tint: string }[] = [
  { name: 'Pip', character: 'pip', tint: '#DCE8FF' },
  { name: 'Mochi', character: 'mochi', tint: '#E6EEF9' },
  { name: 'Frost', character: 'frost', tint: '#E4EEFB' },
  { name: 'Bubbles', character: 'bubbles', tint: '#D8E4FA' },
  { name: 'Nori', character: 'nori', tint: '#E3EDFF' },
  { name: 'Skipper', character: 'pip', tint: '#FFE8D6' },
  { name: 'Pebble', character: 'mochi', tint: '#E9E4FB' },
  { name: 'Tusk', character: 'nori', tint: '#DDF5EE' },
];

const crew = (c: (typeof CREW)[number], size = 44): AvatarPerson => ({
  key: c.name,
  name: c.name,
  avatar: <Portrait character={c.character} size={size} background={c.tint} />,
});

function AvatarStackDemo() {
  const [people, setPeople] = useState<AvatarPerson[]>(CREW.slice(0, 4).map((c) => crew(c)));
  const add = () => {
    const next = CREW.find((c) => !people.some((p) => p.key === c.name));
    if (next) setPeople([crew(next), ...people]);
  };
  return (
    <Col gap={26}>
      <AvatarStack people={people} max={5} />
      <Row>
        <Button size="sm" onPress={add}>
          Add a friend
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setPeople(CREW.slice(0, 4).map((c) => crew(c)))}>
          Reset
        </Button>
      </Row>
      <Text variant="caption" tone="muted">
        Tap the crew to fan them out.
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
  {
    id: 'card-stack',
    name: 'CardStack',
    category: 'Cards',
    summary: 'Wallet-style stack.',
    motion:
      'Tapping a card lifts it to the top with a brief rise toward you, while the rest drop to the bottom edge one after another and tuck into a thin pile, leaving room for its details. Tapping again fans them back out from the top.',
    touch: 'Medium haptic on select, light on put back.',
    layout: 'fill',
    Component: CardStackDemo,
  },
  {
    id: 'expandable-card',
    name: 'ExpandableCard',
    category: 'Cards',
    summary: 'Card that opens in place.',
    motion:
      'The height springs open on a heavy spring and the chevron turns in step with it, not on its own timer. The details are uncovered one after another, leading the eye down the card.',
    touch: 'Light haptic.',
    layout: 'fill',
    Component: ExpandableDemo,
  },
  {
    id: 'accordion',
    name: 'Accordion',
    category: 'Cards',
    summary: 'Collapsible sections.',
    motion:
      'A section springs open by its own height while the chevron turns and the content fades in. In the detached variant the open section also steps away from its neighbours, gaps opening and corners rounding out.',
    touch: 'Selection haptic.',
    layout: 'fill',
    Component: AccordionDemo,
  },
  {
    id: 'swipeable-row',
    name: 'SwipeableRow',
    category: 'Cards',
    summary: 'Row with swipe actions.',
    motion:
      'Swiping left uncovers the actions, each icon growing as it is revealed. Past the full-swipe line the last action floods the row and its icon jumps forward; letting go there runs it and the row folds away.',
    touch: 'Medium haptic at the full-swipe line.',
    layout: 'fill',
    Component: SwipeableRowDemo,
  },
  {
    id: 'reorder-list',
    name: 'ReorderList',
    category: 'Cards',
    summary: 'Drag to reorder.',
    motion:
      'A long press lifts the row: it grows a touch and casts a deeper shadow. Rows it passes step out of the way on springs, and on release it drops into its slot with a small bounce.',
    touch: 'Medium haptic on lift, selection on every slot change.',
    layout: 'fill',
    Component: ReorderDemo,
  },
  {
    id: 'stagger-list',
    name: 'StaggerList',
    category: 'Cards',
    summary: 'Staggered group reveal.',
    motion:
      'On first mount each child enters a beat after the one before, with one of four presets. After that the list moves as one surface: a new item enters on its own, a removed one leaves, and the rest slide to their new places on springs.',
    layout: 'fill',
    Component: StaggerDemo,
  },
  {
    id: 'stacked-scroll',
    name: 'StackedScroll',
    category: 'Cards',
    summary: 'Cards that pin and stack as you scroll.',
    motion:
      'Each card scrolls in, sticks when it reaches the stack, then steps back and dims as the next lands on it, keeping a visible edge of every card in the pile. Scrolling back peels them off in reverse.',
    layout: 'fill',
    Component: StackedScrollDemo,
  },
  {
    id: 'carousel',
    name: 'Carousel',
    category: 'Cards',
    summary: 'Snap carousel with parallax.',
    motion:
      'The middle slide is full size and its neighbours step back and fade. Each photo slides inside its frame against the scroll, so it seems to sit behind the glass. The dots follow the scroll continuously.',
    touch: 'Selection tick on each new slide.',
    layout: 'fill',
    Component: CarouselDemo,
  },
  {
    id: 'coverflow-carousel',
    name: 'CoverflowCarousel',
    category: 'Cards',
    summary: '3D carousel.',
    motion:
      'The middle cover faces you while the rest turn toward it and recede in depth. Drag to flip through; a flick carries on through several before settling. Tapping a cover brings it to the middle.',
    touch: 'Selection tick as each cover passes the centre.',
    layout: 'fill',
    Component: CoverflowDemo,
  },
  {
    id: 'avatar-stack',
    name: 'AvatarStack',
    category: 'Cards',
    summary: 'Overlapping avatars.',
    motion:
      'Tapping fans the row open, each avatar sliding out a beat after the last and showing its name, then closing back up. A new person scales in at the front and pushes the others along on a spring.',
    touch: 'Light haptic on tap.',
    Component: AvatarStackDemo,
  },
];
