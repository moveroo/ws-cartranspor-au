import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const catalog = {
    specVersion: '1.0',
    host: {
      displayName: 'Car Transport',
      identifier: 'did:web:cartransport.au',
      url: 'https://cartransport.au/',
    },
    entries: [
      {
        identifier: 'urn:ai:cartransport.au:web:home',
        displayName: 'Car Transport Website',
        type: 'text/html',
        url: 'https://cartransport.au/',
      },
      {
        identifier: 'urn:ai:cartransport.au:okf:index',
        displayName: 'Car Transport Open Knowledge Index',
        type: 'text/markdown',
        url: 'https://cartransport.au/okf/index.md',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:household',
        displayName: 'Car Transport Household Quote',
        type: 'text/html',
        url: 'https://quoting.cartransport.au/quote/household',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:vehicle',
        displayName: 'Car Transport Vehicle Quote',
        type: 'text/html',
        url: 'https://quoting.cartransport.au/quote/vehicle',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:contact',
        displayName: 'Car Transport Contact',
        type: 'text/html',
        url: 'https://quoting.cartransport.au/contact',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:capability',
        displayName: 'Car Transport Quote Capability Manifest',
        type: 'application/json',
        url: 'https://quoting.cartransport.au/quote-capability.json',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:ai-catalog',
        displayName: 'Car Transport Quote Host AI Catalog',
        type: 'application/json',
        url: 'https://quoting.cartransport.au/.well-known/ai-catalog.json',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:human-guide',
        displayName: 'Car Transport Human Guide For Agents',
        type: 'text/html',
        url: 'https://quoting.cartransport.au/agents',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:household-api',
        displayName: 'Car Transport Household Quote Public Agent API',
        type: 'application/json',
        method: 'POST',
        url: 'https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit',
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
