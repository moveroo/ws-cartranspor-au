import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  DEFAULT_REQUIRED_TOKENS,
  MIN_STYLESHEET_BYTES,
  validateCssIntegrity,
  validateHomepageStylesheetLinks,
} from './check-css-integrity.mjs';

const padding = 'a'.repeat(MIN_STYLESHEET_BYTES + 1024);
const goodCss = DEFAULT_REQUIRED_TOKENS.join('{}') + '{}' + padding;

test('passes when stylesheet meets size bounds and includes all required tokens', () => {
  const result = validateCssIntegrity(goodCss);
  assert.equal(result.valid, true);
  assert.equal(result.verifiedTokens.length, DEFAULT_REQUIRED_TOKENS.length);
});

test('fails if compiled stylesheet is below size floor', () => {
  assert.throws(() => validateCssIntegrity(DEFAULT_REQUIRED_TOKENS.join(' ')), /too small/);
});

test('fails if compiled stylesheet is missing a critical brand token', () => {
  const [dropped, ...rest] = DEFAULT_REQUIRED_TOKENS;
  assert.throws(
    () => validateCssIntegrity(rest.join('{}') + padding),
    new RegExp(`missing critical brand selectors.*${dropped.replace(/[.\\]/g, '\\$&')}`)
  );
});

test('fails if homepage links to a stylesheet missing from the build', () => {
  const outDir = mkdtempSync(path.join(tmpdir(), 'css-guard-'));
  mkdirSync(path.join(outDir, '_astro'));
  writeFileSync(path.join(outDir, '_astro', 'Layout.abc.css'), goodCss);
  const ok = '<head><link rel="stylesheet" href="/_astro/Layout.abc.css"></head>';
  assert.deepEqual(validateHomepageStylesheetLinks(ok, outDir), ['/_astro/Layout.abc.css']);
  const bad = '<head><link rel="stylesheet" href="/_astro/Layout.gone.css"></head>';
  assert.throws(() => validateHomepageStylesheetLinks(bad, outDir), /missing stylesheets/);
});

test('fails if homepage has no styles at all', () => {
  assert.throws(() => validateHomepageStylesheetLinks('<head></head>', tmpdir()), /no stylesheet/);
});
