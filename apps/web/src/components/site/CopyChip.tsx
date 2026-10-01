'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { CheckMark, CopyMark } from './Marks';

/** A command with a copy button. The mark turns into a check that draws itself, then turns back. */
export function CopyChip({ text, label, className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* Clipboard can be blocked; the text is still selectable. */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`group flex max-w-full items-center gap-3 rounded-2xl border border-line-strong bg-deep/80 py-2.5 pl-4 pr-2.5 text-left backdrop-blur transition-colors hover:border-pip-bright/40 ${className ?? ''}`}
    >
      <span className="mono shrink-0 text-xs text-aurora">$</span>
      <span className="mono min-w-0 truncate text-[12.5px] text-frost">{label ?? text}</span>
      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-shelf text-mist transition-colors group-hover:text-snow">
        <AnimatePresence mode="popLayout" initial={false}>
          {done ? (
            <motion.span key="ok" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} className="text-aurora">
              <CheckMark size={16} strokeWidth={2.2} />
            </motion.span>
          ) : (
            <motion.span key="copy" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
              <CopyMark size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
