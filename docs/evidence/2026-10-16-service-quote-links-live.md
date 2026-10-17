# Service quote links: independent live proof, 16 October 2026

Issue: https://github.com/moveroo/ws-cartranspor-au/issues/80  
Repair: https://github.com/moveroo/ws-cartranspor-au/pull/81

## Repair and deployment

PR 81 restored the two styled spans in `src/pages/services/[...slug].astro` to
anchors using the existing configured vehicle destination:
https://quoting.cartransport.au/quote/vehicle. Copy and styles were preserved.

Reviewed head: `39d8e608cc91fd1ba3fa69933efed1934acb02d7`.  
Merge: `34d9fc2d4594e79517645905936d37c30d80fe05`, 2026-10-16 22:22:25 UTC.  
Matching tree: `ff92993fc119c2ce57f41a873e8414c59fb674db`.

[Production deploy](https://app.netlify.com/projects/cartransport/deploys/6ad2a3a44670db504887f002)
published that merge at **2026-10-16 22:25:20.869 UTC**. On closeout, provider
reads still showed this as the current ready deploy and main still held the exact
merge. No open repository PRs overlapped this work.

PR 81 reports independent GPT-6.1 Sol High review with no material findings and
explicit `no_experiment_needed`: this repairs existing controls against the accepted
destination, without a new capability, claim or growth strategy. No Fleet Guard
was added or changed. Public HTML changed. Baseline evidence was the supported
Mac Chrome observation at 07:32 UTC and the inert spans in pre-repair source;
there is no complete pre-change live recording for every route.

Contract, lint, formatting, all 40 tests, Astro checks, build, and SEO/rendered
heading checks passed for PR 81. Built HTML confirmed all eight controls and
stylesheet bytes were unchanged. Exact-head build/manifest validation and
Netlify preview/header/redirect checks passed. GitHub's unrelated duplicate
`manifest` check was skipped and `Pages changed` was neutral; neither is claimed
as a passing executed check. Post-merge
[build](https://github.com/moveroo/ws-cartranspor-au/actions/runs/38975354904/job/117223359618)
and
[manifest validation](https://github.com/moveroo/ws-cartranspor-au/actions/runs/38975356327/job/117223363609)
passed.

## Independent browser results

The connected-iMac verifier used the supported Chrome extension and Checkly's
hosted web editor. This is separate from the repair implementation/review.

All four public HTML routes were tested:

- https://cartransport.au/services/interstate/
- https://cartransport.au/services/depot-to-depot/
- https://cartransport.au/services/door-to-door/
- https://cartransport.au/services/commercial/

Both exact labels, **Get an Instant Quote** and **Get Free Quote**, were checked
on every route.

### Hosted desktop and mobile clicks

Checkly: **1 passed (50.6s)**, Frankfurt, Chromium, runtime 2026.04.
Observed **2026-10-16 23:25:15.867-23:26:02.380 UTC**; job finished 23:26:04.421 UTC.

All **16 click cases** passed: four routes, two labels, two viewports
(desktop 1440x1000; mobile 390x844). Service responses were below HTTP 400, links
were visible with the accepted href, and actual clicks reached the accepted
quote origin/path with visible page content. The reviewed destination screenshot
showed the vehicle quote form's first step, with no customer data entered.
Homepage Services navigation passed at both widths; the mobile menu opened and
its navigation was visible.

### Natural Tab and Enter

Six local Chrome destination cases passed. The verifier used genuine Tab
traversal, checked the active anchor's exact label/href, then pressed Return.

| Route          | Control              | Destination observed UTC              | Tabs        |
| -------------- | -------------------- | ------------------------------------- | ----------- |
| interstate     | Get an Instant Quote | 23:39:28.213                          | 9           |
| interstate     | Get Free Quote       | 23:39:55.328                          | 14          |
| depot-to-depot | Get an Instant Quote | 23:40:04.222                          | 9           |
| depot-to-depot | Get Free Quote       | 23:40:33.663                          | 15          |
| door-to-door   | Get an Instant Quote | 23:40:41.510                          | 9           |
| door-to-door   | Get Free Quote       | between 23:40:41.510 and 23:43:58.855 | unavailable |

All dates in that table are 2026-10-16. The final local case encountered a tool
timeout after navigation; recovery independently confirmed the quote URL and
the door-to-door source path. Its exact per-case time and Tab count were lost.

Local commercial controls received keyboard focus, but both Return navigations
stalled; the cause remains unknown. A separately authorized final hosted run
then tested those two cases with genuine Tab/Enter and no click or programmatic
focus:

**2 passed (16.1s)**, Frankfurt Chromium, runtime 2026.04, 1440x1000.

| Commercial control   | Focus confirmed UTC | Tabs | Accepted destination and heading visible UTC |
| -------------------- | ------------------- | ---- | -------------------------------------------- |
| Get an Instant Quote | 23:49:09.764        | 10   | 23:49:15.756                                 |
| Get Free Quote       | 23:49:16.869        | 16   | 23:49:22.350                                 |

Observation window: **2026-10-16 23:49:08.784-23:49:22.350 UTC**.
Job finished 23:49:22.837 UTC. Each test had a 45-second limit, a 20-second
navigation limit and zero retries. Exact-anchor focus and href assertions passed
before Enter; the quote-page heading was visible after navigation.

Thus all **8 keyboard destination cases** are evidenced. The hosted success
does not diagnose or claim to fix the earlier local commercial stall.

## Retained artifacts and limits

The original hosted run produced 13 screenshots, one video and one trace. The
commercial follow-up produced four screenshots, two videos, two traces, logs and
a test-results JSON reporting expected=2, unexpected=0, skipped=0, flaky=0,
duration=16124.973ms. The instant-focus image captures a lower-page viewport;
its trace contains the exact focus assertion and keyboard actions. The footer
image visibly shows its focused CTA.

Artifacts remain in the connected-iMac task and Jason's ChatGPT Library. The
unsaved Checkly editor exposed no durable result-specific URL; its generic
editor URL is not represented as a permanent report link.

Library report IDs: `libfile_1b742cce847c81918cd68c0fe6128b1e`
(original), `libfile_c88b755403088191af164d92102e2a93` (commercial keyboard).
Final complete archive: `libfile_060210cece088191a2953b3d953969f3`.

SHA-256 of retained original files (before documentation formatting):

```text
d4d5ef0b54c03853e7a636f9c84a5fc4d120acec3268bfb0ea7cdf9b868b5a75  checkly-existing-run-assets.zip
32bcb7107f1b4d9c8c52d4b2280d15085704776feddc18485776800dbf898511  checkly-commercial-keyboard-assets.zip
4d0388e8c44800e0c7608d07d03e11e060896667aaad0cc11af60501ab7e6bde  checkly-public-smoke.spec.js
77a16463d9eb0e97c47a7901a392b97d90ed0503c5b79c42b2ca4124a6b0e693  checkly-commercial-keyboard.spec.js
fe4c779bf828ad85ce3a94f216be882bd11ca13700833f3a75336ea7e3b7eaaf  checkly-keyboard-supplement.json
```

The account used two included browser runs in total (2/4500 at final readback).
Both checks remained unsaved, inactive and muted. No schedule, alert, integration
or paid commitment was enabled. No form field was filled or submitted. Existing
link tracking added lead-intent/source query parameters; backend lead records
were not inspected. No quote calculation, submitted lead, authenticated workflow,
physical mobile device, other browser/region or measured conversion uplift was
tested.

The representation list in the completion JSON names these HTML resources; the
browser evidence is not a negotiation test for custom Accept headers. The
completion file is source-reported evidence for normal Bossman intake, not a
claim that Bossman ingested it, accepted current state, cleared a native finding
or observed recovery. No experiment, Bossman record or issue 67 is changed by
this closeout.

## Executed hosted scripts

The following code is retained as evidence, not installed as a scheduled check.
Formatting may differ from the original byte hashes above.

### Original 16-click smoke script

```javascript
const { test, expect } = require('@playwright/test');
test.setTimeout(210000);
test.use({ actionTimeout: 10000, navigationTimeout: 20000 });
test('public Cartransport desktop and mobile smoke - no form submission', async ({ page }) => {
  const base = 'https://cartransport.au';
  const quote = 'https://quoting.cartransport.au/quote/vehicle';
  const routes = ['interstate', 'depot-to-depot', 'door-to-door', 'commercial'];
  console.log('OBSERVATION_START', new Date().toISOString());
  for (const [device, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();
    const nav =
      device === 'mobile' ? page.locator('header details nav') : page.locator('header nav').first();
    if (device === 'mobile') {
      await page.getByLabel('Open site navigation').click();
      await expect(nav).toBeVisible();
      await page.screenshot({ path: 'mobile-menu.png' });
    }
    await nav.getByRole('link', { name: 'Services', exact: true }).click();
    await expect(page).toHaveURL(/cartransport\.au\/services\/?$/);
    await expect(page.locator('h1')).toBeVisible();
    console.log(device, 'navigation Services PASS', page.url());
    await page.screenshot({ path: device + '-services.png' });
    for (const route of routes) {
      for (const label of ['Get an Instant Quote', 'Get Free Quote']) {
        const response = await page.goto(base + '/services/' + route + '/', {
          waitUntil: 'domcontentloaded',
        });
        expect(response.status()).toBeLessThan(400);
        const cta = page.getByRole('link', { name: label, exact: true });
        await expect(cta).toHaveAttribute('href', quote);
        await cta.scrollIntoViewIfNeeded();
        await expect(cta).toBeVisible();
        if (label === 'Get an Instant Quote')
          await page.screenshot({ path: device + '-' + route + '.png' });
        await Promise.all([
          page.waitForURL(quote + '**', { waitUntil: 'domcontentloaded' }),
          cta.click(),
        ]);
        expect(new URL(page.url()).origin + new URL(page.url()).pathname.replace(/\/$/, '')).toBe(
          quote
        );
        await expect(page.locator('body')).toBeVisible();
        console.log(device, route, label, 'CLICK PASS', page.url());
        if (route === 'interstate' && label === 'Get an Instant Quote')
          await page.screenshot({ path: device + '-quote-destination.png' });
      }
    }
  }
  console.log('OBSERVATION_END', new Date().toISOString(), 'No forms filled or submitted.');
});
```

### Final commercial keyboard script

```javascript
const { test, expect } = require('@playwright/test');
test.describe.configure({ mode: 'default', retries: 0 });
test.setTimeout(45000);
test.use({
  viewport: { width: 1440, height: 1000 },
  actionTimeout: 5000,
  navigationTimeout: 20000,
});
for (const [label, slug] of [
  ['Get an Instant Quote', 'instant'],
  ['Get Free Quote', 'free'],
]) {
  test('commercial keyboard Enter: ' + label, async ({ page }) => {
    console.log('KEYBOARD_START', label, new Date().toISOString());
    const response = await page.goto('https://cartransport.au/services/commercial/', {
      waitUntil: 'domcontentloaded',
    });
    expect(response.status()).toBeLessThan(400);
    let tabCount = 0;
    for (; tabCount < 25;) {
      await page.keyboard.press('Tab');
      tabCount++;
      const active = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        text: document.activeElement?.textContent?.trim(),
      }));
      if (active.tag === 'A' && active.text === label) break;
    }
    const link = page.getByRole('link', { name: label, exact: true });
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute('href', 'https://quoting.cartransport.au/quote/vehicle');
    console.log('KEYBOARD_FOCUS_PASS', label, 'Tab presses:', tabCount, new Date().toISOString());
    await page.screenshot({ path: 'commercial-' + slug + '-keyboard-focus.png' });
    await Promise.all([
      page.waitForURL(
        (url) =>
          url.origin === 'https://quoting.cartransport.au' &&
          url.pathname.replace(/\/$/, '') === '/quote/vehicle',
        { waitUntil: 'domcontentloaded', timeout: 20000 }
      ),
      page.keyboard.press('Enter'),
    ]);
    await expect(
      page.getByRole('heading', {
        name: 'Interstate car transport without the guesswork.',
        exact: true,
      })
    ).toBeVisible();
    await page.screenshot({ path: 'commercial-' + slug + '-keyboard-destination.png' });
    console.log(
      'KEYBOARD_ENTER_PASS',
      label,
      new URL(page.url()).origin + new URL(page.url()).pathname,
      new Date().toISOString()
    );
    console.log('No forms filled or submitted.');
  });
}
```
