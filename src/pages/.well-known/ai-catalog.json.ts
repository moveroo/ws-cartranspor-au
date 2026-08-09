import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    specVersion: '1.0',
    host: {
      displayName: 'Cartransport',
      identifier: 'did:web:cartransport.au',
      url: 'https://cartransport.au/',
    },
    canonicalQuoteHost: 'https://quoting.cartransport.au',
    entries: [
      {
        identifier: 'urn:ai:cartransport.au:web:home',
        displayName: 'Cartransport Website',
        type: 'text/html',
        url: 'https://cartransport.au/',
      },
      {
        identifier: 'urn:ai:cartransport.au:llms',
        displayName: 'Cartransport LLM guidance',
        type: 'text/plain',
        url: 'https://cartransport.au/llms.txt',
      },
      {
        identifier: 'urn:ai:cartransport.au:markdown:index',
        displayName: 'Cartransport Markdown summary',
        type: 'text/markdown',
        url: 'https://cartransport.au/index.md',
      },
      {
        identifier: 'urn:ai:cartransport.au:agent-skills:index',
        displayName: 'Cartransport Agent Skills Index',
        type: 'application/json',
        url: 'https://cartransport.au/.well-known/agent-skills/index.json',
      },
      {
        identifier: 'urn:ai:cartransport.au:agents:guide',
        displayName: 'Cartransport Agent/API Guide',
        type: 'text/html',
        url: 'https://cartransport.au/agents/',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:household',
        displayName: 'Household Quote',
        type: 'text/html',
        url: 'https://quoting.cartransport.au/quote/household',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:vehicle',
        displayName: 'Vehicle Quote Form Handoff',
        type: 'text/html',
        url: 'https://quoting.cartransport.au/quote/vehicle',
      },
      {
        identifier: 'urn:ai:cartransport.au:contact',
        displayName: 'Contact',
        type: 'text/html',
        url: 'https://quoting.cartransport.au/contact',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:capability',
        displayName: 'Quote Capability Manifest',
        type: 'application/json',
        url: 'https://quoting.cartransport.au/quote-capability.json',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:openapi',
        displayName: 'Quote OpenAPI Schema',
        type: 'application/vnd.oai.openapi+json',
        url: 'https://quoting.cartransport.au/openapi.json',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:household-public-agent-api',
        displayName: 'Household Quote Public Agent API',
        type: 'application/json',
        url: 'https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit',
      },
      {
        identifier: 'urn:ai:cartransport.au:quote:callback-public-agent-api',
        displayName: 'Callback Public Agent API',
        type: 'application/json',
        url: 'https://quoting.cartransport.au/api/v1/callbacks/assistant/request',
      },
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
