import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads the component catalog straight from the demo sources in the monorepo, at build time.
 * The demos are React Native code and cannot be imported into the website, so their metadata
 * is parsed from the files instead. One source of truth: the phone app, the live previews and
 * these pages all describe a component in exactly the same words.
 */

export const ROOT = path.resolve(process.cwd(), '../..');
const DEMOS = path.join(ROOT, 'packages/demos/src');
const UI = path.join(ROOT, 'packages/ui/src');

export const CATEGORIES = [
  'Actions',
  'Text',
  'Inputs',
  'Controls',
  'Navigation',
  'Overlays',
  'Cards',
  'Media',
  'Effects',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Entry = {
  id: string;
  name: string;
  category: Category;
  summary: string;
  motion: string;
  touch?: string;
  layout: 'center' | 'fill';
  /** Name of the demo function in its source file. */
  demoFn: string;
  demoFile: string;
};

const FILES = ['actions', 'text', 'inputs', 'controls', 'navigation', 'overlays', 'cards', 'media', 'effects'];

function unquote(raw: string) {
  return raw.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

function field(block: string, key: string): string | undefined {
  const m = new RegExp(`\\b${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`).exec(block);
  return m ? unquote(m[1]) : undefined;
}

let cache: Entry[] | null = null;

export function catalog(): Entry[] {
  if (cache) return cache;
  const out: Entry[] = [];
  for (const file of FILES) {
    const src = fs.readFileSync(path.join(DEMOS, `${file}.tsx`), 'utf8');
    const start = src.indexOf(': Demo[] = [');
    if (start < 0) continue;
    const body = src.slice(start);
    // Each entry is a `{ ... }` at the top level of the array; demo text never contains braces.
    const blocks = body.match(/\{\s*\n\s*id:[\s\S]*?\n\s{2}\}/g) ?? [];
    for (const block of blocks) {
      const id = field(block, 'id');
      const name = field(block, 'name');
      if (!id || !name) continue;
      out.push({
        id,
        name,
        category: field(block, 'category') as Category,
        summary: field(block, 'summary') ?? '',
        motion: field(block, 'motion') ?? '',
        touch: field(block, 'touch'),
        layout: field(block, 'layout') === 'fill' ? 'fill' : 'center',
        demoFn: /Component:\s*(\w+)/.exec(block)?.[1] ?? '',
        demoFile: `${file}.tsx`,
      });
    }
  }
  cache = out;
  return out;
}

export function entry(id: string): Entry | undefined {
  return catalog().find((e) => e.id === id);
}

// ---------- source ----------

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}

let files: string[] | null = null;
function uiFiles() {
  return (files ??= walk(UI).filter((f) => /\.tsx?$/.test(f)));
}

/** Path of the file that defines a component, relative to `packages/ui/src`. */
export function componentFile(name: string): string | undefined {
  const hit = uiFiles().find((f) => path.basename(f, path.extname(f)) === name);
  return hit ? path.relative(UI, hit).replace(/\\/g, '/') : undefined;
}

export function readUi(rel: string): string {
  return fs.readFileSync(path.join(UI, rel), 'utf8');
}

/** Every file in the library a component needs, following relative imports, itself first. */
export function dependencyFiles(rel: string): string[] {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readUi(file);
    for (const m of src.matchAll(/from '(\.[^']+)'/g)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), m[1]));
      const found = ['.tsx', '.ts', '/index.ts'].map((ext) => target + ext).find((c) => fs.existsSync(path.join(UI, c)));
      if (found) visit(found);
    }
  };
  visit(rel);
  return [...seen];
}

/** Third-party packages a set of files imports. */
export function packagesUsed(rels: string[]): string[] {
  const set = new Set<string>();
  for (const rel of rels) {
    for (const m of readUi(rel).matchAll(/from '([^.'][^']*)'/g)) {
      const name = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];
      if (name !== 'react') set.add(name);
    }
  }
  return [...set].sort();
}

/** The source of the demo function for an entry, ready to show as a usage example. */
export function demoSource(e: Entry): string {
  const src = fs.readFileSync(path.join(DEMOS, e.demoFile), 'utf8');
  const start = src.indexOf(`function ${e.demoFn}(`);
  if (start < 0) return '';
  // Walk to the brace that closes the function body.
  let i = src.indexOf('{', src.indexOf(')', start));
  let depth = 0;
  for (; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  const fn = src.slice(start, i + 1);
  // Name the imports the function actually uses, from the library and the brand.
  const ui = [...new Set([...fn.matchAll(/<([A-Z]\w+)/g)].map((m) => m[1]))].filter((n) => componentFile(n));
  const header = ui.length ? `import { ${ui.sort().join(', ')} } from 'penguin-ui';\n\n` : '';
  return `${header}export ${fn.replace(/^function \w+Demo/, 'function Example')}`;
}

export function neighbours(id: string) {
  const all = catalog();
  const i = all.findIndex((e) => e.id === id);
  return { prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
}
