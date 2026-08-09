export interface AgentSkillDocument {
  name: string;
  title: string;
  description: string;
  canonical: string;
  consentRequired: boolean;
  purpose: string;
  steps: string[];
  resources: Array<{ label: string; url: string }>;
}

function yamlString(value: string) {
  return JSON.stringify(value);
}

export function agentSkillResponse(skill: AgentSkillDocument) {
  const body = [
    '---',
    `name: ${skill.name}`,
    `description: ${yamlString(skill.description)}`,
    'metadata:',
    `  moveroo-canonical: ${yamlString(skill.canonical)}`,
    `  moveroo-consent-required: ${yamlString(String(skill.consentRequired))}`,
    '---',
    '',
    `# ${skill.title}`,
    '',
    skill.purpose,
    '',
    '## Safe use',
    '',
    ...(skill.consentRequired
      ? [
          '- Use this skill only when the customer has asked for this action.',
          '- Show the customer the information that will be submitted before submission.',
          '- Do not claim a price, booking, or callback is confirmed until the official service confirms it.',
        ]
      : [
          '- This skill is read-only.',
          '- Use the official resources below as the source of truth.',
        ]),
    '',
    '## Steps',
    '',
    ...skill.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Official resources',
    '',
    ...skill.resources.map(({ label, url }) => `- [${label}](${url})`),
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
      Link: `<${skill.canonical}>; rel="canonical"`,
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}
