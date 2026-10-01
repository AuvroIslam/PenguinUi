'use client';

import { motion, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';

import { ArrowUpRight } from './Marks';
import { PreviewFrame } from './PreviewFrame';

type Props = {
  id: string;
  name: string;
  category: string;
  className?: string;
};

const finePointer = () => window.matchMedia('(pointer: fine)').matches;
const noSubscribe = () => () => {};

/**
 * A window onto one live component. It shows a still frame first and swaps in the real,
 * touchable component when it scrolls into view on a pointer device, or on first tap on a
 * touch screen, so a page of these stays light until someone looks at it.
 */
export function LiveTile({ id, name, category, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '120px' });
  const fine = useSyncExternalStore(noSubscribe, finePointer, () => false);
  const [live, setLive] = useState(false);
  // On a pointer device it comes to life as it scrolls into view, and stays alive after.
  if (fine && inView && !live) setLive(true);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      className={`group relative overflow-hidden rounded-[28px] border border-line bg-[#070C18] shadow-[inset_0_1px_0_rgba(214,228,255,0.06)] ${className ?? ''}`}
      onPointerDown={() => setLive(true)}
    >
      <PreviewFrame id={id} title={`${name}, live`} live={live} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="rounded-2xl bg-night/70 px-3 py-2 backdrop-blur-md">
          <p className="display-wide text-[17px]">{name}</p>
          <p className="mono text-[10.5px] uppercase tracking-[0.16em] text-mist">{category}</p>
        </div>
      </div>
      <Link
        href={`/components/${id}/`}
        aria-label={`Open ${name}`}
        className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-snow text-night opacity-0 shadow-lg transition-all duration-300 ease-[cubic-bezier(.32,.72,0,1)] group-hover:opacity-100 group-hover:rotate-0 focus-visible:opacity-100 sm:rotate-45"
      >
        <ArrowUpRight size={18} strokeWidth={2.2} />
      </Link>
    </motion.div>
  );
}
