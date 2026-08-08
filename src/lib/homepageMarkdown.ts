const BLOCK_END_TAG =
  /<\/(?:address|article|aside|blockquote|div|dl|dt|dd|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)>/gi;
const BLOCK_START_TAG = /<(?:br|hr)\s*\/?>/gi;
const HIDDEN_ELEMENT = /<(script|style|svg|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

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

function visibleText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(HIDDEN_ELEMENT, ' ')
      .replace(BLOCK_END_TAG, '\n')
      .replace(BLOCK_START_TAG, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function prependHomepageContent(markdown: string, html: string) {
  const frontmatterEnd = markdown.indexOf('\n---', 3);
  const homepage = visibleText(html);

  if (frontmatterEnd < 0 || homepage === '') {
    throw new Error('Homepage Markdown requires frontmatter and visible homepage content.');
  }

  const insertAt = frontmatterEnd + 4;
  return `${markdown.slice(0, insertAt)}\n\n## Homepage content\n\n${homepage}\n\n${markdown.slice(insertAt).trimStart()}`;
}
