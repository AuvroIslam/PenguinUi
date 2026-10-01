'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

import { Bubbles, Frost, Mochi, Nori } from '../brand/Friends';
import { Pip, type PipMood } from '../brand/Pip';
import { Reveal } from '../home/Reveal';
import { LiveTile } from '../site/LiveTile';

const FRIENDS = [
  {
    name: 'Mochi',
    species: 'Seal pup',
    line: 'Naps on any flat ice and wakes up for snacks. Appears wherever something needs to feel soft.',
    node: <Mochi size={260} />,
    tint: 'from-[#1b2a4c] to-[#0d1630]',
  },
  {
    name: 'Frost',
    species: 'Polar bear cub',
    line: 'Very calm, very round, builds excellent snow forts. The steady one, cast in cards and confirmations.',
    node: <Frost size={230} />,
    tint: 'from-[#1d2c4f] to-[#0c1530]',
  },
  {
    name: 'Bubbles',
    species: 'Orca',
    line: 'The fastest swimmer of the group and knows every current by name. Shows up in night scenes.',
    node: <Bubbles size={300} />,
    tint: 'from-[#13203e] to-[#081024]',
  },
  {
    name: 'Nori',
    species: 'Narwhal',
    line: 'Navigates by the aurora and sings, slightly out of time. The star of every album cover.',
    node: <Nori size={300} />,
    tint: 'from-[#182b55] to-[#0b1431]',
  },
];

const MOODS: PipMood[] = ['idle', 'happy', 'surprised'];

/** The cast, properly introduced, followed by the six places they live. */
export function CrewPage() {
  const [mood, setMood] = useState(0);
  return (
    <main className="pb-10 pt-32">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <h1 className="display text-[clamp(3.4rem,8vw,6.6rem)]">
              This is Pip.
              <br />
              <span className="text-mist">He runs the place.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-6 max-w-md text-[18px] leading-relaxed text-frost">
              A small blue penguin with strong opinions about springs. He blinks, waves, follows your pointer, and hops when
              you click him. Try changing his mood.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="mt-8 flex gap-2">
              {MOODS.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(i)}
                  className={`relative rounded-full px-4 py-2 text-[14px] capitalize transition-colors ${mood === i ? 'text-night' : 'text-frost hover:text-snow'}`}
                >
                  {mood === i ? <motion.span layoutId="mood" className="absolute inset-0 rounded-full bg-snow" transition={{ type: 'spring', stiffness: 420, damping: 32 }} /> : null}
                  <span className="relative">{m}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
        <motion.div
          className="flex justify-center"
          initial={{ y: 120, opacity: 0, rotate: -12 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 11, delay: 0.2 }}
        >
          <Pip size={320} mood={MOODS[mood]} waving followPointer playful />
        </motion.div>
      </section>

      <section className="mx-auto mt-28 max-w-6xl px-6">
        <Reveal>
          <h2 className="display text-[clamp(2.6rem,5vw,4rem)]">And his friends.</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FRIENDS.map((f, i) => (
            <Reveal key={f.name} delay={0.05 * i}>
              <div className={`group relative flex h-[360px] flex-col justify-between overflow-hidden rounded-[30px] border border-line bg-gradient-to-b p-7 ${f.tint}`}>
                <div>
                  <p className="mono text-[11px] uppercase tracking-[0.16em] text-aurora">{f.species}</p>
                  <p className="display mt-2 text-[44px]">{f.name}</p>
                  <p className="mt-2 max-w-[19rem] text-[15px] leading-relaxed text-frost">{f.line}</p>
                </div>
                <div className="absolute -bottom-2 right-4 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-2">
                  {f.node}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="scenes" className="mx-auto mt-28 max-w-6xl scroll-mt-28 px-6">
        <Reveal>
          <h2 className="display text-[clamp(2.6rem,5vw,4rem)]">Where they live.</h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-frost">
            Six times of day on one stretch of ice, drawn as vectors so they stay sharp at any size and weigh almost nothing.
            They stand in for photography in every demo.
          </p>
        </Reveal>
        <div className="mt-10 grid auto-rows-[340px] grid-cols-1 gap-4 md:grid-cols-3">
          <LiveTile id="carousel" name="Carousel" category="Five scenes, swipe through" className="md:col-span-2" />
          <LiveTile id="coverflow-carousel" name="Coverflow" category="Album covers" />
          <LiveTile id="stories" name="Stories" category="A day on the ice" />
          <LiveTile id="image-compare" name="Night and day" category="ImageCompare" className="md:col-span-2" />
        </div>
      </section>
    </main>
  );
}
