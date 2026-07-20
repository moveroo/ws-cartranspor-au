# Quote Subdomain Brand Adaptation Brief

Status: V1 handoff brief
Date: 2026-06-15
Brand: Vehicle Transport Australia / CarTransport.au
Quote surface: `https://quoting.cartransport.au/quote/vehicle`

## Purpose

This brief translates the `cartransport.au` brand system into a practical
implementation brief for Moveroo quote, booking, contact, and customer portal
surfaces.

The Moveroo surface should feel connected to the Vehicle Transport Australia
site, but it should not copy the Astro homepage wholesale. The quote app is a
task flow, so brand expression must support mobile completion, readable forms,
visible progress, and safe customer navigation.

## Source Of Truth

Use these files before making quote-app design changes:

- `brand/visual-direction.md`
- `brand/tokens.json`
- `brand/moveroo-subdomain.json`
- `src/config/site.ts`
- `src/pages/index.astro`
- `src/components/Header.astro`
- `src/components/Hero.astro`
- `src/components/Footer.astro`

Key production assets:

- Logo: `public/logo.svg`
- Favicon: `public/favicon.svg`
- Site screenshot: `Vehicle Transport Australia  Interstate Car Transport  My Site.png`

## Brand Intent

Vehicle Transport Australia should feel:

- national
- practical
- transport-focused
- dependable
- quote-oriented
- vehicle-first

The quote subdomain should preserve that feel while making the vehicle quote
flow easy to complete.

## Approved Visual Tokens

Use these as the first mapping into the quote app theme contract:

| Role                  | Value                                  |
| --------------------- | -------------------------------------- |
| Deep shell            | `#020617`                              |
| Brand slate           | `#0f172a`                              |
| Panel slate           | `#1e293b`                              |
| Primary action orange | `#f97316`                              |
| Strong action orange  | `#ea580c`                              |
| Warm highlight        | `#f59e0b`                              |
| Ink                   | `#0f172a`                              |
| Page background       | `#f8fafc`                              |
| Surface               | `#ffffff`                              |
| Body font             | `Roboto, Arial, Helvetica, sans-serif` |
| Standard radius       | `0.375rem` to `0.75rem`                |
| CTA shape             | compact rounded rectangle              |

The live quote app may need these mapped into its own variable names, such as:

- `--quote-brand-font`
- `--quote-brand-heading-font`
- `--quote-brand-accent`
- `--quote-brand-accent-strong`
- `--quote-brand-page-background`
- `--quote-brand-text`
- `--quote-brand-muted-text`
- `--quote-brand-panel-background`
- `--quote-brand-panel-border`
- `--quote-brand-panel-radius`
- `--quote-brand-cta-background`
- `--quote-brand-cta-text`
- `--quote-brand-cta-border`
- `--quote-brand-progress-fill`
- `--quote-brand-current-step-border`
- `--quote-brand-selected-choice-border`
- `--quote-brand-field-focus-border`
- `--quote-brand-field-focus-ring`

## Quote App Direction

### Header

The header should clearly read as Vehicle Transport Australia:

- use the orange VTA mark where a logo is supported
- show Vehicle Transport Australia or CarTransport.au in text beside the mark
- keep the shell dark slate with an orange underline or border accent
- use white text and orange hover/focus states
- keep navigation labels practical:
  - Vehicle Quote
  - Moving Quote
  - Book Transport
  - Contact
  - Customer Portal

Provider and admin links must stay disabled.

### Hero / Intro Area

The quote intro should be compact and form-first.

Use:

- brand name and vehicle quote purpose as the main context
- one short reassurance sentence
- dark slate shell with a restrained orange/amber route accent
- real HTML text, not baked image text

Avoid:

- a full marketing homepage hero above the form
- giant imagery that delays the first input
- decorative panels that compete with wizard steps
- household-removal language as the primary journey

Recommended copy direction:

- Eyebrow: `Australia-wide vehicle transport quotes`
- Heading: `Get a car transport quote across Australia`
- Support: `Tell us about the vehicle and route, and we will help with secure transport options across Australia.`
- Helper: `Your progress can be saved as you move through the quote.`

### Form Surface

The wizard should feel branded but calm:

- page background: light slate paper, not a full dark-mode form
- shell/header/side panels: dark slate with orange accents
- panels and fields: white with subtle cool borders
- active step: orange border/accent with clear text contrast
- progress fill: orange or amber
- selected options: orange border with a very light orange tint
- field focus: orange ring with accessible contrast
- validation errors: clear red treatment from Moveroo's app-safe error system
- buttons: orange primary CTA, slate or white secondary action

Do not make every input orange. Reserve accent colour for action, progress,
focus, selected states, and compact brand dividers.

### Visual Motifs

Use Vehicle Transport Australia visual language sparingly:

- route striping can appear in the intro or side rail
- depot/city-pair cues can support the footer or contact page
- vehicle carrier imagery can appear as a small brand panel if locally available
- avoid imagery behind input fields
- avoid image-heavy layouts on mobile

### Typography

Use the approved Roboto direction where the app can support it.

- headings: bold, direct, high contrast
- labels and help text: readable and plain
- CTAs: short title case labels
- avoid hero-scale type inside form cards

### Public Surface Mode

Prefer a light form body inside a dark brand shell:

- dark slate header/footer and optional intro rail
- white/light form panels
- orange CTAs and progress states
- strong focus and selected-choice contrast

If a full dark mode remains available in the Moveroo runtime, it must be
deliberate:

- dark shell: deep slate, not generic black or Backloading red/black
- text: near white with strong contrast
- focus, validation, selected-choice, and progress states must be checked in
  dark mode

## Implementation Notes For Moveroo

The active quote runtime supports a repo-owned handoff contract. Implementation
should prefer that contract instead of copying site CSS.

Expected app-side concepts to map:

- hostname: `quoting.cartransport.au`
- theme key: `cartransport-au`
- primary route: `/quote/vehicle`
- secondary routes:
  - `/quote/household`
  - `/booking/create`
  - `/contact`
  - `/customer/login`
- primary CTA route key: `quote.vehicle.index`
- brand surface attributes:
  - `data-brand-surface`
  - `data-brand-theme`
  - `data-brand-hero`
  - `data-brand-cta`
  - `data-brand-field`
  - `data-brand-step-tab-current`
  - `data-brand-progress-fill`
  - `data-brand-choice-card-current`
  - `data-brand-notice`

The Moveroo implementation should use approved tokens, exact-token mappings,
and bounded theme/profile settings. It should not accept arbitrary CSS, raw
Tailwind class strings, remote layout instructions, or unreviewed image URLs
from a brand payload.

## Contact Routing

Do not expose a public phone number or email address for this Moveroo marketing
site. Every contact action must point to the site-owned contact page at
`https://quoting.cartransport.au/contact`.

## Failure Modes To Avoid

- copying the Astro homepage CSS directly into the quote app
- changing only the logo and CTA colour
- treating household quote as the primary journey for this domain
- using a giant hero that hides the first quote step
- using another site's blue/teal vehicle profile
- using Backloading Removals black/red
- placing route or vehicle imagery behind form controls
- breaking mobile header links, CTA text, or step labels
- exposing provider or admin links
- elevating customer portal into the header without a clear customer reason
- hardcoding placeholder phone values from the source site
- ignoring booking, contact, customer portal, and household fallback surfaces

## Acceptance Checks

Before the quote-subdomain brand pass is accepted, verify:

- `/quote/vehicle` desktop and mobile
- `/quote/household` desktop and mobile
- `/booking/create` desktop and mobile
- `/contact` desktop and mobile
- `/customer/login` desktop and mobile
- header logo and navigation are recognisably Vehicle Transport Australia
- vehicle quote is the primary CTA
- primary CTAs use approved orange treatment and readable text
- progress, selected steps, selected choices, form focus, and errors are themed
- the first input is still reachable quickly on mobile
- no text clips or overlaps in header, hero, buttons, step tabs, or footer
- customer portal appears in the footer only
- provider and admin links remain absent
- non-imported domains keep their existing branding

## Fleet Reuse

Future fleet domains with a quote, booking, portal, assistant, or app subdomain
should publish the same kind of repo-owned adaptation brief beside their
tokens and `brand/moveroo-subdomain.json`.
