import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Site-specific config: brand selectors that must survive every build.
// If a dependency upgrade silently drops the Tailwind theme, these disappear
// and the stylesheet shrinks, so the build fails instead of deploying unstyled.
export const DEFAULT_REQUIRED_TOKENS = [
  '.bg-brand-orange-500',
  '.text-brand-orange-500',
  '.text-brand-orange-700',
];

export const MIN_STYLESHEET_BYTES = 45 * 1024;
export const MAX_STYLESHEET_BYTES = 180 * 1024;

/**
 * Validates the compiled stylesheet for size bounds and brand token presence.
 */
export function validateCssIntegrity(cssContent, options = {}) {
  const minBytes = options.minBytes ?? MIN_STYLESHEET_BYTES;
  const maxBytes = options.maxBytes ?? MAX_STYLESHEET_BYTES;
  const requiredTokens = options.requiredTokens ?? DEFAULT_REQUIRED_TOKENS;

  const cssSize = Buffer.byteLength(cssContent ?? '');
  if (cssSize < minBytes) {
    throw new Error(
      `CSS Integrity Guard: compiled stylesheet is too small (${(cssSize / 1024).toFixed(1)} KiB < ${(minBytes / 1024).toFixed(1)} KiB floor). Possible theme drop or build failure.`
    );
  }
  if (cssSize > maxBytes) {
    throw new Error(
      `CSS Integrity Guard: compiled stylesheet exceeds threshold (${(cssSize / 1024).toFixed(1)} KiB > ${(maxBytes / 1024).toFixed(1)} KiB). Review for bloat.`
    );
  }

  const missing = requiredTokens.filter((token) => !cssContent.includes(token));
  if (missing.length > 0) {
    throw new Error(
      `CSS Integrity Guard: missing critical brand selectors in compiled CSS bundle: ${missing.join(', ')}`
    );
  }

  return { valid: true, sizeBytes: cssSize, verifiedTokens: requiredTokens };
}

/**
 * Every stylesheet the homepage links to must exist in the build output.
 */
export function validateHomepageStylesheetLinks(homepageHtml, outDir) {
  const hrefs = [...homepageHtml.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => /\brel=["']?stylesheet/i.test(tag))
    .map((tag) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1])
    .filter((href) => href && href.startsWith('/'));
  const hasInlineStyles = /<style\b/i.test(homepageHtml);
  if (hrefs.length === 0 && !hasInlineStyles) {
    throw new Error('CSS Integrity Guard: homepage has no stylesheet link or inline styles.');
  }
  const broken = hrefs.filter(
    (href) => !existsSync(path.join(outDir, href.split('?')[0].slice(1)))
  );
  if (broken.length > 0) {
    throw new Error(
      `CSS Integrity Guard: homepage links to missing stylesheets: ${broken.join(', ')}`
    );
  }
  return hrefs;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const outDir = path.resolve(process.argv[2] || 'dist');
  const astroDir = path.join(outDir, '_astro');

  let cssFiles = [];
  try {
    cssFiles = readdirSync(astroDir)
      .filter((file) => file.endsWith('.css'))
      .map((file) => path.join(astroDir, file));
  } catch (err) {
    console.error(`✖ CSS Integrity Guard: failed to read ${astroDir}: ${err.message}`);
    process.exit(1);
  }
  if (cssFiles.length === 0) {
    console.error(`✖ CSS Integrity Guard: no compiled .css files found in ${astroDir}.`);
    process.exit(1);
  }

  // Validate the largest emitted stylesheet (the shared Tailwind bundle).
  const primaryCssPath = cssFiles
    .map((file) => ({ file, size: readFileSync(file).length }))
    .sort((a, b) => b.size - a.size)[0].file;

  try {
    const result = validateCssIntegrity(readFileSync(primaryCssPath, 'utf8'));
    const homepagePath = path.join(outDir, 'index.html');
    if (!existsSync(homepagePath))
      throw new Error(`CSS Integrity Guard: ${homepagePath} not found.`);
    validateHomepageStylesheetLinks(readFileSync(homepagePath, 'utf8'), outDir);
    console.log(
      `✔ CSS Integrity Guard passed: ${path.basename(primaryCssPath)} (${(result.sizeBytes / 1024).toFixed(1)} KiB) verified with ${result.verifiedTokens.length} critical brand tokens; homepage stylesheet links resolve.`
    );
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  }
}
