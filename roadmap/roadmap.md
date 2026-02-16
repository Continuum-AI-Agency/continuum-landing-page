---
feature: "Continuum Landing Page Redesign"
spec: |
  Redesign the landing page with a cleaner Hero, immediate Masonry Gallery (React), Bento Features (Astro), and updated section order. Use Astro for static sections and React for complex interactivity. Filter Strapi assets for the gallery.
---

## Task List

### Feature 1: Wave 1: Foundation & Data
Description: Backend logic and utility setup
- [x] 1.01 Create src/lib/galleryAssets.ts with filtering logic to fetch gallery-specific assets from Strapi. (note: Created src/lib/galleryAssets.ts)
- [x] 1.02 Verify src/lib/utils.ts exists and has 'cn' utility. Setup any base utils for ReactBits. (note: Verified src/lib/utils.ts exists. ReactBits/Shadcnblocks utils are standard or component-level.)

### Feature 2: Wave 2: Components
Description: Core UI components (Astro & React)
- [~] 2.01 Create src/components/ModernHero.astro (Static container, minimal design). (note: Starting ModernHero.astro)
- [~] 2.02 Create src/components/react/MasonryGallery.tsx (Interactive React component). (note: Starting MasonryGallery.tsx)
- [x] 2.03 Create src/components/BentoFeatures.astro (Static Grid layout). (note: Starting BentoFeatures.astro) (note: Completed BentoFeatures.astro)
- [x] 2.04 Create src/components/Team.astro and src/components/Pricing.astro (Static sections). (note: Starting Team.astro and Pricing.astro) (note: Completed Team.astro and Pricing.astro)

### Feature 3: Wave 3: Assembly
Description: Final assembly and polish
- [x] 3.01 Assemble src/pages/index.astro with new section order and data fetching. (note: Starting final assembly of index.astro) (note: Assembled index.astro with new components and data fetching.) (note: Index assembled and built successfully.)
