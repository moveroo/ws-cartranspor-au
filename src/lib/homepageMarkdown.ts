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

function attributeValue(attributes: string, name: string) {
  const match = attributes.match(
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i')
  );

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? '';
}

function spanValue(attributes: string, name: 'colspan' | 'rowspan') {
  const parsed = Number.parseInt(attributeValue(attributes, name), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 1;
}

function safeHref(value: string) {
  const href = decodeHtmlEntities(value).trim();
  if (/^(?:https?:\/\/|\/|#)/i.test(href)) {
    return href.replace(/\s/g, '%20');
  }
  return '';
}

function inlineMarkdown(html: string) {
  const linked = html.replace(
    /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>/gi,
    (_match, _quote: string, rawHref: string, innerHtml: string) => {
      const label = plainText(innerHtml);
      const href = safeHref(rawHref);
      return label && href ? `[${label}](${href})` : label;
    }
  );

  return plainText(linked).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '\\|');
}

type TableCell = {
  header: boolean;
  scope: string;
  text: string;
};

type TableRow = {
  cells: TableCell[];
  columnHeader: boolean;
};

function markdownTable(tableHtml: string) {
  const carried = new Map<number, { cell: TableCell; remainingRows: number }>();
  const rows: TableRow[] = [];

  for (const rowMatch of tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)) {
    const cells: TableCell[] = [];
    for (const [column, span] of [...carried.entries()].sort(([left], [right]) => left - right)) {
      cells[column] = span.cell;
      span.remainingRows -= 1;
      if (span.remainingRows === 0) carried.delete(column);
    }

    const physicalCells = [...rowMatch[1].matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi)].map(
      (cellMatch) => {
        const attributes = cellMatch[2];
        return {
          cell: {
            header: cellMatch[1].toLowerCase() === 'th',
            scope: attributeValue(attributes, 'scope').toLowerCase(),
            text: inlineMarkdown(cellMatch[3]),
          },
          colspan: spanValue(attributes, 'colspan'),
          rowspan: spanValue(attributes, 'rowspan'),
        };
      }
    );

    let column = 0;
    for (const physical of physicalCells) {
      while (
        Array.from({ length: physical.colspan }, (_, offset) => cells[column + offset]).some(
          (cell) => cell !== undefined
        )
      ) {
        column += 1;
      }
      for (let offset = 0; offset < physical.colspan; offset += 1) {
        const occupiedColumn = column + offset;
        cells[occupiedColumn] = physical.cell;
        if (physical.rowspan > 1) {
          carried.set(occupiedColumn, {
            cell: physical.cell,
            remainingRows: physical.rowspan - 1,
          });
        }
      }
      column += physical.colspan;
    }

    if (cells.length === 0) continue;

    const prefix = tableHtml.slice(0, rowMatch.index ?? 0).toLowerCase();
    const inThead = prefix.lastIndexOf('<thead') > prefix.lastIndexOf('</thead');
    const explicitColumnScope = physicalCells.some(({ cell }) =>
      ['col', 'colgroup'].includes(cell.scope)
    );
    const allColumnHeaders =
      physicalCells.length > 0 &&
      physicalCells.every(({ cell }) => cell.header && cell.scope !== 'row');

    rows.push({
      cells,
      columnHeader: inThead || explicitColumnScope || allColumnHeaders,
    });
  }

  if (rows.length === 0) return plainText(tableHtml);

  const columnCount = Math.max(...rows.map((row) => row.cells.length));
  const headerIndex = rows.findIndex((row) => row.columnHeader);
  const header =
    headerIndex >= 0
      ? rows[headerIndex].cells
      : Array.from({ length: columnCount }, (_, index) => ({
          header: true,
          scope: 'col',
          text: `Column ${index + 1}`,
        }));
  const body = rows.filter((_row, index) => index !== headerIndex).map((row) => row.cells);
  const cells = (row: typeof header) =>
    Array.from({ length: columnCount }, (_, index) => row[index]?.text ?? '');

  return [
    '',
    `| ${cells(header).join(' | ')} |`,
    `| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`,
    ...body.map((row) => `| ${cells(row).join(' | ')} |`),
    '',
  ].join('\n');
}

function visibleMarkdown(html: string) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i)?.[1];
  let content = removeHiddenSubtrees(main ?? html.replace(DOCUMENT_HEAD, ' '));

  content = content
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi, (_match, tableHtml: string) =>
      markdownTable(tableHtml)
    )
    .replace(
      /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>/gi,
      (_match, _quote: string, rawHref: string, innerHtml: string) => {
        const href = safeHref(rawHref);
        if (href && /<h[1-6]\b/i.test(innerHtml)) {
          return innerHtml.replace(
            /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi,
            (_heading, level: string, headingHtml: string) => {
              const heading = plainText(headingHtml);
              return heading ? `\n${'#'.repeat(Number(level))} [${heading}](${href})\n` : '\n';
            }
          );
        }

        const label = plainText(innerHtml);
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
