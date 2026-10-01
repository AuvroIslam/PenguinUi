'use client';

import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { GITHUB } from '@/lib/site';

import { PipMark } from '../brand/Pip';
import { ArrowUpRight, RepoMark } from './Marks';

const LINKS = [
  { href: '/components/', label: 'Components' },
  { href: '/docs/', label: 'Docs' },
  { href: '/crew/', label: 'The crew' },
];

/**
 * A floating pill that tightens and gains a frosted backing once the page scrolls, with one
 * highlight that glides between links on hover instead of each link lighting on its own.
 */
export function Nav() {
  const path = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.15 }}
        className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border px-2 py-2 transition-[background-color,border-color,box-shadow] duration-500"
        style={{
          backgroundColor: scrolled ? 'rgba(10,18,34,0.72)' : 'rgba(10,18,34,0)',
          borderColor: scrolled ? 'rgba(214,228,255,0.1)' : 'rgba(214,228,255,0)',
          backdropFilter: scrolled ? 'blur(18px) saturate(1.4)' : 'none',
          boxShadow: scrolled ? '0 12px 40px -12px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 rounded-full py-1 pl-2 pr-3">
          <PipMark size={28} />
          <span className="display-wide text-[19px]">PenguinUi</span>
        </Link>
        <div className="hidden items-center md:flex" onMouseLeave={() => setHover(null)}>
          {LINKS.map((l) => {
            const active = path?.startsWith(l.href.replace(/\/$/, ''));
            return (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHover(l.href)}
                className={`relative rounded-full px-4 py-2 text-[14.5px] transition-colors ${active ? 'text-snow' : 'text-frost hover:text-snow'}`}
              >
                {hover === l.href ? (
                  <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-white/[0.06]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                ) : null}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full px-3.5 py-2 text-[14px] text-frost transition-colors hover:text-snow sm:flex"
          >
            <RepoMark size={17} />
            GitHub
          </a>
          <Link
            href="/components/"
            className="group flex items-center gap-1.5 rounded-full bg-snow py-2 pl-4 pr-3 text-[14px] font-semibold text-night transition-transform active:scale-95"
          >
            Browse
            <span className="transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight size={16} strokeWidth={2.2} />
            </span>
          </Link>
        </div>
      </motion.nav>
    </header>
  );
}
