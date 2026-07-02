const configuredSiteName = import.meta.env.PUBLIC_SITE_NAME;
const configuredSiteDescription = import.meta.env.PUBLIC_SITE_DESCRIPTION;
const configuredSiteUrl = import.meta.env.PUBLIC_SITE_URL;
const hasRealConfiguredSiteUrl = configuredSiteUrl && !configuredSiteUrl.includes('example.com');

export const site = {
  url: hasRealConfiguredSiteUrl ? configuredSiteUrl : 'https://cartransport.au',
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
    householdQuote: 'https://quoting.cartransport.au/quote/household',
    vehicleQuote: 'https://quoting.cartransport.au/quote/vehicle',
    contactPage: 'https://quoting.cartransport.au/contact',
    bookingPage: 'https://quoting.cartransport.au/booking/create',
  },
  analytics: {
    siteKey: 'cartransport-au',
    trackedLinks: [
      {
        href: 'https://quoting.cartransport.au/quote/household',
        eventName: 'quote_household_click',
        params: {
          interaction_type: 'quote',
          lead_type: 'household_quote',
          quote_type: 'household',
          quote_host: 'quoting.cartransport.au',
          handoff_event_name: 'quote_household_click',
        },
      },
      {
        href: 'https://quoting.cartransport.au/quote/vehicle',
        eventName: 'quote_vehicle_click',
        params: {
          interaction_type: 'quote',
          lead_type: 'vehicle_quote',
          quote_type: 'vehicle',
          quote_host: 'quoting.cartransport.au',
          handoff_event_name: 'quote_vehicle_click',
        },
      },
      {
        href: 'https://quoting.cartransport.au/booking/create',
        eventName: 'booking_household_click',
        params: {
          interaction_type: 'booking',
          lead_type: 'booking',
          quote_type: 'household',
          quote_host: 'quoting.cartransport.au',
          handoff_event_name: 'booking_household_click',
        },
      },
      {
        href: 'https://quoting.cartransport.au/contact',
        eventName: 'contact_intent_click',
        params: {
          interaction_type: 'contact',
          lead_type: 'contact',
          quote_host: 'quoting.cartransport.au',
          handoff_event_name: 'contact_intent_click',
        },
      },
    ],
  },
  publicPages: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Transport Guide' },
    { href: 'https://quoting.cartransport.au/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/sitemap/', label: 'HTML Sitemap' },
  ],
};
