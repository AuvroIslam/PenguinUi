'use client';

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { useRef, useState } from 'react';

import { Pip, type PipMood } from '../brand/Pip';

const STEPS: { title: string; body: string; tag: string; mood: PipMood }[] = [
  {
    title: 'Springs, not timers.',
    body: 'Nothing eases along a fixed curve. Every move is a spring with mass and damping, so it can be interrupted halfway and carry on from where it is.',
    tag: 'damping ratio 0.56',
    mood: 'happy',
  },
  {
    title: 'Tied to the finger.',
    body: 'Sheets, decks, sliders and dials follow a thumb frame by frame on the UI thread, then fly off with the speed they were thrown at.',
    tag: 'gesture to spring handoff',
    mood: 'idle',
  },
  {
    title: 'Felt, not only seen.',
    body: 'Detents tick, thresholds thud and results buzz. Haptics are planned per component, and turn off in one line.',
    tag: 'expo-haptics, optional',
    mood: 'surprised',
  },
  {
    title: 'Kind to everyone.',
    body: 'Every component reads the reduced motion setting, keeps touch targets at 44 points, and labels itself for screen readers.',
    tag: 'reduced motion aware',
    mood: 'happy',
  },
];

function SpringCurve() {
  const reduced = useReducedMotion();
  // A damped oscillation, drawn as a path, with a puck riding it.
  const pts = Array.from({ length: 120 }, (_, i) => {
    const t = i / 119;
    const y = 1 - Math.exp(-5.2 * t) * Math.cos(13 * t);
    return [40 + t * 440, 250 - y * 170] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 520 300" className="w-full">
      <line x1={40} y1={80} x2={480} y2={80} stroke="rgba(214,228,255,0.12)" strokeDasharray="0" />
      <line x1={40} y1={250} x2={480} y2={250} stroke="rgba(214,228,255,0.12)" />
      <text x={484} y={84} fill="#4f5d7c" fontSize={11} className="mono">rest</text>
      <motion.path d={d} fill="none" stroke="#5B8DFF" strokeWidth={3} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} />
      {!reduced ? (
        <motion.circle
          r={9}
          cx={pts[0][0]}
          cy={pts[0][1]}
          initial={{ cx: pts[0][0], cy: pts[0][1] }}
          fill="#3DDAB4"
          animate={{ cx: pts.map((p) => p[0]), cy: pts.map((p) => p[1]) }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6, ease: 'linear' }}
        />
      ) : null}
    </svg>
  );
}

function FingerTrail() {
  const path = 'M90 220 C 160 120, 260 260, 330 150 S 430 90, 460 170';
  return (
    <svg viewBox="0 0 520 300" className="w-full">
      <motion.path d={path} fill="none" stroke="rgba(91,141,255,0.35)" strokeWidth={22} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1] }} transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.75, 1] }} />
      <motion.g
        animate={{ offsetDistance: ['0%', '100%', '100%'] }}
        transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.75, 1] }}
        style={{ offsetPath: `path("${path}")`, offsetRotate: '0deg' } as React.CSSProperties}
      >
        <rect x={-46} y={-30} width={92} height={60} rx={16} fill="#16233f" stroke="rgba(214,228,255,0.2)" />
        <rect x={-30} y={-12} width={40} height={6} rx={3} fill="#9CC2FF" />
        <rect x={-30} y={2} width={60} height={6} rx={3} fill="#22314f" />
        <circle cx={34} cy={22} r={14} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" />
      </motion.g>
    </svg>
  );
}

function Haptics() {
  return (
    <svg viewBox="0 0 520 300" className="w-full">
      <rect x={200} y={30} width={120} height={240} rx={28} fill="#0f1a31" stroke="rgba(214,228,255,0.18)" />
      <rect x={236} y={42} width={48} height={10} rx={5} fill="#000" />
      {[0, 1, 2].map((i) => (
        <motion.rect
          key={i}
          x={200}
          y={30}
          width={120}
          height={240}
          rx={28}
          fill="none"
          stroke="#3DDAB4"
          strokeWidth={2}
          style={{ originX: '260px', originY: '150px' }}
          animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
        />
      ))}
      <motion.circle cx={260} cy={190} r={22} fill="#2F6BF0" animate={{ scale: [1, 0.86, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }} style={{ originX: '260px', originY: '190px' }} />
    </svg>
  );
}

function Accessible() {
  const [reduce, setReduce] = useState(false);
  return (
    <div className="w-full">
      <svg viewBox="0 0 520 220" className="w-full">
        <motion.path
          d="M40 170 C 120 -20, 180 110, 260 50 S 380 80, 480 60"
          fill="none"
          stroke="#9CC2FF"
          strokeWidth={3}
          strokeLinecap="round"
          animate={{ d: reduce ? 'M40 170 L 160 60 L 480 60' : 'M40 170 C 120 -20, 180 110, 260 50 S 380 80, 480 60' }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        />
        <line x1={40} y1={60} x2={480} y2={60} stroke="rgba(214,228,255,0.12)" />
      </svg>
      <button
        type="button"
        onClick={() => setReduce((r) => !r)}
        className="mx-auto mt-2 flex items-center gap-3 rounded-full border border-line-strong bg-deep px-4 py-2 text-[14px] text-frost"
        aria-pressed={reduce}
      >
        <span className={`relative h-6 w-11 rounded-full transition-colors ${reduce ? 'bg-aurora' : 'bg-rime'}`}>
          <motion.span className="absolute top-1 h-4 w-4 rounded-full bg-white" animate={{ left: reduce ? 24 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
        </span>
        Reduce motion
      </button>
    </div>
  );
}

const VISUALS = [SpringCurve, FingerTrail, Haptics, Accessible];

/**
 * Four ideas behind the library, one screen each. The section pins while it scrolls; the
 * copy on the left steps through the ideas, the stage on the right shows each one moving,
 * and Pip reacts to each in turn.
 */
export function Principles() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length))));
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const Visual = VISUALS[step];
  const s = STEPS[step];

  return (
    <section ref={ref} className="relative" style={{ height: `${STEPS.length * 85 + 40}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_75%_50%,rgba(47,107,240,0.14),transparent_70%)]" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <div className="mono flex items-center gap-4 text-[12px] text-mist">
              <span className="text-snow">{String(step + 1).padStart(2, '0')}</span>
              <span className="relative h-px w-40 bg-line-strong">
                <motion.span className="absolute inset-y-0 left-0 bg-aurora" style={{ width: bar }} />
              </span>
              <span>{String(STEPS.length).padStart(2, '0')}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -24, filter: 'blur(6px)' }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
              >
                <h2 className="display mt-8 text-[clamp(2.8rem,6vw,5.2rem)]">{s.title}</h2>
                <p className="mt-6 max-w-md text-[18px] leading-relaxed text-frost">{s.body}</p>
                <p className="mono mt-8 inline-block rounded-full border border-line px-3 py-1.5 text-[11px] text-aurora">{s.tag}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="relative">
            <div className="relative aspect-[5/4] rounded-[36px] border border-line bg-gradient-to-b from-deep to-night p-8 shadow-[inset_0_1px_0_rgba(214,228,255,0.06)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="flex h-full items-center justify-center"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                >
                  <Visual />
                </motion.div>
              </AnimatePresence>
              <div className="absolute -bottom-6 -left-6">
                <Pip size={96} mood={s.mood} followPointer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
