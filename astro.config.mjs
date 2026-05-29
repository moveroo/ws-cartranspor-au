import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://cartransport.au',
  redirects: {
    '/interstate-car-transport-with-personal-items': '/services/interstate/',
  },
  integrations: [tailwind(), sitemap(), icon()],
  // Optimize images automatically
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  // Build output
  output: 'static',
  build: {
    // Inline small assets
    inlineStylesheets: 'auto',
  },
});
