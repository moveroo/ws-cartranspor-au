const configuredSiteName = import.meta.env.PUBLIC_SITE_NAME;
const configuredSiteDescription = import.meta.env.PUBLIC_SITE_DESCRIPTION;

export const site = {
  url: import.meta.env.PUBLIC_SITE_URL || 'https://cartransport.au',
  name:
    configuredSiteName && configuredSiteName !== 'My Site'
      ? configuredSiteName
      : 'Vehicle Transport Australia',
  description:
    configuredSiteDescription && configuredSiteDescription !== 'Your site description'
      ? configuredSiteDescription
      : 'Reliable car transport across Australia with interstate vehicle shipping, depot-to-depot, and door-to-door services.',
  destinations: {
    quote: 'https://quoting.cartransport.au/quote/vehicle',
    contact: 'https://quoting.cartransport.au/contact',
  },
  analytics: {
    siteKey: 'cartransport-au',
    trackedLinks: [
      {
        href: 'https://quoting.cartransport.au/quote/vehicle',
        eventName: 'quote_vehicle_click',
      },
    ],
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
