'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
 * highlight that glides between links on hover instead of each link lighting on its own. On
 * phones the links fold into a menu: two strokes turn into a cross and a panel drops in.
 */
export function Nav() {
  const path = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));
  // Close the menu whenever the page changes, back and forward included.
  const [menuPath, setMenuPath] = useState(path);
  if (menuPath !== path) {
    setMenuPath(path);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const solid = scrolled || open;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center px-4 pt-4">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.15 }}
        className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border px-2 py-2 transition-[background-color,border-color,box-shadow] duration-500"
        style={{
          backgroundColor: solid ? 'rgba(10,18,34,0.72)' : 'rgba(10,18,34,0)',
          borderColor: solid ? 'rgba(214,228,255,0.1)' : 'rgba(214,228,255,0)',
          backdropFilter: solid ? 'blur(18px) saturate(1.4)' : 'none',
          boxShadow: solid ? '0 12px 40px -12px rgba(0,0,0,0.6)' : 'none',
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
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full text-snow transition-colors hover:bg-white/[0.06] md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <motion.line x1="3" x2="15" y1="6" y2="6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" animate={open ? { y1: 9, y2: 9, rotate: 45 } : { y1: 6, y2: 6, rotate: 0 }} style={{ originX: '9px', originY: '9px', transformBox: 'view-box' }} transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
              <motion.line x1="3" x2="15" y1="12" y2="12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" animate={open ? { y1: 9, y2: 9, rotate: -45 } : { y1: 12, y2: 12, rotate: 0 }} style={{ originX: '9px', originY: '9px', transformBox: 'view-box' }} transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
            </svg>
          </button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="pointer-events-auto mt-2 w-full max-w-5xl origin-top rounded-[28px] border border-line bg-[rgba(10,18,34,0.92)] p-3 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl md:hidden"
          >
            {[...LINKS, { href: GITHUB, label: 'GitHub' }].map((l, i) => {
              const external = l.href.startsWith('http');
              const active = !external && path?.startsWith(l.href.replace(/\/$/, ''));
              const inner = (
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.03 + i * 0.04 }}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors ${active ? 'bg-white/[0.06] text-snow' : 'text-frost active:bg-white/[0.06]'}`}
                >
                  <span className="display-wide text-[22px]">{l.label}</span>
                  {external ? <RepoMark size={18} /> : <ArrowUpRight size={18} strokeWidth={2} />}
                </motion.span>
              );
              return external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="block">
                  {inner}
                </a>
              ) : (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block">
                  {inner}
                </Link>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
