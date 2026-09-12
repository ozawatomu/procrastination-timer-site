import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { hosting } from './site.config.mjs';

export default defineConfig({
  site: hosting.origin,
  base: hosting.base || undefined,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404.html'),
    }),
  ],
});
