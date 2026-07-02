import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const leadIntentEvents = {
  household: 'quote_household_click',
  vehicle: 'quote_vehicle_click',
  booking: 'booking_household_click',
  contact: 'contact_intent_click',
};

const deprecatedLeadIntentEvents = new Set([
  'booking_click',
  'callback_request_click',
  'callback_page_click',
]);

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
}

function findArray(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openIndex; index < text.length; index += 1) {
    const character = text[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === '[') depth += 1;
    if (character === ']') {
      depth -= 1;
      if (depth === 0) return text.slice(openIndex + 1, index);
    }
  }

  return null;
}

function findRuntimeTrackedLinkArrays(text) {
  const arrays = [];
  const trackedLinksPattern = /trackedLinks\s*:/g;
  let match;

  while ((match = trackedLinksPattern.exec(text))) {
    const propertyPreview = text.slice(match.index, match.index + 80);
    if (/trackedLinks\s*:\s*Array/.test(propertyPreview)) continue;

    const openIndex = text.indexOf('[', match.index);
    if (openIndex === -1) continue;

    const arrayContent = findArray(text, openIndex);
    if (arrayContent) arrays.push(arrayContent);
  }

  return arrays;
}

function splitObjects(arrayContent) {
  const objects = [];
  let start = -1;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < arrayContent.length; index += 1) {
    const character = arrayContent[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === '{') {
      if (depth === 0) start = index;
      depth += 1;
    }

    if (character === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(arrayContent.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function getStringProperty(objectText, property) {
  const match = objectText.match(new RegExp(`${property}\\s*:\\s*(["'\`])([\\s\\S]*?)\\1`));
  return match?.[2] ?? null;
}

function quoteTargetsFromManifest(manifest) {
  const source = manifest.metadata ?? manifest;
  const quoteTargets = source.quoteTargets ?? manifest.quoteTargets ?? {};
  const quoteCapability = source.quoteCapability ?? manifest.quoteCapability ?? {};
  const agentQuote = (source.agentCapabilities ?? manifest.agentCapabilities ?? {}).quote ?? {};

  const household =
    quoteTargets.household ??
    quoteTargets.householdQuote ??
    quoteCapability.household ??
    agentQuote.household ??
    agentQuote.householdQuote;
  const vehicle =
    quoteTargets.vehicle ??
    quoteTargets.vehicleQuote ??
    quoteCapability.vehicle ??
    agentQuote.vehicle ??
    agentQuote.vehicleQuote;
  const contact =
    quoteTargets.contact ??
    quoteTargets.contactPage ??
    quoteCapability.contact ??
    agentQuote.contact ??
    agentQuote.contactPage;
  let booking =
    quoteTargets.booking ??
    quoteTargets.bookingPage ??
    quoteCapability.booking ??
    agentQuote.booking ??
    agentQuote.bookingPage;

  if (!booking && household) {
    booking = `${new URL(household).origin}/booking/create`;
  }

  return { household, vehicle, booking, contact };
}

function trackedLinksFromSiteConfig(siteConfig) {
  const trackedLinksArrays = findRuntimeTrackedLinkArrays(siteConfig);

  return trackedLinksArrays.flatMap((trackedLinksArray) =>
    splitObjects(trackedLinksArray)
      .map((objectText) => ({
        href: getStringProperty(objectText, 'href'),
        eventName: getStringProperty(objectText, 'eventName'),
      }))
      .filter((link) => link.href && link.eventName)
  );
}

function addCheck(checks, label, passed) {
  checks.push([label, Boolean(passed)]);
}

async function main() {
  const checks = [];
  const manifest = JSON.parse(await read('bossman-site-manifest.json'));
  const siteConfig = await read('src/config/site.ts');
  const leadAttributionRuntime = [
    await read('src/components/analytics/Ga4.astro'),
    await fs.readFile(path.join(root, 'public/ga4-loader.js'), 'utf8').catch(() => ''),
  ].join('\n');
  const quoteTargets = quoteTargetsFromManifest(manifest);
  const trackedLinks = trackedLinksFromSiteConfig(siteConfig);

  for (const [kind, eventName] of Object.entries(leadIntentEvents)) {
    const href = quoteTargets[kind];
    addCheck(checks, `Bossman manifest exposes ${kind} target`, href);
    addCheck(
      checks,
      `trackedLinks includes ${eventName} for ${href ?? kind}`,
      href && trackedLinks.some((link) => link.href === href && link.eventName === eventName)
    );
    addCheck(
      checks,
      `${eventName} uses only Bossman target`,
      trackedLinks
        .filter((link) => link.eventName === eventName)
        .every((link) => link.href === href)
    );
  }
	for (const token of [
		"lead_intent_id",
		"source_site",
		"source_path",
		"intent_type",
		"quote_household",
		"quote_vehicle",
		"booking_household",
		"contact",
	]) {
		addCheck(checks, `Lead attribution runtime decorates outbound Lead Intent links with ${token}`, leadAttributionRuntime.includes(token));
	}


  for (const deprecatedEvent of deprecatedLeadIntentEvents) {
    addCheck(
      checks,
      `trackedLinks does not use deprecated ${deprecatedEvent}`,
      !trackedLinks.some((link) => link.eventName === deprecatedEvent)
    );
  }

  const failures = checks.filter(([, passed]) => !passed);
  for (const [label, passed] of checks) {
    console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`);
  }
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
