const DOCUMENT_HEAD = /<head\b[^>]*>[\s\S]*?<\/head\s*>/gi;
const NON_CONTENT_ELEMENT = /<(script|style|svg|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HIDDEN_ELEMENT =
  /<([a-z][\w:-]*)\b(?=[^>]*(?:\shidden(?:\s*=\s*(?:"hidden"|'hidden'|true|"true"|'true'))?|\saria-hidden\s*=\s*["']true["']))[^>]*>[\s\S]*?<\/\1\s*>/gi;
const MOBILE_OR_SCREEN_READER_ELEMENT =
  /<([a-z][\w:-]*)\b(?=[^>]*\bclass\s*=\s*["'][^"']*(?:fl-visible-mobile|sr-only)[^"']*["'])[^>]*>[\s\S]*?<\/\1\s*>/gi;
const BLOCK_END_TAG =
  /<\/(?:address|article|aside|blockquote|div|dl|dt|dd|fieldset|figcaption|figure|footer|form|header|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)>/gi;
const LINE_BREAK_TAG = /<(?:br|hr)\b[^>]*>/gi;

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
  let content = main ?? html.replace(DOCUMENT_HEAD, ' ');

  content = content
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(NON_CONTENT_ELEMENT, ' ')
    .replace(HIDDEN_ELEMENT, ' ')
    .replace(MOBILE_OR_SCREEN_READER_ELEMENT, ' ')
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
  return `${markdown.slice(0, insertAt)}\n\n## Homepage content\n\n${homepage}\n\n${markdown.slice(insertAt).trimStart()}`;
}
