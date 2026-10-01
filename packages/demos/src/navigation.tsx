import {
  Button,
  CollapsingHeader,
  ContextMenu,
  Dock,
  Glyph,
  LiquidTabBar,
  MenuOverlay,
  Onboarding,
  PageDots,
  RadialMenu,
  StepProgress,
  TabBar,
  Tabs,
  Text,
  useTheme,
} from 'penguin-ui';
import { PolarScene, type Character, type SceneTime } from '@penguin-ui/brand';
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { Col, Row } from './kit';
import type { Demo } from './types';

function TabBarDemo() {
  return (
    <Col gap={24}>
      <TabBar
        defaultValue="home"
        items={[
          { key: 'home', label: 'Home', icon: 'home' },
          { key: 'search', label: 'Search', icon: 'search' },
          { key: 'alerts', label: 'Alerts', icon: 'bell' },
          { key: 'me', label: 'Profile', icon: 'user' },
        ]}
      />
    </Col>
  );
}

function TabsDemo() {
  return (
    <Col align="stretch" style={{ paddingTop: 14 }}>
      <Tabs
        tabs={[
          { key: 'overview', label: 'Overview', content: <Text>A summary of everything in one place.</Text> },
          { key: 'activity', label: 'Activity', content: <Text>Recent changes, newest first.</Text> },
          { key: 'settings', label: 'Settings', content: <Text>Preferences for this workspace.</Text> },
        ]}
      />
    </Col>
  );
}

function PageDotsDemo() {
  const { width } = useWindowDimensions();
  // The stage is inset from the screen edge on both sides, and the demo adds its own padding.
  const page = width - 40 - 32;
  const progress = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    progress.value = e.contentOffset.x / page;
  });
  const scenes: { time: SceneTime; character: Character }[] = [
    { time: 'morning', character: 'pip' },
    { time: 'dawn', character: 'mochi' },
    { time: 'dusk', character: 'frost' },
    { time: 'aurora', character: 'nori' },
  ];

  return (
    <Col align="stretch" gap={18} style={{ paddingHorizontal: 16, paddingTop: 36 }}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ borderRadius: 18 }}
      >
        {scenes.map((s) => (
          <PolarScene key={s.time} time={s.time} character={s.character} style={{ width: page, height: 170 }} />
        ))}
      </Animated.ScrollView>
      <PageDots count={scenes.length} progress={progress} />
    </Col>
  );
}

function StepDemo() {
  const [step, setStep] = useState(1);
  const steps = ['Account', 'Profile', 'Plan', 'Done'];
  return (
    <Col align="stretch" gap={28} style={{ paddingHorizontal: 12, paddingTop: 44 }}>
      <StepProgress steps={steps} current={step} />
      <Row>
        <Button variant="secondary" size="sm" onPress={() => setStep((s) => Math.max(0, s - 1))}>
          Back
        </Button>
        <Button size="sm" onPress={() => setStep((s) => Math.min(steps.length, s + 1))}>
          Next
        </Button>
      </Row>
    </Col>
  );
}

function DockDemo() {
  const [last, setLast] = useState('');
  return (
    <Col align="stretch" gap={10}>
      <Dock
        onSelect={setLast}
        items={[
          { key: 'home', label: 'Home', icon: 'home' },
          { key: 'search', label: 'Search', icon: 'search' },
          { key: 'music', label: 'Music', icon: 'music' },
          { key: 'photos', label: 'Photos', icon: 'image' },
          { key: 'chat', label: 'Messages', icon: 'message' },
        ]}
      />
      <Text variant="caption" tone="muted" align="center">
        {last ? `Opened ${last}` : 'Slide a finger across the dock'}
      </Text>
    </Col>
  );
}

function ContextMenuDemo() {
  const theme = useTheme();
  const [picked, setPicked] = useState('');
  return (
    <Col gap={18} style={{ paddingTop: 30 }}>
      <ContextMenu
        onSelect={setPicked}
        items={[
          { key: 'share', label: 'Share', icon: 'share' },
          { key: 'save', label: 'Save', icon: 'bookmark' },
          { key: 'copy', label: 'Copy link', icon: 'copy' },
          { key: 'delete', label: 'Delete', icon: 'trash', destructive: true },
        ]}
      >
        <View
          style={{
            width: 240,
            padding: 18,
            gap: 6,
            borderRadius: 22,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            boxShadow: theme.shadows.md,
          }}
        >
          <Text variant="heading">Spring physics</Text>
          <Text variant="caption" tone="muted">
            Press and hold this card.
          </Text>
        </View>
      </ContextMenu>
      <Text variant="caption" tone="muted">
        {picked ? `Chose ${picked}` : 'Nothing chosen yet'}
      </Text>
    </Col>
  );
}

function MenuOverlayDemo() {
  const [last, setLast] = useState('');
  return (
    <Col gap={14}>
      <MenuOverlay
        onSelect={setLast}
        links={[
          { key: 'work', label: 'Work' },
          { key: 'about', label: 'About' },
          { key: 'journal', label: 'Journal' },
          { key: 'contact', label: 'Contact' },
        ]}
      />
      <Text variant="caption" tone="muted">
        {last ? `Went to ${last}` : 'Tap the button'}
      </Text>
    </Col>
  );
}

function RadialDemo() {
  const theme = useTheme();
  const [picked, setPicked] = useState('');
  return (
    <Col gap={14}>
      <RadialMenu
        onSelect={setPicked}
        items={[
          { key: 'like', label: 'Like', icon: 'heart' },
          { key: 'share', label: 'Share', icon: 'share' },
          { key: 'save', label: 'Save', icon: 'bookmark' },
          { key: 'reply', label: 'Reply', icon: 'message' },
        ]}
      >
        <View
          style={{
            width: 260,
            height: 200,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceSunken,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text variant="label">Press and hold anywhere</Text>
          <Text variant="caption" tone="muted">
            then slide toward an action
          </Text>
        </View>
      </RadialMenu>
      <Text variant="caption" tone="muted">
        {picked ? `Chose ${picked}` : 'Nothing chosen yet'}
      </Text>
    </Col>
  );
}

function OnboardingDemo() {
  const theme = useTheme();
  const [done, setDone] = useState(false);
  const art = (time: SceneTime, character: Character) => (
    <PolarScene time={time} character={character} style={{ width: 230, height: 190, borderRadius: 32 }} />
  );
  return (
    <View style={{ height: 520, alignSelf: 'stretch' }}>
      {done ? (
        <Col gap={12} style={{ flex: 1, justifyContent: 'center' }}>
          <Text variant="title">You are in</Text>
          <Button variant="secondary" size="sm" onPress={() => setDone(false)}>
            Again
          </Button>
        </Col>
      ) : (
        <Onboarding
          onDone={() => setDone(true)}
          pages={[
            { key: 'a', title: 'Feels alive', body: 'Every press moves something, on springs instead of timers.', art: art('morning', 'pip') },
            { key: 'b', title: 'Fast by default', body: 'Animation runs on the UI thread, so it keeps up with your finger.', art: art('deep', 'nori') },
            { key: 'c', title: 'Made with care', body: 'Small details, planned one at a time, for phones.', art: art('dawn', 'mochi') },
          ]}
        />
      )}
    </View>
  );
}

function CollapsingDemo() {
  const theme = useTheme();
  return (
    <View style={{ height: 480, alignSelf: 'stretch' }}>
      <CollapsingHeader title="Library" subtitle="48 components">
        <View style={{ paddingHorizontal: 20, gap: 10, paddingBottom: 40 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <View
              key={i}
              style={{
                height: 64,
                borderRadius: 16,
                backgroundColor: i % 2 ? theme.colors.surfaceSunken : theme.colors.surface,
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}
            >
              <Text variant="label">Row {i + 1}</Text>
            </View>
          ))}
        </View>
      </CollapsingHeader>
    </View>
  );
}

function LiquidDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 14, paddingTop: 60 }}>
      <LiquidTabBar
        items={[
          { key: 'home', label: 'Home', icon: 'home' },
          { key: 'search', label: 'Search', icon: 'search' },
          { key: 'add', label: 'Create', icon: 'plus' },
          { key: 'alerts', label: 'Alerts', icon: 'bell' },
          { key: 'me', label: 'Profile', icon: 'user' },
        ]}
        defaultValue="search"
      />
    </Col>
  );
}

export const navigation: Demo[] = [
  {
    id: 'tab-bar',
    name: 'TabBar',
    category: 'Navigation',
    summary: 'Floating pill tab bar.',
    motion:
      'The chosen tab opens to show its label while one highlight stretches across to it from the last choice, and its icon gives a small bounce. The others close to bare icons on the same spring.',
    touch: 'Selection haptic.',
    Component: TabBarDemo,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    summary: 'Top tabs with panels.',
    motion:
      'The underline is two edges on two springs: the leading edge goes first and the trailing one catches up, so the line stretches across the gap. Panels slide in from the side the new tab is on.',
    touch: 'Selection haptic.',
    layout: 'fill',
    Component: TabsDemo,
  },
  {
    id: 'page-dots',
    name: 'PageDots',
    category: 'Navigation',
    summary: 'Page indicator driven by scroll.',
    motion:
      'Driven by scroll position, the current dot stretches into a bar and hands that length to its neighbour continuously. A half-swiped page shows two half-stretched dots.',
    layout: 'fill',
    Component: PageDotsDemo,
  },
  {
    id: 'step-progress',
    name: 'StepProgress',
    category: 'Navigation',
    summary: 'Multi-step progress.',
    motion:
      'Moving forward, the step behind you redraws its number as a check with a small pop, the connector fills along its length and the new step starts to pulse. Moving back undoes each in turn.',
    layout: 'fill',
    Component: StepDemo,
  },
  {
    id: 'dock',
    name: 'Dock',
    category: 'Navigation',
    summary: 'Magnifying dock.',
    motion:
      'Sliding a finger across the row swells each icon by how near it is, along a bell curve, and lifts them as they grow. A label rides above the nearest icon.',
    touch: 'Selection haptic each time the nearest icon changes.',
    layout: 'fill',
    Component: DockDemo,
  },
  {
    id: 'context-menu',
    name: 'ContextMenu',
    category: 'Navigation',
    summary: 'Long-press menu.',
    motion:
      'Pressing lifts the item toward you. Past the hold the backdrop dims and the menu scales out from the item\'s own corner, its rows arriving one after another. Slide across the rows and let go to pick.',
    touch: 'Medium haptic on open, selection while sliding across rows.',
    layout: 'fill',
    Component: ContextMenuDemo,
  },
  {
    id: 'menu-overlay',
    name: 'MenuOverlay',
    category: 'Navigation',
    summary: 'Full-screen menu that opens out of its button.',
    motion:
      'The hamburger turns into a cross while a circle grows from the button until it covers the screen. The links rise out of clipped boxes 60ms apart. Closing runs backwards, faster.',
    touch: 'Light haptic.',
    Component: MenuOverlayDemo,
  },
  {
    id: 'radial-menu',
    name: 'RadialMenu',
    category: 'Navigation',
    summary: 'Circular menu at the touch point.',
    motion:
      'Hold and the items fan out around the finger, leaving one after another, with the arc turning to stay on screen. Moving toward one grows it and gives it a label while the rest settle. Letting go chooses it.',
    touch: 'Medium haptic on open, selection when the hovered item changes.',
    layout: 'fill',
    Component: RadialDemo,
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    category: 'Navigation',
    summary: 'Paged introduction.',
    motion:
      'Artwork, title and body each move at their own rate as the pages scroll, so the layers slide past each other. On the last page the round next button widens into a labelled call to action.',
    touch: 'Light haptic on next, success on done.',
    layout: 'fill',
    Component: OnboardingDemo,
  },
  {
    id: 'collapsing-header',
    name: 'CollapsingHeader',
    category: 'Navigation',
    summary: 'Large title that folds into the bar.',
    motion:
      'The big title shrinks and rises toward the bar while a small centred title fades in as it leaves, and a hairline appears once content scrolls beneath. Pulling down past the top stretches the title.',
    layout: 'fill',
    Component: CollapsingDemo,
  },
  {
    id: 'liquid-tab-bar',
    name: 'LiquidTabBar',
    category: 'Navigation',
    summary: 'Tab bar with a travelling notch.',
    motion:
      'The bar\'s top edge dips to cradle the chosen tab. The dip is a real cut in the outline that follows the tab on a spring, flattening a little in transit, while the tab\'s icon leaves the bar and rises into a circle in the dip.',
    touch: 'Selection haptic.',
    layout: 'fill',
    Component: LiquidDemo,
  },
];
