import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Detail, type FileBlock } from '@/components/detail/Detail';
import { catalog, componentFile, demoSource, dependencyFiles, entry, neighbours, packagesUsed, readUi } from '@/lib/catalog';
import { highlight } from '@/lib/highlight';

export function generateStaticParams() {
  return catalog().map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = entry(id);
  return e ? { title: e.name, description: `${e.summary} ${e.motion}` } : {};
}

// Files every component shares. Shown once on the docs page, marked as core here.
const CORE = /^(theme|motion|utils)\/|^primitives\/(PressableScale|Text|Portal)\.tsx$/;

export default async function ComponentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = entry(id);
  if (!e) notFound();

  const main = componentFile(e.name)!;
  const deps = dependencyFiles(main);
  // Core files are the same on every page, so they are listed here and linked, not inlined.
  const files: FileBlock[] = await Promise.all(
    deps.map(async (rel) => {
      const core = CORE.test(rel);
      const code = readUi(rel);
      return { path: rel, core, html: core ? '' : await highlight(code), lines: code.split('\n').length };
    }),
  );
  const usage = await highlight(demoSource(e));
  const packages = packagesUsed(deps).filter((p) => p !== 'react-native');
  const { prev, next } = neighbours(id);

  return (
    <Detail
      entry={e}
      usageHtml={usage}
      files={files}
      packages={packages}
      prev={{ id: prev.id, name: prev.name }}
      next={{ id: next.id, name: next.name }}
    />
  );
}
