import { Button } from 'penguin-ui';
import { useState } from 'react';

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
];
