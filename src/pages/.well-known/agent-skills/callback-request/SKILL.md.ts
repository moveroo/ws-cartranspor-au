import type { APIRoute } from 'astro';
import { agentSkillResponse } from '../../../../lib/agentSkillDocument';

const canonical = 'https://cartransport.au/.well-known/agent-skills/callback-request/SKILL.md';

export const GET: APIRoute = () =>
  agentSkillResponse({
    name: 'callback-request',
    title: 'Callback request',
    description: 'Request a customer-authorised callback through the official quote service.',
    canonical,
    consentRequired: true,
    purpose:
      'Use the official quote service to request a callback after the customer asks to speak with the team.',
    steps: [
      'Read the canonical OpenAPI schema and callback requirements.',
      'Collect the required contact details and reason for the callback.',
      'Confirm the details and consent with the customer.',
      'Submit the request and return the service response without promising a callback time.',
    ],
    resources: [
      { label: 'Contact page', url: 'https://quoting.cartransport.au/contact' },
      { label: 'OpenAPI schema', url: 'https://quoting.cartransport.au/openapi.json' },
      { label: 'Agent examples', url: 'https://quoting.cartransport.au/agents/examples' },
    ],
  });
