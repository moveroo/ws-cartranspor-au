import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const vehicleAssistantLoader =
  'src="https://quotes.moveroo.com.au/embed/vehicle-assistant/v1/loader.js"';

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

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
  const packageJson = JSON.parse(await read('package.json'));
  const seo = await read('src/components/SEO.astro');
  const envExample = await read('.env.example');
  const siteConfig = await read('src/config/site.ts');
  const analyticsWrapper = await read('src/components/analytics/Analytics.astro');
  const layout = await read('src/layouts/Layout.astro');
  const notFoundPage = await read('src/pages/404.astro');
  const vercelConfig = await read('vercel.json');
  const netlifyConfig = await read('netlify.toml');

  for (const scriptName of ['check', 'check:contract', 'check:seo']) {
    checks.push([
      `package.json includes ${scriptName}`,
      Boolean(packageJson.scripts?.[scriptName]),
    ]);
  }

  checks.push(['SEO component exists', await exists('src/components/SEO.astro')]);
  checks.push([
    'BrainAnalytics component exists',
    await exists('src/components/BrainAnalytics.astro'),
  ]);
  checks.push([
    'analytics wrapper exists',
    await exists('src/components/analytics/Analytics.astro'),
  ]);
  checks.push(['ga4 wrapper exists', await exists('src/components/analytics/Ga4.astro')]);
  checks.push(['matomo wrapper exists', await exists('src/components/analytics/Matomo.astro')]);
  checks.push([
    'SEO imports analytics wrapper',
    seo.includes("import Analytics from './analytics/Analytics.astro';"),
  ]);
  checks.push(['SEO renders analytics wrapper', seo.includes('<Analytics />')]);
  checks.push([
    'analytics wrapper includes Ga4',
    analyticsWrapper.includes("import Ga4 from './Ga4.astro';"),
  ]);
  checks.push([
    'analytics wrapper includes Matomo',
    analyticsWrapper.includes("import Matomo from './Matomo.astro';"),
  ]);
  checks.push(['site config includes destinations', siteConfig.includes('destinations: {')]);
  checks.push(['SEO links RSS feed', seo.includes('application/rss+xml')]);
  checks.push(['vehicle assistant uses central loader', layout.includes(vehicleAssistantLoader)]);
  checks.push([
    'vehicle assistant loads once in primary layout',
    countOccurrences(layout, vehicleAssistantLoader) === 1,
  ]);
  checks.push([
    'vehicle assistant channel is chatbot-widget',
    layout.includes('data-channel="chatbot-widget"'),
  ]);
  checks.push([
    'vehicle assistant surface is main-domain-sitewide',
    layout.includes('data-surface="main-domain-sitewide"'),
  ]);
  checks.push([
    'vehicle assistant loads on standalone 404',
    notFoundPage.includes(vehicleAssistantLoader) &&
      notFoundPage.includes('data-channel="chatbot-widget"') &&
      notFoundPage.includes('data-surface="main-domain-sitewide"'),
  ]);
  checks.push([
    'vehicle assistant loads once on standalone 404',
    countOccurrences(notFoundPage, vehicleAssistantLoader) === 1,
  ]);
  for (const configText of [vercelConfig, netlifyConfig]) {
    checks.push([
      'vehicle assistant CSP allows central script',
      configText.includes("script-src 'self' 'unsafe-inline' https://quotes.moveroo.com.au"),
    ]);
    checks.push([
      'vehicle assistant CSP allows central connect',
      configText.includes('connect-src') && configText.includes('https://quotes.moveroo.com.au'),
    ]);
    checks.push([
      'vehicle assistant CSP allows central frame',
      configText.includes('frame-src https://quotes.moveroo.com.au'),
    ]);
  }
  for (const relativePath of [
    'src/pages/rss.xml.ts',
    'src/pages/sitemap.astro',
    'src/pages/robots.txt.ts',
    'src/pages/privacy.astro',
    'src/pages/terms.astro',
    'src/config/site.ts',
    'docs/migration-ledger.md',
    'docs/redirect-map.md',
    'docs/live-cutover-status.md',
    'docs/homepage-audit.md',
    'docs/indexed-valid-inventory.md',
    'docs/nonindexed-redirect-strategy.md',
    'docs/nonindexed-redirect-report.md',
  ]) {
    checks.push([`${relativePath} exists`, await exists(relativePath)]);
  }
  checks.push([
    '.env.example includes PUBLIC_ANALYTICS_PROVIDER=',
    envExample.includes('PUBLIC_ANALYTICS_PROVIDER='),
  ]);
  checks.push([
    '.env.example includes PUBLIC_GA_MEASUREMENT_ID=',
    envExample.includes('PUBLIC_GA_MEASUREMENT_ID='),
  ]);
  checks.push([
    '.env.example includes PUBLIC_MATOMO_BASE_URL=',
    envExample.includes('PUBLIC_MATOMO_BASE_URL='),
  ]);
  checks.push([
    '.env.example includes PUBLIC_MATOMO_SITE_ID=',
    envExample.includes('PUBLIC_MATOMO_SITE_ID='),
  ]);

  const failures = checks.filter(([, passed]) => !passed);
  for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
