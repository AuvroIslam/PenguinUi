import { Button, ContextMenu, Dock, MenuOverlay, PageDots, StepProgress, TabBar, Tabs, Text, useTheme } from 'penguin-ui';
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
    <Col align="stretch" style={{ paddingHorizontal: 16, paddingTop: 14 }}>
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
  const colors = ['#F4581C', '#1E9E5A', '#3B82F6', '#A855F7'];

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
        {colors.map((color) => (
          <View key={color} style={{ width: page, height: 150, backgroundColor: color, opacity: 0.85 }} />
        ))}
      </Animated.ScrollView>
      <PageDots count={colors.length} progress={progress} />
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
];
