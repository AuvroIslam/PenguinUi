'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { thumbUrl } from '@/lib/site';

import { SearchMark } from './Marks';

export type NavItem = { id: string; name: string; category: string; summary: string };

/** Best matches first: a name that starts with the query, then one that contains it, then the rest. */
function rank(items: NavItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const scored: { item: NavItem; score: number }[] = [];
  for (const item of items) {
    const name = item.name.toLowerCase();
    const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : `${item.summary} ${item.category}`.toLowerCase().includes(q) ? 2 : -1;
    if (score >= 0) scored.push({ item, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.item);
}

/**
 * Every component, one keystroke away. Type to narrow the list, move with the arrow keys or the
 * pointer while one highlight glides between rows, and press Enter to open it. Each row carries
 * the component's own still, so the list reads as a shelf of things rather than of names.
 */
export function SearchPalette({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const results = useMemo(() => rank(items, query), [items, query]);
  const current = Math.min(selected, Math.max(0, results.length - 1));

  // Focus the field and hold the page still underneath while the palette is up.
  useEffect(() => {
    input.current?.focus();
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    list.current?.querySelector(`[data-row="${current}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  const open = (id: string) => {
    onClose();
    router.push(`/components/${id}/`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(Math.min(current + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(Math.max(current - 1, 0));
    } else if (e.key === 'Enter' && results[current]) {
      e.preventDefault();
      open(results[current].id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[11vh]"
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
    >
      <div className="absolute inset-0 bg-abyss/70 backdrop-blur-[6px]" onClick={onClose} aria-hidden />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search components"
        initial={{ y: -18, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -10, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="relative w-full max-w-xl overflow-hidden rounded-[26px] border border-white/[0.09] bg-[rgba(10,18,34,0.97)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(214,228,255,0.07)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 text-mist">
          <SearchMark size={18} />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search components"
            aria-label="Search components"
            className="w-full bg-transparent text-[16px] text-snow outline-none placeholder:text-fog"
          />
          <button
            type="button"
            onClick={onClose}
            className="mono shrink-0 rounded-md bg-white/[0.06] px-2 py-1 text-[10.5px] text-frost transition-colors hover:text-snow"
          >
            <span className="md:hidden">Close</span>
            <span className="hidden md:inline">Esc</span>
          </button>
        </div>
        <div ref={list} className="max-h-[min(56vh,460px)] overflow-y-auto overscroll-contain p-2" role="listbox" aria-label="Components">
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={i === current}
              data-row={i}
              onMouseMove={() => i !== current && setSelected(i)}
              onClick={() => open(r.id)}
              className="relative flex w-full items-center gap-3.5 rounded-2xl px-2.5 py-2 text-left"
            >
              {i === current ? (
                <motion.span
                  layoutId="search-row"
                  className="absolute inset-0 rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.07]"
                  transition={{ type: 'spring', stiffness: 560, damping: 42 }}
                />
              ) : null}
              <img
                src={thumbUrl(r.id, 'card')}
                alt=""
                loading="lazy"
                className="relative h-12 w-10 shrink-0 rounded-[10px] bg-[#070C18] object-contain ring-1 ring-inset ring-white/[0.06]"
              />
              <span className="relative min-w-0 flex-1">
                <span className={`display-wide block text-[16px] transition-colors ${i === current ? 'text-snow' : 'text-frost'}`}>{r.name}</span>
                <span className="block truncate text-[13px] text-mist">{r.summary}</span>
              </span>
              <span className="mono relative hidden shrink-0 text-[10px] uppercase tracking-[0.14em] text-fog sm:block">{r.category}</span>
            </button>
          ))}
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px] text-mist">Nothing on this floe matches &ldquo;{query}&rdquo;.</p>
          ) : null}
        </div>
        <div className="mono flex items-center gap-4 border-t border-line px-5 py-2.5 text-[10.5px] text-fog">
          {/* Keyboard hints only where there is a keyboard to speak of. */}
          <span className="hidden md:inline">
            <kbd className="text-frost">↑ ↓</kbd> move
          </span>
          <span className="hidden md:inline">
            <kbd className="text-frost">Enter</kbd> open
          </span>
          <span className="ml-auto">{results.length} of {items.length}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
