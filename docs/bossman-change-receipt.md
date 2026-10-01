# Bossman records website changes without a cloud write token

Cloud website work needs only `BOSSMAN_PRODUCTION_AGENT_READ_TOKEN` for the
existing `./scripts/bossman-site-context` check. Do not request, install or use
`BOSSMAN_PRODUCTION_AGENT_WRITE_TOKEN` in this website environment. Keep its
read-only helper setup. Do not delete shared vault entries or change credentials.

## Before a meaningful public change

Attach the existing planned Site Improvement Experiment supplied by Bossman.
Its baseline, approval, exact URL scope and collector enrollment belong in
Bossman, not in the website environment. If one is missing, hand the change
summary and exact URLs to the Bossman operator for central preparation. Continue
authorised investigation, code and local checks; do not invent an experiment ID,
silently skip recording or request a website write token to get around the gap.
Public delivery still requires the applicable approval and central plan.

Check in `bossman-change-receipt-plan.json` with **only** these fields:

```json
{
  "schemaVersion": "bossman.site-change-receipt.v1",
  "siteId": 4,
  "canonicalUrl": "https://movingcars.com.au",
  "repoUrl": "https://github.com/iamjasonhill/astrosites2026",
  "experimentId": 149,
  "changeKey": "movingcars-llms-guidance-quality-2026-10-01",
  "resources": [
    {
      "url": "https://movingcars.com.au/llms.txt",
      "contentType": "text/plain"
    }
  ]
}
```

This is a **format example**, not a plan to copy. Resolve this repository's own
site ID, canonical URL and repository through Bossman; use its actual planned
experiment ID, change key and complete scope. The resource list must cover all
1–10 exact URLs in that experiment, with no queries, fragments, credentials or
cross-host targets. Allowed types: `text/html`, `text/plain`, `text/markdown`,
`application/json`. Each resource must be a built static file of at most 512 KiB.
SSR-only pages, redirects, removals, patterns and site-wide scope need the
existing Bossman operator workflow; version one does not prove them.

## Build and verify

- `npm run test:bossman-receipt` checks identity, hashes, output variants and failures.
- The normal website build runs the receipt generator after its existing checks.
- `npm run bossman:receipt` reruns generation against already-built output.

With no active plan, the generator succeeds without publishing a receipt and
removes only an old generated receipt from cached build output. It does not
create a dummy experiment. An invalid active plan, missing resource, oversized
file or provider/checkout commit mismatch fails the build.

With a valid plan it hashes the final published static bytes and writes
`/.well-known/bossman-change-receipt.json`. Vercel adapter output uses
`.vercel/output/static`; plain Astro and Netlify use `dist`. The repository's
package command selects this explicitly; cached directories never decide it.
No provider request
or Bossman write occurs during generation. Do not copy private baseline packs,
tokens, customer details or internal notes into this public file.

## After approved publication

Bossman collects centrally enrolled planned experiments every 30 minutes, at
most three per tick. The operator enrolls the approved ID using
`BOSSMAN_SITE_CHANGE_RECEIPT_EXPERIMENTS` on Bossman; repository installation
does not enroll changes or grant approval. Bossman checks the current successful
repository deployment, plan at that commit, accepted site/repo/experiment
identity, live receipt, exact resource hashes/types and publication stability.
It then records implementation proof against the existing experiment and
schedules its follow-up. Existing proof and baselines are never overwritten.

Read back the experiment through Bossman to confirm recording. Missing provider
deployment proof or unverifiable live output remains pending; do not replace it
with a claim that build or merge proves production. Provider writes (including
IndexNow), outcome decisions, accepted facts and rollback remain separate.

Beauy can use this integration optionally under its independent repository
rules; receipt support does not make Bossman a mandatory gate there.
