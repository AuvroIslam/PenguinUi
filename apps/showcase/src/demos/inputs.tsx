import { Glyph, OTPInput, PasswordField, PinPad, RangeSlider, Slider, Stepper, Text, TextField, useTheme, type OTPStatus } from 'penguin-ui';
import { useState } from 'react';

import { Col } from './kit';
import type { Demo } from './types';

function TextFieldDemo() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = touched && email.length > 0 && !/^\S+@\S+\.\S+$/.test(email);

  return (
    <Col align="stretch" gap={4}>
      <TextField
        label="Email address"
        value={email}
        onChangeText={setEmail}
        onBlur={() => setTouched(true)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={invalid ? 'That does not look like an email address' : undefined}
        helper="We only use it to send receipts"
        leading={<Glyph name="message" size={20} color={theme.colors.textMuted} />}
      />
    </Col>
  );
}

function PasswordFieldDemo() {
  return (
    <Col align="stretch">
      <PasswordField label="Password" helper="Use 8 or more characters" />
    </Col>
  );
}

function StepperDemo() {
  return (
    <Col gap={22}>
      <Stepper defaultValue={2} min={0} max={10} label="Guests" />
      <Stepper defaultValue={20} min={0} max={100} step={5} format={(n) => `${n}%`} label="Opacity" />
    </Col>
  );
}

function OTPDemo() {
  const [status, setStatus] = useState<OTPStatus>('idle');
  const [note, setNote] = useState('Try 123456');
  const [code, setCode] = useState('');

  const check = (entered: string) => {
    setTimeout(() => {
      const ok = entered === '123456';
      setStatus(ok ? 'success' : 'error');
      setNote(ok ? 'Verified' : 'That code is wrong');
      setTimeout(() => {
        setStatus('idle');
        setCode('');
        setNote('Try 123456');
      }, 1500);
    }, 400);
  };

  return (
    <Col gap={16}>
      <OTPInput value={code} onChange={setCode} status={status} onComplete={check} />
      <Text variant="caption" tone={status === 'error' ? 'danger' : status === 'success' ? 'success' : 'muted'}>
        {note}
      </Text>
    </Col>
  );
}

function PinPadDemo() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <Col gap={20}>
      <Text variant="caption" tone="muted">
        {unlocked ? 'Unlocked' : 'PIN is 2580'}
      </Text>
      <PinPad
        onComplete={async (pin) => {
          await new Promise((r) => setTimeout(r, 250));
          return pin === '2580';
        }}
        onSuccess={() => {
          setUnlocked(true);
          setTimeout(() => setUnlocked(false), 1500);
        }}
      />
    </Col>
  );
}

function SliderDemo() {
  return (
    <Col align="stretch" gap={28} style={{ paddingHorizontal: 28, paddingTop: 16 }}>
      <Slider defaultValue={35} label="Volume" />
      <Slider defaultValue={4} min={0} max={10} step={1} format={(n) => `${n}/10`} label="Rating" />
    </Col>
  );
}

function RangeSliderDemo() {
  return (
    <Col align="stretch" gap={28} style={{ paddingHorizontal: 28, paddingTop: 16 }}>
      <RangeSlider defaultValue={[20, 65]} minGap={10} label="Price" format={(n) => `$${n}`} />
    </Col>
  );
}

export const inputs: Demo[] = [
  {
    id: 'text-field',
    name: 'TextField',
    category: 'Inputs',
    summary: 'Text input with a floating label.',
    motion:
      'The label sits in the field until there is something to label, then lifts and shrinks to 0.78 on a spring. A ring fades in on focus. An error shakes the field, turns the ring red and drops the message in underneath.',
    touch: 'Error haptic when the field becomes invalid.',
    layout: 'fill',
    Component: TextFieldDemo,
  },
  {
    id: 'password-field',
    name: 'PasswordField',
    category: 'Inputs',
    summary: 'Password input with strength feedback.',
    motion:
      'A strike draws through the eye when the text is hidden and erases when shown. Four strength segments fill in sequence and move from red through amber to green, and the strength word morphs in place.',
    touch: 'Selection haptic on the visibility toggle.',
    layout: 'fill',
    Component: PasswordFieldDemo,
  },
  {
    id: 'stepper',
    name: 'Stepper',
    category: 'Inputs',
    summary: 'Increment and decrement a number.',
    motion:
      'The value rolls up or down to match the direction. Holding a button repeats, faster the longer it is held. At a bound the value shakes and the repeat stops.',
    touch: 'Selection haptic per step, warning at a bound.',
    Component: StepperDemo,
  },
  {
    id: 'otp-input',
    name: 'OTPInput',
    category: 'Inputs',
    summary: 'One-time code entry.',
    motion:
      'The active cell carries a ring and a blinking caret. Digits pop in on a bouncy spring. A wrong code shakes the row and turns the cells red; a right one ripples through them in green.',
    touch: 'Selection haptic per digit, notification on the result.',
    Component: OTPDemo,
  },
  {
    id: 'pin-pad',
    name: 'PinPad',
    category: 'Inputs',
    summary: 'PIN entry with a dot row.',
    motion:
      'Dots fill with a pop. A wrong PIN shakes the row and empties the dots left to right. A correct PIN lifts them in a wave.',
    touch: 'Light haptic per key, notification on the result.',
    Component: PinPadDemo,
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'Inputs',
    summary: 'Single-value slider.',
    motion:
      'The thumb grows while held and a value bubble springs up and leans against the direction of travel. Dragging past either end stretches the track like a rubber band, then it snaps back.',
    touch: 'Selection tick on every step.',
    layout: 'fill',
    Component: SliderDemo,
  },
  {
    id: 'range-slider',
    name: 'RangeSlider',
    category: 'Inputs',
    summary: 'Two-thumb range.',
    motion:
      'The nearer thumb follows the finger and a bubble rides it. The thumbs push against each other and stop at a minimum gap, and when they meet the selection squeezes and rebounds.',
    touch: 'Selection tick per step, a rigid tap when the thumbs meet.',
    layout: 'fill',
    Component: RangeSliderDemo,
  },
];
