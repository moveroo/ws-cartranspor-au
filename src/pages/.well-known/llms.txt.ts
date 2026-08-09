import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body = `# Cartransport

> Cartransport publishes agent-readable discovery resources for customer-authorised household moving quotes, vehicle transport quotes, callbacks, and quote API documentation.

## Contact
Website: https://cartransport.au
Contact: https://quoting.cartransport.au/contact
Quote system: https://quoting.cartransport.au/

## Key Pages
- [Homepage](https://cartransport.au/): Main site entry point for Cartransport services.
- [Agent/API documentation](https://cartransport.au/agents/): Human-readable guide for approved AI assistants and developers.
- [Agent/API examples](https://cartransport.au/agents/examples/): Household and callback payload examples, plus the vehicle form handoff.
- [XML sitemap](https://cartransport.au/sitemap.xml): Crawlable page inventory for search engines and agents.
- [Privacy policy](https://cartransport.au/privacy/): Privacy and data-handling policy.
- [Terms and conditions](https://cartransport.au/terms/): Site and service terms.

## Human Quote Flows
- [Household quote form](https://quoting.cartransport.au/quote/household): Customer-facing household removal quote workflow.
- [Vehicle quote form](https://quoting.cartransport.au/quote/vehicle): Customer-facing vehicle transport quote workflow.
- [Contact page](https://quoting.cartransport.au/contact): Contact and callback entry point.

## Agent/API Resources
- [Markdown summary](https://cartransport.au/index.md): Agent-readable markdown summary of the marketing site and quote actions.
- [AI catalog](https://cartransport.au/.well-known/ai-catalog.json): Machine-readable catalog of public agent resources.
- [Agent skills index](https://cartransport.au/.well-known/agent-skills/index.json): Machine-readable skill discovery index.
- [OpenAPI alias](https://cartransport.au/openapi.json): Marketing-domain alias for the canonical quote OpenAPI schema.
- [Quote capability alias](https://cartransport.au/quote-capability.json): Marketing-domain alias for the quote capability manifest.
- [AI plugin alias](https://cartransport.au/.well-known/ai-plugin.json): Marketing-domain alias for AI plugin compatibility metadata.
- [Canonical Agent/API guide](https://quoting.cartransport.au/agents): Quote-host source of truth for API usage.
- [Canonical OpenAPI schema](https://quoting.cartransport.au/openapi.json): Canonical public quote API schema.
- [Canonical quote capability manifest](https://quoting.cartransport.au/quote-capability.json): Canonical supported operations and quote capabilities.
- [Quote host LLM guidance](https://quoting.cartransport.au/llms.txt): Quote-host LLM guidance.

## Public Agent API Endpoints
- [Household quote API](https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit): Submit a customer-authorised household quote request.
- [Vehicle quote form](https://quoting.cartransport.au/quote/vehicle): Human handoff for a vehicle transport quote; no public vehicle submission API is currently available.
- [Callback request API](https://quoting.cartransport.au/api/v1/callbacks/assistant/request): Request a customer-authorised callback.

## Ownership Notes
- This marketing site is owned by the Cartransport Astro repository.
- The quote host is the source of truth for API execution, OpenAPI schemas, and capability manifests.
- Agents may read these resources for customer-authorised quote discovery. They may submit household quote or callback requests only when the customer has asked for that action. Vehicle quotes require the official form handoff.
- Public host-aware API submissions should omit tenant unless Moveroo has supplied an agreed tenant slug.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
