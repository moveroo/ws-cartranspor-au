#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HEADING_GUARD_VERSION = 'rendered-heading-guard.v1';
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const NON_CONTENT_ELEMENTS = new Set(['script', 'style', 'template', 'noscript']);

function decodeHtml(value) {
  const named = new Map([
    ['amp', '&'],
    ['apos', "'"],
    ['gt', '>'],
    ['lt', '<'],
    ['nbsp', ' '],
    ['quot', '"'],
  ]);

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }

    if (code.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }

    return named.get(code.toLowerCase()) ?? entity;
  });
}

function attributeValue(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(
    new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );

  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function elementIsHidden(tag, name) {
  if (NON_CONTENT_ELEMENTS.has(name)) {
    return true;
  }

  if (/(?:^|\s)hidden(?:\s|=|\/?>)/i.test(tag) || /(?:^|\s)inert(?:\s|=|\/?>)/i.test(tag)) {
    return true;
  }

  if (attributeValue(tag, 'aria-hidden')?.toLowerCase() === 'true') {
    return true;
  }

  const style = attributeValue(tag, 'style') ?? '';
  if (/(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style)) {
    return true;
  }

  const classes = (attributeValue(tag, 'class') ?? '').toLowerCase().split(/\s+/);
  return classes.some((className) =>
    ['sr-only', 'screen-reader-text', 'visually-hidden'].includes(className)
  );
}

function pageDeclaresNoindex(html) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  return metaTags.some((tag) => {
    const name = attributeValue(tag, 'name')?.toLowerCase();
    const content = attributeValue(tag, 'content')?.toLowerCase() ?? '';
    return ['robots', 'googlebot'].includes(name) && /(?:^|[\s,])noindex(?:[\s,]|$)/.test(content);
  });
}

function normalizeHeadingText(value) {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function renderedHeadings(html) {
  const headings = [];
  const stack = [];
  let activeHeading = null;
  const tokens = html.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>|[^<]+/gi) ?? [];

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      if (activeHeading && !stack.at(-1)?.hidden) {
        activeHeading.text += token;
      }
      continue;
    }

    if (/^<!--|^<!doctype/i.test(token)) {
      continue;
    }

    const closing = token.match(/^<\/\s*([a-z][\w:-]*)/i);
    if (closing) {
      const name = closing[1].toLowerCase();
      if (/^h[1-6]$/.test(name) && activeHeading) {
        headings.push({
          level: activeHeading.level,
          text: normalizeHeadingText(activeHeading.text),
          visible: activeHeading.visible,
        });
        activeHeading = null;
      }

      const matchingIndex = stack.map((entry) => entry.name).lastIndexOf(name);
      if (matchingIndex >= 0) {
        stack.splice(matchingIndex);
      }
      continue;
    }

    const opening = token.match(/^<\s*([a-z][\w:-]*)/i);
    if (!opening) {
      continue;
    }

    const name = opening[1].toLowerCase();
    const parentHidden = stack.at(-1)?.hidden ?? false;
    const hidden = parentHidden || elementIsHidden(token, name);

    if (/^h[1-6]$/.test(name)) {
      activeHeading = {
        level: Number(name.slice(1)),
        text: '',
        visible: !hidden,
      };
    }

    if (!VOID_ELEMENTS.has(name) && !token.endsWith('/>')) {
      stack.push({ name, hidden });
    }
  }

  if (activeHeading) {
    headings.push({
      level: activeHeading.level,
      text: normalizeHeadingText(activeHeading.text),
      visible: activeHeading.visible,
    });
  }

  return headings;
}

export function inspectRenderedPage(html) {
  if (pageDeclaresNoindex(html)) {
    return { excluded: true, reason: 'noindex', headings: [], failures: [] };
  }

  const headings = renderedHeadings(html).filter((heading) => heading.visible);
  const nonEmptyHeadings = headings.filter((heading) => heading.text.length > 0);
  const h1s = nonEmptyHeadings.filter((heading) => heading.level === 1);
  const failures = [];

  if (h1s.length !== 1) {
    failures.push(`expected exactly one visible, non-empty H1; found ${h1s.length}`);
  }

  for (const [index, heading] of headings.entries()) {
    if (heading.text.length === 0) {
      failures.push(`heading ${index + 1} (H${heading.level}) is empty`);
    }
  }

  if (nonEmptyHeadings.length > 0 && nonEmptyHeadings[0].level !== 1) {
    failures.push(`first visible heading is H${nonEmptyHeadings[0].level}, not H1`);
  }

  for (let index = 1; index < nonEmptyHeadings.length; index += 1) {
    const previous = nonEmptyHeadings[index - 1];
    const current = nonEmptyHeadings[index];
    if (current.level > previous.level + 1) {
      failures.push(
        `skipped heading level from H${previous.level} to H${current.level} at "${current.text.slice(0, 80)}"`
      );
    }
  }

  return { excluded: false, reason: null, headings, failures };
}

export function matchesExclusion(relativePath, patterns) {
  return patterns.some((pattern) => {
    const expression = pattern
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(`^${expression}$`).test(relativePath);
  });
}

export function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(target));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(target);
    }
  }
  return files.sort();
}

function exclusionsFromArguments(argumentsList) {
  const patterns = (process.env.HEADING_GUARD_EXCLUDE ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--exclude' && argumentsList[index + 1]) {
      patterns.push(argumentsList[index + 1]);
      index += 1;
    } else if (argument.startsWith('--exclude=')) {
      patterns.push(argument.slice('--exclude='.length));
    }
  }

  return patterns;
}

function run() {
  const distDirectory = path.resolve(process.cwd(), 'dist');
  if (!existsSync(distDirectory)) {
    console.error('Rendered heading guard failed: dist does not exist. Run the site build first.');
    process.exit(1);
  }

  const exclusions = exclusionsFromArguments(process.argv.slice(2));
  const files = collectHtmlFiles(distDirectory);
  const failures = [];
  let checked = 0;
  let excluded = 0;

  for (const file of files) {
    const relativePath = path.relative(distDirectory, file).split(path.sep).join('/');
    if (matchesExclusion(relativePath, exclusions)) {
      excluded += 1;
      continue;
    }

    const result = inspectRenderedPage(readFileSync(file, 'utf8'));
    if (result.excluded) {
      excluded += 1;
      continue;
    }

    checked += 1;
    for (const failure of result.failures) {
      failures.push(`${relativePath}: ${failure}`);
    }
  }

  if (files.length === 0 || checked === 0) {
    failures.push('no indexable rendered HTML pages were checked');
  }

  if (failures.length > 0) {
    console.error(`${HEADING_GUARD_VERSION} failed:`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    `${HEADING_GUARD_VERSION} passed: ${checked} indexable page(s) checked, ${excluded} page(s) excluded.`
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run();
}
