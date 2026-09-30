import {
  Button,
  CountUp,
  FlipText,
  Glyph,
  HighlightText,
  Marquee,
  RollingNumber,
  SpinningText,
  Text,
  TextLoop,
  TextMorph,
  TextReveal,
  TextScramble,
  TextShimmer,
  Typewriter,
  useTheme,
  type TextRevealPreset,
} from 'penguin-ui';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Col, Row } from './kit';
import type { Demo } from './types';

const presets: TextRevealPreset[] = ['rise', 'blur', 'scale', 'mask', 'fade'];

function TextRevealDemo() {
  const [preset, setPreset] = useState<TextRevealPreset>('rise');
  const [run, setRun] = useState(0);
  const byChar = preset === 'blur' || preset === 'scale';

  return (
    <Col gap={28} align="stretch">
      <View style={{ minHeight: 96, justifyContent: 'center' }}>
        <TextReveal
          variant="title"
          by={preset === 'mask' ? 'line' : byChar ? 'char' : 'word'}
          preset={preset}
          trigger={run}
        >
          {'Interfaces that move\nlike they mean it.'}
        </TextReveal>
      </View>
      <Row>
        {presets.map((name) => (
          <Button
            key={name}
            size="sm"
            variant={name === preset ? 'primary' : 'secondary'}
            onPress={() => {
              setPreset(name);
              setRun((n) => n + 1);
            }}
          >
            {name}
          </Button>
        ))}
      </Row>
    </Col>
  );
}

const morphs = ['Continue', 'Continuing', 'Confirmed', 'Configure', 'Connect'];

function TextMorphDemo() {
  const [index, setIndex] = useState(0);
  return (
    <Col gap={28}>
      <TextMorph variant="title">{morphs[index]}</TextMorph>
      <Button variant="secondary" onPress={() => setIndex((i) => (i + 1) % morphs.length)}>
        Next word
      </Button>
    </Col>
  );
}

function RollingNumberDemo() {
  const [value, setValue] = useState(1284);
  return (
    <Col gap={28}>
      <RollingNumber value={value} prefix="$" variant="display" />
      <Row>
        <Button size="sm" variant="secondary" onPress={() => setValue((v) => Math.max(0, v - 125))}>
          - 125
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setValue((v) => v + 1)}>
          + 1
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setValue((v) => v + 8716)}>
          + 8,716
        </Button>
      </Row>
    </Col>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {children}
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

function CountUpDemo() {
  return (
    <Row gap={28}>
      <Stat label="Installs">
        <CountUp to={12480} variant="title" />
      </Stat>
      <Stat label="Crash free">
        <CountUp to={99.2} decimals={1} suffix="%" variant="title" delay={150} />
      </Stat>
      <Stat label="Rating">
        <CountUp to={4.8} decimals={1} variant="title" delay={300} />
      </Stat>
    </Row>
  );
}

const codes = ['ACCESS GRANTED', 'ROUTE 47 CLEARED', 'SIGNAL LOCKED'];

function TextScrambleDemo() {
  const [index, setIndex] = useState(0);
  return (
    <Col gap={28}>
      <TextScramble mono variant="heading">
        {codes[index]}
      </TextScramble>
      <Button variant="secondary" onPress={() => setIndex((i) => (i + 1) % codes.length)}>
        Decode next
      </Button>
    </Col>
  );
}

function TextShimmerDemo() {
  return (
    <Col gap={18}>
      <TextShimmer variant="heading">Generating a reply</TextShimmer>
      <TextShimmer variant="caption" duration={2400} spread={4}>
        Reading 14 files in the project
      </TextShimmer>
    </Col>
  );
}

function TextLoopDemo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text variant="title">Built for </Text>
      <TextLoop variant="title" tone="accent" items={['iPhone', 'Android', 'thumbs', 'everyone']} />
    </View>
  );
}

function TypewriterDemo() {
  return (
    <View style={{ alignSelf: 'stretch', minHeight: 60 }}>
      <Typewriter
        variant="heading"
        text={[
          'Book a table for two, Friday at eight.',
          'Remind me to call Ines tomorrow.',
          'Split the dinner bill four ways.',
        ]}
      />
    </View>
  );
}

const flips = ['Good morning', 'Bonjour', 'Buenos dias', 'Guten Morgen'];

function FlipTextDemo() {
  const [index, setIndex] = useState(0);
  return (
    <Col gap={28}>
      <FlipText variant="title" align="center">
        {flips[index]}
      </FlipText>
      <Button variant="secondary" onPress={() => setIndex((i) => (i + 1) % flips.length)}>
        Translate
      </Button>
    </Col>
  );
}

function SpinningTextDemo() {
  const theme = useTheme();
  return (
    <SpinningText
      radius={58}
      center={<Glyph name="arrow-up-right" size={26} color={theme.colors.accent} />}
      style={{ letterSpacing: 0 }}
    >
      {'MOTION FIRST • TAP TO SPIN • '}
    </SpinningText>
  );
}

const stack = ['Reanimated', 'Gesture Handler', 'SVG', 'Haptics', 'Expo', 'TypeScript'];

function MarqueeDemo() {
  const theme = useTheme();
  const pill = (label: string) => (
    <View
      key={label}
      style={{
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        marginRight: 10,
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceSunken,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text variant="caption" weight="medium">
        {label}
      </Text>
    </View>
  );
  return (
    <View style={{ flex: 1, gap: 12, justifyContent: 'center' }}>
      <Marquee gap={0} fade={theme.colors.surface}>
        {stack.map(pill)}
      </Marquee>
      <Marquee gap={0} reverse speed={26} fade={theme.colors.surface}>
        {[...stack].reverse().map(pill)}
      </Marquee>
    </View>
  );
}

function HighlightTextDemo() {
  const [kind, setKind] = useState<'marker' | 'underline'>('marker');
  return (
    <Col gap={28} align="stretch">
      <HighlightText variant="heading" highlight="feel physical" kind={kind} trigger={kind}>
        Animations should feel physical, not decorative.
      </HighlightText>
      <Row>
        <Button
          size="sm"
          variant={kind === 'marker' ? 'primary' : 'secondary'}
          onPress={() => setKind('marker')}
        >
          Marker
        </Button>
        <Button
          size="sm"
          variant={kind === 'underline' ? 'primary' : 'secondary'}
          onPress={() => setKind('underline')}
        >
          Underline
        </Button>
      </Row>
    </Col>
  );
}

export const text: Demo[] = [
  {
    id: 'text-reveal',
    name: 'TextReveal',
    category: 'Text',
    summary: 'Reveals text by character, word or line.',
    motion:
      'Five presets: rise, blur, scale, mask and fade. One clock drives every segment with a stagger of 22ms per character, 45ms per word or 90ms per line, so the reveal can also be scrubbed from scroll.',
    Component: TextRevealDemo,
  },
  {
    id: 'text-morph',
    name: 'TextMorph',
    category: 'Text',
    summary: 'Animates from one string to another.',
    motion:
      'Letters that both strings share keep their identity and glide to their new positions on the snappy spring. Letters that leave fade out and new ones fade in.',
    Component: TextMorphDemo,
  },
  {
    id: 'rolling-number',
    name: 'RollingNumber',
    category: 'Text',
    summary: 'Odometer-style number.',
    motion:
      'Each digit is a strip that rolls in the direction the value moved. Rolling 9 to 0 upward is one step, not nine back. When the number gains or loses a digit, the rest reflow on a spring.',
    Component: RollingNumberDemo,
  },
  {
    id: 'count-up',
    name: 'CountUp',
    category: 'Text',
    summary: 'Counts from one value to another.',
    motion:
      'Ease-out over the duration. The count runs on the UI thread and the text only re-renders when the displayed string changes.',
    Component: CountUpDemo,
  },
  {
    id: 'text-scramble',
    name: 'TextScramble',
    category: 'Text',
    summary: 'Decoding text effect.',
    motion:
      'Every character cycles through random glyphs, then they lock in from left to right 28ms apart. Characters still scrambling are muted so the resolved text leads.',
    Component: TextScrambleDemo,
  },
  {
    id: 'text-shimmer',
    name: 'TextShimmer',
    category: 'Text',
    summary: 'A label with a highlight moving through it.',
    motion:
      'A bell curve of brightness travels across the characters on a loop, so the highlight has a soft leading and trailing edge.',
    Component: TextShimmerDemo,
  },
  {
    id: 'text-loop',
    name: 'TextLoop',
    category: 'Text',
    summary: 'Cycles through words in place.',
    motion:
      'The outgoing word leaves upward as the next rises from below, with a small overshoot. The box springs to the width of the arriving word so surrounding text reflows smoothly.',
    Component: TextLoopDemo,
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    category: 'Text',
    summary: 'Types text with a caret.',
    motion:
      'Delay varies per character and stretches after punctuation. The caret holds steady while typing and blinks at rest. Several phrases type, delete and replace in turn.',
    Component: TypewriterDemo,
  },
  {
    id: 'flip-text',
    name: 'FlipText',
    category: 'Text',
    summary: 'Characters that roll in on a 3D axis.',
    motion:
      'Each character turns on X from 90 degrees to flat, 30ms apart. When the text changes, the old characters roll out over the top while the new ones roll in.',
    Component: FlipTextDemo,
  },
  {
    id: 'spinning-text',
    name: 'SpinningText',
    category: 'Text',
    summary: 'Text set on a rotating circle.',
    motion: 'Turns continuously. A press kicks it to several times its speed and it coasts back down.',
    touch: 'Press to spin it up.',
    Component: SpinningTextDemo,
  },
  {
    id: 'marquee',
    name: 'Marquee',
    category: 'Text',
    summary: 'Seamless scrolling band.',
    motion:
      'A linear loop with edges that dissolve. Speed is a value that eases, so holding it decelerates to a stop and letting go accelerates back.',
    touch: 'Press and hold to pause.',
    layout: 'fill',
    Component: MarqueeDemo,
  },
  {
    id: 'highlight-text',
    name: 'HighlightText',
    category: 'Text',
    summary: 'Marker highlight behind a phrase.',
    motion:
      'One stroke from the left that carries on across word boundaries and line wraps, in 450ms. The underline variant draws a hand-made wave.',
    Component: HighlightTextDemo,
  },
];
