import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body =
    '---\ntype: Index\ntitle: Car Transport OKF\nresource: https://cartransport.au/\n---\n\n# Car Transport Open Knowledge Index\n\nCar Transport is an active fleet marketing website. The site exposes public service, support, legal, quote, and agent-readable action-path information for agents and search systems.\n\n## Primary Resources\n\n- [Home](https://cartransport.au/)\n- [AI Catalog](https://cartransport.au/.well-known/ai-catalog.json)\n- [LLMs Text](https://cartransport.au/llms.txt)\n\n## Quote And Contact Resources\n\n- [Household Quote](https://quoting.cartransport.au/quote/household)\n- [Vehicle Quote](https://quoting.cartransport.au/quote/vehicle)\n- [Contact](https://quoting.cartransport.au/contact)\n- [Quote Capability Manifest](https://quoting.cartransport.au/quote-capability.json)\n- [Quote Host AI Catalog](https://quoting.cartransport.au/.well-known/ai-catalog.json)\n- [Human Guide For Agents](https://quoting.cartransport.au/agents)\n- [Household Quote Public Agent API](https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit)\n\n## Agent Notes\n\nUse the public website for crawlable content and legal information. Use the site-owned quote subdomain for household quote, vehicle quote, contact, quote capability, and public household agent API handoff.\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
