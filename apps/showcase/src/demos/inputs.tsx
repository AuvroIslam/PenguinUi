import { AmountInput, DateStrip, TagInput, Glyph, OTPInput, PasswordField, PinPad, PromptInput, RangeSlider, SearchBar, RatingInput, Slider, WheelPicker, Stepper, Text, TextField, useTheme, type OTPStatus } from 'penguin-ui';
import { useRef, useState } from 'react';
import { View } from 'react-native';

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

function WheelDemo() {
  const [hour, setHour] = useState('7');
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
  return (
    <Col gap={14} align="stretch" style={{ paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <WheelPicker items={hours} value={hour} onChange={setHour} style={{ flex: 1 }} />
        <WheelPicker items={minutes} defaultValue="30" style={{ flex: 1 }} />
        <WheelPicker items={['AM', 'PM']} defaultValue="PM" style={{ flex: 1 }} />
      </View>
      <Text variant="caption" tone="muted" align="center">
        Alarm at {hour}
      </Text>
    </Col>
  );
}

function RatingDemo() {
  const [rating, setRating] = useState(3);
  return (
    <Col gap={14}>
      <RatingInput value={rating} onChange={setRating} />
      <Text variant="caption" tone="muted">
        {rating === 0 ? 'Drag across the stars' : `${rating} of 5`}
      </Text>
    </Col>
  );
}

function DateStripDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <DateStrip />
    </Col>
  );
}

function SearchBarDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 20, paddingTop: 12 }}>
      <SearchBar placeholders={['Search components', 'Try "slider"', 'Try "otp"', 'Try "date"']} />
    </Col>
  );
}

function PromptDemo() {
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return (
    <Col align="stretch" style={{ paddingHorizontal: 20, paddingTop: 12 }}>
      <PromptInput
        loading={loading}
        placeholder="Ask the penguin anything"
        onSubmit={() => {
          setLoading(true);
          timer.current = setTimeout(() => setLoading(false), 6000);
        }}
        onStop={() => {
          clearTimeout(timer.current);
          setLoading(false);
        }}
        onMic={() => {}}
      />
    </Col>
  );
}

function AmountDemo() {
  return (
    <Col align="stretch" style={{ paddingTop: 8 }}>
      <AmountInput defaultValue="1250" max={1000000} />
    </Col>
  );
}

function TagDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 20, paddingTop: 12 }} gap={10}>
      <TagInput defaultValue={['motion', 'haptics']} placeholder="Add a tag and press return" />
      <Text variant="caption" tone="muted">
        Type a word and press return or a comma. Backspace twice removes the last tag.
      </Text>
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
  {
    id: 'wheel-picker',
    name: 'WheelPicker',
    category: 'Inputs',
    summary: '3D wheel picker.',
    motion:
      'Rows sit on a real cylinder: they turn away and drop toward the axis as they leave the centre, fading with the angle. Release decays and snaps to the nearest row.',
    touch: 'Selection tick on every row that crosses the centre.',
    layout: 'fill',
    Component: WheelDemo,
  },
  {
    id: 'rating-input',
    name: 'RatingInput',
    category: 'Inputs',
    summary: 'Star rating you scrub.',
    motion:
      'Lay a finger on the row and slide. Stars fill as it passes, each popping in a beat after the last on a bouncy spring, and sliding back un-fills them at once. Tapping the current rating clears it.',
    touch: 'Selection tick for every star crossed.',
    Component: RatingDemo,
  },
  {
    id: 'date-strip',
    name: 'DateStrip',
    category: 'Inputs',
    summary: 'Horizontal week selector.',
    motion:
      'One pill slides between days on a snappy spring, and each label changes colour as the pill passes under it. Swipe sideways to turn the week: the row slides out and the next slides in, keeping the weekday.',
    touch: 'Selection haptic on a day, light haptic when the week turns.',
    layout: 'fill',
    Component: DateStripDemo,
  },
  {
    id: 'search-bar',
    name: 'SearchBar',
    category: 'Inputs',
    summary: 'Search that starts as a button.',
    motion:
      'A circle grows into the full field on a heavy spring while Cancel slides in from the edge. The placeholder leafs through suggestions until something is typed. Cancel reverses all of it.',
    touch: 'Light haptic on open, selection haptic on cancel and clear.',
    layout: 'fill',
    Component: SearchBarDemo,
  },
  {
    id: 'prompt-input',
    name: 'PromptInput',
    category: 'Inputs',
    summary: 'AI prompt composer.',
    motion:
      'The field grows a line at a time on a spring. The action button turns between a microphone, a send arrow and a stop square as the state changes. While loading, a comet of light runs around the border.',
    touch: 'Light haptic on send, medium on stop.',
    layout: 'fill',
    Component: PromptDemo,
  },
  {
    id: 'amount-input',
    name: 'AmountInput',
    category: 'Inputs',
    summary: 'Large currency amount with its own keypad.',
    motion:
      'Digits rise in from below as they are typed and drop out when deleted, and the row reflows on a spring. The amount scales down to stay on one line. A key that would make the value invalid shakes it.',
    touch: 'Light haptic per key, warning when a key is refused.',
    layout: 'fill',
    Component: AmountDemo,
  },
  {
    id: 'tag-input',
    name: 'TagInput',
    category: 'Inputs',
    summary: 'Free-text tags.',
    motion:
      'A committed tag pops in on a bouncy spring and its neighbours slide over. Backspace on an empty field first wiggles the last tag and turns it red, and a second backspace removes it. A refused tag shakes the field.',
    touch: 'Light haptic on commit, selection on arming, medium on delete.',
    layout: 'fill',
    Component: TagDemo,
  },
];
