# Non-Indexed Redirect Strategy

## Objective

Keep indexed and commercially relevant pages live in Astro, and only redirect legacy
URLs after they are confirmed non-indexed and non-essential for quote flow continuity.

## Current rule

- Keep the homepage, service pages, transport guide, and legal pages live in Astro.
- Preserve any indexed content that still contributes search demand or conversion intent.
- Redirect thin or duplicate legacy pages only after Search Console and crawl checks confirm
  they are safe to retire.

## Verification

- Record redirect decisions in `docs/redirect-map.md`.
- Re-test each redirect after deploy.
- Keep a running batch log in `docs/nonindexed-redirect-report.md`.
