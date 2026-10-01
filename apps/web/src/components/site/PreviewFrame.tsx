'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';

import crops from '@/lib/crops.json';
import { previewUrl, thumbUrl } from '@/lib/site';

/** The screen the live previews run on and their stills were taken at. */
const SCREEN = { width: 290, height: 628 };

type Props = {
  id: string;
  title: string;
  /** Run the real component in place of the still. */
  live: boolean;
  /** Show a small "waking up" note while the live component loads. */
  hint?: boolean;
};

/**
 * A still of one component that can come to life in place. The still is cropped to what the
 * component draws and fitted to the frame; the live component runs on the same screen the
 * still was taken on, scaled and shifted by that same crop. So when it takes over nothing
 * moves or changes size: the picture simply starts responding to the pointer.
 */
export function PreviewFrame({ id, title, live, hint }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);
  // Back to the still whenever the live component is let go.
  if (!live && ready) setReady(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [cx, cy, cw, ch] = (crops as Record<string, number[]>)[id] ?? [0, 0, SCREEN.width, SCREEN.height];
  // Exactly where object-contain puts the still: scaled to fit and centred.
  const scale = size ? Math.min(size.w / cw, size.h / ch) : 1;
  const left = size ? (size.w - cw * scale) / 2 - cx * scale : 0;
  const top = size ? (size.h - ch * scale) / 2 - cy * scale : 0;

  return (
    <div ref={box} className="absolute inset-0">
      <img
        src={thumbUrl(id, 'card')}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
        style={{ opacity: ready ? 0 : 1 }}
      />
      {live && size ? (
        <iframe
          src={previewUrl(id)}
          title={title}
          onLoad={() => setTimeout(() => setReady(true), 200)}
          className="absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-500"
          style={{
            width: SCREEN.width,
            height: SCREEN.height,
            transform: `translate(${left}px, ${top}px) scale(${scale})`,
            opacity: ready ? 1 : 0,
          }}
        />
      ) : null}
      <AnimatePresence>
        {hint && live && !ready ? (
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
  );
}
