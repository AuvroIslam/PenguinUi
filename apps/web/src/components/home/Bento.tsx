import { LiveTile } from '../site/LiveTile';
import { Reveal } from './Reveal';

const TILES = [
  { id: 'swipe-deck', name: 'SwipeDeck', category: 'Cards', className: 'md:col-span-5 md:row-span-2' },
  { id: 'dynamic-island', name: 'DynamicIsland', category: 'Overlays', className: 'md:col-span-7' },
  { id: 'knob', name: 'Knob', category: 'Controls', className: 'md:col-span-3' },
  { id: 'toast', name: 'Toast', category: 'Overlays', className: 'md:col-span-4' },
  { id: 'liquid-tab-bar', name: 'LiquidTabBar', category: 'Navigation', className: 'md:col-span-7' },
  { id: 'success-check', name: 'SuccessCheck', category: 'Effects', className: 'md:col-span-5' },
];

/**
 * Six components, live, in one grid. Not recordings: each window runs the real React Native
 * component, so a visitor can drag the cards, turn the knob and fire the toasts right here.
 */
export function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <Reveal>
        <h2 className="display text-[clamp(3rem,7vw,6rem)]">
          Don&apos;t watch it.
          <br />
          <span className="text-mist">Touch it.</span>
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-frost">
          Every window below is running the real component. Drag the cards, turn the dial, tap the island.
        </p>
      </Reveal>
      <div className="mt-14 grid auto-rows-[300px] grid-cols-1 gap-4 md:grid-cols-12">
        {TILES.map((t) => (
          <LiveTile key={t.id} {...t} />
        ))}
      </div>
    </section>
  );
}
