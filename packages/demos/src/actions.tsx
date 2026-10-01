import {
  Button,
  CopyButton,
  ExpandButton,
  Glyph,
  HoldToConfirm,
  IconButton,
  LikeButton,
  MagneticButton,
  PopButton,
  ShineButton,
  SlideToConfirm,
  SpeedDial,
  StatefulButton,
  Text,
  useTheme,
} from 'penguin-ui';
import { useState } from 'react';
import { View } from 'react-native';

import { Col, Row } from './kit';
import type { Demo } from './types';

function ButtonDemo() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1800);
  };

  return (
    <Col>
      <Button size="lg" trailing="arrow-right">
        Continue
      </Button>
      <Row>
        <Button variant="secondary">Not now</Button>
        <Button variant="outline" trailing="arrow-up-right">
          Read docs
        </Button>
      </Row>
      <Row>
        <Button variant="accent" loading={saving} onPress={save}>
          Save changes
        </Button>
        <Button variant="ghost" size="sm">
          Skip
        </Button>
      </Row>
    </Col>
  );
}

function IconButtonDemo() {
  return (
    <Row gap={14}>
      <IconButton icon="bell" label="Notifications" variant="filled" />
      <IconButton icon="search" label="Search" />
      <IconButton icon="share" label="Share" variant="outline" />
      <IconButton icon="more" label="More" variant="ghost" />
    </Row>
  );
}

const wait = (ms: number, fail = false) =>
  new Promise<void>((resolve, reject) => setTimeout(fail ? reject : resolve, ms));

function StatefulButtonDemo() {
  return (
    <Col gap={16} align="stretch">
      <StatefulButton block onPress={() => wait(1500)}>
        Pay $48.20
      </StatefulButton>
      <StatefulButton block variant="accent" onPress={() => wait(1300, true)}>
        Send with no signal
      </StatefulButton>
    </Col>
  );
}

function HoldToConfirmDemo() {
  const [count, setCount] = useState(0);
  return (
    <Col gap={18}>
      <HoldToConfirm confirmedLabel="Deleted" onConfirm={() => setCount((n) => n + 1)}>
        Hold to delete account
      </HoldToConfirm>
      <HoldToConfirm tone="primary" duration={900} confirmedLabel="Published" onConfirm={() => {}}>
        Hold to publish
      </HoldToConfirm>
      <Text variant="caption" tone="muted">
        {count === 0 ? 'Let go early and the fill comes back.' : `Confirmed ${count} time${count === 1 ? '' : 's'}.`}
      </Text>
    </Col>
  );
}

function SlideToConfirmDemo() {
  return (
    <Col gap={16} align="stretch">
      <SlideToConfirm confirmedLabel="Payment sent" onConfirm={() => {}}>
        Slide to pay $48.20
      </SlideToConfirm>
      <SlideToConfirm tone="accent" confirmedLabel="Unlocked" onConfirm={() => {}}>
        Slide to unlock
      </SlideToConfirm>
    </Col>
  );
}

function MagneticButtonDemo() {
  const [presses, setPresses] = useState(0);
  return (
    <Col gap={22}>
      <MagneticButton onPress={() => setPresses((n) => n + 1)}>Drag me around</MagneticButton>
      <Text variant="caption" tone="muted">
        {presses === 0 ? 'Press and drag. It leans toward your finger.' : `Pressed ${presses} times.`}
      </Text>
    </Col>
  );
}

function LikeButtonDemo() {
  const [liked, setLiked] = useState(false);
  return (
    <Col gap={20}>
      <LikeButton size={34} liked={liked} onChange={setLiked} count={1284 + (liked ? 1 : 0)} />
      <Row gap={22}>
        <LikeButton defaultLiked />
        <LikeButton color="#3B82F6" />
      </Row>
    </Col>
  );
}

function SpeedDialDemo() {
  const theme = useTheme();
  const [last, setLast] = useState('Nothing yet');
  return (
    <View style={{ flex: 1, minHeight: 380 }}>
      <View style={{ padding: 24, gap: 6 }}>
        <Text variant="micro" tone="muted">
          Last action
        </Text>
        <Text variant="heading">{last}</Text>
        <Text tone="muted" style={{ marginTop: 8, maxWidth: 220 }}>
          Actions open nearest-first and close furthest-first.
        </Text>
      </View>
      <SpeedDial
        actions={[
          { key: 'note', label: 'New note', icon: 'pencil', onPress: () => setLast('New note') },
          { key: 'photo', label: 'Add photo', icon: 'image', onPress: () => setLast('Add photo') },
          {
            key: 'voice',
            label: 'Record voice',
            icon: <Glyph name="mic" size={20} color={theme.colors.accent} />,
            onPress: () => setLast('Record voice'),
          },
        ]}
      />
    </View>
  );
}

function PopButtonDemo() {
  return (
    <Col gap={18}>
      <PopButton>Start the quiz</PopButton>
      <Row gap={14}>
        <PopButton tone="primary">Check</PopButton>
        <PopButton color="#22A06B">Correct</PopButton>
      </Row>
    </Col>
  );
}

function ShineButtonDemo() {
  const theme = useTheme();
  return (
    <Col gap={16}>
      <ShineButton leading={<Glyph name="sparkle" size={18} color={theme.colors.onPrimary} />}>
        Upgrade to Pro
      </ShineButton>
      <ShineButton variant="accent" interval={2200}>
        Claim your invite
      </ShineButton>
    </Col>
  );
}

function CopyButtonDemo() {
  const theme = useTheme();
  return (
    <Col gap={18}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 16,
          paddingRight: 6,
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text mono variant="caption">
          npm i penguin-ui
        </Text>
        <CopyButton onCopy={() => {}} />
      </View>
      <CopyButton compact onCopy={() => {}} />
    </Col>
  );
}

function ExpandButtonDemo() {
  return (
    <Col gap={14} align="stretch">
      <ExpandButton
        resetAfter={2600}
        onSubmit={(value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)}
      >
        Notify me
      </ExpandButton>
      <Text variant="caption" tone="muted" align="center">
        An invalid address is refused with a shake.
      </Text>
    </Col>
  );
}

export const actions: Demo[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'Actions',
    summary: 'Pill button with a nested trailing icon.',
    motion:
      'Scales to 0.97 on an overdamped spring and releases with one overshoot. The trailing circle follows on a looser spring, so it arrives late. Loading swaps the label for rising dots without changing width.',
    touch: 'Light haptic on press-in.',
    Component: ButtonDemo,
  },
  {
    id: 'icon-button',
    name: 'IconButton',
    category: 'Actions',
    summary: 'Circular icon button.',
    motion:
      'Scales to 0.9 on press. On release a ring leaves the edge, which confirms the press after the finger is no longer covering the button.',
    touch: 'Light haptic on press-in.',
    Component: IconButtonDemo,
  },
  {
    id: 'stateful-button',
    name: 'StatefulButton',
    category: 'Actions',
    summary: 'Submit button that reports its own progress.',
    motion:
      'The pill closes into a circle around a spinner. On success the fill turns green and a check draws itself; on failure it turns red, draws a cross and shakes. Then the pill opens back up. The slot keeps its size, so nothing around it moves.',
    touch: 'Success or error notification haptic. Return a promise from onPress and it follows the promise.',
    Component: StatefulButtonDemo,
  },
  {
    id: 'hold-to-confirm',
    name: 'HoldToConfirm',
    category: 'Actions',
    summary: 'Press and hold to confirm something destructive.',
    motion:
      'A fill sweeps across for the hold duration and the label changes colour exactly at its edge, because it is two labels and a moving clip. Release early and the fill springs back.',
    touch: 'Soft ticks at each quarter, success at the end. The hold keeps its full duration under reduced motion.',
    Component: HoldToConfirmDemo,
  },
  {
    id: 'slide-to-confirm',
    name: 'SlideToConfirm',
    category: 'Actions',
    summary: 'Drag a thumb across a track to confirm.',
    motion:
      'The thumb tracks the finger exactly, the track fills behind it and the instruction fades as it is obeyed. Past 85 percent it completes and the arrow redraws as a check; short of that it springs home.',
    touch: 'Light haptic on grab, success on completion. Screen readers activate it without dragging.',
    Component: SlideToConfirmDemo,
  },
  {
    id: 'magnetic-button',
    name: 'MagneticButton',
    category: 'Actions',
    summary: 'A button that leans toward the finger.',
    motion:
      'The body follows 35 percent of the drag, up to 14 points, and the label travels further than the body, which reads as depth. Letting go returns it on a loose spring with a wobble.',
    touch: 'Light haptic on grab. A press that wanders too far becomes a drag and does not fire.',
    Component: MagneticButtonDemo,
  },
  {
    id: 'like-button',
    name: 'LikeButton',
    category: 'Actions',
    summary: 'Heart toggle with a count.',
    motion:
      'Liking squashes the heart to 0.7, overshoots to 1.25 and settles while seven particles and a ring leave it, and the count rolls. Unliking is deliberately quiet: a dip and nothing else.',
    touch: 'Medium haptic on like, light on unlike.',
    Component: LikeButtonDemo,
  },
  {
    id: 'speed-dial',
    name: 'SpeedDial',
    category: 'Actions',
    summary: 'Floating action button that opens a stack of actions.',
    motion:
      'The plus turns into a cross. Actions rise out of the button 40ms apart with their labels sliding in from the side, over a scrim. Closing folds them back in the opposite order, faster.',
    touch: 'Light haptic on open, selection haptic on an action.',
    layout: 'fill',
    Component: SpeedDialDemo,
  },
  {
    id: 'pop-button',
    name: 'PopButton',
    category: 'Actions',
    summary: 'A pushable button with physical depth.',
    motion:
      'The face rides above a darker base. Pressing drives it down into the base and release bounces it back, so the press is a change in height rather than in size.',
    touch: 'Rigid haptic on press-in.',
    Component: PopButtonDemo,
  },
  {
    id: 'shine-button',
    name: 'ShineButton',
    category: 'Actions',
    summary: 'A button that catches the light.',
    motion:
      'A soft diagonal band crosses the button on an interval, which draws the eye without the button moving, and once more on every press.',
    touch: 'Light haptic on press-in.',
    Component: ShineButtonDemo,
  },
  {
    id: 'copy-button',
    name: 'CopyButton',
    category: 'Actions',
    summary: 'Copy with confirmation.',
    motion:
      'The copy glyph turns away as a check draws in its place, and the label morphs from Copy to Copied letter by letter while the pill resizes on a spring. Both return after 1.6 seconds.',
    touch: 'Success haptic.',
    Component: CopyButtonDemo,
  },
  {
    id: 'expand-button',
    name: 'ExpandButton',
    category: 'Actions',
    summary: 'A button that becomes the field it was asking for.',
    motion:
      'The pill widens into an input with its own submit button, then closes around a confirmation with a drawn check. It sits in a full-width slot, so opening it moves nothing around it.',
    touch: 'Light haptic on open, success on submit, error with a shake on a rejected value.',
    Component: ExpandButtonDemo,
  },
];
