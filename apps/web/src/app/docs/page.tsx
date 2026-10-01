import type { Metadata } from 'next';
import Link from 'next/link';

import { Reveal } from '@/components/home/Reveal';
import { CodeCard } from '@/components/site/CodeCard';
import { CopyChip } from '@/components/site/CopyChip';
import { readUi } from '@/lib/catalog';
import { highlight } from '@/lib/highlight';
import { GITHUB, PEERS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Getting started',
  description: 'Install the peers, copy the core, then copy any PenguinUi component into your Expo app.',
};

const CORE_FILES = [
  'theme/tokens.ts',
  'theme/ThemeProvider.tsx',
  'motion/tokens.ts',
  'motion/haptics.ts',
  'motion/shake.ts',
  'utils/layout.ts',
  'utils/color.ts',
  'utils/useControllable.ts',
  'primitives/PressableScale.tsx',
  'primitives/Text.tsx',
  'primitives/Portal.tsx',
  'primitives/Glyph.tsx',
];

const PROVIDER = `import { PenguinProvider } from './penguin-ui/theme/ThemeProvider';

export default function App() {
  return (
    <PenguinProvider scheme="dark">
      <YourScreens />
    </PenguinProvider>
  );
}`;

const THEME = `<PenguinProvider
  scheme="dark"
  theme={{
    // One accent. Its soft tint is derived for you.
    accent: '#3DDAB4',
    fonts: {
      regular: 'BricolageGrotesque_400Regular',
      semibold: 'BricolageGrotesque_600SemiBold',
      bold: 'BricolageGrotesque_700Bold',
      mono: 'MartianMono_400Regular',
    },
  }}
  haptics={false}
>`;

const BABEL = `// babel.config.js: Reanimated 4 needs the worklets plugin, last in the list.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};`;

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="grid gap-6 border-t border-line py-14 md:grid-cols-[180px_1fr]">
        <div>
          <p className="mono text-[12px] text-aurora">{n}</p>
          <h2 className="display-wide mt-2 text-[26px]">{title}</h2>
        </div>
        <div className="min-w-0 space-y-5 text-[16.5px] leading-relaxed text-frost">{children}</div>
      </section>
    </Reveal>
  );
}

export default async function Docs() {
  const provider = await highlight(PROVIDER);
  const theme = await highlight(THEME);
  const babel = await highlight(BABEL);
  const tokens = await highlight(readUi('motion/tokens.ts').split('// Closed-form')[0]);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-10 pt-36">
      <Reveal>
        <h1 className="display text-[clamp(3.4rem,8vw,6.4rem)]">
          Getting
          <br />
          started.
        </h1>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="mt-6 max-w-xl text-[19px] leading-relaxed text-frost">
          PenguinUi is copy and paste. You own the code: there is no package to keep up with, and every file is yours to
          change. It takes about five minutes.
        </p>
      </Reveal>

      <div className="mt-16">
        <Step n="01" title="Install the peers">
          <p>
            Four libraries do the heavy lifting: Reanimated for motion on the UI thread, Gesture Handler for touch, SVG for
            drawing and Worklets underneath Reanimated. <code className="mono text-[13px] text-snow">expo-haptics</code> is
            optional; without it every haptic quietly does nothing.
          </p>
          <CopyChip text={PEERS} />
          <p>If you are not on Expo, add the Worklets Babel plugin.</p>
          <CodeCard title="babel.config.js" html={babel} />
        </Step>

        <Step n="02" title="Copy the core">
          <p>
            Twelve small files that every component leans on: the theme, the motion vocabulary, haptics and the press
            primitive. Put them in a <code className="mono text-[13px] text-snow">penguin-ui</code> folder in your app, keeping
            the paths.
          </p>
          <ul className="mono grid gap-1.5 rounded-[20px] border border-line bg-deep p-5 text-[12.5px] text-mist sm:grid-cols-2">
            {CORE_FILES.map((f) => (
              <li key={f}>
                <a href={`${GITHUB}/blob/main/packages/ui/src/${f}`} target="_blank" rel="noreferrer" className="transition-colors hover:text-snow">
                  {f}
                </a>
              </li>
            ))}
          </ul>
        </Step>

        <Step n="03" title="Wrap your app">
          <p>The provider hands every component its theme, sets up the overlay layer for sheets and toasts, and switches haptics on or off.</p>
          <CodeCard title="App.tsx" html={provider} />
        </Step>

        <Step n="04" title="Copy a component">
          <p>
            Open any component. Its Source tab lists the files it needs in order, its own first, then any core file you have
            not copied yet, then the packages to install. Paste them in and it moves.
          </p>
          <Link href="/components/" className="inline-flex rounded-full bg-snow px-5 py-2.5 text-[15px] font-semibold text-night">
            Pick a component
          </Link>
        </Step>

        <section id="theming" className="scroll-mt-28">
          <Step n="05" title="Make it yours">
            <p>
              One accent colour, your own fonts, light or dark, and a switch for haptics. Every component reads from the theme,
              so one change reaches all of them.
            </p>
            <CodeCard title="App.tsx" html={theme} />
            <p>
              Motion comes from one shared set of springs and curves. Change them and every component moves to the new rhythm.
            </p>
            <CodeCard title="motion/tokens.ts" html={tokens} maxHeight={460} />
          </Step>
        </section>
      </div>
    </main>
  );
}
