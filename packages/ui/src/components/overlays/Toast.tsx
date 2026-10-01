import { memo, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { ArcSpinner } from '../../primitives/ArcSpinner';
import { DrawnCheck, DrawnCross } from '../../primitives/DrawnPath';
import { Glyph } from '../../primitives/Glyph';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastItem = {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
  /** Milliseconds on screen. `Infinity` keeps it until dismissed. */
  duration: number;
};

type Options = { description?: string; duration?: number };

// A tiny store outside React, so `toast()` can be called from anywhere, not just components.
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function upsert(item: ToastItem) {
  const exists = items.some((t) => t.id === item.id);
  items = exists ? items.map((t) => (t.id === item.id ? item : t)) : [item, ...items];
  emit();
}

function create(type: ToastType, title: string, options: Options = {}, id?: number): number {
  const toastId = id ?? nextId++;
  upsert({
    id: toastId,
    title,
    description: options.description,
    type,
    duration: options.duration ?? (type === 'loading' ? Infinity : 4000),
  });
  return toastId;
}

/** Shows a toast. Needs a `Toaster` mounted somewhere in the app. */
export function toast(title: string, options?: Options) {
  return create('default', title, options);
}
toast.success = (title: string, options?: Options) => create('success', title, options);
toast.error = (title: string, options?: Options) => create('error', title, options);
toast.warning = (title: string, options?: Options) => create('warning', title, options);
toast.info = (title: string, options?: Options) => create('info', title, options);
toast.dismiss = (id: number) => {
  items = items.filter((t) => t.id !== id);
  emit();
};
/**
 * Shows a loading toast that turns into a success or error toast when the promise settles.
 * The same toast changes in place: its spinner draws into a check or a cross.
 */
toast.promise = <T,>(
  promise: Promise<T>,
  labels: { loading: string; success: string | ((value: T) => string); error: string | ((e: unknown) => string) },
) => {
  const id = create('loading', labels.loading);
  promise.then(
    (value) => create('success', typeof labels.success === 'function' ? labels.success(value) : labels.success, {}, id),
    (e) => create('error', typeof labels.error === 'function' ? labels.error(e) : labels.error, {}, id),
  );
  return promise;
};

function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
  );
}

const VISIBLE = 3;
const GAP = 12;
/** How much of each toast behind the front one shows below it. */
const PEEK = 14;
const SWIPE = 45;

function StatusIcon({ type }: { type: ToastType }) {
  const theme = useTheme();
  const c = theme.colors;
  const draw = useSharedValue(type === 'loading' ? 0 : 1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (type !== 'loading') {
        draw.value = 0;
        draw.value = withTiming(1, { duration: 360, easing: easings.out });
      }
      return;
    }
    // Arriving from loading: draw the result in, so the spinner seems to resolve into it.
    draw.value = 0;
    draw.value = withTiming(1, { duration: 380, easing: easings.out });
    if (type === 'success') haptic('success');
    if (type === 'error') haptic('error');
  }, [type, draw]);

  const tint =
    type === 'success' ? c.success : type === 'error' ? c.danger : type === 'warning' ? c.warning : type === 'info' ? c.accent : c.text;

  if (type === 'default') return null;
  return (
    <View style={styles.icon}>
      {type === 'loading' ? (
        <ArcSpinner size={20} color={c.text} strokeWidth={2.2} />
      ) : (
        // Mounted fresh when the result arrives, so it can pop out of the spinner's place.
        // Recolouring a view that was mounted transparent also loses its corner radius on Android.
        <ResultDisc color={tint}>
          {type === 'success' ? <DrawnCheck progress={draw} size={16} color={c.onStatus} strokeWidth={2.6} /> : null}
          {type === 'error' ? <DrawnCross progress={draw} size={16} color={c.onStatus} strokeWidth={2.6} /> : null}
          {type === 'warning' ? <Glyph name="alert" size={14} color={c.onStatus} strokeWidth={2.4} /> : null}
          {type === 'info' ? <Glyph name="info" size={16} color={c.onStatus} strokeWidth={2.2} /> : null}
        </ResultDisc>
      )}
    </View>
  );
}

function ResultDisc({ color, children }: { color: string; children: ReactNode }) {
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = withSpring(1, springs.bouncy);
  }, [pop]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: 0.4 + pop.value * 0.6 }], opacity: Math.min(1, pop.value * 2) }));
  return <Animated.View style={[styles.disc, { backgroundColor: color }, animated]}>{children}</Animated.View>;
}

type CardProps = {
  item: ToastItem;
  index: number;
  expanded: boolean;
  offset: number;
  frontHeight: number;
  onHeight: (id: number, h: number) => void;
  onToggle: () => void;
};

const ToastCard = memo(function ToastCard({ item, index, expanded, offset, frontHeight, onHeight, onToggle }: CardProps) {
  const theme = useTheme();
  const c = theme.colors;

  const enter = useSharedValue(0);
  const lift = useSharedValue(0);
  const place = useSharedValue(index);
  const open = useSharedValue(expanded ? 1 : 0);
  const at = useSharedValue(offset);
  const drag = useSharedValue(0);
  const leaving = useSharedValue(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    enter.value = withSpring(1, springs.smooth);
  }, [enter]);
  useEffect(() => {
    place.value = withSpring(index, springs.smooth);
  }, [index, place]);
  useEffect(() => {
    open.value = withSpring(expanded ? 1 : 0, springs.smooth);
  }, [expanded, open]);
  useEffect(() => {
    at.value = withSpring(offset, springs.smooth);
  }, [offset, at]);

  // Auto dismiss. The clock pauses while the stack is open for reading.
  useEffect(() => {
    if (item.duration === Infinity || expanded) return;
    const t = setTimeout(() => toast.dismiss(item.id), item.duration);
    return () => clearTimeout(t);
  }, [item.id, item.duration, item.type, expanded]);

  const dismiss = () => toast.dismiss(item.id);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      // Up dismisses; down meets resistance, so the toast feels held rather than stuck.
      drag.value = e.translationY < 0 ? e.translationY : e.translationY * 0.15;
    })
    .onEnd((e) => {
      if (drag.value < -SWIPE || e.velocityY < -600) {
        leaving.value = withTiming(1, { duration: 180 });
        drag.value = withTiming(-160, { duration: 180 }, () => scheduleOnRN(dismiss));
      } else {
        drag.value = withSpring(0, springs.bouncy);
      }
    });
  const tap = Gesture.Tap().onEnd(() => scheduleOnRN(onToggle));
  const gesture = Gesture.Exclusive(pan, tap);

  const animated = useAnimatedStyle(() => {
    const p = place.value;
    const o = open.value;
    // Collapsed: each toast behind steps down by the peek and shrinks by 5 percent.
    const collapsedY = p * PEEK;
    const y = interpolate(o, [0, 1], [collapsedY, at.value]);
    const scale = interpolate(o, [0, 1], [1 - p * 0.05, 1]);
    const hidden = p >= VISIBLE ? 1 - Math.min(1, p - (VISIBLE - 1)) : 1;
    return {
      zIndex: 100 - Math.round(p),
      opacity: Math.max(0, enter.value * hidden * (1 - leaving.value)),
      transform: [
        { translateY: y + drag.value + (1 - enter.value) * -90 },
        { scale: scale * (0.94 + enter.value * 0.06) },
      ],
    };
  });

  // In the collapsed stack every card behind takes the front card's height, so the stack
  // stays tidy whatever each one says, and their text is hidden until it is opened.
  const body = useAnimatedStyle(() => {
    const behind = Math.min(1, place.value);
    const collapsedH = frontHeight || height;
    return {
      height: height ? interpolate(open.value, [0, 1], [interpolate(behind, [0, 1], [height, collapsedH]), height]) : undefined,
    };
  });
  const content = useAnimatedStyle(() => ({
    opacity: Math.max(open.value, 1 - Math.min(1, place.value) * 1.4),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animated]}>
        <Animated.View
          style={[
            styles.surface,
            { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: theme.radii.lg, boxShadow: theme.shadows.lg },
            body,
          ]}
        >
          <Animated.View
            style={[styles.row, content]}
            onLayout={(e: LayoutChangeEvent) => {
              const h = e.nativeEvent.layout.height;
              if (Math.abs(h - height) > 0.5) {
                setHeight(h);
                onHeight(item.id, h);
              }
            }}
          >
            <StatusIcon type={item.type} />
            <View style={styles.text}>
              <Text variant="label" numberOfLines={2}>
                {item.title}
              </Text>
              {item.description ? (
                <Text variant="caption" tone="muted" numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

/**
 * Hosts toasts. New ones drop in from above while older ones step back and shrink, so three
 * cards read as one stack with depth. Tap the stack to fan it open and read everything; the
 * timers pause while it is open. Swipe a toast up to dismiss it. A promise toast changes in
 * place from its spinner to a drawn check or cross.
 */
export function Toaster({ top = 0 }: {
  /** Distance from the top of the screen, such as the status bar inset. */
  top?: number;
}) {
  const list = useToasts();
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<number, number>>({});

  useEffect(() => {
    if (list.length === 0) setExpanded(false);
  }, [list.length]);

  const onHeight = (id: number, h: number) => setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));

  const offsets: number[] = [];
  let run = 0;
  list.forEach((t) => {
    offsets.push(run);
    run += (heights[t.id] ?? 64) + GAP;
  });

  if (list.length === 0) return null;

  return (
    <Portal>
      <View style={fill} pointerEvents="box-none">
        {expanded ? <View style={fill} onTouchEnd={() => setExpanded(false)} /> : null}
        <View pointerEvents="box-none" style={[styles.host, { top: top + 8 }]}>
          {list.map((item, i) => (
            <ToastCard
              key={item.id}
              item={item}
              index={i}
              expanded={expanded}
              offset={offsets[i]}
              frontHeight={heights[list[0].id] ?? 0}
              onHeight={onHeight}
              onToggle={() => setExpanded((e) => !e)}
            />
          ))}
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 14, right: 14 },
  // Scaled about the bottom edge, so a card behind keeps its full peek below the one in front.
  card: { position: 'absolute', left: 0, right: 0, top: 0, transformOrigin: 'center bottom' },
  surface: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  icon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  disc: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
