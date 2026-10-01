'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { Bubbles, Frost, Mochi, Nori } from '../brand/Friends';
import { Pip } from '../brand/Pip';
import { ArrowRight } from '../site/Marks';
import { Reveal } from './Reveal';

const CAST = [
  { name: 'Mochi', species: 'seal pup', node: <Mochi size={190} />, tilt: -3 },
  { name: 'Frost', species: 'polar bear cub', node: <Frost size={170} />, tilt: 2 },
  { name: 'Pip', species: 'penguin, the boss', node: <Pip size={170} followPointer playful waving />, tilt: 0 },
  { name: 'Bubbles', species: 'orca', node: <Bubbles size={230} />, tilt: 3 },
  { name: 'Nori', species: 'narwhal', node: <Nori size={230} />, tilt: -2 },
];

/**
 * The cast, lined up on one floe. Each one lifts and tilts when pointed at, and Pip in the
 * middle watches the pointer. The point of the section: a hundred demos, one world.
 */
export function Crew() {
  // On a narrow screen the line-up scrolls sideways; start it centred on Pip.
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  return (
    <section id="crew" className="relative overflow-hidden py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="display max-w-4xl text-[clamp(3rem,7vw,6rem)]">
            One world.
            <br />
            <span className="text-mist">Zero stock photos.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-frost">
            Every demo is set on the same ice, with the same five friends. Avatars, album covers, cards and stories all come
            from one cast, so a hundred components still read as one product.
          </p>
        </Reveal>
      </div>

      <div className="relative mt-20">
        {/* The floe they stand on. */}
        <svg className="absolute inset-x-0 bottom-0 h-[120px] w-full" viewBox="0 0 1600 120" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="floe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#24365e" />
              <stop offset="1" stopColor="#0a1222" />
            </linearGradient>
          </defs>
          <path d="M0 40 C 200 10, 420 30, 640 22 C 880 12, 1120 34, 1340 18 C 1460 10, 1540 20, 1600 28 L 1600 120 L 0 120 Z" fill="url(#floe)" />
          <path d="M0 40 C 200 10, 420 30, 640 22 C 880 12, 1120 34, 1340 18 C 1460 10, 1540 20, 1600 28" stroke="rgba(214,228,255,0.25)" strokeWidth={2} fill="none" />
        </svg>
        {/* The inner row centres itself when it fits and scrolls from its first friend when it
            does not, so nobody is pushed off the left edge out of reach. */}
        <div ref={row} className="relative overflow-x-auto pb-14 [scrollbar-width:none]">
          <div className="mx-auto flex w-max items-end gap-2 px-6 [zoom:0.62] sm:gap-6 sm:[zoom:0.85] lg:[zoom:1]">
          {CAST.map((c, i) => (
            <motion.div
              key={c.name}
              className="group flex shrink-0 flex-col items-center"
              initial={{ y: 80, opacity: 0, rotate: c.tilt * 2 }}
              whileInView={{ y: 0, opacity: 1, rotate: c.tilt }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.08 * i }}
            >
              <div className="mb-3 translate-y-2 rounded-full border border-line-strong bg-deep/80 px-3 py-1 text-center opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="display-wide text-[15px]">{c.name}</span>
                <span className="mono ml-2 text-[10.5px] text-mist">{c.species}</span>
              </div>
              {c.node}
            </motion.div>
          ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl justify-center px-6">
        <Link href="/crew/" className="group inline-flex items-center gap-2 text-[15px] text-frost transition-colors hover:text-snow">
          Meet them properly
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>
    </section>
  );
}
