// The static export writes prefetch segments as folders (crew/__next.crew/__PAGE__.txt), but
// the client asks for them flat (crew/__next.crew.__PAGE__.txt). Write the flat name beside
// each one so prefetches hit a file on a plain static host instead of a 404.
import { copyFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const out = path.resolve(import.meta.dirname, '../out');
let count = 0;

function flatten(segmentDir, prefix, into) {
  for (const name of readdirSync(segmentDir)) {
    const full = path.join(segmentDir, name);
    const flat = `${prefix}.${name}`;
    if (statSync(full).isDirectory()) flatten(full, flat, into);
    else {
      copyFileSync(full, path.join(into, flat));
      count++;
    }
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith('__next.')) flatten(full, name, dir);
    else if (name !== '_next' && name !== 'preview') walk(full);
  }
}

walk(out);
console.log(`flattened ${count} prefetch segments`);
