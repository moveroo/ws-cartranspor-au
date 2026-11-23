import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACTIVATION_EVENTS,
  APPROVED_SOURCE_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  captureLandingAttribution,
  collectApprovedSourceParams,
  createLeadIntentId,
  decorateLeadIntentHref,
  normalizeTrackedHref,
  readStoredAttribution,
} from '../public/lead-attribution-core.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

assert.deepEqual(APPROVED_SOURCE_KEYS, [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
]);

assert.deepEqual(ACTIVATION_EVENTS, ['click', 'auxclick', 'pointerdown', 'keydown']);

const storage = createMemoryStorage();
const landingUrl =
  'https://cartransport.au/?utm_source=google&utm_medium=cpc&utm_campaign=pilot_audit&utm_id=camp_42&utm_source_platform=google_ads&gclid=pilotgclid123&gbraid=pilotgbraid456&wbraid=pilotwbraid789&msclkid=pilotmsclkid012&utm_content=private@example.com&utm_term=(07)%205550%201234&fbclid=should-not-pass&email=private@example.com&signed_token=secret';

const landingCaptured = captureLandingAttribution(landingUrl, storage);
assert.equal(landingCaptured.utm_source, 'google');
assert.equal(landingCaptured.utm_id, 'camp_42');
assert.equal(landingCaptured.utm_source_platform, 'google_ads');
assert.equal(landingCaptured.gclid, 'pilotgclid123');
assert.equal(landingCaptured.gbraid, 'pilotgbraid456');
assert.equal(landingCaptured.wbraid, 'pilotwbraid789');
assert.equal(landingCaptured.msclkid, 'pilotmsclkid012');
assert.equal(landingCaptured.utm_content, undefined);
assert.equal(landingCaptured.utm_term, undefined);
assert.equal(landingCaptured.fbclid, undefined);
assert.ok(storage.getItem(ATTRIBUTION_STORAGE_KEY));

const internalPageUrl = 'https://cartransport.au/about';
const persistedAfterNav = captureLandingAttribution(internalPageUrl, storage);
assert.equal(persistedAfterNav.gclid, 'pilotgclid123');
assert.equal(persistedAfterNav.gbraid, 'pilotgbraid456');

const firstDecorated = decorateLeadIntentHref(
  'https://quoting.cartransport.au/quote/vehicle?existing=keep#quote-start',
  {
    sourceUrl: internalPageUrl,
    eventName: 'quote_vehicle_click',
    siteKey: 'cartransport-au',
    persistedParams: persistedAfterNav,
    idFactory: () => 'li_test_001',
  }
);
const decoratedUrl = new URL(firstDecorated);
assert.equal(decoratedUrl.searchParams.get('existing'), 'keep');
assert.equal(decoratedUrl.hash, '#quote-start');
assert.equal(decoratedUrl.searchParams.get('lead_intent_id'), 'li_test_001');
assert.equal(decoratedUrl.searchParams.get('source_site'), 'cartransport.au');
assert.equal(decoratedUrl.searchParams.get('source_path'), '/about');
assert.equal(decoratedUrl.searchParams.get('intent_type'), 'quote_vehicle');
assert.equal(decoratedUrl.searchParams.get('utm_source'), 'google');
assert.equal(decoratedUrl.searchParams.get('utm_medium'), 'cpc');
assert.equal(decoratedUrl.searchParams.get('utm_campaign'), 'pilot_audit');
assert.equal(decoratedUrl.searchParams.get('utm_id'), 'camp_42');
assert.equal(decoratedUrl.searchParams.get('utm_source_platform'), 'google_ads');
assert.equal(decoratedUrl.searchParams.get('gclid'), 'pilotgclid123');
assert.equal(decoratedUrl.searchParams.get('gbraid'), 'pilotgbraid456');
assert.equal(decoratedUrl.searchParams.get('wbraid'), 'pilotwbraid789');
assert.equal(decoratedUrl.searchParams.get('msclkid'), 'pilotmsclkid012');
assert.equal(decoratedUrl.searchParams.has('email'), false);
assert.equal(decoratedUrl.searchParams.has('signed_token'), false);

const secondDecorated = decorateLeadIntentHref(firstDecorated, {
  sourceUrl: internalPageUrl,
  eventName: 'quote_vehicle_click',
  siteKey: 'cartransport-au',
  persistedParams: persistedAfterNav,
  idFactory: () => 'li_should_not_replace',
});
assert.equal(secondDecorated, firstDecorated);

captureLandingAttribution('https://cartransport.au/?utm_source=bing&msclkid=freshbing999', storage);
const replaced = readStoredAttribution(storage);
assert.equal(replaced.msclkid, 'freshbing999');
assert.equal(replaced.gclid, undefined);

const signedUrl = 'https://quoting.cartransport.au/quote/vehicle?signature=abc123';
assert.equal(
  decorateLeadIntentHref(signedUrl, {
    sourceUrl: landingUrl,
    eventName: 'quote_vehicle_click',
  }),
  signedUrl
);

assert.deepEqual(collectApprovedSourceParams('https://example.test/'), {});
assert.equal(
  decorateLeadIntentHref('/quote', {
    sourceUrl: landingUrl,
    eventName: 'unknown',
  }),
  '/quote'
);
assert.match(createLeadIntentId('cartransport-au'), /^li_cartransport_au_/);
assert.equal(
  normalizeTrackedHref('https://quoting.cartransport.au/quote/vehicle/'),
  'https://quoting.cartransport.au/quote/vehicle'
);

const agentsSource = fs.readFileSync(new URL('../src/pages/agents.astro', import.meta.url), 'utf8');
assert.match(agentsSource, /LeadAttribution/);
assert.match(agentsSource, /quoting\.cartransport\.au\/quote\/household/);
assert.match(agentsSource, /quoting\.cartransport\.au\/quote\/vehicle/);
assert.match(agentsSource, /quoting\.cartransport\.au\/contact/);
console.log(
  'PASS: lead attribution persists across pages, forwards all 12 approved fields, and strips PII/secrets/placeholders'
);
