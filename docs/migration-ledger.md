# CarTransport.au Migration Ledger

## Controller

- domain: `cartransport.au`
- current local controller: `MM-cartransport.au`
- framework: Astro
- hosting: Netlify (per current controller record)
- current live platform: Astro

## Site Shape

CarTransport.au is a mid-sized content-led transport site with SEO-heavy page generation, analysis scripts, and a broader supporting page set than the smallest fleet repos.

## Current Content Sources

- markdown/content inventory under `src/content/`
- public routes in `src/pages/`
- shared SEO/schema/FAQ components in `src/components/`
- analysis and cleanup tooling in `scripts/`

## Evidence Captured

- markdown content documents currently present: `6`
- Astro page routes currently present: `10`
- live robots route present at `src/pages/robots.txt.ts`
- existing SEO-analysis tooling already present in `scripts/`

## Standardization Outcome On 2026-04-18

- repo-level migration docs added
- README rewritten around the canonical controller role
- `.env.example` aligned to the live domain and brand
- `check` and `check:seo` added to the package baseline
- robots route corrected to use canonical site URL env vars
