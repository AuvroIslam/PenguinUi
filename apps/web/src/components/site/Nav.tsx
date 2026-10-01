'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { GITHUB } from '@/lib/site';

import { PipMark } from '../brand/Pip';
import { ArrowUpRight, RepoMark, SearchMark } from './Marks';
import { SearchPalette, type NavItem } from './SearchPalette';

const LINKS = [
  { href: '/components/', label: 'Components' },
  { href: '/docs/', label: 'Docs' },
  { href: '/crew/', label: 'The crew' },
];

const glide = { type: 'spring' as const, stiffness: 440, damping: 36 };

const onMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const noSubscribe = () => () => {};

/** Typing in a field should never open the palette. */
function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

/**
 * One small island of glass at the top of the page, solid from the first frame. The links sit
 * in a recessed track where a single highlight rests on the current page and glides to
 * whichever link is pointed at, then glides home again. Search opens a palette of every
 * component (Ctrl K, or / anywhere). On phones the island itself grows downward into the menu,
 * the way the Dynamic Island opens, rather than dropping a separate sheet.
 */
export function Nav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const mac = useSyncExternalStore(noSubscribe, onMac, () => false);

  // Close everything whenever the page changes, back and forward included.
  const [shownPath, setShownPath] = useState(path);
  if (shownPath !== path) {
    setShownPath(path);
    setOpen(false);
    setSearching(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(false);
        setSearching((s) => !s);
      } else if (e.key === '/' && !typing(e.target)) {
        e.preventDefault();
        setOpen(false);
        setSearching(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const current = LINKS.find((l) => path?.startsWith(l.href.replace(/\/$/, '')))?.href ?? null;
  const lit = hover ?? current;
  const search = () => {
    setOpen(false);
    setSearching(true);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <motion.div
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.15 }}
        className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-[27px] border border-white/[0.08] bg-[rgba(8,14,28,0.76)] shadow-[0_14px_44px_-14px_rgba(0,0,0,0.7)] backdrop-blur-xl backdrop-saturate-150 md:w-auto md:max-w-none"
      >
        {/* Light catching the top edge, like the rim of a sheet of ice. */}
        <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <nav className="flex items-center gap-1 p-1.5" aria-label="Main">
          <Link href="/" className="group flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-3 transition-colors hover:bg-white/[0.04]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-floe to-deep ring-1 ring-inset ring-white/10 transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)] group-hover:-rotate-12">
              <PipMark size={23} />
            </span>
            <span className="display-wide text-[18px] leading-none">PenguinUi</span>
          </Link>

          <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/10 md:block" />

          <div
            className="hidden items-center rounded-full bg-black/25 p-1 ring-1 ring-inset ring-white/[0.05] md:flex"
            onMouseLeave={() => setHover(null)}
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current === l.href ? 'page' : undefined}
                onMouseEnter={() => setHover(l.href)}
                onFocus={() => setHover(l.href)}
                onBlur={() => setHover(null)}
                className={`relative rounded-full px-3.5 py-1.5 text-[14px] transition-colors duration-200 ${lit === l.href ? 'text-snow' : 'text-mist hover:text-snow'}`}
              >
                {lit === l.href ? (
                  <motion.span
                    layoutId="nav-lit"
                    className="absolute inset-0 rounded-full bg-white/[0.09] shadow-[inset_0_1px_0_rgba(214,228,255,0.1)]"
                    transition={glide}
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  {l.label}
                  {l.href === '/components/' ? <span className="mono text-[10px] text-fog">{items.length}</span> : null}
                </span>
              </Link>
            ))}
          </div>

          <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/10 md:block" />

          <button
            type="button"
            onClick={search}
            className="hidden items-center gap-2 rounded-full bg-white/[0.03] py-1.5 pl-3 pr-1.5 text-[13.5px] text-mist ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06] hover:text-snow md:flex"
          >
            <SearchMark size={15} />
            Search
            <kbd className="mono ml-3 rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-frost">{mac ? '⌘ K' : 'Ctrl K'}</kbd>
          </button>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label="PenguinUi on GitHub"
            className="hidden h-9 items-center gap-2 rounded-full px-2.5 text-[13.5px] text-frost transition-colors hover:bg-white/[0.07] hover:text-snow md:flex lg:pr-3.5"
          >
            <RepoMark size={17} />
            <span className="hidden lg:inline">GitHub</span>
          </a>

          <span className="flex-1 md:hidden" />
          <button
            type="button"
            onClick={search}
            aria-label="Search components"
            className="grid h-9 w-9 place-items-center rounded-full text-frost transition-colors hover:bg-white/[0.07] md:hidden"
          >
            <SearchMark size={17} />
          </button>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] text-snow ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.09] md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              {/* Both strokes are drawn through the middle and moved by transforms, so they meet
                  there and turn into a cross without animating the lines' own attributes. */}
              {[-1, 1].map((side) => (
                <motion.line
                  key={side}
                  x1="3"
                  x2="15"
                  y1="9"
                  y2="9"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  initial={false}
                  animate={open ? { y: 0, rotate: side * -45 } : { y: side * 3, rotate: 0 }}
                  style={{ originX: '9px', originY: '9px', transformBox: 'view-box' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                />
              ))}
            </svg>
          </button>
        </nav>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="md:hidden"
            >
              <div className="mx-1.5 h-px bg-white/[0.07]" />
              <div className="p-1.5">
                {[...LINKS, { href: GITHUB, label: 'GitHub' }].map((l, i) => {
                  const external = l.href.startsWith('http');
                  const here = current === l.href;
                  const inner = (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.04 + i * 0.04 }}
                      className={`flex items-center justify-between rounded-[20px] px-4 py-3.5 transition-colors ${here ? 'bg-white/[0.07] text-snow' : 'text-frost active:bg-white/[0.06]'}`}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="display-wide text-[22px]">{l.label}</span>
                        {l.href === '/components/' ? <span className="mono text-[11px] text-fog">{items.length}</span> : null}
                      </span>
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
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>{searching ? <SearchPalette key="search" items={items} onClose={() => setSearching(false)} /> : null}</AnimatePresence>
    </header>
  );
}
