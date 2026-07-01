import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body =
    '# Cartransport\n\nCartransport publishes agent-readable discovery resources for customer-authorised household moving quotes, vehicle transport quotes, callbacks, and quote API documentation.\n\n## Contact\nWebsite: https://cartransport.au\nContact: https://quoting.cartransport.au/contact\nQuote system: https://quoting.cartransport.au/\n\n## Human quote flows\n- Household quote: https://quoting.cartransport.au/quote/household\n- Vehicle quote: https://quoting.cartransport.au/quote/vehicle\n- Contact page: https://quoting.cartransport.au/contact\n\n## Agent/API resources\n- Agent guide: https://cartransport.au/agents/\n- Agent examples: https://cartransport.au/agents/examples/\n- Markdown summary: https://cartransport.au/index.md\n- AI catalog: https://cartransport.au/.well-known/ai-catalog.json\n- Agent skills index: https://cartransport.au/.well-known/agent-skills/index.json\n- Quote host agent guide: https://quoting.cartransport.au/agents\n- Quote host examples: https://quoting.cartransport.au/agents/examples\n- OpenAPI alias: https://cartransport.au/openapi.json\n- Canonical OpenAPI: https://quoting.cartransport.au/openapi.json\n- Quote capability alias: https://cartransport.au/quote-capability.json\n- Canonical quote capability: https://quoting.cartransport.au/quote-capability.json\n- AI plugin alias: https://cartransport.au/.well-known/ai-plugin.json\n- Quote host AI catalog: https://quoting.cartransport.au/.well-known/ai-catalog.json\n- Quote host LLM guidance: https://quoting.cartransport.au/llms.txt\n\n## Public agent API endpoints\n- Household quote API: https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit\n- Vehicle quote API: https://quoting.cartransport.au/api/v1/vehicle-quotes/assistant/submit\n- Callback request API: https://quoting.cartransport.au/api/v1/callbacks/assistant/request\n\n## Agent rules\n- Customer consent is required before submitting quote or callback requests.\n- Use the quote host OpenAPI schema and capability manifest as the canonical contract.\n- Public host-aware API submissions should omit tenant unless Moveroo has supplied an agreed tenant slug.\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
