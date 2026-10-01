'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

/**
 * Pip's friends, drawn for the web from the same geometry as the React Native versions. Each
 * blinks on its own clock and leans in when pointed at, so a row of them feels inhabited.
 */

type Props = { size?: number; className?: string; delay?: number };

function Blink({ children, cx, cy, delay = 0 }: { children: React.ReactNode; cx: number; cy: number; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.g
      style={{ originX: `${cx}px`, originY: `${cy}px` }}
      animate={reduced ? undefined : { scaleY: [1, 1, 0.08, 1, 1] }}
      transition={{ duration: 4.2 + delay, times: [0, 0.9, 0.93, 0.97, 1], repeat: Infinity, delay }}
    >
      {children}
    </motion.g>
  );
}

function Shell({ vb, size, className, children }: { vb: [number, number]; size: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.svg
      viewBox={`0 0 ${vb[0]} ${vb[1]}`}
      width={size}
      height={(size * vb[1]) / vb[0]}
      className={className}
      whileHover={{ y: -6, rotate: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 14 }}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      {children}
    </motion.svg>
  );
}

export function Mochi({ size = 220, className, delay = 0.6 }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <Shell vb={[220, 180]} size={size} className={className}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9E5F6" />
          <stop offset="1" stopColor="#B9CDEB" />
        </linearGradient>
      </defs>
      <ellipse cx={110} cy={168} rx={86} ry={7} fill="#0c1730" />
      <path d="M70 120 C 80 96 130 92 164 108 C 186 118 196 132 192 148 C 189 160 176 164 160 164 L 80 164 C 62 164 58 140 70 120 Z" fill="#B9CDEB" />
      <path d="M184 140 C 198 132 210 136 212 146 C 204 148 198 152 196 160 C 192 152 188 148 184 140 Z" fill="#A9C0E4" />
      <circle cx={86} cy={96} r={56} fill={`url(#${id}b)`} stroke="#AFC5E8" strokeWidth={1.5} />
      <path d="M52 140 C 40 150 42 164 58 164 C 60 156 62 150 66 144 Z" fill="#A9C0E4" />
      <path d="M112 142 C 120 152 118 164 104 164 C 104 156 102 150 100 144 Z" fill="#A9C0E4" />
      <ellipse cx={86} cy={112} rx={20} ry={14} fill="#fff" />
      <path d="M80 104 C 83 101 89 101 92 104 C 91 108 88 110 86 110 C 84 110 81 108 80 104 Z" fill="#16264D" />
      <path d="M86 110 L 86 114 M 79 116 C 83 119 89 119 93 116" stroke="#16264D" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <ellipse cx={54} cy={108} rx={8} ry={5} fill="#FFB4C6" opacity={0.85} />
      <ellipse cx={118} cy={108} rx={8} ry={5} fill="#FFB4C6" opacity={0.85} />
      <Blink cx={86} cy={90} delay={delay}>
        <ellipse cx={66} cy={90} rx={8.5} ry={10} fill="#0B1730" />
        <ellipse cx={106} cy={90} rx={8.5} ry={10} fill="#0B1730" />
        <circle cx={63} cy={85.5} r={3.2} fill="#fff" />
        <circle cx={103} cy={85.5} r={3.2} fill="#fff" />
      </Blink>
    </Shell>
  );
}

export function Frost({ size = 200, className, delay = 1.4 }: Props) {
  const id = useId().replace(/:/g, '');
  const line = '#C3D5EF';
  return (
    <Shell vb={[200, 200]} size={size} className={className}>
      <defs>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#DCE8F8" />
        </linearGradient>
      </defs>
      <ellipse cx={100} cy={190} rx={62} ry={7} fill="#0c1730" />
      <path d="M44 152 C 44 122 68 106 100 106 C 132 106 156 122 156 152 C 156 178 138 188 100 188 C 62 188 44 178 44 152 Z" fill="#E6EEFA" stroke={line} strokeWidth={1.5} />
      <ellipse cx={74} cy={183} rx={19} ry={9} fill="#fff" stroke={line} strokeWidth={1.5} />
      <ellipse cx={126} cy={183} rx={19} ry={9} fill="#fff" stroke={line} strokeWidth={1.5} />
      <circle cx={54} cy={54} r={19} fill="#fff" stroke={line} strokeWidth={1.5} />
      <circle cx={146} cy={54} r={19} fill="#fff" stroke={line} strokeWidth={1.5} />
      <circle cx={54} cy={54} r={9.5} fill="#BCD3F5" />
      <circle cx={146} cy={54} r={9.5} fill="#BCD3F5" />
      <ellipse cx={100} cy={96} rx={60} ry={54} fill={`url(#${id}h)`} stroke={line} strokeWidth={1.5} />
      <ellipse cx={70} cy={110} rx={9} ry={5.5} fill="#FFB4C6" opacity={0.85} />
      <ellipse cx={130} cy={110} rx={9} ry={5.5} fill="#FFB4C6" opacity={0.85} />
      <ellipse cx={100} cy={114} rx={18} ry={13} fill="#fff" stroke="#D3E2F6" strokeWidth={1.2} />
      <path d="M92 107 C 96 104 104 104 108 107 C 106 112 103 114 100 114 C 97 114 94 112 92 107 Z" fill="#16264D" />
      <path d="M100 114 L 100 118 M 94 120 C 97 122.5 103 122.5 106 120" stroke="#16264D" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Blink cx={100} cy={92} delay={delay}>
        <ellipse cx={78} cy={92} rx={7.5} ry={9} fill="#0B1730" />
        <ellipse cx={122} cy={92} rx={7.5} ry={9} fill="#0B1730" />
        <circle cx={75.5} cy={88} r={2.8} fill="#fff" />
        <circle cx={119.5} cy={88} r={2.8} fill="#fff" />
      </Blink>
    </Shell>
  );
}

export function Bubbles({ size = 260, className, delay = 2.2 }: Props) {
  return (
    <Shell vb={[240, 150]} size={size} className={className}>
      <ellipse cx={120} cy={142} rx={90} ry={6} fill="#0c1730" />
      <path d="M192 84 C 208 66 226 66 230 76 C 220 80 212 86 208 96 C 220 98 228 106 226 116 C 214 114 200 106 192 96 Z" fill="#16264D" />
      <path d="M122 46 C 126 26 136 14 148 12 C 142 26 142 38 148 50 Z" fill="#16264D" />
      <path d="M24 94 C 24 60 66 42 116 42 C 162 42 196 62 202 90 C 208 112 188 130 150 132 L 72 132 C 40 132 24 118 24 94 Z" fill="#1E3266" stroke="#2c4682" strokeWidth={1.2} />
      <path d="M30 104 C 40 126 80 132 120 130 C 152 128 172 120 182 110 C 150 114 118 112 90 108 C 66 105 46 104 30 104 Z" fill="#fff" />
      <path d="M74 66 C 88 60 102 64 104 72 C 100 78 88 80 78 76 C 72 74 70 70 74 66 Z" fill="#fff" />
      <ellipse cx={52} cy={98} rx={8} ry={4.5} fill="#FFB4C6" opacity={0.9} />
      <path d="M30 96 C 36 101 44 101 48 97" stroke="#9FB4D6" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M100 122 C 96 136 104 146 120 144 C 114 136 112 128 114 120 Z" fill="#16264D" />
      <Blink cx={66} cy={84} delay={delay}>
        <ellipse cx={66} cy={84} rx={6.5} ry={7.5} fill="#0B1730" stroke="#2A4380" strokeWidth={1} />
        <circle cx={64} cy={81} r={2.4} fill="#fff" />
      </Blink>
    </Shell>
  );
}

export function Nori({ size = 260, className, delay = 3 }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <Shell vb={[240, 160]} size={size} className={className}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9CC2FF" />
          <stop offset="1" stopColor="#6E9BF5" />
        </linearGradient>
      </defs>
      <ellipse cx={120} cy={152} rx={88} ry={6} fill="#0c1730" />
      <path d="M62 66 L 12 30 L 66 58 Z" fill="#FFF4DD" stroke="#EAD8B0" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M24 38 L 27 44 M 35 46 L 38 52 M 46 53 L 49 59" stroke="#E2CB98" strokeWidth={2} strokeLinecap="round" />
      <path d="M196 96 C 212 80 228 80 232 88 C 222 92 214 98 210 108 C 222 110 228 118 226 126 C 214 124 202 116 196 106 Z" fill="#6E9BF5" />
      <path d="M30 104 C 30 70 64 54 112 54 C 156 54 196 72 204 98 C 210 118 190 138 150 142 L 76 142 C 44 142 30 128 30 104 Z" fill={`url(#${id}b)`} />
      <circle cx={140} cy={76} r={4} fill="#fff" opacity={0.4} />
      <circle cx={156} cy={88} r={3} fill="#fff" opacity={0.4} />
      <circle cx={128} cy={90} r={2.5} fill="#fff" opacity={0.4} />
      <path d="M36 116 C 48 134 86 140 122 138 C 152 136 170 130 180 122 C 152 124 122 124 92 120 C 70 118 50 116 36 116 Z" fill="#fff" opacity={0.94} />
      <ellipse cx={60} cy={108} rx={8} ry={4.5} fill="#FFB4C6" opacity={0.9} />
      <path d="M40 108 C 45 112 52 112 56 108" stroke="#3E68C9" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M104 130 C 100 144 108 152 124 150 C 118 142 116 134 118 128 Z" fill="#5A86E8" />
      <Blink cx={72} cy={94} delay={delay}>
        <ellipse cx={72} cy={94} rx={6.5} ry={7.5} fill="#0B1730" />
        <circle cx={70} cy={91} r={2.4} fill="#fff" />
      </Blink>
    </Shell>
  );
}
