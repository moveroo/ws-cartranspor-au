# Cartransport clean Astro install pilot

Observed 16 October 2026. Repository: `moveroo/ws-cartranspor-au`;
canonical site: `https://cartransport.au`; hosting: Netlify, static `dist` output.
Baseline: main `10f6d034bd793e9724d5a15d85ddfede4adbc49a`.

## Version and compatibility

- The [official registry latest tag](https://registry.npmjs.org/astro/latest),
  [Astro upgrade documentation](https://docs.astro.build/en/upgrade-astro/), and
  [7.4.0 release](https://github.com/withastro/astro/releases/tag/astro%407.4.0)
  agreed on stable Astro **7.4.0**, released 15 October 2026.
- Astro 7.4.0 requires Node `>=22.22.0` and npm `>=9.6.5`.
  Existing hosted Node **22.23.3** / npm **10.9.9** meets both requirements.
  The declared minimum and README now agree with Astro. CI, `.nvmrc`, Netlify
  settings, redirects, headers and build/output commands are unchanged.
- This is a 7.2 to 7.4 upgrade within the existing major version. The
  [v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/) and
  intervening releases were reviewed. No source migration or new experimental
  feature was needed. Sharp image handling, Markdown rendering and emitted
  assets were included in the comparison.

## Deliberate clean resolution

On a separate branch, Astro's range became `^7.4.0`, the official sitemap
integration became `^3.7.4`, and the Node floor became `>=22.22.0`. All other
direct declarations, scripts and tests were retained. PR70 and its failed CI
remain separate evidence; its lockfile was not used as the pilot baseline.

An isolated Node 22.23.3 distribution from `nodejs.org` was checked against its
official SHA-256 checksum. Its bundled npm was exactly 10.9.9. Only child process
paths used this temporary toolchain; no global or hosted runtime was changed.

The intended manifest was copied into an empty temporary directory containing
neither a lockfile nor `node_modules`. That directory ran:

```sh
npm install --package-lock-only --ignore-scripts --engine-strict \
  --no-audit --no-fund --registry=https://registry.npmjs.org/
```

The generated lock was copied unchanged to the branch, then installed with:

```sh
npm ci --engine-strict --no-audit --no-fund \
  --registry=https://registry.npmjs.org/
```

Installation passed with 603 packages; the lock remained byte-identical.
Lock SHA-256: `b53cd7927ec2d5867b0d530c5e6d25863369cf3c7a6b144bc961316bc08d1e62`.
No integrity values or dependency flags were hand-edited.

The clean graph has 715 package records including the root, versus 771 before:
38 added paths, 94 removed paths, and 301 version changes at shared paths.
Those include major transitive changes; this is a clean resolution, not a
surgical esbuild patch. All resolved artifacts use the official npm registry.
Esbuild 0.28.2 and all 26 platform records are present; the graph review found
no missing or invalid required/optional/peer resolutions.

| Direct package    | Baseline | Pilot   |
| ----------------- | -------- | ------- |
| Astro             | 7.2.0    | 7.4.0   |
| @astrojs/sitemap  | 3.7.3    | 3.7.4   |
| astro-icon        | 1.1.5    | 1.2.0   |
| autoprefixer      | 10.5.4   | 10.6.1  |
| happy-dom         | 20.11.1  | 20.14.6 |
| prettier          | 3.9.6    | 3.9.10  |
| postcss           | 8.5.26   | 8.5.30  |
| sharp             | 0.35.3   | 0.35.5  |
| typescript-eslint | 8.66.0   | 8.71.2  |

On Linux, npm's installed-tree report lists the optional shared Sharp WASM
package as extraneous after its platform-specific parents are omitted. The
committed lock has no extraneous entries. Native Linux x64 Sharp loads
successfully; no WASM module was loaded in that check. This warning did not
prevent installation, type checks or the build.

## Baseline and pilot comparison

Both builds used Node 22.23.3 / npm 10.9.9. Both passed `check:contract`, lint,
`format:check`, all **40 unchanged tests with zero skipped**, `astro check`,
the complete build and `check:seo`.

- Both emitted 91 files and the same 17 HTML routes, including legal, contact,
  agent documentation, blog and service pages.
- Every HTML file was identical after substituting only the Astro generator
  version and the generated stylesheet filename. Content, metadata other than
  that version marker, structured data, links, forms and inline scripts match.
- Overall, 76 of the 91 files were byte-identical, including three HTML files
  and 73 other files: fonts, images, sitemaps, RSS, discovery resources and
  analytics JavaScript. The remaining files are the 14 HTML files described
  above and the stylesheet.
- The stylesheet differs by grouped equivalent selectors and three added
  compatibility declarations: `-moz-tab-size:4`, `-o-tab-size:4`, and
  `-webkit-background-clip:text`. Parsing and expanding grouped selectors
  produced identical ordered CSS records after removing just those additions.
- Local Astro previews returned the exact built bytes for all 91 files on
  each build. Quote links and forms matched, and unknown routes returned the
  built 404 with status 404. Both preview processes were shut down.

Local previews do not establish Netlify redirect/header enforcement, production
browser or visual behavior, or operation of external quote widgets. No quote
was submitted and no denied public-site route was retried. Hosted CI, merge,
exact-commit provider deployment and independent live verification must be
reported separately from these local results. No performance or SEO uplift is
claimed; issue67's render-blocking finding remains separate.

This dependency compatibility repair adds no feature, content, commercial
claim or Fleet Guard. Its proposed `no_experiment_needed` disposition depends
on independent review of these exact checks and output differences plus the
delivery proof. No experiment ID or enrollment was invented.

## Reusable checklist and site-fit criteria

1. Resolve the site's own instructions, accepted identity, current remote main,
   overlapping work, hosting contract and delivery authority. Preserve previous
   failed evidence. Do not carry this site's approval to other sites.
2. Observe official stable versions, release notes, integration requirements and
   engine floors on the day of work. Reject prereleases. Stop for an incompatible
   hosted runtime, material source migration or feature/design change.
3. Capture a baseline from the exact main tree: clean install using the hosted
   Node/npm pair, unchanged test coverage, required checks and build output.
4. Use a fresh branch and an isolated matching toolchain verified from reputable
   official sources. Obtain authority for deliberate lock regeneration. Preserve
   all site source, operational paths, runtime settings and tests.
5. Resolve the intended manifest without an existing lock or `node_modules`.
   Commit the generated lock without invented hashes/flags. Prove a fresh strict
   `npm ci` succeeds and leaves that lock unchanged.
6. Review the complete graph delta, engines, peers, optional platform closure,
   integrity metadata and registry provenance. Explain incidental warnings.
7. Repeat required checks without weakening assertions. Compare every output
   route, content, metadata, scripts, styles, images/fonts, sitemap/discovery
   resources, quote links and forms. Record any semantic or visual uncertainty.
8. Obtain independent review and successful existing hosted CI on the reviewed
   tree. Merge only within the site's authority; retain normal provider CD.
   Verify the exact deployed commit independently, then perform separately
   authorized live/browser checks without submissions or access workarounds.
9. Record the change disposition, before/after evidence, merge and provider
   proof separately from measured outcomes. Stop after four diagnosed repair
   rounds, or earlier for no progress, unexplained failure or scope growth.

This approach fits a site whose stable upgrade works with its existing hosted
runtime, integrations and unchanged public contracts, with complete reproducible
installation, checks and output comparison. A major framework/adapter change,
runtime/settings migration, changed business behavior, missing baseline or
unexplained output difference requires a separate decision. This pilot does not
authorize fleet rollout.
