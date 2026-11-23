export const CAMPAIGN_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
];

export const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];

export const APPROVED_SOURCE_KEYS = [...CAMPAIGN_KEYS, ...CLICK_ID_KEYS];

export const ATTRIBUTION_STORAGE_KEY = 'mh_lead_attribution_v1';

export const LEAD_INTENT_BY_EVENT = {
  quote_household_click: 'quote_household',
  quote_vehicle_click: 'quote_vehicle',
  booking_household_click: 'booking_household',
  contact_intent_click: 'contact',
};

export const ACTIVATION_EVENTS = ['click', 'auxclick', 'pointerdown', 'keydown'];

const PROTECTED_DESTINATION_KEYS = new Set([
  'signature',
  'sig',
  'googleaccessid',
  'awsaccesskeyid',
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
]);

const PLACEHOLDER_CLICK_ID_RE =
  /^(?:should-not-.*|control(?:[-_].*)?|test|fake|dummy|example|null|undefined)$/i;

export function isSensitiveValue(value) {
  if (typeof value !== 'string' || !value) return false;
  const patterns = [
    /[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i,
    /(?:@|%40)/i,
    /(?<!\d)(?:\+?61|0)[2-478](?:[\s.-]?\d){8}(?!\d)/,
    /(?:\(0[2-478]\)|\+61\s*\(?0?\)?[2-478])(?:[\s.-]?\d){6,10}(?!\d)/,
    /(?<!\d)\d{2,4}[\s.-]\d{3,4}[\s.-]\d{3,4}(?!\d)/,
    /(?<!\d)\+(?:[1-9]\d{0,3})(?:[\s.-]?\d){7,14}(?!\d)/,
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
    /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}\b/i,
    /\bsk-proj-[A-Za-z0-9_-]{8,}\b/i,
    /\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_-]{8,}\b/i,
    /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
    /\bSG\.[A-Za-z0-9._-]{12,}\b/i,
    /\bxox[baprs]-[A-Za-z0-9-]{16,}\b/i,
    /\b(?:ya29|oauth2)[._-][A-Za-z0-9._~+\/=\-]{16,}\b/i,
    /\bBearer\s+\S+/i,
    /\b(?:Proxy-)?Authorization\s*[:=]\s*\S+/i,
    /(?<![A-Za-z0-9])(?:password|passwd|secret|credential|api[_-]?key|bearer|authorization|session[_-]?id|cookie|access[_-]?token|token)\s*[:=]/i,
    /(?:https?:\/\/|\/\/|[?&][A-Za-z0-9_-]+=)/i,
  ];

  let candidate = value;
  for (let layer = 0; layer <= 3; layer += 1) {
    if (patterns.some((pattern) => pattern.test(candidate))) return true;
    if (!/%[0-9a-f]{2}/i.test(candidate)) break;
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) break;
      candidate = decoded;
    } catch {
      return true;
    }
  }
  return false;
}

export function sanitizeValue(value, maxLength = 120) {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/[\u0000-\u001F\u007F\uFFFD]/g, '')
    .slice(0, maxLength);
  if (!cleaned || isSensitiveValue(cleaned)) return '';
  return cleaned;
}

export function sanitizeClickId(value) {
  const cleaned = sanitizeValue(value, 256);
  if (!cleaned) return '';
  if (!/^[A-Za-z0-9._:-]+$/.test(cleaned)) return '';
  if (PLACEHOLDER_CLICK_ID_RE.test(cleaned)) return '';
  return cleaned;
}

export function sanitizePath(pathname) {
  let clean = String(pathname || '/')
    .split('?')[0]
    .split('#')[0]
    .replace(/[\u0000-\u001F\u007F\uFFFD]/g, '')
    .trim();
  if (!clean) return '/';
  if (!clean.startsWith('/')) clean = `/${clean}`;
  if (/^\/\//.test(clean) || isSensitiveValue(clean)) return '/';
  return clean.slice(0, 512);
}

export function sanitizeSourceSite(hostname) {
  const clean = String(hostname || '')
    .trim()
    .toLowerCase();
  if (
    !clean ||
    clean.length > 120 ||
    isSensitiveValue(clean) ||
    !/^(?=.*[a-z])[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/.test(
      clean
    )
  ) {
    return '';
  }
  return clean;
}

export function hasProtectedDestinationParams(url) {
  try {
    const parsed = url instanceof URL ? url : new URL(String(url));
    for (const rawKey of parsed.searchParams.keys()) {
      const marker = String(rawKey || '')
        .trim()
        .toLowerCase()
        .replace(/-/g, '_');
      if (PROTECTED_DESTINATION_KEYS.has(marker) || /^(?:x_amz|x_goog)_/.test(marker)) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export function createLeadIntentId(siteKey = '') {
  const safeSite =
    String(siteKey || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'site';

  let rand = Math.random().toString(36).slice(2, 12);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(2);
    globalThis.crypto.getRandomValues(buf);
    rand = Array.from(buf, (n) => n.toString(36)).join('');
  }

  return `li_${safeSite}_${Date.now().toString(36)}_${rand}`.slice(0, 120);
}

export function normalizeTrackedHref(href) {
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname}`.replace(/\/$/, '');
  } catch {
    return String(href || '').replace(/\/$/, '');
  }
}

export function collectApprovedSourceParams(sourceUrl) {
  const source = sourceUrl instanceof URL ? sourceUrl : new URL(String(sourceUrl));
  const approved = {};
  for (const key of CAMPAIGN_KEYS) {
    const value = sanitizeValue(source.searchParams.get(key), 120);
    if (value) approved[key] = value;
  }
  for (const key of CLICK_ID_KEYS) {
    const value = sanitizeClickId(source.searchParams.get(key));
    if (value) approved[key] = value;
  }
  return approved;
}

function sanitizeStoredParamsObject(rawParams) {
  if (!rawParams || typeof rawParams !== 'object' || Array.isArray(rawParams)) {
    return {};
  }
  const clean = {};
  for (const key of CAMPAIGN_KEYS) {
    const val = sanitizeValue(rawParams[key], 120);
    if (val) clean[key] = val;
  }
  for (const key of CLICK_ID_KEYS) {
    const val = sanitizeClickId(rawParams[key]);
    if (val) clean[key] = val;
  }
  return clean;
}

function readStoredRecord(storage) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return {
      params: sanitizeStoredParamsObject(parsed.params),
      landingPath: sanitizePath(parsed.landingPath || '/'),
      capturedAt: typeof parsed.capturedAt === 'number' ? parsed.capturedAt : null,
    };
  } catch {
    return null;
  }
}

export function readStoredAttribution(storage) {
  const record = readStoredRecord(storage);
  return record ? record.params : {};
}

export function captureLandingAttribution(sourceUrl, storage) {
  try {
    const source = sourceUrl instanceof URL ? sourceUrl : new URL(String(sourceUrl));
    const currentParams = collectApprovedSourceParams(source);
    const existing = readStoredRecord(storage);

    if (Object.keys(currentParams).length > 0) {
      if (storage && typeof storage.setItem === 'function') {
        try {
          storage.setItem(
            ATTRIBUTION_STORAGE_KEY,
            JSON.stringify({
              params: currentParams,
              landingPath: existing?.landingPath || sanitizePath(source.pathname),
              capturedAt: Date.now(),
            })
          );
        } catch {
          // ignore storage quota/private mode errors
        }
      }
      return currentParams;
    }

    return existing ? existing.params : {};
  } catch {
    return readStoredAttribution(storage);
  }
}

export function decorateLeadIntentHref(
  href,
  { sourceUrl, eventName, siteKey = '', persistedParams = null, idFactory = null } = {}
) {
  try {
    const intentType = LEAD_INTENT_BY_EVENT[eventName];
    if (!intentType || typeof href !== 'string' || !href.trim()) return href;

    const source = sourceUrl instanceof URL ? sourceUrl : new URL(String(sourceUrl));
    const target = new URL(href, source);
    if (!['http:', 'https:'].includes(target.protocol)) return href;
    if (hasProtectedDestinationParams(target)) return href;

    const currentParams = collectApprovedSourceParams(source);
    const storedParams = sanitizeStoredParamsObject(persistedParams);
    const effectiveParams = { ...storedParams, ...currentParams };

    if (!target.searchParams.has('lead_intent_id')) {
      const rawId =
        typeof idFactory === 'function'
          ? idFactory()
          : createLeadIntentId(siteKey || source.hostname);
      const cleanId = sanitizeValue(rawId, 120);
      if (cleanId && /^[A-Za-z0-9._:-]{1,120}$/.test(cleanId)) {
        target.searchParams.set('lead_intent_id', cleanId);
      }
    }

    if (!target.searchParams.has('source_site')) {
      const cleanSite = sanitizeSourceSite(source.hostname);
      if (cleanSite) target.searchParams.set('source_site', cleanSite);
    }

    if (!target.searchParams.has('source_path')) {
      target.searchParams.set('source_path', sanitizePath(source.pathname));
    }

    if (!target.searchParams.has('intent_type')) {
      target.searchParams.set('intent_type', intentType);
    }

    for (const [key, value] of Object.entries(effectiveParams)) {
      if (!target.searchParams.has(key) && value) {
        target.searchParams.set(key, value);
      }
    }

    return target.toString();
  } catch {
    return href;
  }
}
