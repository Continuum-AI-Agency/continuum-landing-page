---
feature: "Migration to Astro & Tailwind"
spec: |
  Move assets directory to public/ and copy existing CSS files to src/styles/.
---

## Task List

### Feature 1: Setup & Configuration},{actions:[{description:
Description: Set up the basic Astro and Tailwind configuration and directory structure.
- [x] 1.01 Initialize Astro project structure (src/pages, src/components, src/layouts, public). (note: Created src/pages, src/layouts, src/components, src/styles, public.)
- [x] 1.02 Create astro.config.mjs with Tailwind integration. (note: Created astro.config.mjs.)
- [x] 1.03 Create tailwind.config.mjs (or rely on v4 auto-detection if applicable, but explicit config is safer for migration). (note: Skipped explicit config file. Using Tailwind v4 CSS-first configuration via src/styles/global.css.)
