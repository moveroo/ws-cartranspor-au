import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const homepagePath = path.resolve(process.cwd(), 'dist', 'index.html');

if (!fs.existsSync(homepagePath)) {
  console.error(
    'Built homepage not found at dist/index.html. Run `npm run build` before this check to validate rendered output.'
  );
  process.exit(1);
}

const html = fs.readFileSync(homepagePath, 'utf8');
const { document } = new JSDOM(html).window;

const h1Elements = Array.from(document.querySelectorAll('h1'));
const visibleH1s = h1Elements.filter((h1) => {
  if (!h1.textContent || !h1.textContent.trim()) {
    return false;
  }

  if (h1.hasAttribute('hidden')) {
    return false;
  }

  for (let node = h1; node; node = node.parentElement) {
    if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') {
      return false;
    }
  }

  return true;
});

if (visibleH1s.length !== 1) {
  const labels = visibleH1s.map((h1, index) => `${index + 1}: ${h1.textContent.trim()}`).join('\n  - ');
  console.error(`Expected exactly 1 visible homepage H1, found ${visibleH1s.length}.`);
  if (labels) {
    console.error(`Detected H1s:\n  - ${labels}`);
  }
  process.exit(1);
}

console.log(`Homepage H1 guard passed: ${visibleH1s.length} visible H1 heading found.`);
