import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import react from '@astrojs/react';
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite';

export default defineConfig({
  site: 'https://trycontinuum.ai',
  integrations: [react()],
  vite: {
    plugins: [tailwind(), wgslVitePlugin()],
  },
});
