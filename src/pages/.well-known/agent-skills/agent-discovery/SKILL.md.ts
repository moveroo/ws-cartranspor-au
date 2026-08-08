import type { APIRoute } from 'astro';
import { agentSkillResponse } from '../../../../lib/agentSkillDocument';

const canonical = 'https://cartransport.au/.well-known/agent-skills/agent-discovery/SKILL.md';

export const GET: APIRoute = () =>
  agentSkillResponse({
    name: 'Agent and API documentation discovery',
    description:
      'Read the public Cartransport agent guidance and machine-readable service contracts.',
    canonical,
    consentRequired: false,
    purpose:
      'Use this read-only skill to find the current public guidance, schemas, capability metadata, and examples.',
    steps: [
      'Read the agent guide for operating rules and ownership.',
      'Read the quote capability manifest to find supported interactions.',
      'Use the OpenAPI schema for current request and response fields.',
      'Use the examples only with the current schema and capability manifest.',
    ],
    resources: [
      { label: 'Agent guide', url: 'https://cartransport.au/agents/' },
      { label: 'OpenAPI schema', url: 'https://quoting.cartransport.au/openapi.json' },
      {
        label: 'Quote capability manifest',
        url: 'https://quoting.cartransport.au/quote-capability.json',
      },
      { label: 'Agent examples', url: 'https://quoting.cartransport.au/agents/examples' },
    ],
  });
