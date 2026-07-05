export function GET() {
  const body =
    'User-agent: *\nAllow: /\nSitemap: https://cartransport.au/sitemap.xml\nSitemap: https://cartransport.au/sitemap-index.xml\nSitemap: https://cartransport.au/llms.txt\nSitemap: https://cartransport.au/.well-known/llms.txt\nSitemap: https://cartransport.au/index.md\n\n# AI crawlers and search agents may use these resources for customer-authorised quote discovery.\n# API execution is documented at /agents/ and /openapi.json.\nAllow: /agents/\nAllow: /agents/examples/\nAllow: /llms.txt\nAllow: /.well-known/llms.txt\nAllow: /index.md\nAllow: /openapi.json\nAllow: /quote-capability.json\nAllow: /.well-known/ai-catalog.json\nAllow: /.well-known/agent-skills/index.json\nAllow: /.well-known/ai-plugin.json\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
