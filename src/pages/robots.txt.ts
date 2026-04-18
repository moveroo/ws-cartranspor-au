import type { APIRoute } from 'astro';

const siteUrl =
  import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || 'https://cartransport.au';

const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${siteUrl.replace(/\/$/, '')}/sitemap-index.xml
`.trim();

export const GET: APIRoute = () => {
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
