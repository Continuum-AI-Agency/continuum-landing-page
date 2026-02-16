# Landing Page Redesign Plan

This document outlines the strategy for creating a new set of modern components for the Continuum landing page, starting fresh in `src/components/` while leveraging the existing design system.

## 1. Components to Build

### Hero Section (`Hero.astro`)
- **Focus:** High-impact introduction.
- **Typography:** Use `Futura Maxi` for headings and `Raleway` for storytelling elements.
- **Features:** 
  - Interactive background gradients.
  - `BlurText.tsx` integration for entry animations.
  - Refined CTA form.

### Client Logos (`Logos.astro`)
- **Focus:** Social proof and trust.
- **Design:** Infinite horizontal marquee.
- **Source:** Automatically pulls logos from `src/assets/cliente_logos/`.
- **Interactivity:** Pause on hover, grayscale to color transition.

### Examples Gallery (`Gallery.astro`)
- **Focus:** Visual proof of work.
- **Logic:** Astro wrapper for `MasonryGallery.tsx`.
- **Data:** Consumes `GalleryImage` array from Strapi.
- **Design:** Responsive masonry layout with lazy-loaded images and hover overlays.

### Product Bento (`ProductBento.astro`)
- **Focus:** Module breakdown (Studio+, Social+, Performance+).
- **Design:** Bento-box grid using Tailwind's `grid-cols-3`.
- **Visuals:** High-quality product screenshots with glassmorphism overlays.

### Team Section (`Team.astro`)
- **Focus:** Human expertise.
- **Design:** Modern card grid.
- **Features:** 
  - Grayscale-to-color avatar transitions.
  - Previous experience logo strips.
  - Minimalist layout focusing on bio and role.

## 2. Implementation Strategy

1. **New Directory:** All new components will reside in `src/components/` (distinct from `src/components-old/`).
2. **Layout Integration:** Utilize `src/layouts/Layout.astro` as the base, ensuring global styles and fonts are preserved.
3. **Data Flow:** Fetch Strapi assets at the page level (`index.astro`) and pass them as props to ensure high performance and SEO.
4. **Consistency:** Strictly follow the font pairings defined in `global.css`:
   - **Headings:** Futura Maxi
   - **Body/UI:** Poppins
   - **Editorial:** Raleway

## 3. Targeted File Structure
- `src/components/Hero.astro`
- `src/components/Logos.astro`
- `src/components/Gallery.astro`
- `src/components/ProductBento.astro`
- `src/components/Team.astro`
- `src/pages/index.astro` (Updated)
