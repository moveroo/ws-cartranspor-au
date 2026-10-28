// Embedded into the existing GA decorator; this function must be self-contained.
// Contract: Moving Cars PR120 / Moving Again PR68. No new activation or tracker.
export function quoteHandoffHref(href, sourceUrl, intentType, idFactory) {
  const campaignKeys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'fbclid',
  ];
  const leadKeys = ['lead_intent_id', 'source_site', 'source_path', 'intent_type'];
  const approved = [...campaignKeys, ...leadKeys];
  const protectedKeys = new Set([
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
  ]);

  function sanitizeValue(value) {
    const cleaned = String(value || '')
      .trim()
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .slice(0, 120);
    if (!cleaned || /@|%40/i.test(cleaned) || /\+?\d[\d\s().-]{7,}\d/.test(cleaned)) return '';
    return cleaned;
  }

  function validExistingValue(key, value) {
    if (!sanitizeValue(value)) return false;
    if (key === 'lead_intent_id') return /^[A-Za-z0-9._:-]+$/.test(value);
    if (key === 'source_site')
      return /^(?=.*[A-Za-z])[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/.test(
        value
      );
    if (key === 'source_path') return /^\/(?!\/)[A-Za-z0-9._~/-]*$/.test(value);
    if (key === 'intent_type') return ['quote_household', 'quote_vehicle'].includes(value);
    return true;
  }

  function parameters(search, destination) {
    const values = new Map();
    for (const part of search.replace(/^\?/, '').split('&')) {
      if (!part) continue;
      const separator = part.indexOf('=');
      let key;
      try {
        key = decodeURIComponent(
          (separator < 0 ? part : part.slice(0, separator)).replace(/\+/g, ' ')
        );
      } catch {
        return null;
      }
      if (destination && /[\x00-\x1f\x7f]/.test(key)) return null;
      const intakeKey = key
        .replace(/^ +/, '')
        .replace(/[ .]/g, '_')
        .split(/[\[\x00]/, 1)[0];
      const marker = intakeKey.trim().toLowerCase();
      if (
        destination &&
        (protectedKeys.has(marker.replace(/-/g, '_')) ||
          /^x[-_]amz[-_]|^x[-_]goog[-_]/.test(marker))
      )
        return null;
      if (key !== marker && approved.includes(marker)) return null;
      if (!approved.includes(key)) continue;
      if (values.has(key)) return null;
      let value;
      try {
        value = decodeURIComponent(
          (separator < 0 ? '' : part.slice(separator + 1)).replace(/\+/g, ' ')
        );
      } catch {
        return null;
      }
      if (destination && (/[\x00-\x1f\x7f]/.test(value) || !validExistingValue(key, value)))
        return null;
      values.set(key, destination ? value : sanitizeValue(value));
    }
    return values;
  }

  try {
    if (
      typeof href !== 'string' ||
      href !== href.trim() ||
      /[\x00-\x1f\x7f]/.test(href) ||
      !['quote_household', 'quote_vehicle'].includes(intentType)
    )
      return null;
    const source = new URL(sourceUrl);
    const destination = new URL(href, source);
    if (
      !['http:', 'https:'].includes(destination.protocol) ||
      destination.hostname === source.hostname ||
      destination.username ||
      destination.password
    )
      return null;
    const incoming = parameters(source.search, false);
    const existing = parameters(destination.search, true);
    if (!incoming || !existing) return null;
    for (const [key, value] of incoming) {
      if (value && existing.has(key) && value !== existing.get(key)) return null;
    }

    // Keep the site's original lead-ID, source-path and intent generation.
    const additions = new URLSearchParams();
    if (!existing.has('lead_intent_id')) additions.set('lead_intent_id', idFactory());
    if (!existing.has('source_site')) additions.set('source_site', source.hostname);
    if (!existing.has('source_path')) additions.set('source_path', source.pathname || '/');
    if (!existing.has('intent_type')) additions.set('intent_type', intentType);
    for (const key of campaignKeys) {
      if (!existing.has(key) && incoming.get(key)) additions.set(key, incoming.get(key));
    }
    if (!additions.size) return href;
    const hash = href.indexOf('#');
    const base = hash < 0 ? href : href.slice(0, hash);
    const fragment = hash < 0 ? '' : href.slice(hash);
    const separator = base.includes('?') ? (/[?&]$/.test(base) ? '' : '&') : '?';
    return base + separator + additions.toString() + fragment;
  } catch {
    return null;
  }
}
