import {
  captureLandingAttribution,
  decorateLeadIntentHref,
  normalizeTrackedHref,
  readStoredAttribution,
} from './lead-attribution-core.js';

const config = globalThis.__LEAD_ATTRIBUTION_CONFIG__ || {};
const trackedLinks = (config.trackedLinks || []).map((link) => ({
  ...link,
  href: normalizeTrackedHref(link.href),
}));

function getSafeSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

const storage = getSafeSessionStorage();
const initialCapturedParams = captureLandingAttribution(window.location.href, storage);

function shouldSkipDecoration(target) {
  if (target.hasAttribute('data-no-track') || target.hasAttribute('data-track-ignore')) {
    return true;
  }
  const relTokens = (target.getAttribute('rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
  return relTokens.includes('no-track') || relTokens.includes('notrack');
}

function decorate(target) {
  if (shouldSkipDecoration(target)) return;
  const href = target.getAttribute('href');
  if (!href) return;

  let resolvedHref;
  try {
    resolvedHref = new URL(href, window.location.href).toString();
  } catch {
    return;
  }

  const normalizedHref = normalizeTrackedHref(resolvedHref);
  const trackedLink = trackedLinks.find((link) => normalizedHref === link.href);
  if (!trackedLink) return;

  const stored = readStoredAttribution(storage);
  const persistedParams = stored && Object.keys(stored).length > 0 ? stored : initialCapturedParams;

  const nextHref = decorateLeadIntentHref(href, {
    sourceUrl: window.location.href,
    eventName: trackedLink.eventName,
    siteKey: config.siteKey || '',
    persistedParams,
  });

  if (nextHref && nextHref !== href) {
    target.setAttribute('href', nextHref);
  }
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (target) decorate(target);
});
document.addEventListener('auxclick', (event) => {
  const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (target) decorate(target);
});
document.addEventListener('pointerdown', (event) => {
  const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (target) decorate(target);
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (target) decorate(target);
});
