import fs from 'fs';
import path from 'path';

const XML_PATH = 'vehicletransportaustralia.WordPress.2025-12-30.xml';
const OUTPUT_DIR = 'src/content/posts';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const xmlContent = fs.readFileSync(XML_PATH, 'utf-8');

// Simple regex to split by items. Note: This is fragile but sufficient for standard WP exports.
const items = xmlContent.split('<item>');

let count = 0;

items.forEach((item, index) => {
  if (index === 0) return; // Skip header

  // Helper to clean CDATA
  const clean = (str) => (str ? str.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '');

  // Extract Status
  const statusMatch = item.match(/<wp:status>([\s\S]*?)<\/wp:status>/);
  const status = clean(statusMatch ? statusMatch[1] : '');

  // Extract Post Type
  const typeMatch = item.match(/<wp:post_type>([\s\S]*?)<\/wp:post_type>/);
  const type = clean(typeMatch ? typeMatch[1] : '');

  if (status !== 'publish' || type !== 'post') {
    return;
  }

  // Extract Title
  const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
  const title = clean(titleMatch ? titleMatch[1] : 'Untitled');

  // Extract Date
  const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
  const date = dateMatch
    ? new Date(dateMatch[1]).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Extract Slug
  const slugMatch = item.match(/<wp:post_name>([\s\S]*?)<\/wp:post_name>/);
  let slug = clean(slugMatch ? slugMatch[1] : '');
  if (!slug)
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  if (!slug) slug = `post-${index}`;

  // Extract Content
  const contentMatch = item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
  let content = contentMatch ? contentMatch[1] : '';

  // Clean Content
  content = content.replace('<![CDATA[', '').replace(']]>', '');
  // Remove WP comments
  content = content.replace(/<!-- \/?wp:.*? -->/g, '');

  // Construct Markdown
  const markdown = `---
title: "${title.replace(/"/g, '\\"')}"
pubDate: "${date}"
description: "Migrated from WordPress"
author: "Vehicle Transport Australia"
---

${content}
`;

  // Write file
  fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.md`), markdown);
  console.log(`Migrated: ${slug}`);
  count++;
});

console.log(`Total posts migrated: ${count}`);
