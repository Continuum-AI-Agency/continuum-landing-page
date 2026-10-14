import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import emdash, { local } from 'emdash/astro';
import { sqlite } from 'emdash/db';
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite';

export default defineConfig({
  site: 'https://trycontinuum.ai',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    sitemap(),
    emdash({
      database: sqlite({ url: 'file:./data/emdash.db' }),
      storage: local({
        directory: './data/uploads',
        baseUrl: '/_emdash/api/media/file',
      }),
    }),
  ],
  vite: {
    plugins: [tailwind(), wgslVitePlugin()],
  },
});
