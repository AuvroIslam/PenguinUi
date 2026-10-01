'use client';

import { useEffect, useRef } from 'react';

type Flake = { x: number; y: number; r: number; vy: number; drift: number; phase: number; px: number; py: number };

/**
 * Snow over the polar night, drawn on one canvas. Flakes fall at their own speeds, sway, and
 * part around the pointer as if it were a warm hand, then settle back into their paths. The
 * canvas pauses when it is off screen and stays still under reduced motion.
 */
export function Snowfall({ density = 0.00012, className }: { density?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    let raf = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999 };
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const seed = () => {
      const rect = el.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(w * h * density);
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() ** 2 * 2.2,
        vy: 0.15 + Math.random() * 0.45,
        drift: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        px: 0,
        py: 0,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        if (!reduced) {
          f.y += f.vy * (0.6 + f.r * 0.35);
          f.x += Math.sin(t / 2400 + f.phase) * 0.18 * f.drift;
          if (f.y > h + 4) {
            f.y = -4;
            f.x = Math.random() * w;
          }
          // The pointer pushes nearby flakes away, and the push decays back to nothing.
          const dx = f.x + f.px - pointer.x;
          const dy = f.y + f.py - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) {
            const d = Math.sqrt(d2) || 1;
            const k = (1 - d / 120) * 2.4;
            f.px += (dx / d) * k;
            f.py += (dy / d) * k;
          }
          f.px *= 0.94;
          f.py *= 0.94;
        }
        const a = 0.25 + f.r * 0.22;
        ctx.beginPath();
        ctx.fillStyle = `rgba(214, 228, 255, ${Math.min(0.85, a)})`;
        ctx.arc(f.x + f.px, f.y + f.py, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (visible && !reduced) raf = requestAnimationFrame(draw);
    };

    seed();
    draw(0);
    const ro = new ResizeObserver(() => seed());
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(draw);
    });
    io.observe(el);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [density]);

  return <canvas ref={canvas} className={className} aria-hidden />;
}
