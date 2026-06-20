import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const catalog = {
    specVersion: '1.0',
    host: {
      displayName: 'Cartransport',
      identifier: 'did:web:cartransport.au',
      url: 'https://cartransport.au/',
    },
    entries: [
      {
        identifier: 'urn:ai:cartransport.au:web:home',
        displayName: 'Cartransport Website',
        type: 'text/html',
        url: 'https://cartransport.au/',
      },
      {
        identifier: 'urn:ai:cartransport.au:okf:index',
        displayName: 'Cartransport Open Knowledge Index',
        type: 'text/markdown',
        url: 'https://cartransport.au/okf/index.md',
      },
      {
        identifier: 'urn:ai:cartransport.au:action:1',
        displayName: 'Cartransport Action 1',
        type: 'application/javascript',
        url: 'https://quotes.moveroo.com.au/embed/vehicle-assistant/v1/loader.js',
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
