import type { APIRoute } from 'astro';
import { agentSkillResponse } from '../../../../lib/agentSkillDocument';

const canonical = 'https://cartransport.au/.well-known/agent-skills/household-quote/SKILL.md';

export const GET: APIRoute = () =>
  agentSkillResponse({
    name: 'household-quote',
    title: 'Household removal quote',
    description:
      'Collect a customer-authorised household removal quote request through the official quote service.',
    canonical,
    consentRequired: true,
    purpose:
      'Use the official quote service to collect a household removal quote request after the customer asks you to do so.',
    steps: [
      'Read the canonical OpenAPI schema and quote capability manifest.',
      'Collect every required field and confirm the details with the customer.',
      'Submit only after the customer confirms consent.',
      'Return the service response without changing its status or meaning.',
    ],
    resources: [
      { label: 'Household quote form', url: 'https://quoting.cartransport.au/quote/household' },
      { label: 'OpenAPI schema', url: 'https://quoting.cartransport.au/openapi.json' },
      {
        label: 'Quote capability manifest',
        url: 'https://quoting.cartransport.au/quote-capability.json',
      },
    ],
  });
