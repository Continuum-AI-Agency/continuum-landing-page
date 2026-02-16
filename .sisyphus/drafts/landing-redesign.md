# Draft: Landing Page Redesign

## Current State (confirmed via codebase audit)
- **Framework**: Astro 5.16.9 + React 18.3.1
- **Styling**: Tailwind CSS 4.1.18, dark-mode-first, glassmorphism throughout
- **Fonts**: Futura Maxi (headings), Poppins (UI/body), Raleway (quotes)
- **ShadCN installed**: accordion, badge, button, card, form, input, label, marquee
- **Assets from Strapi**: via fetchAssetMap() + resolveAsset()

### Current section order:
1. Header (sticky nav, pill-style links)
2. Hero (headline + subtitle + HeroForm email capture + phone mockup video)
3. TrustMarquee (15 client logos, infinite scroll marquee)
4. Gallery (horizontal auto-scroll row of 15+ videos + 1 image, various aspect ratios)
5. HowItWorks (4 cards: Listen/Analyze/Create/Launch with counters, marquees, stacked images)
6. Modules (tabbed: STUDIO+, SOCIAL+, PERFORMANCE+ with screenshots)
7. Solutions (2 persona cards: In-house teams vs Performance agencies)
8. ImpactMetrics (4 animated counter cards)
9. Team (5 founder cards with flip effect)
10. Pricing (3 cards: SOCIAL+, STUDIO+, PERFORMANCE+)
11. FAQ (accordion)
12. CTA (final conversion)
13. Footer

## Requirements (confirmed)
- Total redesign of the landing page
- **New section order**: Hero → Bento Grid Gallery → Customer Marquee → [rest]
- **Cleaner hero**: [NEEDS CLARIFICATION — what "cleaner" means]
- **Bento Grid Gallery**: ReactBits masonry-style, replaces current horizontal scroll Gallery
- **Customer Marquee**: moves below the bento grid (currently above Gallery)
- **Then**: Product, Features, Pricing, Team sections
- **Libraries to use**: ReactBits (copy-paste), ShadCN, ShadcnBlocks (copy-paste), LaunchUI (copy-paste, free OSS)

## Technical Decisions
- ReactBits is a copy-paste model (not npm install). Copy component code, install peer deps (e.g., gsap)
- ShadcnBlocks: 1351+ blocks, copy-paste or shadcn CLI. Key: Hero (177), Bento (8), Gallery (48), Pricing (37), Team (15), Feature (274), FAQ (17), CTA (26), Footer (26), Logos (14), Navbar (19). Supports Astro.
- LaunchUI: Free OSS, React + Shadcn/ui + Tailwind 4.1.18. Sections: Hero (6), Bento Grid (5), Feature (6), Social Proof (6), FAQ (6), Navbar (6), Logos (6), Pricing (6), Gallery (3), Stats (4), Testimonials (3), CTA (4), Footer (4).

## Research Findings
- Current Gallery has 15 videos across multiple aspect ratios (1:1, 9:16, 4:5) — excellent masonry content
- GlassPanel wrapper used on every section — will this stay?
- Hero has email capture form via react-hook-form + zod — keep or remove?
- The `global.css` is ~3000+ lines of hand-written component CSS

## Open Questions
1. What does "cleaner hero" mean? (see options below)
2. Which sections are BEING REMOVED in the redesign?
3. Keep glassmorphism or go cleaner?
4. Keep dark theme or explore light/dark toggle?
5. Bento grid content: same videos/images as current gallery?
6. Should the bento grid be a React client component (for animations) or static Astro?

## Scope Boundaries
- INCLUDE: [pending]
- EXCLUDE: [pending]
