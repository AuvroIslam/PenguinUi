'use client';

import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

const STATS = [
  { value: 100, label: 'components', note: 'each with its own planned motion' },
  { value: 9, label: 'families', note: 'from buttons to charts' },
  { value: 6, label: 'springs', note: 'one shared motion vocabulary' },
  { value: 0, label: 'stock photos', note: 'the crew stars in every demo' },
];

function Count({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '-40px' });
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => Math.round(n).toString());
  useEffect(() => {
    if (seen) animate(v, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
  }, [seen, to, v]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

/** The library in four numbers, separated by hairlines rather than boxed into cards. */
export function Numbers() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid grid-cols-2 border-y border-line md:grid-cols-4">
        {STATS.map((s, i) => (
          <div key={s.label} className={`px-6 py-10 ${i ? 'border-l border-line' : ''} ${i === 2 ? 'max-md:border-l-0 max-md:border-t' : ''} ${i === 3 ? 'max-md:border-t' : ''}`}>
            <p className="display text-[clamp(3.5rem,7vw,5.5rem)] text-snow">
              <Count to={s.value} />
            </p>
            <p className="mono mt-3 text-[12px] uppercase tracking-[0.16em] text-aurora">{s.label}</p>
            <p className="mt-2 text-[14px] text-mist">{s.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
