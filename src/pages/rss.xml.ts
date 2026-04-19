import rss from '@astrojs/rss';
import { site } from '../config/site';

const items = [
  {
    title: site.name,
    description: site.description,
    link: '/',
  },
  {
    title: 'About Vehicle Transport Australia',
    description:
      'Learn how Vehicle Transport Australia handles interstate vehicle moves and quoting.',
    link: '/about',
  },
  {
    title: 'Transport Guide',
    description: 'Read the Vehicle Transport Australia transport guide and supporting articles.',
    link: '/blog',
  },
  {
    title: 'Contact',
    description: 'Contact the Vehicle Transport Australia team for route review and support.',
    link: '/contact',
  },
];

export function GET(context: { site?: string | URL }) {
  return rss({
    title: `${site.name} updates`,
    description: `${site.name} transport guidance, quote pathways, and support content.`,
    site: context.site ?? site.url,
    items,
  });
}
