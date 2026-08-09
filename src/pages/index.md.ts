import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { APIRoute } from 'astro';
import { prependHomepageContent } from '../lib/homepageMarkdown';
import Homepage from './index.astro';

export const GET: APIRoute = async () => {
  const body =
    '---\ntitle: Cartransport\ncanonical: https://cartransport.au/\ndescription: Cartransport publishes agent-readable discovery resources for customer-authorised household moving quotes, vehicle transport quotes, callbacks, and quote API documentation.\nagent_resources:\n  - https://cartransport.au/agents/\n  - https://cartransport.au/agents/examples/\n  - https://cartransport.au/llms.txt\n  - https://cartransport.au/.well-known/llms.txt\n  - https://cartransport.au/.well-known/ai-catalog.json\n  - https://cartransport.au/.well-known/agent-skills/index.json\nquote_host: https://quoting.cartransport.au\n---\n\n# Cartransport\n\nCartransport publishes agent-readable discovery resources for customer-authorised household moving quotes, vehicle transport quotes, callbacks, and quote API documentation.\n\n## Agent and API Discovery\n\n- [Agent/API documentation](https://cartransport.au/agents/)\n- [Agent/API examples](https://cartransport.au/agents/examples/)\n- [Agent skills index](https://cartransport.au/.well-known/agent-skills/index.json)\n- [LLM guidance](https://cartransport.au/llms.txt)\n- [Well-known LLM guidance](https://cartransport.au/.well-known/llms.txt)\n- [AI catalog](https://cartransport.au/.well-known/ai-catalog.json)\n- [Quote capability alias](https://cartransport.au/quote-capability.json)\n- [OpenAPI alias](https://cartransport.au/openapi.json)\n\n## Quote Actions\n\nThe canonical quote and callback API contract lives on the Cartransport quote host at https://quoting.cartransport.au.\n\n- [Household quote form](https://quoting.cartransport.au/quote/household)\n- [Vehicle quote form](https://quoting.cartransport.au/quote/vehicle)\n- [Contact and callback page](https://quoting.cartransport.au/contact)\n- [Canonical Agent/API guide](https://quoting.cartransport.au/agents)\n- [Canonical Agent/API examples](https://quoting.cartransport.au/agents/examples)\n- [Canonical OpenAPI schema](https://quoting.cartransport.au/openapi.json)\n- [Canonical quote capability manifest](https://quoting.cartransport.au/quote-capability.json)\n- [Canonical AI plugin compatibility manifest](https://quoting.cartransport.au/.well-known/ai-plugin.json)\n\n## Public Agent API Endpoints\n\n- Household quote API: https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit\n- Vehicle quote handoff: https://quoting.cartransport.au/quote/vehicle\n- Callback request API: https://quoting.cartransport.au/api/v1/callbacks/assistant/request\n\nAgents may submit household quote or callback requests only when the customer has asked for that action and the payload includes the required customer consent fields. Vehicle quote requests must use the official form handoff.\n';

  const container = await AstroContainer.create();
  const homepageHtml = await container.renderToString(Homepage);

  return new Response(prependHomepageContent(body, homepageHtml), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      Link: '<https://cartransport.au/>; rel="canonical"',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
};
