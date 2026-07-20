import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const approvedContactUrl = 'https://quoting.cartransport.au/contact';
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const netlify = read('netlify.toml');

for (const source of [
  '/contact',
  '/contact/',
  '/contact-us',
  '/contact-us/',
  '/contact-page',
  '/contact-page/',
  '/contact-au',
  '/contact-au/',
]) {
  const redirectBlock = `[[redirects]]
  from = "${source}"
  to = "${approvedContactUrl}"
  status = 301
  force = true`;
  if (!netlify.includes(redirectBlock)) {
    throw new Error(`${source} must permanently redirect to ${approvedContactUrl}`);
  }
}

const fallback = read('src/pages/contact.astro');
if (
  !fallback.includes(`const contactUrl = '${approvedContactUrl}';`) ||
  !fallback.includes('noindex, follow') ||
  !fallback.includes('content={`0; url=${contactUrl}`}') ||
  !fallback.includes('<link rel="canonical" href={contactUrl} />')
) {
  throw new Error('The contact route must provide the approved noindex portal fallback');
}

const collectFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
const prohibitedDirectLinkOrEmail =
  /href=["'](?:tel:|mailto:)|mailto:|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const prohibitedAustralianPhone =
  /(?:^|\D)(?:(?:\+?61\s*(?:2|3|7|8)|0[2378])(?:[\s()-]*\d){8}|(?:\+?61\s*4|04)(?:[\s-]*\d){8}|(?:1300|1800)(?:[\s-]*\d){6}|13(?:[\s-]*\d){4})(?!\d)/;
const prohibitedPlaceholderPhone = /\b(?:1300|1800|13)(?:[\s-]*X){3,6}\b/i;

const scanPublicText = (directory, label) => {
  for (const path of collectFiles(directory)) {
    if (!/\.(?:astro|html?|json|txt|xml|svg|ts|js|css|md)$/i.test(path)) continue;
    const contents = readFileSync(path, 'utf8')
      .replaceAll('customer@example.com', '')
      .replaceAll('0400000000', '');
    const phoneContents = path.endsWith('.css')
      ? [...contents.matchAll(/content\s*:\s*([^;}]+)/gi)].map((match) => match[1]).join(' ')
      : contents;
    if (
      prohibitedDirectLinkOrEmail.test(contents) ||
      prohibitedAustralianPhone.test(phoneContents) ||
      prohibitedPlaceholderPhone.test(phoneContents)
    ) {
      throw new Error(`${path} contains a ${label} direct contact channel`);
    }
  }
};

scanPublicText(resolve(root, 'src'), 'source');
scanPublicText(resolve(root, 'public'), 'deployable');
scanPublicText(resolve(root, 'brand'), 'brand handoff');

const brandHandoff = JSON.parse(read('brand/moveroo-subdomain.json'));
if (
  brandHandoff.behavior?.show_phone_publicly !== false ||
  brandHandoff.behavior?.show_email_publicly !== false ||
  brandHandoff.behavior?.prefer_contact_page_over_direct_contact !== true ||
  Object.values(brandHandoff.contact ?? {}).some((value) => value !== null)
) {
  throw new Error('The quote-subdomain brand handoff must remain portal-only');
}

if (process.argv.includes('--dist')) {
  scanPublicText(resolve(root, 'dist'), 'rendered');
  const sitemapXml = collectFiles(resolve(root, 'dist'))
    .filter((path) => path.split('/').at(-1)?.startsWith('sitemap') && path.endsWith('.xml'))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  if (sitemapXml.includes('<loc>https://cartransport.au/contact/</loc>')) {
    throw new Error('/contact/ must not appear in generated sitemaps');
  }
}

console.log('Contact routing contract is valid.');
