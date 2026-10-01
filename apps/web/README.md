# PenguinUi website

The site where the components are browsed, tried live and copied. Next.js, exported as static files.

```bash
npm run web          # dev server on :3000 (from the repo root)
npm run build:web    # exports the live previews, then the site, into apps/web/out
```

Live previews are the real components: the showcase app's web build is exported to
`public/preview` and every phone on the site is an iframe of `/preview/?c=<id>`.
Set `BASE_PATH=/PenguinUi` when building for GitHub Pages.
