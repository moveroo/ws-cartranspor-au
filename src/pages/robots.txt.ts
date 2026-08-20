export function GET() {
  // Sitemap: https://cartransport.au/sitemap.xml\n
  // Sitemap: https://cartransport.au/sitemap-index.xml\n
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || 'https://cartransport.au').replace(/\/$/, '');
  const sitemapDeclarations =
    siteUrl === 'https://cartransport.au'
      ? 'Sitemap: https://cartransport.au/sitemap.xml\nSitemap: https://cartransport.au/sitemap-index.xml'
      : `Sitemap: ${siteUrl}/sitemap.xml\nSitemap: ${siteUrl}/sitemap-index.xml`;

  const body = `User-agent: *\\nAllow: /\\n${sitemapDeclarations}\\n\\n# AI crawlers and search agents may use these resources for customer-authorised quote discovery.\\n# API execution is documented at /agents/ and /openapi.json.\\nAllow: /agents/\\nAllow: /agents/examples/\\nAllow: /llms.txt\\nAllow: /.well-known/llms.txt\\nAllow: /index.md\\nAllow: /openapi.json\\nAllow: /quote-capability.json\\nAllow: /.well-known/ai-catalog.json\\nAllow: /.well-known/agent-skills/index.json\\nAllow: /.well-known/ai-plugin.json\\n`;

  const renderedBody = body.replaceAll('\\n', '\n');

  return new Response(renderedBody, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
