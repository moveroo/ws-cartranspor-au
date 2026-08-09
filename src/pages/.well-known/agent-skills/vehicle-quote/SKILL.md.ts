import type { APIRoute } from 'astro';
import { agentSkillResponse } from '../../../../lib/agentSkillDocument';

const canonical = 'https://cartransport.au/.well-known/agent-skills/vehicle-quote/SKILL.md';

export const GET: APIRoute = () =>
  agentSkillResponse({
    name: 'vehicle-quote',
    title: 'Vehicle transport quote',
    description:
      'Hand the customer to the official vehicle transport quote form; no public vehicle submission API is currently available.',
    canonical,
    consentRequired: false,
    purpose:
      'Use the official vehicle quote form as a human handoff. Do not collect or submit vehicle quote data through an API.',
    steps: [
      'Open the official vehicle quote form for the customer.',
      'Explain that the customer must review and submit the form themselves.',
      'Do not claim that a quote request, price, or booking has been created.',
    ],
    resources: [
      { label: 'Vehicle quote form', url: 'https://quoting.cartransport.au/quote/vehicle' },
    ],
  });
