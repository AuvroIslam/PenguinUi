import type { Metadata } from 'next';

import { Gallery } from '@/components/gallery/Gallery';
import { CATEGORIES, catalog } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Components',
  description: 'All one hundred PenguinUi components, live. Search, filter, hover to try one, open it for the code.',
};

export default function ComponentsPage() {
  const items = catalog().map(({ id, name, category, summary }) => ({ id, name, category, summary }));
  return <Gallery items={items} categories={[...CATEGORIES]} />;
}
