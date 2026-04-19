import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const checks = [];
  const seo = await read('src/components/SEO.astro');
  const envExample = await read('.env.example');

  checks.push(['SEO component exists', await exists('src/components/SEO.astro')]);
  checks.push(['BrainAnalytics component exists', await exists('src/components/BrainAnalytics.astro')]);
  checks.push(['Analytics component exists', await exists('src/components/Analytics.astro')]);
  checks.push(['SEO imports BrainAnalytics', seo.includes("import BrainAnalytics from './BrainAnalytics.astro';")]);
  checks.push(['SEO includes Matomo rollout', seo.includes('PUBLIC_MATOMO_BASE_URL') && seo.includes('PUBLIC_MATOMO_SITE_ID')]);
  checks.push(['SEO renders BrainAnalytics', seo.includes('<BrainAnalytics />')]);
  checks.push(['.env.example includes PUBLIC_MATOMO_BASE_URL=', envExample.includes('PUBLIC_MATOMO_BASE_URL=')]);
  checks.push(['.env.example includes PUBLIC_MATOMO_SITE_ID=', envExample.includes('PUBLIC_MATOMO_SITE_ID=')]);

  const failures = checks.filter(([, passed]) => !passed);
  for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
