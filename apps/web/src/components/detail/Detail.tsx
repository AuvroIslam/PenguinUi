'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';

import type { Entry } from '@/lib/catalog';

import { GITHUB } from '@/lib/site';

import { CodeCard } from '../site/CodeCard';
import { CopyChip } from '../site/CopyChip';
import { LivePhone } from '../site/LivePhone';
import { ArrowLeft, ArrowRight, MoonMark, ReplayMark, SunMark } from '../site/Marks';

export type FileBlock = { path: string; core: boolean; html: string; lines: number };

type Props = {
  entry: Entry;
  usageHtml: string;
  files: FileBlock[];
  packages: string[];
  prev: { id: string; name: string };
  next: { id: string; name: string };
};

const spring = { type: 'spring' as const, stiffness: 110, damping: 20 };

/**
 * One component. The phone on the left runs it for real and can be replayed or switched to
 * light mode; the right side says what it does, how it moves, and hands over every file it
 * needs, in order, ready to copy.
 */
export function Detail({ entry: e, usageHtml, files, packages, prev, next }: Props) {
  const [replay, setReplay] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tab, setTab] = useState<'usage' | 'source'>('usage');
  const [open, setOpen] = useState(files.find((f) => !f.core)?.path ?? '');
  const own = files.filter((f) => !f.core);
  const core = files.filter((f) => f.core);
  const current = own.find((f) => f.path === open) ?? own[0];
  const installLine = packages.length ? `npx expo install ${packages.join(' ')}` : '';

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-32">
      <Link href="/components/" className="inline-flex items-center gap-2 text-[14px] text-mist transition-colors hover:text-snow">
        <ArrowLeft size={15} />
        All components
      </Link>

      <div className="mt-8 grid gap-14 lg:grid-cols-[360px_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex justify-center">
            <LivePhone id={e.id} width={330} theme={theme} replay={replay} eager />
          </motion.div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setReplay((r) => r + 1)}
              className="flex items-center gap-2 rounded-full border border-line bg-deep px-4 py-2 text-[13px] text-frost transition-colors hover:text-snow"
            >
              <ReplayMark size={15} />
              Replay
            </button>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="flex items-center gap-2 rounded-full border border-line bg-deep px-4 py-2 text-[13px] text-frost transition-colors hover:text-snow"
            >
              {theme === 'dark' ? <SunMark size={15} /> : <MoonMark size={15} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
          <p className="mono mt-3 text-center text-[10.5px] text-fog">Live. Drag, tap and hold it like a phone.</p>
        </div>

        <div className="min-w-0">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mono text-[11.5px] uppercase tracking-[0.18em] text-aurora">
            {e.category}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={spring}
            className="display mt-3 text-[clamp(3rem,6vw,5.2rem)]"
          >
            {e.name}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.06 }} className="mt-4 text-[20px] text-frost">
            {e.summary}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.12 }}
            className="mt-10 grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2"
          >
            <div className="bg-night p-6">
              <p className="mono text-[11px] uppercase tracking-[0.16em] text-mist">Motion</p>
              <p className="mt-3 text-[15.5px] leading-relaxed text-frost">{e.motion}</p>
            </div>
            <div className="bg-night p-6">
              <p className="mono text-[11px] uppercase tracking-[0.16em] text-mist">Touch</p>
              <p className="mt-3 text-[15.5px] leading-relaxed text-frost">{e.touch ?? 'No gesture of its own; it follows the props you give it.'}</p>
            </div>
          </motion.div>

          {installLine ? (
            <div className="mt-10">
              <p className="mono mb-3 text-[11px] uppercase tracking-[0.16em] text-mist">Install</p>
              <CopyChip text={installLine} />
            </div>
          ) : null}

          <div className="mt-12">
            <div className="flex items-center gap-1 rounded-full border border-line bg-deep p-1" style={{ width: 'fit-content' }}>
              {(['usage', 'source'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`relative rounded-full px-4 py-1.5 text-[13.5px] transition-colors ${tab === t ? 'text-night' : 'text-frost hover:text-snow'}`}
                >
                  {tab === t ? <motion.span layoutId="code-tab" className="absolute inset-0 rounded-full bg-snow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} /> : null}
                  <span className="relative">{t === 'usage' ? 'Usage' : `Source · ${own.length} ${own.length === 1 ? 'file' : 'files'}`}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'usage' ? (
                <motion.div key="usage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-5">
                  <CodeCard title="Example.tsx" html={usageHtml} maxHeight={560} />
                  <p className="mt-3 text-[13.5px] text-mist">
                    This is the demo running in the phone. <code className="mono text-[12px] text-frost">Col</code> and{' '}
                    <code className="mono text-[12px] text-frost">Row</code> are two small flex helpers, and the scenes come from
                    the crew package; swap in your own views.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="source" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-5">
                  <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="space-y-5">
                      <FileList title="This component" files={own} open={open} onOpen={setOpen} />
                      {core.length ? (
                        <div>
                          <p className="mono mb-2 px-2 text-[10.5px] uppercase tracking-[0.16em] text-fog">Core, copy once</p>
                          <ul className="space-y-0.5">
                            {core.map((f) => (
                              <li key={f.path}>
                                <a
                                  href={`${GITHUB}/blob/main/packages/ui/src/${f.path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mono flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-[11.5px] text-mist transition-colors hover:bg-white/[0.03] hover:text-frost"
                                >
                                  <span className="truncate">{f.path}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                          <Link href="/docs/" className="mt-2 block px-2.5 text-[12px] text-pip-bright hover:underline">
                            How the core works
                          </Link>
                        </div>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      {current ? <CodeCard key={current.path} title={`src/${current.path}`} html={current.html} maxHeight={640} /> : null}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-3">
            <Link href={`/components/${prev.id}/`} className="group rounded-[20px] border border-line p-5 transition-colors hover:border-line-strong">
              <span className="flex items-center gap-2 text-[12px] text-mist">
                <ArrowLeft size={14} /> Previous
              </span>
              <span className="display-wide mt-2 block text-[20px]">{prev.name}</span>
            </Link>
            <Link href={`/components/${next.id}/`} className="group rounded-[20px] border border-line p-5 text-right transition-colors hover:border-line-strong">
              <span className="flex items-center justify-end gap-2 text-[12px] text-mist">
                Next <ArrowRight size={14} />
              </span>
              <span className="display-wide mt-2 block text-[20px]">{next.name}</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function FileList({ title, files, open, onOpen }: { title: string; files: FileBlock[]; open: string; onOpen: (p: string) => void }) {
  return (
    <div>
      <p className="mono mb-2 px-2 text-[10.5px] uppercase tracking-[0.16em] text-fog">{title}</p>
      <ul className="space-y-0.5">
        {files.map((f) => (
          <li key={f.path}>
            <button
              type="button"
              onClick={() => onOpen(f.path)}
              className={`mono flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-[11.5px] transition-colors ${open === f.path ? 'bg-shelf text-snow' : 'text-mist hover:bg-white/[0.03] hover:text-frost'}`}
            >
              <span className="truncate">{f.path.split('/').pop()}</span>
              <span className="shrink-0 text-[10px] text-fog">{f.lines}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
