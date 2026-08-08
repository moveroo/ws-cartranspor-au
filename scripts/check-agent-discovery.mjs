import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = {
  domain: 'cartransport.au',
  siteUrl: 'https://cartransport.au/',
  quoteRoot: 'https://quoting.cartransport.au/',
  contact: 'https://quoting.cartransport.au/contact',
  householdQuote: 'https://quoting.cartransport.au/quote/household',
  vehicleQuote: 'https://quoting.cartransport.au/quote/vehicle',
  openApi: 'https://quoting.cartransport.au/openapi.json',
  quoteCapability: 'https://quoting.cartransport.au/quote-capability.json',
  householdPublicAgentApi:
    'https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit',
  vehiclePublicAgentApi: 'https://quoting.cartransport.au/api/v1/vehicle-quotes/assistant/submit',
  callbackPublicAgentApi: 'https://quoting.cartransport.au/api/v1/callbacks/assistant/request',
};
const requiredFiles = [
  'src/pages/agents.astro',
  'src/pages/agents/examples.astro',
  'src/pages/index.md.ts',
  'src/pages/llms.txt.ts',
  'src/pages/.well-known/llms.txt.ts',
  'src/pages/.well-known/ai-catalog.json.ts',
  'src/pages/.well-known/agent-skills/index.json.ts',
];
const requiredAgentAllows = [
  '/agents/',
  '/agents/examples/',
  '/llms.txt',
  '/.well-known/llms.txt',
  '/index.md',
  '/openapi.json',
  '/quote-capability.json',
  '/.well-known/ai-catalog.json',
  '/.well-known/agent-skills/index.json',
  '/.well-known/ai-plugin.json',
];

let failed = false;
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`Missing agent discovery file: ${file}`);
    failed = true;
  }
}

const searchableFiles = requiredFiles.filter((file) => fs.existsSync(path.join(root, file)));
const haystack = searchableFiles
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');

for (const [label, value] of Object.entries(required)) {
  if (!haystack.includes(value)) {
    console.error(`Agent discovery missing ${label}: ${value}`);
    failed = true;
  }
}

const robotsRoute = fs.readFileSync(path.join(root, 'src/pages/robots.txt.ts'), 'utf8');
const sitemapDeclarations = [...robotsRoute.matchAll(/Sitemap:\s+(https?:\/\/.*?)(?=\\n)/g)].map(
  (match) => match[1]
);

if (sitemapDeclarations.length === 0) {
  console.error('robots.txt must declare at least one sitemap');
  failed = true;
}

for (const sitemapUrl of sitemapDeclarations) {
  if (!new URL(sitemapUrl).pathname.endsWith('.xml')) {
    console.error(`robots.txt declares a non-XML sitemap: ${sitemapUrl}`);
    failed = true;
  }
}

for (const resource of requiredAgentAllows) {
  if (!robotsRoute.includes(`Allow: ${resource}`)) {
    console.error(`robots.txt missing agent resource Allow: ${resource}`);
    failed = true;
  }
}

const examplesPage = fs.readFileSync(path.join(root, 'src/pages/agents/examples.astro'), 'utf8');
if (
  !examplesPage.includes("const canonical = 'https://cartransport.au/agents/examples/';") ||
  !examplesPage.includes('<link rel="canonical" href={canonical} />')
) {
  console.error('/agents/examples/ must declare its production self-canonical');
  failed = true;
}

if (fs.existsSync(path.join(root, 'vercel.json'))) {
  const vercel = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8');
  for (const value of [
    '/openapi.json',
    '/quote-capability.json',
    '/.well-known/ai-plugin.json',
    '/.well-known/agent-skills/index.json',
    '/.well-known/llms.txt',
  ]) {
    if (!vercel.includes(value)) {
      console.error(`Vercel discovery header/redirect missing ${value}`);
      failed = true;
    }
  }
}

const agentSkillResources = [
  'src/pages/.well-known/agent-skills/household-quote/SKILL.md.ts',
  'src/pages/.well-known/agent-skills/vehicle-quote/SKILL.md.ts',
  'src/pages/.well-known/agent-skills/callback-request/SKILL.md.ts',
  'src/pages/.well-known/agent-skills/agent-discovery/SKILL.md.ts',
];
const agentSkillUrls = [
  'https://cartransport.au/.well-known/agent-skills/household-quote/SKILL.md',
  'https://cartransport.au/.well-known/agent-skills/vehicle-quote/SKILL.md',
  'https://cartransport.au/.well-known/agent-skills/callback-request/SKILL.md',
  'https://cartransport.au/.well-known/agent-skills/agent-discovery/SKILL.md',
];
const agentSkillIndexPath = path.join(
  process.cwd(),
  'src/pages/.well-known/agent-skills/index.json.ts'
);

for (const file of ['src/lib/agentSkillDocument.ts', ...agentSkillResources]) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`Missing bounded Agent Skill file: ${file}`);
    failed = true;
  }
}

if (fs.existsSync(agentSkillIndexPath)) {
  const agentSkillIndex = fs.readFileSync(agentSkillIndexPath, 'utf8');
  const declaredUrls = agentSkillUrls.filter((url) => agentSkillIndex.includes(url));

  if (
    declaredUrls.length !== agentSkillUrls.length ||
    new Set(declaredUrls).size !== agentSkillUrls.length
  ) {
    console.error('Agent Skills index must advertise one distinct URL for every bounded skill.');
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`Agent discovery contract OK for ${required.domain}`);
