'use client';

import { motion, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

import { GITHUB } from '@/lib/site';

import { Pip } from '../brand/Pip';

const COLUMNS = [
  {
    title: 'Library',
    links: [
      { label: 'All components', href: '/components/' },
      { label: 'Getting started', href: '/docs/' },
      { label: 'Theming', href: '/docs/#theming' },
    ],
  },
  {
    title: 'World',
    links: [
      { label: 'Meet the crew', href: '/crew/' },
      { label: 'Polar scenes', href: '/crew/#scenes' },
    ],
  },
  {
    title: 'Source',
    links: [
      { label: 'GitHub', href: GITHUB, external: true },
      { label: 'MIT licence', href: `${GITHUB}/blob/main/LICENSE`, external: true },
    ],
  },
];

/**
 * The page ends at the edge of the ice. A wordmark too big for the screen sits on the
 * horizon, and Pip climbs up over it to wave goodbye when the footer comes into view.
 */
export function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  // Half of the wordmark on screen is enough: at the very bottom of a short page it can never
  // scroll further in than that.
  const seen = useInView(ref, { once: true, amount: 0.5 });

  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line bg-abyss">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-20 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <p className="display-wide text-2xl">Built for thumbs.</p>
          <p className="mt-3 text-[15px] leading-relaxed text-mist">
            Open source and free. Every component was planned, built and then tested on a real phone before it shipped here.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mono text-[11px] uppercase tracking-[0.18em] text-fog">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {'external' in l ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="text-[15px] text-frost transition-colors hover:text-snow">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-[15px] text-frost transition-colors hover:text-snow">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div ref={ref} className="relative mx-auto max-w-[1400px] px-4">
        <motion.div
          className="absolute bottom-[64%] left-[58%] z-30 origin-bottom scale-[0.72] sm:left-[61%] sm:scale-100"
          initial={{ y: 140, rotate: 8, opacity: 0 }}
          animate={seen ? { y: 0, rotate: 0, opacity: 1 } : undefined}
          transition={{ type: 'spring', stiffness: 160, damping: 13, delay: 0.25 }}
        >
          <Pip size={110} waving={seen} playful />
        </motion.div>
        <p
          className="display relative z-20 select-none text-center text-[clamp(5rem,21vw,19rem)] text-transparent"
          style={{
            backgroundImage: 'linear-gradient(180deg, #22314f 0%, #0a1222 78%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            marginBottom: '-0.18em',
          }}
          aria-hidden
        >
          PenguinUi
        </p>
      </div>
      <div className="relative z-30 flex items-center justify-between border-t border-line px-6 py-5 text-[13px] text-fog">
        <span className="mono">© {new Date().getFullYear()} Auvro Islam</span>
        <span className="mono">Made on the ice</span>
      </div>
    </footer>
  );
}
