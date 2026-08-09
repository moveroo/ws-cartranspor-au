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
      'Open the official contact page and read its callback requirements.',
      'Collect the required contact details and reason for the callback.',
      'Confirm the details and consent with the customer.',
      'Give the confirmed details to the customer and direct them to the contact page to submit. Do not claim that a callback request was sent.',
    ],
    resources: [
      { label: 'Contact page', url: 'https://quoting.cartransport.au/contact' },
      { label: 'OpenAPI schema', url: 'https://quoting.cartransport.au/openapi.json' },
      { label: 'Agent examples', url: 'https://quoting.cartransport.au/agents/examples' },
    ],
  });
