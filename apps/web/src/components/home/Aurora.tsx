'use client';

import { motion, useReducedMotion } from 'motion/react';

const RIBBONS = [
  { d: 'M-100 260 C 260 120 520 330 820 210 C 1100 100 1340 260 1700 150', width: 110, opacity: 0.6, grad: 'au1', dur: 16, delay: 0 },
  { d: 'M-100 360 C 300 250 600 420 900 300 C 1200 190 1400 330 1700 260', width: 70, opacity: 0.42, grad: 'au2', dur: 21, delay: 0.5 },
  { d: 'M-100 160 C 240 60 560 210 860 110 C 1160 20 1400 140 1700 70', width: 90, opacity: 0.32, grad: 'au1', dur: 26, delay: 1 },
];

/**
 * The northern lights, as three soft ribbons that draw themselves across the sky once, then
 * drift and breathe on long, unrelated loops. Each ribbon is blurred once inside its own
 * layer and only that layer moves, so the browser composites rather than repaints.
 */
export function Aurora({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={className} aria-hidden>
      {RIBBONS.map((r, i) => (
        <motion.div
          key={i}
          // Wider than the sky, so drifting sideways never exposes an edge.
          className="absolute inset-y-0 -left-[12%] -right-[12%] will-change-transform"
          initial={{ opacity: 0 }}
          animate={
            reduced
              ? { opacity: r.opacity }
              : { opacity: [0, r.opacity, r.opacity * 0.55, r.opacity], x: [0, 50, -40, 0], y: [0, -18, 12, 0], scaleY: [1, 1.15, 0.92, 1] }
          }
          transition={{ duration: r.dur, repeat: reduced ? 0 : Infinity, ease: 'easeInOut', delay: r.delay }}
        >
          <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
            <defs>
              <linearGradient id={`au1-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#3DDAB4" stopOpacity="0" />
                <stop offset="0.3" stopColor="#3DDAB4" stopOpacity="0.9" />
                <stop offset="0.65" stopColor="#5B8DFF" stopOpacity="0.8" />
                <stop offset="1" stopColor="#5B8DFF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`au2-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#5B8DFF" stopOpacity="0" />
                <stop offset="0.4" stopColor="#5B8DFF" stopOpacity="0.85" />
                <stop offset="0.8" stopColor="#3DDAB4" stopOpacity="0.6" />
                <stop offset="1" stopColor="#3DDAB4" stopOpacity="0" />
              </linearGradient>
              <filter id={`auBlur-${i}`} x="-40%" y="-300%" width="180%" height="700%" filterUnits="objectBoundingBox">
                <feGaussianBlur stdDeviation="38" />
              </filter>
            </defs>
            <motion.path
              d={r.d}
              fill="none"
              stroke={`url(#${r.grad}-${i})`}
              strokeLinecap="round"
              strokeWidth={r.width}
              filter={`url(#auBlur-${i})`}
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 + r.delay }}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/** The ice shelf on the horizon: two ranges of peaks and a lip of snow. */
export function Horizon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1600 220" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="hz1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14213d" />
          <stop offset="1" stopColor="#0a1222" />
        </linearGradient>
        <linearGradient id="hz2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2c4d" />
          <stop offset="1" stopColor="#060b17" />
        </linearGradient>
      </defs>
      <path d="M0 120 L 120 70 L 210 104 L 330 40 L 450 98 L 560 66 L 690 112 L 820 52 L 940 96 L 1060 62 L 1180 108 L 1310 48 L 1440 92 L 1600 60 L 1600 220 L 0 220 Z" fill="url(#hz1)" />
      <path d="M330 40 L 360 66 L 342 64 L 330 78 L 318 62 L 300 66 Z M820 52 L 848 76 L 832 74 L 820 86 L 808 72 L 792 76 Z M1310 48 L 1338 72 L 1322 70 L 1310 82 L 1298 68 L 1282 72 Z" fill="#2a3b62" opacity="0.8" />
      <path d="M0 170 L 160 128 L 300 158 L 460 118 L 620 162 L 780 130 L 960 166 L 1120 124 L 1280 160 L 1440 130 L 1600 156 L 1600 220 L 0 220 Z" fill="url(#hz2)" />
    </svg>
  );
}
