# Plan: Continuum Landing Page Redesign

## TL;DR

> **Quick Summary**: Complete redesign of the landing page using a cleaner, modern aesthetic with a "True Masonry" gallery and Bento Grid layouts.
> 
> **Deliverables**:
> - New `index.astro` layout with reordered sections.
> - React components for Hero, Masonry Gallery, Bento Features, and Team/Pricing.
> - Integration of ReactBits, Shadcnblocks, and LaunchUI patterns.
> - Updated Strapi asset fetching for gallery specific content.
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Asset Logic → Components → Page Assembly

---

## Context

### Original Request
- **Goal**: Redesign landing page.
- **Flow**: Hero -> Masonry Gallery -> Customer Marquee -> Product/Features (Bento) -> Pricing -> Team.
- **Style**: "Cleaner", "True Masonry" (ReactBits style), "Bento Grid".
- **Tech**: ReactBits, Shadcn, Shadcnblocks, LaunchUI.

### Interview Summary
**Key Decisions**:
- **Layout**: "True Masonry" for the main gallery, "Bento Grid" for features.
- **Content**: Gallery will use existing Strapi assets (Customer Work).
- **Colors**: Custom palette (User to provide hex codes; using variables for now).
- **Typography**: Keep existing `Future Maxi` (Headings) and `Poppins` (Body).

**Research Findings**:
- **Framework**: Astro + React + Tailwind v4.
- **Data**: `src/lib/strapiAssets.ts` currently fetches *all* assets. Need to filter for the gallery.
- **Existing**: Global CSS variables define the theme.

---

## Work Objectives

### Core Objective
Create a high-performance, visually stunning landing page that showcases customer work immediately after the hero, followed by social proof and detailed feature breakdowns.

### Concrete Deliverables
- `src/pages/index.astro` (Updated layout)
- `src/components/ModernHero.astro` (New - Static container)
- `src/components/react/MasonryGallery.tsx` (New - Interactive)
- `src/components/BentoFeatures.astro` (New - Static/Grid layout)
- `src/components/Team.astro` (New - Static)
- `src/components/Pricing.astro` (New - Static)
- `src/lib/galleryAssets.ts` (New/Updated logic)

### Definition of Done
- [ ] Landing page follows the new section order.
- [ ] Masonry Gallery loads images from Strapi without layout shift.
- [ ] Bento Grid displays features correctly.
- [ ] All interactive elements work (hover states, marqee).
- [ ] Responsive on Mobile (375px), Tablet (768px), and Desktop (1440px).

### Must Have
- **True Masonry Layout** (Staggered columns).
- **Immediate Gallery** (Above the fold/Just below hero).
- **Bento Grid** for features.
- **Astro-First Architecture**: Use `.astro` components for all static sections; only use `.tsx` for complex state/motion.

### Must NOT Have (Guardrails)
- **Layout Shift**: Images must have aspect ratios or skeletons while loading.
- **Generic AI Art**: Use actual "Customer Work" from Strapi.
- **Blocking Scripts**: Heavy animations must not block main thread (use `client:visible` or `client:idle`).

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure**: Existing (Astro/React).
- **Automated Tests**: NO (Focus on visual regression/component verification via Agent QA).
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks).

### Agent-Executed QA Scenarios (MANDATORY)

**Frontend/UI (Playwright)**
All UI components will be verified by:
1.  Rendering the component/page.
2.  Checking for visibility of key elements (Hero title, Gallery images).
3.  Verifying no console errors.
4.  Taking screenshots for visual confirmation.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation & Data):
├── Task 1: [Data] Update Asset Logic (Filter for Gallery)
└── Task 2: [Setup] Install/Copy Dependencies (ReactBits/Shadcnblocks utils)

Wave 2 (Components):
├── Task 3: [UI] Create Modern Hero (Astro)
├── Task 4: [UI] Create Masonry Gallery (React)
├── Task 5: [UI] Create Bento Features (Astro)
└── Task 6: [UI] Create Team & Pricing (Astro)

Wave 3 (Assembly):
└── Task 7: [Page] Assemble index.astro & Final Polish
```

---

## TODOs

- [ ] 1. [Data] Create Gallery Asset Logic

  **What to do**:
  - Create `src/lib/galleryAssets.ts` (or update `strapiAssets.ts`).
  - Implement logic to filter assets suitable for the gallery (e.g., filter by folder path `gallery/` or look for specific metadata if available, otherwise fallback to a specific list or recent uploads).
  - *Refinement*: Since we don't have folder info in the current `UploadFile` type, we'll filter by `caption` containing "gallery" OR `alternativeText` containing "gallery" as a convention, or just fetch the first N images.
  - Return a structured array of `{ url, width, height, alt }` for the Masonry grid.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`typescript`, `astro`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Acceptance Criteria**:
  - [ ] `fetchGalleryAssets()` function exists and returns `Promise<GalleryImage[]>`.
  - [ ] Returns at least 5 mock/real images from Strapi.
  - [ ] **QA Scenario**:
    - Tool: Bash (bun/node REPL)
    - Code: `import { fetchGalleryAssets } from './src/lib/galleryAssets'; console.log(await fetchGalleryAssets())`
    - Expect: Array of objects with `url` property.

- [ ] 2. [Setup] Setup ReactBits & Shadcnblocks Utils

  **What to do**:
  - Check requirements for ReactBits Masonry (usually just CSS/React).
  - Add `tailwind-merge` and `clsx` utilities if not present (already in package.json, just verify `src/lib/utils.ts`).
  - Create `src/components/ui/masonry.tsx` (or similar) base component if ReactBits provides a specific primitive.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`react`, `tailwindcss`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Acceptance Criteria**:
  - [ ] `src/lib/utils.ts` exists and exports `cn`.
  - [ ] **QA Scenario**:
    - Tool: Bash
    - Command: `ls src/lib/utils.ts`
    - Expect: File exists.

- [ ] 3. [UI] Create Modern Hero Component (Astro)

  **What to do**:
  - Create `src/components/ModernHero.astro`.
  - **Design**:
    - Minimalist text-centered or split layout (LaunchUI style).
    - `h1` using `Future Maxi` font.
    - Subtitle using `Poppins`.
    - "Get Started" / "View Work" CTAs.
    - Subtle background animation (CSS keyframes or static mesh).
  - **Props**: Allow passing `title`, `subtitle`, `ctaLink`.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `astro`, `tailwindcss`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] Component renders without errors.
  - [ ] Uses `font-futura` (or whatever class matches `Future Maxi`).
  - [ ] **QA Scenario**:
    - Tool: Playwright (via specific test page or component preview)
    - Action: Render component.
    - Assert: `h1` is visible.

- [ ] 4. [UI] Create Masonry Gallery Component (React)

  **What to do**:
  - Create `src/components/react/MasonryGallery.tsx`.
  - **Implementation**:
    - Use ReactBits Masonry logic (Staggered columns).
    - Map over the data from Task 1.
    - **Layout**: 3 columns on desktop, 2 on tablet, 1 on mobile.
    - **Animation**: Fade-in on scroll (Framer Motion).
  - **Style**:
    - Rounded corners (`rounded-2xl`).
    - Subtle hover effect (scale up + overlay caption).
  - **Note**: This component will be hydrated with `client:load` in the parent Astro page.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `react`, `framer-motion`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] Gallery renders images in a staggered layout.
  - [ ] Responsive column count.
  - [ ] **QA Scenario**:
    - Tool: Playwright
    - Action: Check for `.masonry-grid` class (or equivalent).
    - Assert: Images are visible.

- [ ] 5. [UI] Create Bento Features Component (Astro)

  **What to do**:
  - Create `src/components/BentoFeatures.astro`.
  - **Design**:
    - Grid layout using CSS Grid (`grid-cols-1 md:grid-cols-3`).
    - Spanning cells (`col-span-2`, `row-span-2`).
    - 4-5 Feature cards built as HTML/CSS.
    - Cards use `GlassCard` style or solid dark theme cards.
    - Icons/Illustrations in each cell.
  - **Content**: Placeholders for now (Product, Features, etc.).

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `astro`, `tailwindcss`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] Grid layout uses CSS Grid.
  - [ ] At least one cell spans multiple columns.
  - [ ] **QA Scenario**:
    - Tool: Playwright
    - Action: Verify grid structure.

- [ ] 6. [UI] Create Team & Pricing Sections (Astro)

  **What to do**:
  - Create `src/components/Team.astro` and `src/components/Pricing.astro`.
  - **Team**: Circular avatars or cards, "Meet the experts".
  - **Pricing**: 3 cards (Basic, Pro, Enterprise). "Pro" highlighted.
  - Use HTML/Tailwind for structure to minimize JS payload.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`, `astro`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] Pricing section has 3 cards.
  - [ ] **QA Scenario**:
    - Tool: Playwright
    - Assert: Text "Pricing" is visible.

- [ ] 7. [Page] Assemble Index Page

  **What to do**:
  - Edit `src/pages/index.astro`.
  - Import new `.astro` and `.tsx` components.
  - **Order**:
    1. `<ModernHero />` (Static Astro)
    2. `<MasonryGallery client:load images={galleryImages} />` (React)
    3. `<TrustMarquee client:idle />` (Existing)
    4. `<BentoFeatures />` (Static Astro)
    5. `<Pricing />` (Static Astro)
    6. `<Team />` (Static Astro)
    7. `<Footer />` (Existing)
  - Fetch data via `await fetchGalleryAssets()` in the frontmatter.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`astro`, `frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (Depends on components)
  - **Parallel Group**: Wave 3

  **Acceptance Criteria**:
  - [ ] Page builds successfully.
  - [ ] Section order matches requirements.
  - [ ] **QA Scenario**:
    - Tool: Playwright
    - Action: Visit `/`.
    - Assert: Hero is at top, Footer at bottom.
    - Screenshot: `.sisyphus/evidence/index-redesign.png`.

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `feat(data): add gallery asset filtering logic` | `src/lib/galleryAssets.ts` |
| 2 | `chore(setup): ensure utility dependencies` | `src/lib/utils.ts` |
| 3 | `feat(ui): add modern hero component` | `src/components/ModernHero.astro` |
| 4 | `feat(ui): add masonry gallery component` | `src/components/react/MasonryGallery.tsx` |
| 5 | `feat(ui): add bento features component` | `src/components/BentoFeatures.astro` |
| 6 | `feat(ui): add team and pricing sections` | `src/components/Team.astro`, `Pricing.astro` |
| 7 | `feat(page): assemble new landing page layout` | `src/pages/index.astro` |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Must pass without errors
bun run preview # For visual verification
```

### Final Checklist
- [ ] Hero is cleaner/minimalist.
- [ ] Masonry Gallery appears immediately after Hero.
- [ ] Customer Marquee follows Gallery.
- [ ] Features are in a Bento Grid.
- [ ] No layout shifts on image load.
