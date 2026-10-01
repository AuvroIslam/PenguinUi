import Link from 'next/link';

import { PEERS } from '@/lib/site';

import { CodeCard } from '../site/CodeCard';
import { CopyChip } from '../site/CopyChip';
import { ArrowRight } from '../site/Marks';
import { Reveal } from './Reveal';

const STEPS = [
  { n: '01', title: 'Install the four peers', body: 'Reanimated, Gesture Handler, SVG and Worklets. Expo Go already ships them; haptics are optional.' },
  { n: '02', title: 'Copy the core once', body: 'Theme, motion tokens and a few primitives. About a dozen small files.' },
  { n: '03', title: 'Copy any component', body: 'Each page lists exactly which files it needs. Paste them in and it moves.' },
];

/** How people use it: three steps on the left, real code on the right. */
export function Install({ codeHtml }: { codeHtml: string }) {
  return (
    // grid-cols-1 and min-w-0 keep the code's long lines scrolling inside the card on phones,
    // instead of stretching the column and the whole page sideways.
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-32 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="min-w-0">
        <Reveal>
          <h2 className="display text-[clamp(3rem,6.5vw,5.6rem)]">
            Copy it in.
            <br />
            <span className="text-pip-bright">It moves.</span>
          </h2>
        </Reveal>
        <ol className="mt-12 space-y-7">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.06 * i}>
              <li className="flex gap-5">
                <span className="mono pt-1 text-[12px] text-aurora">{s.n}</span>
                <div>
                  <p className="display-wide text-[22px]">{s.title}</p>
                  <p className="mt-1.5 max-w-sm text-[15.5px] leading-relaxed text-mist">{s.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/"
              className="group inline-flex items-center gap-2 rounded-full bg-snow py-3 pl-5 pr-4 text-[15px] font-semibold text-night transition-transform active:scale-[0.97]"
            >
              Getting started
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight size={15} strokeWidth={2.2} />
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
      <Reveal delay={0.1} className="min-w-0">
        <div className="space-y-4">
          <CopyChip text={PEERS} label="npx expo install react-native-reanimated ..." />
          <CodeCard title="App.tsx" html={codeHtml} />
        </div>
      </Reveal>
    </section>
  );
}
