'use client';

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

export type PipMood = 'idle' | 'happy' | 'surprised';

type Props = {
  size?: number;
  mood?: PipMood;
  waving?: boolean;
  /** Look toward the pointer anywhere on the page. */
  followPointer?: boolean;
  /** Hop and squeal when clicked. */
  playful?: boolean;
  className?: string;
};

const W = 200;
const H = 220;

/**
 * A pivot in Pip's own drawing units. Motion measures SVG origins from each shape's bounding
 * box by default, which would put a flipper's hinge far off the flipper and swing it away.
 */
const pivot = (x: number, y: number) => ({ originX: `${x}px`, originY: `${y}px`, transformBox: 'view-box' as const });

/**
 * Pip, drawn for the web from the same geometry as the React Native mascot. He blinks on his
 * own, breathes, can wave, tracks the pointer with his eyes and a slight lean, and hops when
 * clicked. All of it rides motion values, so nothing here re-renders on pointer movement.
 */
export function Pip({ size = 240, mood = 'idle', waving = false, followPointer = false, playful = false, className }: Props) {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const root = useRef<SVGSVGElement>(null);
  const [face, setFace] = useState<PipMood>(mood);
  useEffect(() => setFace(mood), [mood]);

  // Pointer, from -1 to 1, smoothed so the eyes glide rather than snap.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const lx = useSpring(px, { stiffness: 140, damping: 18, mass: 0.6 });
  const ly = useSpring(py, { stiffness: 140, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (!followPointer || reduced) return;
    const onMove = (e: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.45;
      px.set(Math.max(-1, Math.min(1, (e.clientX - cx) / 420)));
      py.set(Math.max(-1, Math.min(1, (e.clientY - cy) / 320)));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [followPointer, reduced, px, py]);

  const eyeX = useTransform(lx, (v) => v * 4.5);
  const eyeY = useTransform(ly, (v) => v * 3.5);
  const lean = useTransform(lx, (v) => v * 3);

  // Blink at a relaxed, slightly irregular pace.
  const lid = useMotionValue(1);
  useEffect(() => {
    if (reduced) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const blink = async () => {
      if (!alive) return;
      await animate(lid, [1, 0.08, 1], { duration: 0.2, times: [0, 0.35, 1], ease: 'easeInOut' });
      if (Math.random() < 0.2) await animate(lid, [1, 0.08, 1], { duration: 0.2, times: [0, 0.35, 1] });
      t = setTimeout(blink, 2200 + Math.random() * 3200);
    };
    t = setTimeout(blink, 900 + Math.random() * 1400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduced, lid]);
  const eyeRy = useTransform(lid, (v) => 11 * v);
  const glint = useTransform(lid, (v) => Math.max(0, (v - 0.5) * 2));

  // Hop.
  const hop = useMotionValue(0);
  const squash = useMotionValue(1);
  const doHop = async () => {
    if (!playful || reduced) return;
    setFace('happy');
    await animate(squash, 0.86, { duration: 0.09 });
    animate(squash, 1.06, { type: 'spring', stiffness: 500, damping: 12 });
    await animate(hop, -46, { type: 'spring', stiffness: 380, damping: 16 });
    animate(squash, 1, { type: 'spring', stiffness: 400, damping: 14 });
    await animate(hop, 0, { type: 'spring', stiffness: 320, damping: 14 });
    setTimeout(() => setFace(mood), 900);
  };

  const happy = face === 'happy';
  const surprised = face === 'surprised';

  return (
    <motion.svg
      ref={root}
      viewBox={`0 0 ${W} ${H}`}
      width={size}
      height={(size * H) / W}
      className={className}
      onClick={doHop}
      style={{ cursor: playful ? 'pointer' : undefined, overflow: 'visible' }}
      role="img"
      aria-label="Pip the penguin"
    >
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A84FF" />
          <stop offset="1" stopColor="#2551D9" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E4EEFF" />
        </linearGradient>
      </defs>
      <motion.ellipse cx={100} cy={210} rx={58} ry={7} fill="#0c1730" style={{ scaleX: useTransform(hop, [-46, 0], [0.6, 1]), ...pivot(100, 210) }} />
      <motion.g style={{ y: hop, scaleY: squash, ...pivot(100, 205) }}>
        <ellipse cx={78} cy={203} rx={17} ry={8} fill="#FF9A3C" />
        <ellipse cx={122} cy={203} rx={17} ry={8} fill="#FF9A3C" />
        <Breathing reduced={!!reduced}>
          <motion.g style={{ rotate: lean, ...pivot(100, 200) }}>
            <motion.path
              d="M32 116 C 14 126 8 152 14 166 C 22 160 36 146 42 130 Z"
              fill="#2551D9"
              animate={{ rotate: surprised ? 18 : 0 }}
              style={pivot(38, 122)}
            />
            <motion.path
              d="M168 116 C 186 126 192 152 186 166 C 178 160 164 146 158 130 Z"
              fill="#2551D9"
              style={pivot(162, 122)}
              // A proper hello: the flipper swings up beside his head, waggles three times, and drops.
              animate={waving && !reduced ? { rotate: [0, -112, -78, -112, -78, -112, 0] } : { rotate: surprised ? -18 : 0 }}
              transition={
                waving
                  ? { duration: 1.9, times: [0, 0.2, 0.36, 0.52, 0.68, 0.84, 1], repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }
                  : { type: 'spring', stiffness: 200, damping: 12 }
              }
            />
            <path d="M100 26 C 150 26 176 72 176 128 C 176 180 144 204 100 204 C 56 204 24 180 24 128 C 24 72 50 26 100 26 Z" fill={`url(#${id}b)`} />
            <path d="M96 30 C 92 14 106 6 113 15 C 106 13 102 19 106 28 Z" fill="#2551D9" />
            <path
              d="M100 72 C 110 56 142 54 150 80 C 157 102 154 122 152 140 C 148 178 126 196 100 196 C 74 196 52 178 48 140 C 46 122 43 102 50 80 C 58 54 90 56 100 72 Z"
              fill={`url(#${id}w)`}
            />
            <ellipse cx={64} cy={124} rx={10} ry={6} fill="#FFB4C6" opacity={0.85} />
            <ellipse cx={136} cy={124} rx={10} ry={6} fill="#FFB4C6" opacity={0.85} />
            <motion.path
              d="M89 117 C 95 112 105 112 111 117 C 108 126 104 130 100 130 C 96 130 92 126 89 117 Z"
              fill="#FF9A3C"
              animate={{ scaleY: surprised ? 1.35 : 1 }}
              style={pivot(100, 116)}
            />
            <path d="M91 119 C 96 121 104 121 109 119" stroke="#E07A22" strokeWidth={1.6} fill="none" strokeLinecap="round" />
            {happy ? (
              <g>
                <path d="M69 106 C 72 97 84 97 87 106" stroke="#0B1730" strokeWidth={4.5} fill="none" strokeLinecap="round" />
                <path d="M113 106 C 116 97 128 97 131 106" stroke="#0B1730" strokeWidth={4.5} fill="none" strokeLinecap="round" />
              </g>
            ) : (
              <motion.g style={{ x: eyeX, y: eyeY }}>
                <Eye cx={78} ry={eyeRy} glint={glint} wide={surprised} />
                <Eye cx={122} ry={eyeRy} glint={glint} wide={surprised} />
              </motion.g>
            )}
          </motion.g>
        </Breathing>
      </motion.g>
    </motion.svg>
  );
}

function Eye({ cx, ry, glint, wide }: { cx: number; ry: MotionValue<number>; glint: MotionValue<number>; wide: boolean }) {
  const scale = wide ? 1.15 : 1;
  return (
    <g transform={`translate(${cx} 104) scale(${scale}) translate(${-cx} -104)`}>
      <motion.ellipse cx={cx} cy={104} rx={9} style={{ ry }} fill="#0B1730" />
      <motion.circle cx={cx - 3} cy={99} r={3.6} fill="#fff" style={{ opacity: glint }} />
      <motion.circle cx={cx + 3} cy={109} r={1.6} fill="#fff" style={{ opacity: glint }} />
    </g>
  );
}

function Breathing({ children, reduced }: { children: React.ReactNode; reduced: boolean }) {
  return (
    <motion.g
      animate={reduced ? undefined : { y: [0, -2.4, 0], scaleY: [1, 1.018, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      style={pivot(100, 205)}
    >
      {children}
    </motion.g>
  );
}

/** Pip's head on its own, for the logo mark. */
export function PipMark({ size = 28 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="22 20 156 136" width={size} height={(size * 136) / 156} aria-hidden>
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B8DFF" />
          <stop offset="1" stopColor="#2551D9" />
        </linearGradient>
      </defs>
      <path d="M100 26 C 150 26 176 72 176 128 C 176 150 168 156 100 156 C 32 156 24 150 24 128 C 24 72 50 26 100 26 Z" fill={`url(#${id}m)`} />
      <path d="M100 72 C 110 56 142 54 150 80 C 157 102 154 122 152 140 C 151 150 140 156 100 156 C 60 156 49 150 48 140 C 46 122 43 102 50 80 C 58 54 90 56 100 72 Z" fill="#fff" />
      <ellipse cx={78} cy={104} rx={9} ry={11} fill="#0B1730" />
      <ellipse cx={122} cy={104} rx={9} ry={11} fill="#0B1730" />
      <circle cx={75} cy={99} r={3.6} fill="#fff" />
      <circle cx={119} cy={99} r={3.6} fill="#fff" />
      <path d="M89 117 C 95 112 105 112 111 117 C 108 126 104 130 100 130 C 96 130 92 126 89 117 Z" fill="#FF9A3C" />
    </svg>
  );
}
