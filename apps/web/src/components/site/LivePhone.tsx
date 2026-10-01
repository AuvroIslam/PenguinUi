'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { previewUrl, thumbUrl } from '@/lib/site';

type Props = {
  /** Component id. Changing it cross-fades to the new component once it has loaded. */
  id: string;
  /** Width of the phone, in pixels. The screen keeps a 9 by 19.5 ratio. */
  width?: number;
  theme?: 'dark' | 'light';
  /** Load straight away instead of waiting to scroll into view. */
  eager?: boolean;
  /** Changes force a reload of the current component. */
  replay?: number;
  className?: string;
};

/**
 * A phone running a component for real: the React Native code, built for the web and framed
 * in an iframe. A still frame shows until the live one has loaded, and switching components
 * keeps the old one on screen until the new one is ready, so the phone never flashes empty.
 */
export function LivePhone({ id, width = 320, theme = 'dark', eager = false, replay = 0, className }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { margin: '200px', once: true });
  const live = eager || inView;
  const [shown, setShown] = useState(id);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (id !== shown) setLoading(id);
  }, [id, shown]);

  const bezel = Math.round(width * 0.035);
  const radius = Math.round(width * 0.155);
  const screenW = width - bezel * 2;
  const screenH = Math.round(screenW * (19.5 / 9));

  const frame = (cid: string, key: string, onLoad?: () => void, hidden?: boolean) => (
    <iframe
      key={key}
      src={previewUrl(cid, theme)}
      title={`${cid} preview`}
      loading="lazy"
      onLoad={onLoad}
      className="absolute inset-0 h-full w-full border-0"
      style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto', colorScheme: 'normal' }}
    />
  );

  return (
    <div
      ref={box}
      className={`relative shrink-0 ${className ?? ''}`}
      style={{
        width,
        height: screenH + bezel * 2,
        borderRadius: radius,
        padding: bezel,
        background: 'linear-gradient(160deg, #24324f 0%, #0b1324 45%, #1a2540 100%)',
        boxShadow:
          '0 0 0 1px rgba(214,228,255,0.12), 0 1px 0 0 rgba(255,255,255,0.18) inset, 0 40px 80px -20px rgba(0,0,0,0.75), 0 0 120px -30px rgba(61,218,180,0.25)',
      }}
    >
      <div className="relative h-full w-full overflow-hidden bg-[#070C18]" style={{ borderRadius: radius - bezel }}>
        {/* The still frame, until the live preview has painted. */}
        <img src={thumbUrl(shown)} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        {live ? frame(shown, `${shown}-${replay}`) : null}
        {live && loading ? frame(loading, `${loading}-next`, () => {
          setShown(loading);
          setLoading(null);
        }, true) : null}
        <AnimatePresence>
          {loading ? (
            <motion.div
              key="veil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 backdrop-blur-md"
              style={{ background: 'rgba(7,12,24,0.35)' }}
            />
          ) : null}
        </AnimatePresence>
        {/* Status bar and island, so the frame reads as a phone at a glance. */}
        <div className="pointer-events-none absolute left-1/2 top-[10px] h-[22px] w-[30%] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}
