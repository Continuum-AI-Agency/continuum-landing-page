import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://trycontinuum.ai',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwind()],
  },
});
