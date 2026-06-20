import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body =
    '---\ntype: Index\ntitle: Cartransport OKF\nresource: https://cartransport.au/\n---\n\n# Cartransport Open Knowledge Index\n\nCartransport is an active fleet marketing website. The site exposes public service, support, legal, and action-path information for agents and search systems.\n\n## Primary Resources\n\n- [Home](https://cartransport.au/)\n- [privacy](https://cartransport.au/privacy/)\n- [terms](https://cartransport.au/terms/)\n\n## Action Resources\n\n- [Action 1](https://quotes.moveroo.com.au/embed/vehicle-assistant/v1/loader.js)\n\n## Agent Notes\n\nUse the public website for crawlable content and legal information. Quote, booking, contact, portal, or assistant actions may be handled by linked subdomains or application surfaces.\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
