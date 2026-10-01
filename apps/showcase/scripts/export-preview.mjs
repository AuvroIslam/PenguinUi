// Builds the web version of this app into the website's public folder, where the site loads
// it in iframes as live component previews. The base path must match the site's.
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const base = `${process.env.BASE_PATH ?? ''}/preview`;
const out = '../web/public/preview';
rmSync(out, { recursive: true, force: true });
execSync(`npx expo export -p web --output-dir ${out}`, {
  stdio: 'inherit',
  env: { ...process.env, PREVIEW_BASE_URL: base, MSYS_NO_PATHCONV: '1' },
});
