export const site = {
  url: import.meta.env.PUBLIC_SITE_URL || 'https://cartransport.au',
  name: import.meta.env.PUBLIC_SITE_NAME || 'Vehicle Transport Australia',
  description:
    import.meta.env.PUBLIC_SITE_DESCRIPTION ||
    'Reliable car transport across Australia with interstate vehicle shipping, depot-to-depot, and door-to-door services.',
  destinations: {
    quote: 'https://quoting.cartransport.au/quote/vehicle',
    contact: 'https://quoting.cartransport.au/contact',
  },
  publicPages: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Transport Guide' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/sitemap/', label: 'HTML Sitemap' },
  ],
};
