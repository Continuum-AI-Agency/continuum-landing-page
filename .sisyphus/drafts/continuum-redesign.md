# Draft: Continuum Landing Page Redesign

## Requirements (Confirmed)
- **Goal**: Total redesign of the landing page.
- **Section Flow**:
  1. **Hero Section** (Cleaner, immediate transition to Gallery)
  2. **Bento Grid Gallery** (Masonry layout using ReactBits)
  3. **Customer Marquee** (Below the gallery)
  4. **Product Section**
  5. **Features Section**
  6. **Pricing Section**
  7. **Team Section**
- **Tech Stack**:
  - Framework: Astro + React
  - UI Library: ShadCN UI (already installed in `src/components/ui`)
  - Blocks: Shadcnblocks, LaunchUI
  - Special Components: ReactBits Masonry (for gallery)
  - Styling: Tailwind CSS v4

## Design System (Preliminary)
- **Style**: Clean, Minimalist, likely Dark Mode (based on "Continuum" name and modern SaaS trends).
- **Hero**: Needs to be "cleaner".
- **Gallery**: Masonry layout is key. Link: https://reactbits.dev/components/masonry

## Open Questions
- **"Cleaner" Hero**:
  - Centered text vs Split layout?
  - Background: Abstract, gradient, or solid?
  - Typography scale: Huge display text or more restrained?
- **Bento Grid Content**: What content goes in the grid? Product screenshots? User testimonials? abstract visuals?
- **Color Palette**: Existing brand colors or open to new suggestions?
- **Animations**: How heavy? Scroll-triggered?
