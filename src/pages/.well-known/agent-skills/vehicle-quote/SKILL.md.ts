import type { APIRoute } from 'astro';
import { agentSkillResponse } from '../../../../lib/agentSkillDocument';

const canonical = 'https://cartransport.au/.well-known/agent-skills/vehicle-quote/SKILL.md';

export const GET: APIRoute = () =>
  agentSkillResponse({
    name: 'Vehicle transport quote',
    description:
      'Collect a customer-authorised vehicle transport quote request through the official quote service.',
    canonical,
    consentRequired: true,
    purpose:
      'Use the official quote service to collect a vehicle transport quote request after the customer asks you to do so.',
    steps: [
      'Read the canonical OpenAPI schema and quote capability manifest.',
      'Collect the locations, vehicle details, condition, and modifications required by the schema.',
      'Confirm the details and consent with the customer.',
      'Submit the request and return the service response without changing its status or meaning.',
    ],
    resources: [
      { label: 'Vehicle quote form', url: 'https://quoting.cartransport.au/quote/vehicle' },
      { label: 'OpenAPI schema', url: 'https://quoting.cartransport.au/openapi.json' },
      {
        label: 'Quote capability manifest',
        url: 'https://quoting.cartransport.au/quote-capability.json',
      },
    ],
  });
