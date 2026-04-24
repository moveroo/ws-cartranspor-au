# MM-cartransport.au

Canonical Astro controller for `cartransport.au`.

This repo contains the live `cartransport.au` Astro site: a route-heavy SEO-focused transport site
with custom components, analysis scripts, and a broader content/application surface than the small
fleet marketing repos.

## Current State

- domain: `https://cartransport.au`
- framework: Astro
- hosting: Netlify (per current controller record)
- local controller path: `MM-cartransport.au`
- site shape: content-led vehicle transport site with city, blog, legal, and support pages

The current migration and operating paperwork lives in:

- [docs/migration-ledger.md](docs/migration-ledger.md)
- [docs/redirect-map.md](docs/redirect-map.md)
- [docs/indexed-valid-inventory.md](docs/indexed-valid-inventory.md)
- [docs/homepage-audit.md](docs/homepage-audit.md)
- [docs/live-cutover-status.md](docs/live-cutover-status.md)
- [docs/PROJECT-CHECKLIST.md](docs/PROJECT-CHECKLIST.md)

## Important Commands

```bash
npm run dev
npm run build
npm run check
npm run check:seo
```

Useful supporting commands:

- `npm run test:run`
- `npm run seo:audit`
- `npm run analyze:duplicates`
- `npm run analyze:content`
- `npm run check:links`

## Site Shape

Current important building blocks:

- public marketing, legal, and blog pages in `src/pages/`
- a route/content layer rendered through `[...slug].astro`
- custom SEO, schema, analytics, and FAQ components
- a large set of SEO-analysis and cleanup scripts in `scripts/`

## Environment

Copy `.env.example` to `.env` when needed:

- `PUBLIC_SITE_URL`
- `PUBLIC_SITE_NAME`
- `PUBLIC_SITE_DESCRIPTION`
- `PUBLIC_SITE_IMAGE`
- `PUBLIC_GA_ID`
- `PUBLIC_MATOMO_BASE_URL`
- `PUBLIC_MATOMO_SITE_ID`

## Notes

- this repo had never been normalized after the folder rename, so it was still carrying the Astro
  starter README
- the current standardization pass adds the fleet controller contract and fixes the canonical robots
  URL generation
