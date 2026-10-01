'use client';

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';

import { PEERS } from '@/lib/site';

import { Pip } from '../brand/Pip';
import { CopyChip } from '../site/CopyChip';
import { LivePhone } from '../site/LivePhone';
import { ArrowRight } from '../site/Marks';
import { Snowfall } from '../site/Snowfall';
import { Aurora, Horizon } from './Aurora';

const SHOWCASE = [
  { id: 'swipe-deck', label: 'Swipe deck' },
  { id: 'dynamic-island', label: 'Island' },
  { id: 'liquid-tab-bar', label: 'Liquid tabs' },
  { id: 'pull-to-refresh', label: 'Pull to refresh' },
  { id: 'toast', label: 'Toasts' },
];

const spring = { type: 'spring' as const, stiffness: 120, damping: 18, mass: 0.9 };

function Letters({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <span className={`inline-block ${className ?? ''}`} aria-hidden>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-transform"
          initial={reduced ? false : { y: '0.7em', opacity: 0, rotate: -8, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, rotate: 0, filter: 'blur(0px)' }}
          transition={{ ...spring, delay: delay + i * 0.035 }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * The first screen. The headline drops in letter by letter like settling snow, the phone rises
 * out of the dark already running a real component, and Pip belly-slides in from the left,
 * pops upright and waves. From then on his eyes follow the pointer, and he hops if clicked.
 */
export function Hero() {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(SHOWCASE[0].id);

  return (
    <section className="relative isolate min-h-[100dvh] overflow-hidden pb-24 pt-32">
      {/* Sky */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_70%_0%,#0f1d3d_0%,#060b17_55%,#03060d_100%)]" />
      <Aurora className="absolute inset-x-0 top-0 -z-10 h-[78%] w-full opacity-90" />
      <Snowfall className="absolute inset-0 -z-10 h-full w-full" />
      <Horizon className="absolute inset-x-0 bottom-0 -z-10 h-[150px] w-full" />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="min-w-0">
          <motion.a
            href="#crew"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-deep/60 py-1.5 pl-1.5 pr-4 text-[13px] text-frost backdrop-blur"
          >
            <span className="mono rounded-full bg-pip px-2.5 py-1 text-[11px] font-medium text-white">100</span>
            components, one penguin
          </motion.a>

          <h1 className="display text-[clamp(3.8rem,8.4vw,7.6rem)]" aria-label="Motion you can feel.">
            <span className="block">
              <Letters text="Motion" delay={0.2} />
            </span>
            <span className="block">
              <Letters text="you can" delay={0.42} />
              <span className="inline-block w-[0.22em]" />
              <span className="relative inline-block text-pip-bright">
                <Letters text="feel." delay={0.7} />
                <motion.svg
                  viewBox="0 0 220 26"
                  className="absolute -bottom-[0.08em] left-0 w-full"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <motion.path
                    d="M4 16 C 30 4, 52 24, 78 14 S 128 4, 152 15 S 196 22, 216 9"
                    stroke="#3DDAB4"
                    strokeWidth={5}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 1.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                </motion.svg>
              </span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 1.05 }}
            className="mt-8 max-w-[30rem] text-[19px] leading-[1.55] text-frost"
          >
            One hundred React Native components built on springs, gestures and haptics. Made for phones, tested on real ones.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 1.2 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/components/"
              className="group inline-flex items-center gap-2 rounded-full bg-snow py-3.5 pl-6 pr-4 text-[15.5px] font-semibold text-night shadow-[0_10px_40px_-10px_rgba(91,141,255,0.6)] transition-transform active:scale-[0.97]"
            >
              Browse components
              <span className="grid h-7 w-7 place-items-center rounded-full bg-night text-snow transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] group-hover:translate-x-1">
                <ArrowRight size={15} strokeWidth={2.2} />
              </span>
            </Link>
            <Link href="/docs/" className="rounded-full px-5 py-3.5 text-[15.5px] text-frost transition-colors hover:text-snow">
              Read the docs
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="mt-10 max-w-md"
          >
            <CopyChip text={PEERS} label="npx expo install react-native-reanimated ..." />
          </motion.div>
        </div>

        <div className="relative flex min-w-0 flex-col items-center">
          <motion.div
            initial={reduced ? false : { y: 140, opacity: 0, rotateX: 28, rotateZ: -6 }}
            animate={{ y: 0, opacity: 1, rotateX: 0, rotateZ: -2 }}
            transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.5 }}
            style={{ transformPerspective: 1200 }}
          >
            <LivePhone id={current} width={312} eager />
          </motion.div>

          {/* Pip belly-slides in from the left and pops upright beside the phone. */}
          <motion.div
            className="absolute -left-3 bottom-36 z-10 origin-bottom-left scale-[0.68] sm:-left-24 sm:bottom-40 sm:scale-100"
            initial={reduced ? false : { x: -420, rotate: -84, y: 40 }}
            animate={{ x: 0, rotate: 0, y: 0 }}
            transition={{
              x: { type: 'spring', stiffness: 60, damping: 14, delay: 1.1 },
              rotate: { type: 'spring', stiffness: 140, damping: 9, delay: 1.75 },
              y: { type: 'spring', stiffness: 140, damping: 10, delay: 1.75 },
            }}
          >
            <Pip size={150} waving followPointer playful />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, ...spring }}
            className="mt-8 flex flex-wrap justify-center gap-1.5 rounded-full border border-line bg-deep/70 p-1.5 backdrop-blur"
            role="tablist"
          >
            {SHOWCASE.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={current === s.id}
                onClick={() => setCurrent(s.id)}
                className={`relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${current === s.id ? 'text-night' : 'text-frost hover:text-snow'}`}
              >
                {current === s.id ? (
                  <motion.span layoutId="hero-pick" className="absolute inset-0 rounded-full bg-snow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                ) : null}
                <span className="relative">{s.label}</span>
              </button>
            ))}
          </motion.div>
          <p className="mono mt-4 text-[11px] text-fog">This is the real component. Touch it.</p>
        </div>
      </div>
    </section>
  );
}
