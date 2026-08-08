import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://cartransport.au/.well-known/agent-skills/schema.json',
    version: '2026-07-01',
    publisher: {
      name: 'Cartransport',
      url: 'https://cartransport.au/',
      agentGuide: 'https://cartransport.au/agents/',
      openApi: 'https://cartransport.au/openapi.json',
    },
    canonicalQuoteHost: 'https://quoting.cartransport.au',
    skills: [
      {
        id: 'cartransport-au.household_quote',
        name: 'Household removal quote',
        type: 'quote_request',
        description:
          'Collect a customer-authorised household removal quote request through the official Cartransport quote API.',
        url: 'https://cartransport.au/.well-known/agent-skills/household-quote/SKILL.md',
        openApi: 'https://cartransport.au/openapi.json',
        capabilityManifest: 'https://cartransport.au/quote-capability.json',
        examples: 'https://cartransport.au/agents/examples/',
        executionHost: 'https://quoting.cartransport.au',
        endpoint: 'https://quoting.cartransport.au/api/v1/household-quotes/assistant/submit',
        consentRequired: true,
      },
      {
        id: 'cartransport-au.vehicle_quote',
        name: 'Vehicle transport quote',
        type: 'quote_request',
        description:
          'Collect a customer-authorised vehicle transport quote request through the official Cartransport quote API.',
        url: 'https://cartransport.au/.well-known/agent-skills/vehicle-quote/SKILL.md',
        openApi: 'https://cartransport.au/openapi.json',
        capabilityManifest: 'https://cartransport.au/quote-capability.json',
        examples: 'https://cartransport.au/agents/examples/',
        executionHost: 'https://quoting.cartransport.au',
        endpoint: 'https://quoting.cartransport.au/api/v1/vehicle-quotes/assistant/submit',
        consentRequired: true,
      },
      {
        id: 'cartransport-au.callback_request',
        name: 'Callback request',
        type: 'contact_request',
        description:
          'Request a customer-authorised Cartransport callback through the official quote host contact API.',
        url: 'https://cartransport.au/.well-known/agent-skills/callback-request/SKILL.md',
        openApi: 'https://cartransport.au/openapi.json',
        capabilityManifest: 'https://cartransport.au/quote-capability.json',
        examples: 'https://cartransport.au/agents/examples/',
        executionHost: 'https://quoting.cartransport.au',
        endpoint: 'https://quoting.cartransport.au/api/v1/callbacks/assistant/request',
        consentRequired: true,
      },
      {
        id: 'cartransport-au.agent_discovery',
        name: 'Agent/API documentation discovery',
        type: 'documentation',
        description:
          'Read public Cartransport agent guidance, capability metadata, OpenAPI aliases, and integration examples.',
        url: 'https://cartransport.au/.well-known/agent-skills/agent-discovery/SKILL.md',
        openApi: 'https://cartransport.au/openapi.json',
        capabilityManifest: 'https://cartransport.au/quote-capability.json',
        examples: 'https://cartransport.au/agents/examples/',
        consentRequired: false,
      },
    ],
    operatingRules: {
      customerConsentRequired:
        'Quote and callback submissions require the customer to ask for the action and include customer_consent.confirmed=true.',
      tenant:
        'Public submissions are host-aware. Omit tenant unless Moveroo has supplied an agreed tenant slug.',
      canonicalContract:
        'Use the quote host OpenAPI schema, capability manifest, agent guide, and examples as the source of truth.',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
