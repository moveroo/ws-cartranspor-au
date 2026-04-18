import fs from 'node:fs';
import path from 'node:path';

const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function walk(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) {
    return total;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += walk(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.md') || fullPath.endsWith('.mdx'))) {
      total += 1;
    }
  }

  return total;
}

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const robotsRoute = fs.readFileSync(new URL('../src/pages/robots.txt.ts', import.meta.url), 'utf8');
const layoutSource = fs.readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const contentDocs = walk(new URL('../src/content', import.meta.url).pathname);

assert(packageJson.scripts.check, 'package.json is missing the check script');
assert(packageJson.scripts['check:seo'], 'package.json is missing the check:seo script');
assert(
  robotsRoute.includes('PUBLIC_SITE_URL') || robotsRoute.includes('SITE_URL'),
  'robots.txt route must use canonical site URL env vars'
);
assert(
  !robotsRoute.includes('import.meta.env.SITE}/sitemap-index.xml'),
  'robots.txt route is still deriving sitemap URLs from import.meta.env.SITE'
);
assert(
  layoutSource.includes('Vehicle Transport Australia'),
  'layout no longer identifies the Vehicle Transport Australia brand'
);
assert(contentDocs >= 1, 'expected at least some markdown content under src/content');

if (failures.length > 0) {
  console.error('CarTransport.au SEO checks failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('CarTransport.au SEO checks passed.');
