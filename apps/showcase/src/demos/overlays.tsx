import {
  ActionSheet,
  Banner,
  BottomSheet,
  Button,
  CircularProgress,
  Dialog,
  DynamicIsland,
  Glyph,
  IconButton,
  MorphingDialog,
  ProgressBar,
  PullToRefresh,
  Skeleton,
  Spinner,
  Text,
  Tooltip,
  toast,
  useTheme,
  type IslandState,
} from 'penguin-ui';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Col, Row } from './kit';
import type { Demo } from './types';

function BottomSheetDemo() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [detent, setDetent] = useState(0);
  return (
    <Col gap={14}>
      <Button
        onPress={() => {
          setDetent(0);
          setOpen(true);
        }}
      >
        Open sheet
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} onDetentChange={setDetent} detents={[0.42, 0.86]}>
        <View style={{ paddingHorizontal: 22, gap: 14 }}>
          <Text variant="title">Share</Text>
          <Text variant="body" tone="muted">
            {detent === 0
              ? 'Flick up to open it fully. A fast flick carries it all the way even from a short drag.'
              : 'Pull past the top and it resists. Drag down fast to close.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, paddingTop: 6 }}>
            {(['message', 'copy', 'bookmark', 'share'] as const).map((icon) => (
              <View
                key={icon}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 20,
                  backgroundColor: theme.colors.surfaceSunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Glyph name={icon} size={24} />
              </View>
            ))}
          </View>
        </View>
      </BottomSheet>
    </Col>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  return (
    <Col gap={12}>
      <Row>
        <Button
          onPress={() => {
            setLocked(false);
            setOpen(true);
          }}
        >
          Open dialog
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            setLocked(true);
            setOpen(true);
          }}
        >
          Required
        </Button>
      </Row>
      <Text variant="caption" tone="muted" align="center">
        The required one refuses a tap outside with a pulse.
      </Text>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        dismissible={!locked}
        title={locked ? 'Update required' : 'Delete this draft?'}
        description={
          locked ? 'This version is no longer supported. Update to keep going.' : 'You will not be able to get it back.'
        }
        actions={
          locked ? (
            <Button size="sm" onPress={() => setOpen(false)}>
              Update
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onPress={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" onPress={() => setOpen(false)}>
                Delete
              </Button>
            </>
          )
        }
      />
    </Col>
  );
}

function ToastDemo() {
  return (
    <Col gap={12}>
      <Row>
        <Button size="sm" onPress={() => toast('Event created', { description: 'Tuesday at 10:00' })}>
          Default
        </Button>
        <Button size="sm" variant="secondary" onPress={() => toast.success('Saved to library')}>
          Success
        </Button>
        <Button size="sm" variant="secondary" onPress={() => toast.error('Could not connect', { description: 'Check your network and try again.' })}>
          Error
        </Button>
      </Row>
      <Button
        size="sm"
        variant="outline"
        onPress={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1800)), {
            loading: 'Uploading photo',
            success: 'Photo uploaded',
            error: 'Upload failed',
          })
        }
      >
        Promise
      </Button>
      <Text variant="caption" tone="muted" align="center">
        Fire a few, then tap the stack to fan it open. Swipe one up to dismiss it.
      </Text>
    </Col>
  );
}

function IslandDemo() {
  const theme = useTheme();
  const [state, setState] = useState<IslandState>('idle');
  const next: Record<IslandState, IslandState> = { idle: 'compact', compact: 'expanded', expanded: 'idle' };
  return (
    <Col gap={18} align="stretch" style={{ paddingTop: 12 }}>
      <DynamicIsland
        state={state}
        onPress={() => setState(next[state])}
        compact={{
          leading: <Glyph name="music" size={18} color="#FF6B35" />,
          trailing: <Bars />,
        }}
        expanded={
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 54, height: 54, borderRadius: 14, backgroundColor: '#FF6B35' }} />
              <View style={{ flex: 1 }}>
                <Text variant="label" style={{ color: '#fff' }}>
                  Midnight Drive
                </Text>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Penguin Collective
                </Text>
              </View>
              <Bars />
            </View>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <View style={{ width: '42%', height: 4, borderRadius: 2, backgroundColor: '#fff' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 36 }}>
              <Glyph name="chevron-left" size={26} color="#fff" />
              <Glyph name="pause" size={26} color="#fff" />
              <Glyph name="chevron-right" size={26} color="#fff" />
            </View>
          </View>
        }
      />
      <Text variant="caption" tone="muted" align="center" style={{ color: theme.colors.textMuted }}>
        Tap the island: idle, compact, expanded.
      </Text>
    </Col>
  );
}

function Bar({ index }: { index: number }) {
  const level = useSharedValue(0.4);
  useEffect(() => {
    // Each bar has its own period, so together they never fall into step.
    const period = [520, 380, 610, 450, 560][index];
    level.value = withDelay(index * 70, withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [index, level]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.3 + level.value * 0.7 }] }));
  return <Animated.View style={[{ width: 2.5, height: 16, borderRadius: 1.5, backgroundColor: '#FF6B35' }, animated]} />;
}

function Bars() {
  return (
    <View style={{ flexDirection: 'row', gap: 2.5, alignItems: 'center', height: 16 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Bar key={i} index={i} />
      ))}
    </View>
  );
}

function MorphingDialogDemo() {
  const theme = useTheme();
  const art = (color: string, icon: 'music' | 'image') => (
    <View style={{ flex: 1, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Glyph name={icon} size={44} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignSelf: 'stretch', paddingTop: 8 }}>
      <MorphingDialog
        style={{ flex: 1 }}
        title="Midnight Drive"
        subtitle="Penguin Collective"
        image={art('#E8572A', 'music')}
      >
        <Text variant="body" tone="muted">
          Recorded over one long night in a borrowed studio. Eight tracks, no overdubs, and a drum machine that kept
          drifting out of time, which the band decided to keep.
        </Text>
      </MorphingDialog>
      <MorphingDialog style={{ flex: 1 }} title="Coastline" subtitle="Field recordings" image={art(theme.dark ? '#2B6CB0' : '#3B82F6', 'image')}>
        <Text variant="body" tone="muted">
          Waves, gulls and wind, captured along forty kilometres of coast over a single week in autumn.
        </Text>
      </MorphingDialog>
    </View>
  );
}

function ActionSheetDemo() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('');
  return (
    <Col gap={12}>
      <Button onPress={() => setOpen(true)}>Show actions</Button>
      <Text variant="caption" tone="muted">
        {last ? `Chose ${last}` : 'Nothing chosen'}
      </Text>
      <ActionSheet
        open={open}
        onClose={() => setOpen(false)}
        bottom={insets.bottom}
        title="Photo"
        message="Choose what to do with this photo."
        actions={[
          { label: 'Share', icon: 'share', onPress: () => setLast('share') },
          { label: 'Save to library', icon: 'bookmark', onPress: () => setLast('save') },
          { label: 'Copy link', icon: 'copy', onPress: () => setLast('copy') },
          { label: 'Delete', icon: 'trash', destructive: true, onPress: () => setLast('delete') },
        ]}
      />
    </Col>
  );
}

function TooltipDemo() {
  return (
    <Col gap={22} style={{ paddingTop: 10 }}>
      <Row gap={18}>
        <Tooltip content="Notifications are paused until 9:00">
          <IconButton icon="bell" label="Notifications" variant="filled" />
        </Tooltip>
        <Tooltip content="Share with people in this workspace" placement="bottom">
          <IconButton icon="share" label="Share" variant="outline" />
        </Tooltip>
        <Tooltip content="Saved" trigger="press">
          <IconButton icon="bookmark" label="Save" />
        </Tooltip>
      </Row>
      <Text variant="caption" tone="muted" align="center">
        Long press the first two, tap the last.
      </Text>
    </Col>
  );
}

function BannerDemo() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<null | 'success' | 'danger'>(null);
  return (
    <Col gap={12}>
      <Row>
        <Button size="sm" onPress={() => setOpen('success')}>
          Archived
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setOpen('danger')}>
          Failed
        </Button>
      </Row>
      <Text variant="caption" tone="muted" align="center">
        Hold the banner to pause its timer. Flick it up to dismiss.
      </Text>
      <Banner
        open={open !== null}
        onDismiss={() => setOpen(null)}
        top={insets.top}
        tone={open ?? 'success'}
        title={open === 'danger' ? 'Payment failed' : 'Conversation archived'}
        description={open === 'danger' ? 'Your card was declined.' : 'You can find it in Archive.'}
        action={
          <Button size="sm" variant="secondary" onPress={() => setOpen(null)}>
            {open === 'danger' ? 'Retry' : 'Undo'}
          </Button>
        }
      />
    </Col>
  );
}

function SkeletonDemo() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const row = (i: number) => (
    <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Skeleton loading={loading} width={44} height={44} radius="pill">
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ['#F4581C', '#3B82F6', '#1E9E5A'][i] }} />
      </Skeleton>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton loading={loading} width="62%" height={14}>
          <Text variant="label">{['Ada Lovelace', 'Grace Hopper', 'Alan Kay'][i]}</Text>
        </Skeleton>
        <Skeleton loading={loading} width="88%" height={12}>
          <Text variant="caption" tone="muted">
            {['Shared a new design file', 'Commented on your prototype', 'Started following you'][i]}
          </Text>
        </Skeleton>
      </View>
    </View>
  );
  return (
    <Col align="stretch" gap={18} style={{ paddingHorizontal: 18, paddingTop: 16 }}>
      <View style={{ gap: 18, padding: 16, borderRadius: 20, backgroundColor: theme.colors.surface }}>{[0, 1, 2].map(row)}</View>
      <Button size="sm" variant="secondary" onPress={() => setLoading((l) => !l)}>
        {loading ? 'Finish loading' : 'Load again'}
      </Button>
    </Col>
  );
}

function SpinnerDemo() {
  const theme = useTheme();
  return (
    <Col gap={18}>
      <Row gap={30}>
        {(['arc', 'dots', 'bars'] as const).map((v) => (
          <View key={v} style={{ alignItems: 'center', gap: 10 }}>
            <Spinner variant={v} size={36} />
            <Text variant="micro" tone="muted">
              {v}
            </Text>
          </View>
        ))}
      </Row>
      <Row gap={30}>
        {(['orbit', 'pulse'] as const).map((v) => (
          <View key={v} style={{ alignItems: 'center', gap: 10 }}>
            <Spinner variant={v} size={36} color={theme.colors.accent} />
            <Text variant="micro" tone="muted">
              {v}
            </Text>
          </View>
        ))}
      </Row>
    </Col>
  );
}

function ProgressBarDemo() {
  const [value, setValue] = useState(0.25);
  return (
    <Col align="stretch" gap={24} style={{ paddingHorizontal: 24, paddingTop: 40 }}>
      <ProgressBar value={value} />
      <ProgressBar tone="primary" />
      <Row>
        <Button size="sm" variant="secondary" onPress={() => setValue((v) => Math.max(0, v - 0.2))}>
          Less
        </Button>
        <Button size="sm" onPress={() => setValue((v) => Math.min(1, v + 0.2))}>
          More
        </Button>
      </Row>
    </Col>
  );
}

function CircularDemo() {
  const [value, setValue] = useState(0.4);
  return (
    <Col gap={20}>
      <CircularProgress value={value} label="Uploaded" />
      <Row>
        <Button size="sm" variant="secondary" onPress={() => setValue(0.15)}>
          Reset
        </Button>
        <Button size="sm" onPress={() => setValue((v) => Math.min(1, Math.round((v + 0.3) * 100) / 100))}>
          Add 30%
        </Button>
      </Row>
    </Col>
  );
}

function PullDemo() {
  const theme = useTheme();
  const [count, setCount] = useState(0);
  return (
    <View style={{ height: 470, alignSelf: 'stretch', borderRadius: 18, overflow: 'hidden', backgroundColor: theme.colors.surfaceSunken }}>
      <PullToRefresh
        onRefresh={() => new Promise((r) => setTimeout(() => {
          setCount((n) => n + 1);
          r(null);
        }, 1600))}
        contentContainerStyle={{ padding: 14, gap: 10 }}
      >
        <Text variant="caption" tone="muted" align="center">
          {count ? `Refreshed ${count} time${count > 1 ? 's' : ''}` : 'Pull down to refresh'}
        </Text>
        {Array.from({ length: 8 }, (_, i) => (
          <View key={i} style={{ height: 62, borderRadius: 14, backgroundColor: theme.colors.surface, justifyContent: 'center', paddingHorizontal: 16 }}>
            <Text variant="label">Message {i + 1 + count * 8}</Text>
          </View>
        ))}
      </PullToRefresh>
    </View>
  );
}

export const overlays: Demo[] = [
  {
    id: 'bottom-sheet',
    name: 'BottomSheet',
    category: 'Overlays',
    summary: 'Draggable sheet with detents.',
    motion:
      'Where it settles is decided by where the flick would carry it, so a quick flick from the small detent goes all the way up. Past the top it rubber-bands. The backdrop darkens with its position, and the handle bends into a chevron pointing the way it is pulled.',
    touch: 'Light haptic on each detent.',
    Component: BottomSheetDemo,
  },
  {
    id: 'dialog',
    name: 'Dialog',
    category: 'Overlays',
    summary: 'Centred modal.',
    motion:
      'Arrives from 12pt below at 0.92 scale on a bouncy spring and leaves in 150ms, faster than it came. A dialog that cannot be dismissed answers a tap outside with a small pulse instead of ignoring it.',
    touch: 'Warning haptic on a refused dismissal.',
    Component: DialogDemo,
  },
  {
    id: 'toast',
    name: 'Toast',
    category: 'Overlays',
    summary: 'Stacked notifications.',
    motion:
      'New toasts drop in from above while older ones step back 5 percent and take the front card\'s height, so three read as one stack with depth. Tap to fan them open; the timers pause while open. A promise toast turns its spinner into a drawn check or cross.',
    touch: 'Swipe up to dismiss. Success and error haptics on a settled promise.',
    Component: ToastDemo,
  },
  {
    id: 'dynamic-island',
    name: 'DynamicIsland',
    category: 'Overlays',
    summary: 'Morphing status pill.',
    motion:
      'Width, height and radius move on one lively spring that visibly overshoots. The outgoing content shrinks away almost at once, and the incoming content grows in only once the shape has most of its size, so they never overlap.',
    touch: 'Soft haptic on press.',
    layout: 'fill',
    Component: IslandDemo,
  },
  {
    id: 'morphing-dialog',
    name: 'MorphingDialog',
    category: 'Overlays',
    summary: 'A card that becomes a dialog.',
    motion:
      'The card\'s own frame springs from its place in the layout to the middle of the screen, position, size and radius together, with the artwork growing inside it. The body opens only as it arrives. Closing returns it to its exact place.',
    touch: 'Drag the open dialog down to shrink and dismiss it.',
    Component: MorphingDialogDemo,
  },
  {
    id: 'action-sheet',
    name: 'ActionSheet',
    category: 'Overlays',
    summary: 'List of actions from the bottom.',
    motion:
      'The sheet rides up on a heavy spring and its rows rise into place one after another, tied to the sheet\'s own travel rather than a separate clock. Cancel sits apart and arrives last.',
    touch: 'Selection haptic on an action. Drag down to dismiss.',
    Component: ActionSheetDemo,
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'Overlays',
    summary: 'Anchored hint.',
    motion:
      'Grows out of the tip of its own arrow on a snappy spring, so it comes from the control. It flips above or below and slides along the screen edge to stay visible while the arrow keeps pointing at the anchor.',
    touch: 'Selection haptic on show.',
    Component: TooltipDemo,
  },
  {
    id: 'banner',
    name: 'Banner',
    category: 'Overlays',
    summary: 'Top alert with a visible timer.',
    motion:
      'Drops from the top edge on a bouncy spring. A line along its bottom shrinks toward the moment it will leave, so the time left is visible. Holding the banner stops the line; letting go resumes it.',
    touch: 'Notification haptic by tone. Flick up to dismiss.',
    Component: BannerDemo,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Overlays',
    summary: 'Loading placeholder.',
    motion:
      'A soft band of light sweeps left to right with a short rest between passes. Every skeleton shares one clock and knows where it sits on screen, so a whole page is crossed by a single sweep. When loading ends, the real content fades in in place.',
    layout: 'fill',
    Component: SkeletonDemo,
  },
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'Overlays',
    summary: 'Five loading indicators.',
    motion:
      'The arc breathes its length while it turns, the dots rise in a wave, the bars move like an equaliser, one orbit dot chases another, and the pulse sends out rings that fade as they grow.',
    Component: SpinnerDemo,
  },
  {
    id: 'progress-bar',
    name: 'ProgressBar',
    category: 'Overlays',
    summary: 'Linear progress.',
    motion:
      'The fill springs to its value on a heavy spring so jumps land softly, with a glint on the leading edge while it moves. The indeterminate segment stretches as it speeds through the middle and shrinks at the ends.',
    layout: 'fill',
    Component: ProgressBarDemo,
  },
  {
    id: 'circular-progress',
    name: 'CircularProgress',
    category: 'Overlays',
    summary: 'Ring progress.',
    motion:
      'The ring fills on a spring while the percentage rolls. Reaching 100 is an event: the ring turns green, the figure gives way to a check that draws itself, and the ring gives one pulse.',
    touch: 'Success haptic at 100 percent.',
    Component: CircularDemo,
  },
  {
    id: 'pull-to-refresh',
    name: 'PullToRefresh',
    category: 'Overlays',
    summary: 'Liquid pull to refresh.',
    motion:
      'Pulling draws a drop out of the top edge, its neck thinning as the bulb swells. At the threshold the neck snaps back into the edge and the bulb, left hanging, becomes the spinner. When the work is done it shrinks away and the content rises.',
    touch: 'A rigid tap at the threshold, medium when the refresh starts.',
    layout: 'fill',
    Component: PullDemo,
  },
];
