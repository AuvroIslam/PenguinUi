import type { NextConfig } from 'next';

// The site is a static export so it can be hosted anywhere, including GitHub Pages, where it
// lives under the repository's name. `BASE_PATH=/PenguinUi npm run build` produces that build.
const basePath = process.env.BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Static hosts serve /preview/ from its index.html. The dev server does not, so point it there.
  ...(process.env.NODE_ENV === 'development'
    ? { rewrites: async () => [{ source: '/preview/', destination: '/preview/index.html' }] }
    : {}),
};

export default nextConfig;
