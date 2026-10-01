'use client';

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

import { Flake } from '../site/Marks';

type Item = { id: string; name: string };

function Row({ items, base, reverse }: { items: Item[]; base: number; reverse?: boolean }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 300 });
  // Scrolling speeds the ribbon up, in the direction of the scroll, then it eases back.
  const boost = useTransform(velocity, [-1500, 0, 1500], [-4, 0, 4], { clamp: false });
  const dir = useRef(reverse ? -1 : 1);
  const hover = useRef(false);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const b = boost.get();
    if (b < 0) dir.current = reverse ? 1 : -1;
    else if (b > 0) dir.current = reverse ? -1 : 1;
    const speed = hover.current ? 0.15 : 1;
    x.set(x.get() + dir.current * base * (delta / 1000) * speed * (1 + Math.abs(b)));
  });

  const pos = useTransform(x, (v) => `${wrap(-50, 0, v)}%`);
  const doubled = [...items, ...items];

  return (
    <div
      className="flex overflow-hidden whitespace-nowrap py-3"
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    >
      <motion.div className="flex shrink-0 items-center gap-8" style={{ x: pos }}>
        {doubled.map((item, i) => (
          <Link
            key={`${item.id}-${i}`}
            href={`/components/${item.id}/`}
            className="group flex items-center gap-8 text-[clamp(1.6rem,3.6vw,3rem)] text-frost/70 transition-colors hover:text-snow"
          >
            <span className="display-wide">{item.name}</span>
            <span className="text-fog transition-transform duration-700 group-hover:rotate-90 group-hover:text-aurora">
              <Flake size={22} />
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Every component's name on two ribbons drifting in opposite directions. Scrolling throws
 * them faster in the scroll's direction, hovering slows them to a crawl, and every name is a
 * link to its component.
 */
export function Ticker({ items }: { items: Item[] }) {
  const half = Math.ceil(items.length / 2);
  return (
    <section aria-label="Every component" className="relative border-y border-line bg-deep/40 py-6">
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: 'linear-gradient(90deg, #060b17 0%, transparent 12%, transparent 88%, #060b17 100%)' }}
      />
      <Row items={items.slice(0, half)} base={-2.2} />
      <Row items={items.slice(half)} base={-2.2} reverse />
    </section>
  );
}
