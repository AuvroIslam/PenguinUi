'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { previewUrl, thumbUrl } from '@/lib/site';

import { Pip } from '../brand/Pip';
import { ArrowUpRight, SearchMark } from '../site/Marks';

type Item = { id: string; name: string; category: string; summary: string };

function Card({ item, index }: { item: Item; index: number }) {
  const [hot, setHot] = useState(false);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fine = useRef(false);
  useEffect(() => {
    fine.current = window.matchMedia('(pointer: fine)').matches;
  }, []);

  // Hovering for a moment brings the component to life; leaving puts the still back.
  const enter = () => {
    if (!fine.current) return;
    timer.current = setTimeout(() => setHot(true), 260);
  };
  const leave = () => {
    clearTimeout(timer.current);
    setHot(false);
    setReady(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22, delay: Math.min(index, 12) * 0.025 }}
      onMouseEnter={enter}
      onMouseLeave={leave}
      className="group relative"
    >
      {/* The card's ground matches the component's own background, so the still, cropped to
          what the component draws, sits in it seamlessly and nothing is cut off. */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[26px] border border-line bg-[#070C18] shadow-[inset_0_1px_0_rgba(214,228,255,0.06)] transition-[border-color,box-shadow] duration-500 group-hover:border-pip-bright/30 group-hover:shadow-[0_30px_70px_-30px_rgba(47,107,240,0.45)]">
        <img
          src={thumbUrl(item.id, 'card')}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
          style={{ opacity: ready ? 0 : 1 }}
        />
        {hot ? (
          <iframe
            src={previewUrl(item.id)}
            title={`${item.name}, live`}
            onLoad={() => setTimeout(() => setReady(true), 200)}
            className="absolute inset-0 h-full w-full border-0 transition-opacity duration-500"
            style={{ opacity: ready ? 1 : 0 }}
          />
        ) : null}
        <AnimatePresence>
          {hot && !ready ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mono pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-night/80 px-3 py-1 text-[10.5px] text-mist backdrop-blur"
            >
              waking up
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <Link href={`/components/${item.id}/`} className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="display-wide text-[19px] transition-colors group-hover:text-snow">{item.name}</p>
          <p className="mt-1 line-clamp-1 text-[14px] text-mist">{item.summary}</p>
        </div>
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-frost transition-all duration-300 group-hover:border-transparent group-hover:bg-snow group-hover:text-night">
          <ArrowUpRight size={15} strokeWidth={2.1} />
        </span>
      </Link>
    </motion.div>
  );
}

/**
 * The whole library. Filter by family with a highlight that glides between chips, search by
 * name or purpose, and hover any card to bring that component to life in place.
 */
export function Gallery({ items, categories }: { items: Item[]; categories: string[] }) {
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) => (category === 'All' || i.category === category) && (!q || `${i.name} ${i.summary} ${i.category}`.toLowerCase().includes(q)),
    );
  }, [items, category, query]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: items.length };
    for (const i of items) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, [items]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-20 pt-36">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            className="display text-[clamp(3.4rem,8vw,6.6rem)]"
          >
            The whole colony.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.08 }}
            className="mt-5 max-w-md text-[18px] leading-relaxed text-frost"
          >
            {items.length} components. Hover any card to try it, open it for the code.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.2 }} className="hidden md:block">
          <Pip size={120} mood={shown.length === 0 ? 'surprised' : 'idle'} followPointer playful />
        </motion.div>
      </div>

      <div className="sticky top-[84px] z-30 mt-12 flex flex-col gap-3 rounded-[24px] border border-line bg-night/80 p-2 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <LayoutGroup id="families">
          <div className="flex gap-1 overflow-x-auto" data-lenis-prevent>
            {['All', ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`relative shrink-0 rounded-full px-3.5 py-2 text-[13.5px] transition-colors ${category === c ? 'text-night' : 'text-frost hover:text-snow'}`}
              >
                {category === c ? (
                  <motion.span layoutId="family" className="absolute inset-0 rounded-full bg-snow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                ) : null}
                <span className="relative">
                  {c}
                  <span className={`mono ml-1.5 text-[10.5px] ${category === c ? 'text-night/60' : 'text-fog'}`}>{counts[c]}</span>
                </span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <label className="flex items-center gap-2.5 rounded-full border border-line bg-deep px-4 py-2 text-mist focus-within:border-pip-bright/40 md:w-64">
          <SearchMark size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the colony"
            className="w-full bg-transparent text-[14px] text-snow outline-none placeholder:text-fog"
          />
        </label>
      </div>

      <motion.div layout className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((item, i) => (
            <Card key={item.id} item={item} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>
      {shown.length === 0 ? (
        <p className="mt-16 text-center text-[16px] text-mist">Nothing on this floe matches &ldquo;{query}&rdquo;.</p>
      ) : null}
    </main>
  );
}
