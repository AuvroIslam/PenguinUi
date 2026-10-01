import {
  ActivityRings,
  BarChart,
  Button,
  ImageCompare,
  LineChart,
  MiniPlayer,
  PlayPauseButton,
  Stories,
  Text,
  VoiceRecordButton,
  Waveform,
  useTheme,
} from 'penguin-ui';
import { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';

import { Col, Row } from './kit';
import type { Demo } from './types';

/**
 * A believable voice envelope: words of a few syllables each, grouped into phrases with
 * breaths between them, and a slow rise and fall in loudness across each phrase.
 */
function makeSamples(count: number, seed = 7) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: number[] = [];
  while (out.length < count) {
    const phrase = 14 + Math.floor(rand() * 18);
    for (let i = 0; i < phrase && out.length < count; i += 1) {
      const arc = Math.sin((i / phrase) * Math.PI) * 0.55 + 0.4;
      // Syllables: short bursts with a dip between them.
      const syllable = i % 3 === 2 ? 0.35 : 1;
      out.push(Math.min(1, arc * syllable * (0.65 + rand() * 0.45)));
    }
    // A breath.
    const pause = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < pause && out.length < count; i += 1) out.push(0.04 + rand() * 0.05);
  }
  return out;
}

function PlayPauseDemo() {
  const [playing, setPlaying] = useState(false);
  return (
    <Col gap={20}>
      <Row gap={22}>
        <PlayPauseButton playing={playing} onToggle={() => setPlaying((p) => !p)} size={76} />
        <PlayPauseButton playing={!playing} onToggle={() => setPlaying((p) => !p)} size={56} tone="accent" />
      </Row>
      <Text variant="caption" tone="muted">
        {playing ? 'Playing' : 'Paused'}
      </Text>
    </Col>
  );
}

function WaveformDemo() {
  const samples = useMemo(() => makeSamples(160), []);
  const [progress, setProgress] = useState(0.32);
  const total = 94;
  const at = Math.round(progress * total);
  return (
    <Col align="stretch" gap={22} style={{ paddingHorizontal: 22, paddingTop: 30 }}>
      <Waveform samples={samples} progress={progress} onSeek={setProgress} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" mono tone="muted">
          {Math.floor(at / 60)}:{String(at % 60).padStart(2, '0')}
        </Text>
        <Text variant="caption" mono tone="muted">
          1:34
        </Text>
      </View>
      <Text variant="micro" tone="muted">
        Live
      </Text>
      <Waveform samples={makeSamples(80, 3)} live height={34} />
    </Col>
  );
}

function ImageCompareDemo() {
  return (
    <Col align="stretch" style={{ paddingHorizontal: 14, paddingTop: 8 }}>
      <ImageCompare
        height={380}
        before={
          <Image
            source={{ uri: 'https://picsum.photos/id/1016/900/1000?grayscale' }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        }
        after={<Image source={{ uri: 'https://picsum.photos/id/1016/900/1000' }} style={{ flex: 1 }} resizeMode="cover" />}
      />
    </Col>
  );
}

function VoiceDemo() {
  const theme = useTheme();
  const [log, setLog] = useState<string[]>([]);
  return (
    <Col align="stretch" gap={16} style={{ paddingHorizontal: 16 }}>
      <View style={{ minHeight: 120, justifyContent: 'flex-end', gap: 8 }}>
        {log.slice(-2).map((line, i) => (
          <View
            key={i}
            style={{
              alignSelf: line.startsWith('Sent') ? 'flex-end' : 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: line.startsWith('Sent') ? theme.colors.accentSoft : theme.colors.surfaceSunken,
            }}
          >
            <Text variant="caption">{line}</Text>
          </View>
        ))}
      </View>
      <VoiceRecordButton
        onSend={(ms) => setLog((l) => [...l, `Sent a ${(ms / 1000).toFixed(1)}s voice note`])}
        onCancel={() => setLog((l) => [...l, 'Recording discarded'])}
      />
      <Text variant="caption" tone="muted" align="center">
        Hold the mic. Slide left to cancel.
      </Text>
    </Col>
  );
}

const STORY_IDS = ['1025', '1074', '1084', '237'];

function StoriesDemo() {
  const [round, setRound] = useState(0);
  // Fetch every story up front so the next one is ready the moment it is shown.
  useEffect(() => {
    STORY_IDS.forEach((id) => Image.prefetch(`https://picsum.photos/id/${id}/700/1100`));
  }, []);
  return (
    <Col align="stretch" style={{ paddingHorizontal: 30, paddingTop: 4 }}>
      <Stories
        key={round}
        height={480}
        onEnd={() => setRound((r) => r + 1)}
        header={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FF6B35', borderWidth: 2, borderColor: '#fff' }} />
            <Text variant="label" style={{ color: '#fff' }}>
              penguin.ui
            </Text>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
              2h
            </Text>
          </View>
        }
        stories={STORY_IDS.map((id, i) => ({
          key: id,
          duration: 4000,
          content: (
            <View style={{ flex: 1 }}>
              <Image source={{ uri: `https://picsum.photos/id/${id}/700/1100` }} style={{ flex: 1 }} resizeMode="cover" />
              <Text variant="title" style={{ position: 'absolute', left: 18, bottom: 26, color: '#fff' }}>
                Story {i + 1}
              </Text>
            </View>
          ),
        }))}
      />
    </Col>
  );
}

function MiniPlayerDemo() {
  const samples = useMemo(() => makeSamples(120, 11), []);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0.2);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress((p) => (p >= 1 ? 0 : p + 0.004)), 120);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <View style={{ alignSelf: 'stretch', paddingHorizontal: 12, paddingBottom: 6 }}>
      <MiniPlayer
        height={540}
        title="Midnight Drive"
        artist="Penguin Collective"
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        artwork={<Image source={{ uri: 'https://picsum.photos/id/1062/800/800' }} style={{ flex: 1 }} resizeMode="cover" />}
      >
        <Waveform samples={samples} progress={progress} onSeek={setProgress} height={36} />
      </MiniPlayer>
    </View>
  );
}

const WEEK = [
  { label: 'Mon', value: 3200 },
  { label: 'Tue', value: 5400 },
  { label: 'Wed', value: 4100 },
  { label: 'Thu', value: 7800 },
  { label: 'Fri', value: 6300 },
  { label: 'Sat', value: 9100 },
  { label: 'Sun', value: 2600 },
];

function BarChartDemo() {
  return (
    <Col align="stretch" gap={10} style={{ paddingHorizontal: 18, paddingTop: 10 }}>
      <Text variant="label">Steps this week</Text>
      <BarChart data={WEEK} highlight={5} height={250} format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : String(v))} />
      <Text variant="caption" tone="muted">
        Slide a finger across the bars.
      </Text>
    </Col>
  );
}

const PRICE = [
  128, 131, 129, 135, 141, 138, 144, 152, 149, 147, 155, 161, 158, 166, 171, 168, 175, 182, 179, 186, 191, 188, 196, 203,
].map((v, i) => ({ label: `Sep ${i + 6}`, value: v }));

function LineChartDemo() {
  return (
    <Col align="stretch" gap={10} style={{ paddingHorizontal: 18, paddingTop: 10 }}>
      <LineChart data={PRICE} height={260} format={(v) => `$${v}`} />
      <Text variant="caption" tone="muted">
        Touch and slide to read any day.
      </Text>
    </Col>
  );
}

function RingsDemo() {
  const [day, setDay] = useState(0);
  const days = [
    { move: 0.72, exercise: 0.45, stand: 0.9 },
    { move: 1.24, exercise: 1, stand: 0.66 },
    { move: 0.35, exercise: 0.8, stand: 1.1 },
  ];
  const d = days[day];
  const rings = [
    { key: 'move', label: 'Move', value: d.move, color: '#FA114F' },
    { key: 'exercise', label: 'Exercise', value: d.exercise, color: '#A6FF00' },
    { key: 'stand', label: 'Stand', value: d.stand, color: '#00F0FF' },
  ];
  return (
    <Col gap={20}>
      <View style={{ padding: 18, borderRadius: 32, backgroundColor: '#0B0B0D' }}>
        <ActivityRings rings={rings} size={200} />
      </View>
      <Row>
        {rings.map((r) => (
          <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.color }} />
            <Text variant="caption">
              {r.label} {Math.round(r.value * 100)}%
            </Text>
          </View>
        ))}
      </Row>
      <Button size="sm" variant="secondary" onPress={() => setDay((x) => (x + 1) % days.length)}>
        Next day
      </Button>
    </Col>
  );
}

export const media: Demo[] = [
  {
    id: 'play-pause-button',
    name: 'PlayPauseButton',
    category: 'Media',
    summary: 'Play and pause as one shape.',
    motion:
      'The triangle splits down its middle and each half stretches into a bar, so the icon changes form instead of crossfading two pictures. A stroke of the same colour keeps every corner soft through the morph.',
    touch: 'Light haptic.',
    Component: PlayPauseDemo,
  },
  {
    id: 'waveform',
    name: 'Waveform',
    category: 'Media',
    summary: 'Audio waveform you can scrub.',
    motion:
      'Dragging swells the bars under the finger like a lens passing over them, and the played colour follows. In live mode every bar breathes on its own phase, so the row never pulses in unison.',
    touch: 'A light tick every few bars while scrubbing.',
    layout: 'fill',
    Component: WaveformDemo,
  },
  {
    id: 'image-compare',
    name: 'ImageCompare',
    category: 'Media',
    summary: 'Before and after.',
    motion:
      'The divider trails the finger on a quick spring, which reads as weight rather than lag, and the handle grows when grabbed. Each label fades as the divider covers it.',
    touch: 'Light haptic on grab.',
    layout: 'fill',
    Component: ImageCompareDemo,
  },
  {
    id: 'voice-record-button',
    name: 'VoiceRecordButton',
    category: 'Media',
    summary: 'Hold to record.',
    motion:
      'Holding grows the button and sends rings pulsing out of it while a timer counts up. Sliding left uncovers a bin that grows as you approach; reach it and the recording is thrown away with a small jump of the bin.',
    touch: 'Medium haptic on start, light on send or cancel.',
    layout: 'fill',
    Component: VoiceDemo,
  },
  {
    id: 'stories',
    name: 'Stories',
    category: 'Media',
    summary: 'Story viewer.',
    motion:
      'Segments fill over each story\'s duration. Tap right or left to move. Holding pauses the segment where it is, and after a moment the header and segments fade so the story can be seen on its own.',
    touch: 'Selection haptic on each new story.',
    layout: 'fill',
    Component: StoriesDemo,
  },
  {
    id: 'mini-player',
    name: 'MiniPlayer',
    category: 'Media',
    summary: 'Player that opens from a pill.',
    motion:
      'One progress value drives everything: the pill grows into a card, the artwork grows from thumbnail to cover, the small title gives way to the large one, and the controls arrive row by row. Drag it down and it follows the finger closed.',
    touch: 'Light haptic when it settles open or closed.',
    layout: 'fill',
    Component: MiniPlayerDemo,
  },
  {
    id: 'bar-chart',
    name: 'BarChart',
    category: 'Media',
    summary: 'Bar chart read by touch.',
    motion:
      'Bars rise from the baseline one after another on a bouncy spring. Sliding a finger across keeps the bar under it at full strength while the rest recede, and a value bubble glides between bars with its figure rolling.',
    touch: 'Selection haptic per bar.',
    layout: 'fill',
    Component: BarChartDemo,
  },
  {
    id: 'line-chart',
    name: 'LineChart',
    category: 'Media',
    summary: 'Line chart that draws itself.',
    motion:
      'The line draws in along a monotone curve and the area fades up beneath it. Touching snaps a ringed cursor to the nearest point, and the headline figure rolls to its value while the change and date update.',
    touch: 'Selection haptic per point.',
    layout: 'fill',
    Component: LineChartDemo,
  },
  {
    id: 'activity-rings',
    name: 'ActivityRings',
    category: 'Media',
    summary: 'Concentric progress rings.',
    motion:
      'Each ring sweeps round on a heavy spring 120ms after the one outside it. A ring past its goal keeps going and laps itself, its head casting a small shadow so the overlap reads. Closing a ring gives it one pulse.',
    touch: 'Success haptic when a ring closes.',
    Component: RingsDemo,
  },
];
