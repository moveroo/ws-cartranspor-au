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
    const decodedCodePoint = (raw: string, radix: number) => {
      const codePoint = Number.parseInt(raw, radix);
      if (
        !Number.isFinite(codePoint) ||
        codePoint <= 0 ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return '\uFFFD';
      }
      return String.fromCodePoint(codePoint);
    };

    if (key.startsWith('#x') || key.startsWith('#X')) {
      return decodedCodePoint(key.slice(2), 16);
    }
    if (key.startsWith('#')) {
      return decodedCodePoint(key.slice(1), 10);
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

function isHiddenOpeningTag(tag: string, name: string) {
  if (NON_CONTENT_TAGS.has(name)) return true;
  if (attributeValue(tag, 'aria-hidden').toLowerCase() === 'true') return true;
  if (/\shidden(?=\s|=|\/?>)/i.test(tag)) {
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

function escapeMarkdownText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/([`*_[\]~<>])/g, '\\$1')
    .replace(/(^|\n)([ \t]{0,3})(#{1,6}|>|\+|-)(?=\s|$)/g, '$1$2\\$3')
    .replace(/(^|\n)([ \t]{0,3})(\d+)([.)])(?=\s|$)/g, '$1$2$3\\$4');
}

function generatedText(html: string) {
  return escapeMarkdownText(plainText(html));
}

function accessibleLinkLabel(attributes: string, innerHtml: string) {
  const imageAttributes = innerHtml.match(/<img\b([^>]*)>/i)?.[1] ?? '';
  const explicit =
    attributeValue(attributes, 'aria-label') || attributeValue(attributes, 'data-markdown-label');
  if (explicit) {
    return escapeMarkdownText(decodeHtmlEntities(explicit).trim());
  }

  const visible = generatedText(innerHtml);
  if (visible) return visible;

  const fallback = attributeValue(imageAttributes, 'alt') || attributeValue(attributes, 'title');

  return escapeMarkdownText(decodeHtmlEntities(fallback).trim());
}

function attributeValue(attributes: string, name: string) {
  const match = attributes.match(
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i')
  );

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? '';
}

function hasAttribute(attributes: string, name: string) {
  return new RegExp(`(?:^|\\s)${name}(?=\\s|=|$)`, 'i').test(attributes);
}

function encodeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function preserveAccessibleLinkNames(html: string) {
  return html.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi,
    (anchor, attributes: string, innerHtml: string) => {
      if (
        attributeValue(attributes, 'aria-label') ||
        attributeValue(attributes, 'data-markdown-label')
      ) {
        return anchor;
      }

      const screenReaderText = [
        ...innerHtml.matchAll(
          /<(?:span|span\b[^>]*\bclass\s*=\s*["'][^"']*\b(?:sr-only|visually-hidden)\b[^"']*["'][^>]*)>([\s\S]*?)<\/span\s*>/gi
        ),
      ]
        .map((match) => plainText(match[1]))
        .filter(Boolean)
        .join(' ');
      const svgAttributes = innerHtml.match(/<svg\b([^>]*)>/i)?.[1] ?? '';
      const svgLabel =
        attributeValue(svgAttributes, 'aria-label') ||
        plainText(
          innerHtml.match(/<svg\b[^>]*>[\s\S]*?<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? ''
        );
      const label = screenReaderText || svgLabel;
      if (!label) return anchor;

      return anchor.replace(/^<a\b/i, `<a data-markdown-label="${encodeHtmlAttribute(label)}"`);
    }
  );
}

function spanValue(attributes: string, name: 'colspan' | 'rowspan') {
  const parsed = Number.parseInt(attributeValue(attributes, name), 10);
  if (name === 'rowspan' && parsed === 0) return 0;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 1;
}

function safeHref(value: string) {
  const href = decodeHtmlEntities(value).trim();
  if (!href || /[\u0000-\u001F\u007F]/.test(href) || /\\/.test(href)) return '';

  const scheme = href.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme && !['http', 'https'].includes(scheme)) return '';

  try {
    const parsed = new URL(href, 'https://markdown.invalid/');
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
  } catch {
    return '';
  }

  return href.replace(/\s/g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function inlineMarkdown(html: string) {
  const links: string[] = [];
  const linked = html.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi,
    (_match, attributes: string, innerHtml: string) => {
      const label = accessibleLinkLabel(attributes, innerHtml);
      const href = safeHref(attributeValue(attributes, 'href'));
      if (!label || !href) return label;

      const index = links.push(`[${label}](${href})`) - 1;
      return `\uE000${index}\uE001`;
    }
  );

  return generatedText(linked)
    .replace(/\uE000(\d+)\uE001/g, (_token, index: string) => links[Number(index)])
    .replace(/\|/g, '\\|');
}

type TableCell = {
  header: boolean;
  scope: string;
  text: string;
};

type TableRow = {
  cells: TableCell[];
  columnHeader: boolean;
  inThead: boolean;
  inTfoot: boolean;
};

function rowGroupKey(tableHtml: string, rowIndex: number) {
  const prefix = tableHtml.slice(0, rowIndex).toLowerCase();
  const candidates = ['thead', 'tbody', 'tfoot']
    .map((name) => ({
      name,
      open: prefix.lastIndexOf(`<${name}`),
      close: prefix.lastIndexOf(`</${name}`),
    }))
    .filter(({ open, close }) => open > close)
    .sort((left, right) => right.open - left.open);

  return candidates[0] ? `${candidates[0].name}:${candidates[0].open}` : 'table';
}

function markdownTable(tableHtml: string) {
  const caption = inlineMarkdown(
    tableHtml.match(/<caption\b[^>]*>([\s\S]*?)<\/caption\s*>/i)?.[1] ?? ''
  );
  const carried = new Map<number, { cell: TableCell; group: string; remainingRows: number }>();
  const rows: TableRow[] = [];

  for (const rowMatch of tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)) {
    const group = rowGroupKey(tableHtml, rowMatch.index ?? 0);
    const cells: TableCell[] = [];
    for (const [column, span] of [...carried.entries()].sort(([left], [right]) => left - right)) {
      if (span.group !== group) {
        carried.delete(column);
        continue;
      }
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
            group,
            remainingRows: physical.rowspan - 1,
          });
        } else if (physical.rowspan === 0) {
          carried.set(occupiedColumn, {
            cell: physical.cell,
            group,
            remainingRows: Number.POSITIVE_INFINITY,
          });
        }
      }
      column += physical.colspan;
    }

    if (cells.length === 0) continue;

    const prefix = tableHtml.slice(0, rowMatch.index ?? 0).toLowerCase();
    const inThead = prefix.lastIndexOf('<thead') > prefix.lastIndexOf('</thead');
    const inTfoot = prefix.lastIndexOf('<tfoot') > prefix.lastIndexOf('</tfoot');
    const explicitColumnScope = physicalCells.some(({ cell }) =>
      ['col', 'colgroup'].includes(cell.scope)
    );
    const allColumnHeaders =
      physicalCells.length > 0 &&
      physicalCells.every(({ cell }) => cell.header && cell.scope !== 'row');

    rows.push({
      cells,
      columnHeader: !inTfoot && (inThead || explicitColumnScope || allColumnHeaders),
      inThead,
      inTfoot,
    });
  }

  if (rows.length === 0) return generatedText(tableHtml);

  const columnCount = Math.max(...rows.map((row) => row.cells.length));
  const theadRows = rows.filter((row) => row.inThead);
  const headerIndex = theadRows.length === 0 && rows[0]?.columnHeader ? 0 : -1;
  const header =
    theadRows.length > 0
      ? Array.from({ length: columnCount }, (_, index) => {
          const labels = theadRows
            .map((row) => row.cells[index]?.text ?? '')
            .filter((label, labelIndex, all) => label !== '' && all.indexOf(label) === labelIndex);
          return {
            header: true,
            scope: 'col',
            text: labels.join(' / '),
          };
        })
      : headerIndex >= 0
        ? rows[headerIndex].cells
        : Array.from({ length: columnCount }, (_, index) => ({
            header: true,
            scope: 'col',
            text: `Column ${index + 1}`,
          }));
  const body = rows
    .filter((row, index) => !row.inThead && index !== headerIndex)
    .map((row) => row.cells);
  const cells = (row: typeof header) =>
    Array.from({ length: columnCount }, (_, index) => row[index]?.text ?? '');

  return [
    '',
    ...(caption ? [caption, ''] : []),
    `| ${cells(header).join(' | ')} |`,
    `| ${Array.from({ length: columnCount }, () => '---').join(' | ')} |`,
    ...body.map((row) => `| ${cells(row).join(' | ')} |`),
    '',
  ].join('\n');
}

function visibleMarkdown(html: string) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1];
  let content = removeHiddenSubtrees(
    preserveAccessibleLinkNames(body ?? html.replace(DOCUMENT_HEAD, ' '))
  );
  const markdownTokens: string[] = [];
  const markdownTokenKinds: Array<'inline' | 'block' | 'list'> = [];
  const preserveMarkdown = (markdown: string, kind: 'inline' | 'block' | 'list' = 'inline') => {
    const index = markdownTokens.push(markdown) - 1;
    markdownTokenKinds[index] = kind;
    return `\uE000${index}\uE001`;
  };

  content = content
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(
      /<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi,
      (_match, tableHtml: string) => `\n${preserveMarkdown(markdownTable(tableHtml), 'block')}\n`
    )
    .replace(
      /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi,
      (_match, attributes: string, innerHtml: string) => {
        const href = safeHref(attributeValue(attributes, 'href'));
        if (href && /<h[1-6]\b/i.test(innerHtml)) {
          return innerHtml.replace(
            /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi,
            (_heading, level: string, headingHtml: string) => {
              const heading = accessibleLinkLabel(attributes, headingHtml);
              return heading
                ? `\n${preserveMarkdown(`${'#'.repeat(Number(level))} [${heading}](${href})`, 'block')}\n`
                : '\n';
            }
          );
        }

        const label = accessibleLinkLabel(attributes, innerHtml);
        return label && href ? ` ${preserveMarkdown(`[${label}](${href})`)} ` : label;
      }
    )
    .replace(/<img\b([^>]*)>/gi, (_match, attributes: string) => {
      const alt = escapeMarkdownText(decodeHtmlEntities(attributeValue(attributes, 'alt')).trim());
      if (!alt) return ' ';

      const src = safeHref(attributeValue(attributes, 'src'));
      return src ? ` ${preserveMarkdown(`![${alt}](${src})`)} ` : ` ${alt} `;
    })
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi, (_match, level: string, inner: string) => {
      const heading = generatedText(inner);
      return heading
        ? `\n${preserveMarkdown(`${'#'.repeat(Number(level))} ${heading}`, 'block')}\n`
        : '\n';
    });

  const innermostList = /<(ol|ul)\b([^>]*)>((?:(?!<(?:ol|ul)\b)[\s\S])*?)<\/\1\s*>/gi;
  for (let pass = 0; pass < 1000; pass += 1) {
    let converted = false;
    content = content.replace(
      innermostList,
      (_match, type: string, attributes: string, listHtml: string) => {
        converted = true;
        const ordered = type.toLowerCase() === 'ol';
        const items = [...listHtml.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li\s*>/gi)];
        const reversed = ordered && hasAttribute(attributes, 'reversed');
        const preservesExplicitCounters =
          reversed || items.some((item) => hasAttribute(item[1], 'value'));
        let counter = Number.parseInt(attributeValue(attributes, 'start'), 10);
        if (!Number.isFinite(counter)) counter = reversed ? items.length : 1;
        const step = reversed ? -1 : 1;

        const lines = items.map((itemMatch) => {
          const itemAttributes = itemMatch[1];
          const inner = itemMatch[2];
          const explicitValue = Number.parseInt(attributeValue(itemAttributes, 'value'), 10);
          if (ordered && Number.isFinite(explicitValue)) counter = explicitValue;

          const itemCounter = counter;
          const marker = ordered && !preservesExplicitCounters ? `${counter}.` : '-';
          if (ordered) counter += step;
          const indent = ' '.repeat(marker.length + 1);
          const segments = inner.split(/(\uE000\d+\uE001)/g).filter(Boolean);
          const lines: string[] = [];
          let inline = ordered && preservesExplicitCounters ? `${itemCounter}\\.` : '';

          const flushInline = () => {
            const text = inline.replace(/\s+/g, ' ').trim();
            if (text) {
              lines.push(lines.length === 0 ? `${marker} ${text}` : `${indent}${text}`);
            }
            inline = '';
          };

          for (const segment of segments) {
            const token = segment.match(/^\uE000(\d+)\uE001$/);
            if (!token) {
              const text = generatedText(segment);
              if (text) inline += `${inline ? ' ' : ''}${text}`;
              continue;
            }

            const index = Number(token[1]);
            const kind = markdownTokenKinds[index];
            if (kind === 'inline') {
              inline += `${inline ? ' ' : ''}${markdownTokens[index]}`;
              continue;
            }

            flushInline();
            if (lines.length === 0) lines.push(marker);
            lines.push(...markdownTokens[index].split('\n').map((line) => `${indent}${line}`));
          }

          flushInline();
          if (lines.length === 0) lines.push(marker);
          return lines.join('\n');
        });

        return `\n${preserveMarkdown(lines.join('\n'), 'list')}\n`;
      }
    );
    if (!converted) break;
  }

  content = content
    .replace(/<summary\b[^>]*>([\s\S]*?)<\/summary\s*>/gi, (_match, inner: string) => {
      const question = generatedText(inner);
      return question ? `\n${preserveMarkdown(`### ${question}`, 'block')}\n` : '\n';
    })
    .replace(/<\/?details\b[^>]*>/gi, '\n')
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi, (_match, inner: string) => {
      const item = generatedText(inner);
      return item ? `\n${preserveMarkdown(`- ${item}`)}` : '\n';
    })
    .replace(BLOCK_END_TAG, '\n')
    .replace(LINE_BREAK_TAG, '\n')
    .replace(/<[^>]+>/g, ' ');

  const markdown = escapeMarkdownText(decodeHtmlEntities(content))
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  let restored = markdown;
  for (let pass = 0; pass <= markdownTokens.length; pass += 1) {
    const next = restored.replace(
      /\uE000(\d+)\uE001/g,
      (_token, index: string) => markdownTokens[Number(index)]
    );
    if (next === restored) break;
    restored = next;
  }

  if (/\uE000\d+\uE001/.test(restored)) {
    throw new Error('Homepage Markdown contains an unresolved internal token.');
  }

  return restored.replace(/\n{3,}/g, '\n\n').trim();
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
