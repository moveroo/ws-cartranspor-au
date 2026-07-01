#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const endpoint = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const batchSize = 5000;

function argSet() {
  return new Set(process.argv.slice(2));
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function normalizeSiteUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/$/, '');
}

function siteUrlFromManifest(manifest) {
  return (
    process.env.PUBLIC_SITE_URL ||
    manifest.productionUrl ||
    manifest.site?.canonicalUrl ||
    (manifest.domain ? 'https://' + manifest.domain : null) ||
    (manifest.site?.domain ? 'https://' + manifest.site.domain : null) ||
    (manifest.indexNow?.keyFileUrl ? new URL(manifest.indexNow.keyFileUrl).origin : null)
  );
}

function validateKey(key) {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
    throw new Error(
      'IndexNow key must be 8-128 characters and contain only letters, numbers, underscores, or dashes.'
    );
  }
  return key;
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi), (match) => match[1].trim());
}

async function readSitemapUrlLocs(distDir, siteUrl, file) {
  const xml = await fs.readFile(file, 'utf8');
  const locs = extractLocs(xml);
  const urls = [];
  const nested = [];

  for (const loc of locs) {
    if (/\.xml(?:$|[?#])/i.test(loc)) {
      nested.push(loc);
    } else {
      urls.push(loc);
    }
  }

  for (const nestedLoc of nested) {
    const nestedUrl = new URL(nestedLoc, siteUrl + '/');
    const nestedPath = path.join(distDir, path.basename(nestedUrl.pathname));
    if (await exists(nestedPath)) {
      urls.push(...(await readSitemapUrlLocs(distDir, siteUrl, nestedPath)));
    }
  }

  return urls;
}

async function findDistDirs() {
  const dirs = [path.join(root, 'dist'), path.join(root, 'dist', 'client')];
  const existing = [];

  for (const dir of dirs) {
    if (await exists(dir)) {
      existing.push(dir);
    }
  }

  return existing;
}

async function sitemapUrls(siteUrl) {
  const candidates = [
    'sitemap-index.xml',
    'sitemap.xml',
    'sitemaps.xml',
    'sitemap_index.xml',
    'sitemap-0.xml',
  ];

  for (const distDir of await findDistDirs()) {
    for (const candidate of candidates) {
      const file = path.join(distDir, candidate);
      if (await exists(file)) {
        return readSitemapUrlLocs(distDir, siteUrl, file);
      }
    }
  }

  throw new Error('No sitemap XML file found in dist. Run the Astro build first.');
}

function normalizeUrls(rawUrls, siteUrl) {
  const site = new URL(siteUrl);
  const urls = [];

  for (const raw of rawUrls) {
    const url = new URL(raw, siteUrl + '/');
    url.hash = '';
    url.search = '';

    if (url.protocol !== 'https:') continue;
    if (url.hostname !== site.hostname) continue;
    if (url.pathname.startsWith('/api/')) continue;
    if (url.pathname.includes('/template-')) continue;

    urls.push(url.toString());
  }

  return Array.from(new Set(urls)).sort();
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function submissionStatus(httpStatus) {
  if (httpStatus === 200) return 'submitted';
  if (httpStatus === 202) return 'accepted_pending_key_validation';
  return 'failed';
}

function shouldRetryStatus(httpStatus) {
  return [403, 429, 500, 502, 503, 504].includes(httpStatus);
}

async function postBatch(payload, retryFailed) {
  const delays = retryFailed ? [3000, 10000] : [];
  let attempts = 0;

  for (const delay of [0, ...delays]) {
    if (delay > 0) await sleep(delay);
    attempts += 1;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (!retryFailed || !shouldRetryStatus(response.status) || attempts > delays.length) {
        return { httpStatus: response.status, status: submissionStatus(response.status), attempts };
      }
    } catch (error) {
      if (!retryFailed || attempts > delays.length) {
        return {
          httpStatus: null,
          status: 'failed',
          attempts,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  return { httpStatus: null, status: 'failed', attempts };
}

async function submit({ host, key, keyLocation, urls, dryRun, retryFailed }) {
  const batches = chunk(urls, batchSize);
  const results = [];

  for (const [index, urlList] of batches.entries()) {
    const payload = { host, key, keyLocation, urlList };

    if (dryRun) {
      results.push({
        batch: index + 1,
        urlCount: urlList.length,
        httpStatus: null,
        status: 'dry_run',
        attempts: 0,
      });
      continue;
    }

    results.push({
      batch: index + 1,
      urlCount: urlList.length,
      ...(await postBatch(payload, retryFailed)),
    });
  }

  return results;
}

async function main() {
  const args = argSet();
  const auto = args.has('--auto');
  const dryRun = args.has('--dry-run') || (!args.has('--live') && !auto);
  const force = args.has('--force') || process.env.INDEXNOW_FORCE === 'true';
  const isProductionDeploy =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NETLIFY === 'true' && process.env.CONTEXT === 'production');

  if (auto && !isProductionDeploy && !force) {
    console.log('IndexNow auto-submit skipped outside production deploy.');
    return;
  }

  const manifest = await readJson(path.join(root, 'bossman-site-manifest.json'));
  const siteUrl = normalizeSiteUrl(siteUrlFromManifest(manifest));
  const host = new URL(siteUrl).hostname;
  const indexNow = manifest.indexNow || {};
  const key = validateKey((indexNow.key || process.env.INDEXNOW_KEY || '').trim());
  const keyLocation =
    process.env.INDEXNOW_KEY_LOCATION || indexNow.keyFileUrl || siteUrl + '/' + key + '.txt';
  const urls = normalizeUrls(await sitemapUrls(siteUrl), siteUrl);

  if (urls.length === 0) {
    throw new Error('No same-host HTTPS sitemap URLs found for IndexNow submission.');
  }

  const results = await submit({ host, key, keyLocation, urls, dryRun, retryFailed: auto });
  const failed = results.filter((result) => result.status === 'failed');
  const proof = {
    schema: 'indexnow-auto-submit-proof-v1',
    domain: host,
    mode: dryRun ? 'dry_run' : 'live',
    trigger: auto ? 'production_deploy' : 'manual',
    urlCount: urls.length,
    batchCount: results.length,
    urlsSha256: sha256(urls.join('\n')),
    endpoint,
    keyLocation: '[redacted]',
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    submittedAt: new Date().toISOString(),
    results,
  };

  console.log(JSON.stringify(proof, null, 2));

  if (failed.length > 0 && !auto) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
