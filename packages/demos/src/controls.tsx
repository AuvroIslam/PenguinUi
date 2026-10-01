import { Checkbox, ChipGroup, Knob, PlanPicker, RadioGroup, SegmentedControl, Switch, Text, ThemeToggle } from 'penguin-ui';
import { useState } from 'react';

import { Col, Row } from './kit';
import type { Demo } from './types';

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <Col gap={20}>
      <Switch value={on} onChange={setOn} label="Notifications" />
      <Text variant="caption" tone="muted">
        {on ? 'Notifications on' : 'Notifications off'}. Drag the thumb or tap.
      </Text>
      <Row>
        <Switch defaultValue={false} />
        <Switch defaultValue disabled />
      </Row>
    </Col>
  );
}

function CheckboxDemo() {
  return (
    <Col align="flex-start" gap={4} style={{ paddingHorizontal: 28 }}>
      <Checkbox label="Sketch the motion" strike defaultValue />
      <Checkbox label="Write the spring" strike />
      <Checkbox label="Test on a real phone" strike />
      <Checkbox label="Accept the terms" />
    </Col>
  );
}

function SegmentedDemo() {
  const [range, setRange] = useState('Week');
  return (
    <Col align="stretch" gap={20} style={{ paddingHorizontal: 20, paddingTop: 28 }}>
      <SegmentedControl options={['Day', 'Week', 'Month', 'Year']} value={range} onChange={setRange} />
      <SegmentedControl options={['Light', 'Dark']} defaultValue="Dark" />
      <Text variant="caption" tone="muted" align="center">
        Showing {range.toLowerCase()}
      </Text>
    </Col>
  );
}

function ThemeToggleDemo() {
  const [dark, setDark] = useState(false);
  return (
    <Col gap={18}>
      <ThemeToggle value={dark} onChange={setDark} size={72} />
      <Text variant="caption" tone="muted">
        {dark ? 'Dark' : 'Light'}
      </Text>
    </Col>
  );
}

function KnobDemo() {
  return (
    <Col gap={8}>
      <Knob defaultValue={64} label="Volume" />
    </Col>
  );
}

function RadioDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 12, paddingTop: 24 }}>
      <RadioGroup
        defaultValue="standard"
        options={[
          { label: 'Standard', value: 'standard', description: 'Arrives in 3 to 5 days' },
          { label: 'Express', value: 'express', description: 'Arrives tomorrow' },
          { label: 'Pick up', value: 'pickup' },
        ]}
      />
    </Col>
  );
}

function ChipDemo() {
  return (
    <Col align="stretch" gap={22} style={{ paddingHorizontal: 20, paddingTop: 12 }}>
      <ChipGroup multiple defaultValue={['Motion']} options={['Motion', 'Haptics', 'Gestures', 'Springs', 'Type']} />
      <ChipGroup defaultValue={['Week']} options={['Day', 'Week', 'Month']} />
    </Col>
  );
}

function PlanDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 14, paddingTop: 10 }}>
      <PlanPicker
        defaultValue="pro"
        plans={[
          { id: 'free', name: 'Free', monthly: 0, yearly: 0, blurb: 'For trying it out', features: ['3 projects', 'Community support'] },
          {
            id: 'pro',
            name: 'Pro',
            monthly: 19,
            yearly: 15,
            badge: 'Popular',
            blurb: 'For working teams',
            features: ['Unlimited projects', 'Priority support', 'Custom themes'],
          },
          { id: 'team', name: 'Team', monthly: 49, yearly: 39, blurb: 'For larger groups', features: ['Everything in Pro', 'Shared libraries', 'Audit log'] },
        ]}
      />
    </Col>
  );
}

export const controls: Demo[] = [
  {
    id: 'switch',
    name: 'Switch',
    category: 'Controls',
    summary: 'A toggle you can drag.',
    motion:
      'The thumb widens under the finger as if gripped, then rides a spring to the other end. Drag it past halfway and let go to commit. The track colour follows the thumb, not the state.',
    touch: 'Light haptic on change.',
    Component: SwitchDemo,
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Controls',
    summary: 'Checkbox that builds itself in order.',
    motion:
      'The fill grows out of the centre on a bouncy spring, then the check draws in. Unchecking erases the check first, then the fill lets go. With strike, a line is drawn through the label in step.',
    touch: 'Medium haptic on check, light on uncheck.',
    layout: 'fill',
    Component: CheckboxDemo,
  },
  {
    id: 'segmented-control',
    name: 'SegmentedControl',
    category: 'Controls',
    summary: 'Segmented picker with one shared thumb.',
    motion:
      'One thumb serves every segment. It stretches while it travels, front edge first, and settles with a little overshoot. It can be grabbed and dragged, and labels darken as it arrives.',
    touch: 'Selection haptic per segment.',
    layout: 'fill',
    Component: SegmentedDemo,
  },
  {
    id: 'theme-toggle',
    name: 'ThemeToggle',
    category: 'Controls',
    summary: 'Light and dark switch.',
    motion:
      'The sun is one shape driven by one value. Its rays pull in toward the core while a disc slides across and leaves a crescent, with a quarter turn of rotation. Stopping halfway looks like an eclipse.',
    touch: 'Light haptic.',
    Component: ThemeToggleDemo,
  },
  {
    id: 'knob',
    name: 'Knob',
    category: 'Controls',
    summary: 'Rotary dial.',
    motion:
      'A ring of ticks fills up to the current value and the tick at the value stands taller than its neighbours. The number rolls in the centre. Drag up to turn it up and down to turn it down.',
    touch: 'Selection tick per step.',
    Component: KnobDemo,
  },
  {
    id: 'radio-group',
    name: 'RadioGroup',
    category: 'Controls',
    summary: 'Single choice from a list.',
    motion:
      'The dot springs into the chosen row. One highlight slides from the old choice to the new one instead of each row flashing, and it takes the height of whatever row it is under.',
    touch: 'Selection haptic.',
    layout: 'fill',
    Component: RadioDemo,
  },
  {
    id: 'chip-group',
    name: 'ChipGroup',
    category: 'Controls',
    summary: 'Single or multi-select chips.',
    motion:
      'A chosen chip fills in while a slot opens at its left edge, pushing the label over, and a check draws into it. The chips around it slide to make room.',
    touch: 'Selection haptic.',
    layout: 'fill',
    Component: ChipDemo,
  },
  {
    id: 'plan-picker',
    name: 'PlanPicker',
    category: 'Controls',
    summary: 'Pricing plans with a billing switch.',
    motion:
      'Changing the billing period rolls every price to its new figure. Choosing a plan draws an outline around it from the top-left corner, springs a check in and opens its feature list line by line, each tick drawing in.',
    touch: 'Selection haptic.',
    layout: 'fill',
    Component: PlanDemo,
  },
];
