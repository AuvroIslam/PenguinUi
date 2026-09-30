import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../../motion/haptics';
import { springs } from '../../motion/tokens';
import { PressableScale } from '../../primitives/PressableScale';
import { TextMorph } from '../text/TextMorph';
import { useTheme } from '../../theme/ThemeProvider';
import { fontFor } from '../../theme/tokens';
import { useControllable } from '../../utils/useControllable';

export type DateStripProps = {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
  /** 0 is Sunday, 1 is Monday. */
  weekStartsOn?: 0 | 1;
  style?: StyleProp<ViewStyle>;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CELL_HEIGHT = 74;

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date, b: Date) => dayStart(a).getTime() === dayStart(b).getTime();

function weekOf(date: Date, weekStartsOn: 0 | 1): Date[] {
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  const first = addDays(date, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

type CellProps = {
  date: Date;
  index: number;
  width: number;
  pill: SharedValue<number>;
  today: boolean;
  onPress: () => void;
};

const Cell = memo(function Cell({ date, index, width, pill, today, onPress }: CellProps) {
  const theme = useTheme();
  const c = theme.colors;

  // The pill's distance from this cell decides the colour, so a label darkens as the pill
  // approaches and lightens as it leaves, rather than switching when the selection changes.
  const label = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(pill.value - index * width) / width);
    return { color: interpolateColor(near, [0, 1], [c.textMuted, c.onPrimary]) };
  });
  const number = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(pill.value - index * width) / width);
    return { color: interpolateColor(near, [0, 1], [c.text, c.onPrimary]) };
  });

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      haptic="selection"
      accessibilityLabel={`${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`}
      style={[styles.cell, { width }]}
    >
      <Animated.Text style={[styles.day, fontFor(theme, 'medium'), label]}>
        {DAYS[date.getDay()].toUpperCase()}
      </Animated.Text>
      <Animated.Text style={[styles.date, fontFor(theme, 'semibold'), number]}>
        {date.getDate()}
      </Animated.Text>
      <View style={[styles.dot, { backgroundColor: today ? c.accent : 'transparent' }]} />
    </PressableScale>
  );
});

/**
 * A week you can leaf through. One pill slides between days and each label changes colour as
 * the pill passes under it. Swipe the strip sideways to turn to the next or previous week,
 * which slides out and the new one slides in, with the selection following to the same
 * weekday.
 */
export function DateStrip({
  value: controlled,
  defaultValue,
  onChange,
  weekStartsOn = 1,
  style,
}: DateStripProps) {
  const theme = useTheme();
  const c = theme.colors;
  const fallback = useMemo(() => dayStart(new Date()), []);
  const [value, setValue] = useControllable<Date>(controlled, defaultValue ?? fallback, onChange);
  const week = useMemo(() => weekOf(value, weekStartsOn), [value, weekStartsOn]);
  const index = week.findIndex((d) => sameDay(d, value));

  const [width, setWidth] = useState(0);
  // The strip has 4pt of padding on each side.
  const cell = Math.max(0, width - 8) / 7;

  const pill = useSharedValue(index * cell);
  const slide = useSharedValue(0);
  const ready = useSharedValue(false);

  useEffect(() => {
    if (!cell) return;
    if (!ready.value) {
      pill.value = index * cell;
      ready.value = true;
      return;
    }
    pill.value = withSpring(index * cell, springs.snappy);
  }, [index, cell, pill, ready]);

  const turn = (direction: 1 | -1) => {
    haptic('light');
    setValue(addDays(value, direction * 7));
    // Comes in from the side the swipe was heading toward.
    slide.value = direction * 36;
    slide.value = withSpring(0, springs.smooth);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      slide.value = e.translationX * 0.35;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 60 || Math.abs(e.velocityX) > 700) {
        scheduleOnRN(turn, e.translationX < 0 ? 1 : -1);
      } else {
        slide.value = withSpring(0, springs.smooth);
      }
    });

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pill.value }] }));
  const rowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(slide.value), [0, 40], [1, 0.4]),
    transform: [{ translateX: slide.value }],
  }));

  const today = dayStart(new Date());
  const heading = `${MONTHS[value.getMonth()]} ${value.getFullYear()}`;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.header}>
        <TextMorph variant="heading">{heading}</TextMorph>
      </View>
      <GestureDetector gesture={pan}>
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          style={[
            styles.strip,
            { backgroundColor: c.surfaceSunken, borderColor: c.border, borderRadius: theme.radii.lg },
          ]}
        >
          {cell > 0 ? (
            <Animated.View
              style={[
                styles.pill,
                { width: cell, backgroundColor: c.primary, borderRadius: theme.radii.md },
                pillStyle,
              ]}
            />
          ) : null}
          <Animated.View style={[styles.days, rowStyle]}>
            {cell > 0
              ? week.map((date, i) => (
                  <Cell
                    key={date.getTime()}
                    date={date}
                    index={i}
                    width={cell}
                    pill={pill}
                    today={sameDay(date, today)}
                    onPress={() => setValue(date)}
                  />
                ))
              : null}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 12 },
  header: { paddingHorizontal: 6 },
  strip: { height: CELL_HEIGHT + 8, padding: 4, borderWidth: StyleSheet.hairlineWidth },
  pill: { position: 'absolute', top: 4, left: 4, height: CELL_HEIGHT, pointerEvents: 'none' },
  days: { flexDirection: 'row' },
  cell: { height: CELL_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 2 },
  day: { fontSize: 11, letterSpacing: 0.6 },
  date: { fontSize: 20, lineHeight: 26 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
