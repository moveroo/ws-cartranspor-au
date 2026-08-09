const DOCUMENT_HEAD = /<head\b[^>]*>[\s\S]*?<\/head\s*>/gi;
const BLOCK_END_TAG =
  /<\/(?:address|article|aside|blockquote|div|dl|dt|dd|fieldset|figcaption|figure|footer|form|header|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)>/gi;
const LINE_BREAK_TAG = /<(?:br|hr)\b[^>]*>/gi;
const NON_CONTENT_TAGS = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const VOID_TAGS = new Set([
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

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, key: string) => {
    if (key.startsWith('#x') || key.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    }
    if (key.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

function isHiddenOpeningTag(tag: string, name: string) {
  if (NON_CONTENT_TAGS.has(name)) return true;
  if (/\saria-hidden\s*=\s*["']true["']/i.test(tag)) return true;
  if (/\shidden(?:\s*=\s*(?:"hidden"|'hidden'|true|"true"|'true'))?(?=\s|\/?>)/i.test(tag)) {
    return true;
  }

  const classes = tag.match(/\sclass\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
  return classes
    .split(/\s+/)
    .some((className) => ['fl-visible-mobile', 'sr-only'].includes(className));
}

function removeHiddenSubtrees(html: string) {
  const tagPattern = /<\/?([a-z][\w:-]*)\b[^>]*>/gi;
  const hiddenStack: string[] = [];
  let output = '';
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    const tag = match[0];
    const name = match[1].toLowerCase();
    const closing = tag.startsWith('</');
    const selfClosing = tag.endsWith('/>') || VOID_TAGS.has(name);

    if (hiddenStack.length === 0) {
      output += html.slice(cursor, match.index);
    }

    if (closing) {
      if (hiddenStack.length > 0) {
        hiddenStack.pop();
      } else {
        output += tag;
      }
    } else if (hiddenStack.length > 0) {
      if (!selfClosing) hiddenStack.push(name);
    } else if (isHiddenOpeningTag(tag, name)) {
      if (!selfClosing) hiddenStack.push(name);
    } else {
      output += tag;
    }

    cursor = tagPattern.lastIndex;
  }

  if (hiddenStack.length === 0) {
    output += html.slice(cursor);
  }

  return output;
}

function plainText(html: string) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function safeHref(value: string) {
  const href = decodeHtmlEntities(value).trim();
  if (/^(?:https?:\/\/|\/|#)/i.test(href)) {
    return href.replace(/\s/g, '%20');
  }
  return '';
}

function visibleMarkdown(html: string) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i)?.[1];
  let content = removeHiddenSubtrees(main ?? html.replace(DOCUMENT_HEAD, ' '));

  content = content
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(
      /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>/gi,
      (_match, _quote: string, rawHref: string, innerHtml: string) => {
        const label = plainText(innerHtml);
        const href = safeHref(rawHref);
        return label && href ? ` [${label}](${href}) ` : label;
      }
    )
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi, (_match, level: string, inner: string) => {
      const heading = plainText(inner);
      return heading ? `\n${'#'.repeat(Number(level))} ${heading}\n` : '\n';
    })
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi, (_match, inner: string) => {
      const item = plainText(inner);
      return item ? `\n- ${item}` : '\n';
    })
    .replace(BLOCK_END_TAG, '\n')
    .replace(LINE_BREAK_TAG, '\n')
    .replace(/<[^>]+>/g, ' ');

  return decodeHtmlEntities(content)
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function prependHomepageContent(markdown: string, html: string) {
  const frontmatterEnd = markdown.indexOf('\n---', 3);
  const homepage = visibleMarkdown(html);

  if (frontmatterEnd < 0 || homepage === '') {
    throw new Error('Homepage Markdown requires frontmatter and visible homepage content.');
  }

  const insertAt = frontmatterEnd + 4;
  const appendix = markdown
    .slice(insertAt)
    .trimStart()
    .replace(/^# [^\n]+\n+/, '');

  return `${markdown.slice(0, insertAt)}\n\n${homepage}\n\n${appendix}`;
}
