import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { quoteHandoffHref } from '../src/components/analytics/quote-handoff.js';

const home = 'https://cartransport.au/';
const sourcePage = `${home}services/interstate/`;
const vehicle = 'https://quoting.cartransport.au/quote/vehicle';
const household = 'https://quoting.cartransport.au/quote/household';
const booking = 'https://quoting.cartransport.au/booking/create';
const contact = 'https://quoting.cartransport.au/contact';
const campaigns = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
];
const lead = ['lead_intent_id', 'source_site', 'source_path', 'intent_type'];
const trackedLinks = [
  { href: vehicle, eventName: 'quote_vehicle_click' },
  { href: household, eventName: 'quote_household_click' },
  { href: booking, eventName: 'booking_household_click' },
  { href: contact, eventName: 'contact_intent_click' },
];
const gaSource = await fs.readFile(
  new URL('../src/components/analytics/Ga4.astro', import.meta.url),
  'utf8'
);
const template = gaSource.match(/set:html=\{(`[^]*?`)\}/)?.[1];
assert.ok(template, 'Exercise the actual GA inline template');
const runtime = vm.runInNewContext(template, {
  quoteHandoffHref,
  gaMeasurementId: 'INERT_FIXTURE',
  gaTagUrl: 'https://analytics.invalid/never-load',
  gaConfig: {},
  siteKey: 'cartransport-au',
  normalizedTrackedLinks: trackedLinks,
});
const runtimes = [['source', runtime]];
if (process.env.QUOTE_HANDOFF_BUILT_HTML) {
  const html = await fs.readFile(process.env.QUOTE_HANDOFF_BUILT_HTML, 'utf8');
  const dom = new JSDOM(html);
  const emitted = [...dom.window.document.scripts].filter((script) =>
    script.textContent.includes('var trackedLinks =')
  );
  assert.equal(emitted.length, 1, 'Exactly one existing emitted GA decorator');
  runtimes.push(['emitted', emitted[0].textContent]);
  dom.window.close();
}

function fixture(code, href = vehicle, arrival = `${sourcePage}?utm_source=fixture`, attrs = '') {
  const dom = new JSDOM('<!doctype html><a><span>Quote</span></a>', {
    url: arrival,
    runScripts: 'outside-only',
  });
  const { window } = dom;
  // JSDOM has no resource loading enabled. Block timers and navigation too.
  window.setTimeout = () => 0;
  window.requestIdleCallback = () => 0;
  window.document.addEventListener('click', (event) => event.preventDefault());
  const anchor = window.document.querySelector('a');
  anchor.setAttribute('href', href);
  if (attrs) {
    const attributeFixture = window.document.createElement('div');
    attributeFixture.innerHTML = `<a ${attrs}></a>`;
    for (const attribute of attributeFixture.firstChild.attributes)
      anchor.setAttribute(attribute.name, attribute.value);
  }
  const originalSetter = anchor.setAttribute.bind(anchor);
  let writes = 0;
  anchor.setAttribute = (name, value) => {
    if (name === 'href') writes += 1;
    originalSetter(name, value);
  };
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLAnchorElement.prototype, 'href');
  Object.defineProperty(anchor, 'href', {
    get: () => descriptor.get.call(anchor),
    set: (value) => {
      writes += 1;
      descriptor.set.call(anchor, value);
    },
  });
  window.eval(code);
  assert.equal(writes, 0, 'No eager href decoration');
  const click = () =>
    anchor.querySelector('span').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  const events = () => [...window.dataLayer].filter((entry) => entry[0] === 'event');
  return { anchor, click, events, writes: () => writes, close: () => window.close() };
}

for (const [label, code] of runtimes) {
  test(`${label}: quote clicks retain seven sanitized campaign fields and existing lead/GA behavior`, () => {
    for (const [href, eventName, intent] of [
      [vehicle, 'quote_vehicle_click', 'quote_vehicle'],
      [household, 'quote_household_click', 'quote_household'],
    ]) {
      const incoming = new URL(sourcePage);
      for (const key of campaigns) incoming.searchParams.set(key, ` fixture-${key} `);
      incoming.searchParams.set('msclkid', 'unsupported');
      incoming.searchParams.set('email', 'synthetic@example.invalid');
      incoming.searchParams.set('lead_intent_id', 'must-not-be-copied');
      const f = fixture(code, href, incoming.toString());
      try {
        f.click();
        const result = new URL(f.anchor.href);
        for (const key of campaigns) assert.equal(result.searchParams.get(key), `fixture-${key}`);
        assert.equal(result.searchParams.has('msclkid'), false);
        assert.equal(result.searchParams.has('email'), false);
        assert.match(
          result.searchParams.get('lead_intent_id'),
          /^li_cartransport_au_[a-z0-9]+_[a-z0-9]+$/
        );
        assert.equal(result.searchParams.get('source_site'), 'cartransport.au');
        assert.equal(result.searchParams.get('source_path'), '/services/interstate/');
        assert.equal(result.searchParams.get('intent_type'), intent);
        assert.equal(f.events().length, 1);
        assert.equal(f.events()[0][1], eventName);
        assert.equal(f.events()[0][2].site_key, 'cartransport-au');
        assert.equal(f.writes(), 1);
        const first = f.anchor.getAttribute('href');
        f.click();
        assert.equal(f.anchor.getAttribute('href'), first, 'Repeat activation is idempotent');
        assert.equal(f.writes(), 1);
        assert.equal(f.events().length, 2, 'Existing GA event remains per click');
      } finally {
        f.close();
      }
    }
  });

  test(`${label}: append-only destination values, query bytes and fragment survive`, () => {
    for (const suffix of [
      '',
      '?',
      '?business=keep%2f+bytes&',
      '?utm_source=fixture&business=keep%20bytes',
    ]) {
      const href = `${vehicle}${suffix}#keep%2f+fragment`;
      const f = fixture(code, href);
      try {
        f.click();
        const result = f.anchor.getAttribute('href');
        assert.ok(result.startsWith(href.split('#')[0]));
        assert.ok(result.endsWith('#keep%2f+fragment'));
        assert.equal(new URL(result).searchParams.getAll('utm_source').length, 1);
      } finally {
        f.close();
      }
    }
    const explicit = `${vehicle}?lead_intent_id=li_existing&source_site=prior.example&source_path=%2Foriginal&intent_type=quote_vehicle&utm_source=fixture#hash`;
    const f = fixture(code, explicit, `${sourcePage}?utm_source=fixture&utm_medium=synthetic`);
    try {
      f.click();
      assert.ok(
        f.anchor.getAttribute('href').startsWith(explicit.slice(0, -5) + '&utm_medium=synthetic')
      );
      assert.equal(new URL(f.anchor.href).searchParams.get('lead_intent_id'), 'li_existing');
      assert.equal(new URL(f.anchor.href).searchParams.get('source_path'), '/original');
    } finally {
      f.close();
    }
  });

  test(`${label}: conflicting touches and duplicate/aliased evidence leave href completely untouched`, () => {
    const cases = [];
    for (const key of campaigns)
      cases.push([`${vehicle}?${key}=destination`, `${home}?${key}=source`]);
    for (const key of [...campaigns, ...lead]) {
      cases.push([`${vehicle}?${key}=one&${key}=two`, home]);
      cases.push([vehicle, `${home}?${key}=one&${key}=two`]);
    }
    for (const alias of [
      'utm.source',
      'utm+source',
      'UTM_SOURCE',
      'utm_source%5B%5D',
      'utm_source%5Bx%5D',
      '%20utm_source',
      'utm_source%00suffix',
      'lead_intent_id%5Bx%5D',
      '%75tm_source',
    ]) {
      cases.push([`${vehicle}?utm_source=fixture&${alias}=fixture`, home]);
      cases.push([vehicle, `${home}?utm_source=fixture&${alias}=fixture`]);
    }
    cases.push([
      `${vehicle}?utm_campaign=${'x'.repeat(121)}`,
      `${home}?utm_campaign=${'x'.repeat(120)}`,
    ]);
    cases.push([`${vehicle}?source_site=prior.example`, `${home}?source_site=other.example`]);
    for (const [href, arrival] of cases) {
      const f = fixture(code, href, arrival);
      try {
        f.click();
        assert.equal(f.anchor.getAttribute('href'), href, `${href} / ${arrival}`);
        assert.equal(f.writes(), 0);
        assert.equal(f.events().length, 1, 'GA event is retained on rejected decoration');
      } finally {
        f.close();
      }
    }
  });

  test(`${label}: protected/action-specific URLs and invalid explicit evidence are untouched`, () => {
    const markers = [
      'signature',
      'sig',
      'token',
      '_token',
      'signed_token',
      'access_token',
      'auth_token',
      'csrf_token',
      'session',
      'session_id',
      'expires',
      'expiry',
      'nonce',
      'password',
      'passwd',
      'secret',
      'credential',
      'authorization',
      'api_key',
      'apikey',
      'googleaccessid',
      'awsaccesskeyid',
      'email',
      'phone',
      'name',
      'first_name',
      'last_name',
      'tenant',
      'Signature',
      'access.token',
      'token%5Bx%5D',
      'X-Amz-Signature',
      'X-Goog-Credential',
      '%20TOKEN',
      'sig%00suffix',
    ];
    const hrefs = markers.map((key) => `${vehicle}?${key}=opaque%2fvalue&business=keep#anchor`);
    hrefs.push(
      `${vehicle}?utm_source=%00bad`,
      `${vehicle}?lead_intent_id=bad%20id`,
      `${vehicle}?source_path=//unsafe`,
      `${vehicle}?intent_type=unknown`,
      `${vehicle}?%ZZ=bad`,
      `${vehicle}?utm_source=%ZZ`,
      `https://user:secret@quoting.cartransport.au/quote/vehicle`
    );
    for (const href of hrefs) {
      const f = fixture(code, href);
      try {
        f.click();
        assert.equal(f.anchor.getAttribute('href'), href);
        assert.equal(f.writes(), 0);
      } finally {
        f.close();
      }
    }
  });

  test(`${label}: exact existing sanitizer bounds and privacy exclusions apply only to supported fields`, () => {
    for (const [incoming, expected] of [
      ['  hello\u0000world\u007f ', 'helloworld'],
      ['x'.repeat(121), 'x'.repeat(120)],
      ['', null],
      ['synthetic@example.invalid', null],
      ['synthetic%40example.invalid', null],
      ['+61 400 000 000', null],
    ]) {
      const arrival = new URL(home);
      arrival.searchParams.set('utm_campaign', incoming);
      const f = fixture(code, vehicle, arrival.toString());
      try {
        f.click();
        assert.equal(new URL(f.anchor.href).searchParams.get('utm_campaign'), expected);
      } finally {
        f.close();
      }
    }
  });

  test(`${label}: quote opt-outs and untracked links retain navigation without added activation paths`, () => {
    for (const attrs of [
      'data-no-track',
      'data-track-ignore',
      'rel="NO-TRACK"',
      'rel="external notrack"',
    ]) {
      const f = fixture(code, vehicle, `${home}?utm_source=fixture`, attrs);
      try {
        f.click();
        assert.equal(f.anchor.getAttribute('href'), vehicle);
        assert.equal(f.writes(), 0);
        assert.equal(f.events().length, 1);
      } finally {
        f.close();
      }
    }
    for (const href of [
      `${home}about/`,
      'mailto:synthetic@example.invalid',
      'https://other.invalid/quote/vehicle',
    ]) {
      const f = fixture(code, href);
      try {
        f.click();
        assert.equal(f.anchor.getAttribute('href'), href);
        assert.equal(f.events().length, 0);
      } finally {
        f.close();
      }
    }
  });

  test(`${label}: booking and contact keep their existing four-field behavior without campaign changes`, () => {
    for (const [href, eventName, intent] of [
      [booking, 'booking_household_click', 'booking_household'],
      [contact, 'contact_intent_click', 'contact'],
    ]) {
      const f = fixture(code, href);
      try {
        f.click();
        const result = new URL(f.anchor.href);
        assert.equal(result.origin + result.pathname, href);
        assert.equal(result.searchParams.size, 4);
        for (const key of campaigns) assert.equal(result.searchParams.has(key), false);
        assert.equal(result.searchParams.get('intent_type'), intent);
        assert.equal(f.events()[0][1], eventName);
      } finally {
        f.close();
      }
    }
  });
}

test('disabled/provider gates remain at the existing analytics wrapper', async () => {
  const wrapper = await fs.readFile(
    new URL('../src/components/analytics/Analytics.astro', import.meta.url),
    'utf8'
  );
  assert.ok(wrapper.includes("analyticsEnabled === 'true'"));
  assert.ok(wrapper.includes("import.meta.env.PROD && enabled && provider === 'ga4'"));
  assert.ok(gaSource.includes('import.meta.env.PROD && gaMeasurementId'));
});
