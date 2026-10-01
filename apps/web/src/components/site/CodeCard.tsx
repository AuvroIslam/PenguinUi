'use client';

import { useRef, useState } from 'react';

import { CheckMark, CopyMark } from './Marks';

/**
 * Highlighted code in a window. The HTML is produced at build time by Shiki, so the page
 * ships no highlighter; copying takes the plain text back out of the rendered block.
 */
export function CodeCard({
  title,
  html,
  maxHeight,
  className,
}: {
  title: string;
  html: string;
  maxHeight?: number;
  className?: string;
}) {
  const body = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const copy = async () => {
    const text = body.current?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* The text stays selectable when the clipboard is blocked. */
    }
  };

  return (
    <div className={`overflow-hidden rounded-[22px] border border-line bg-[#070d1b] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(214,228,255,0.05)] ${className ?? ''}`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rime" />
            <span className="h-2.5 w-2.5 rounded-full bg-rime" />
            <span className="h-2.5 w-2.5 rounded-full bg-rime" />
          </span>
          <span className="mono text-[11.5px] text-mist">{title}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="mono flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-mist transition-colors hover:bg-white/5 hover:text-snow"
        >
          {done ? <CheckMark size={14} strokeWidth={2.2} /> : <CopyMark size={14} />}
          {done ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div
        ref={body}
        data-lenis-prevent
        className="code overflow-auto"
        style={{ maxHeight }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
