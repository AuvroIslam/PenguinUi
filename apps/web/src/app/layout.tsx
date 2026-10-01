import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Martian_Mono } from 'next/font/google';

import { Footer } from '@/components/site/Footer';
import { Nav } from '@/components/site/Nav';
import { SmoothScroll } from '@/components/site/SmoothScroll';

import './globals.css';

// Bricolage Grotesque for everything set in words: a grotesque with ink traps and a real
// optical-size axis, so headlines can be cut tight and condensed while body text stays open.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
  variable: '--font-bricolage',
  display: 'swap',
});

// Martian Mono for code, numbers and labels: a mono with a width axis, kept slightly narrow.
const martian = Martian_Mono({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-martian',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'PenguinUi, motion-first components for React Native', template: '%s · PenguinUi' },
  description:
    'One hundred React Native components with spring physics, gestures and haptics. Copy them into your Expo app and they move.',
  openGraph: { title: 'PenguinUi', description: 'Motion-first components for React Native.', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#060b17', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${martian.variable}`}>
      <body className="grain min-h-dvh overflow-x-clip">
        <SmoothScroll />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
