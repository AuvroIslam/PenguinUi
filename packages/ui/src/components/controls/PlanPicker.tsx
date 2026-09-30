import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { haptic } from '../../motion/haptics';
import { easings, springs } from '../../motion/tokens';
import { DrawnCheck } from '../../primitives/DrawnPath';
import { PressableScale } from '../../primitives/PressableScale';
import { Text } from '../../primitives/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fill } from '../../utils/layout';
import { useControllable } from '../../utils/useControllable';
import { RollingNumber } from '../text/RollingNumber';
import { SegmentedControl } from './SegmentedControl';

export type Plan = {
  id: string;
  name: string;
  /** Price per month when billed monthly. */
  monthly: number;
  /** Price per month when billed yearly. */
  yearly: number;
  /** Short line under the name. */
  blurb?: string;
  features: string[];
  /** A small tag on the card, such as "Popular". */
  badge?: string;
};

export type Billing = 'monthly' | 'yearly';

export type PlanPickerProps = {
  plans: Plan[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  billing?: Billing;
  defaultBilling?: Billing;
  onBillingChange?: (billing: Billing) => void;
  currency?: string;
  style?: StyleProp<ViewStyle>;
};

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const reflow = LinearTransition.springify()
  .mass(springs.smooth.mass)
  .stiffness(springs.smooth.stiffness)
  .damping(springs.smooth.damping);

const RADIUS = 20;

function Outline({ width, height, selected, color }: { width: number; height: number; selected: boolean; color: string }) {
  const draw = useSharedValue(selected ? 1 : 0);

  const w = Math.max(0, width - 3);
  const h = Math.max(0, height - 3);
  const r = Math.min(RADIUS - 1.5, h / 2);
  const perimeter = 2 * (w + h - 2 * r) + 2 * Math.PI * r;

  useEffect(() => {
    draw.value = selected
      ? withTiming(1, { duration: 620, easing: easings.out })
      : withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [selected, draw]);

  const animated = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - draw.value),
    strokeOpacity: draw.value > 0.001 ? 1 : 0,
  }));

  if (!width || !height) return null;

  return (
    <View style={fill} pointerEvents="none">
      <Svg width={width} height={height}>
        <AnimatedRect
          x={1.5}
          y={1.5}
          width={w}
          height={h}
          rx={r}
          ry={r}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={[perimeter, perimeter]}
          animatedProps={animated}
        />
      </Svg>
    </View>
  );
}

function Tick({ show, delay }: { show: boolean; delay: number }) {
  const theme = useTheme();
  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = show ? withDelay(delay, withTiming(1, { duration: 260, easing: easings.out })) : 0;
  }, [show, delay, draw]);
  return <DrawnCheck progress={draw} size={18} color={theme.colors.accent} strokeWidth={2.2} />;
}

function PlanCard({
  plan,
  selected,
  billing,
  currency,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  billing: Billing;
  currency: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const badge = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    badge.value = withSpring(selected ? 1 : 0, springs.bouncy);
  }, [selected, badge]);

  const check = useAnimatedStyle(() => ({
    opacity: Math.min(1, badge.value * 2),
    transform: [{ scale: badge.value }],
  }));

  const price = billing === 'yearly' ? plan.yearly : plan.monthly;

  return (
    <Animated.View layout={reflow}>
      <PressableScale
        onPress={onPress}
        haptic={false}
        scaleTo={0.985}
        accessibilityRole="radio"
        accessibilityLabel={`${plan.name}, ${currency}${price} per month`}
        accessibilityState={{ selected }}
        onLayout={(e: LayoutChangeEvent) =>
          setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
        }
        style={[
          styles.card,
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            borderRadius: RADIUS,
            boxShadow: selected ? theme.shadows.md : theme.shadows.sm,
          },
        ]}
      >
        <View style={styles.head}>
          <View style={styles.title}>
            <View style={styles.nameRow}>
              <Text variant="heading">{plan.name}</Text>
              {plan.badge ? (
                <View style={[styles.badge, { backgroundColor: c.accentSoft, borderRadius: theme.radii.pill }]}>
                  <Text variant="micro" tone="accent">
                    {plan.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            {plan.blurb ? (
              <Text variant="caption" tone="muted">
                {plan.blurb}
              </Text>
            ) : null}
          </View>
          <View style={styles.priceBlock}>
            <View style={styles.price}>
              <RollingNumber value={price} prefix={currency} variant="title" group={false} />
              <Text variant="caption" tone="muted">
                /mo
              </Text>
            </View>
          </View>
          <Animated.View style={[styles.check, { backgroundColor: c.accent }, check]}>
            <DrawnCheck progress={badge} size={16} color={c.onAccent} strokeWidth={2.6} />
          </Animated.View>
        </View>

        {selected ? (
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(120)} style={styles.features}>
            <View style={[styles.rule, { backgroundColor: c.border }]} />
            {plan.features.map((feature, i) => (
              <Animated.View
                key={feature}
                entering={FadeInDown.delay(120 + i * 60).duration(240)}
                exiting={FadeOut.duration(90)}
                style={styles.feature}
              >
                <Tick show={selected} delay={180 + i * 60} />
                <Text variant="body" style={styles.featureText}>
                  {feature}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}

        <Outline width={size.width} height={size.height} selected={selected} color={c.accent} />
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Pricing plans with a billing switch. Changing the period rolls every price to its new
 * figure. Choosing a plan draws an outline around its card from the top-left corner, springs
 * a check into the corner and opens its feature list, each line fading up a beat after the
 * last with its own tick drawing in. The other cards close and the stack reflows.
 */
export function PlanPicker({
  plans,
  value: controlled,
  defaultValue,
  onChange,
  billing: controlledBilling,
  defaultBilling = 'monthly',
  onBillingChange,
  currency = '$',
  style,
}: PlanPickerProps) {
  const [value, setValue] = useControllable<string | undefined>(
    controlled,
    defaultValue ?? plans[0]?.id,
    onChange as ((value: string | undefined) => void) | undefined,
  );
  const [billing, setBilling] = useControllable<Billing>(controlledBilling, defaultBilling, onBillingChange);

  return (
    <View style={[styles.wrap, style]}>
      <SegmentedControl
        options={[
          { label: 'Monthly', value: 'monthly' as Billing },
          { label: 'Yearly', value: 'yearly' as Billing },
        ]}
        value={billing}
        onChange={setBilling}
      />
      <View accessibilityRole="radiogroup" style={styles.list}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === value}
            billing={billing}
            currency={currency}
            onPress={() => {
              if (plan.id === value) return;
              haptic('selection');
              setValue(plan.id);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 16 },
  list: { gap: 12 },
  card: { padding: 18, borderWidth: StyleSheet.hairlineWidth },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  priceBlock: { alignItems: 'flex-end' },
  price: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  features: { gap: 10, paddingTop: 14 },
  rule: { height: StyleSheet.hairlineWidth, marginBottom: 4 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { flex: 1 },
});
