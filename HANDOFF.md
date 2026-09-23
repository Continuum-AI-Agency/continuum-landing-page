# Handoff: landing overhaul (branch `overhaul`)

State as of 2026-09-22. Branch `overhaul` is **local only, not pushed, no PR**. `main` equals `origin/main`.
Merging `overhaul` into main also closes Michelle's PRs #5, #6, #7 (merged in locally).

Masonry grid refresh and pricing solids landed on 2026-09-23 (see [Masonry grid](#masonry-grid) and [Pricing](#pricing)).

## Run

- `bun run dev` on http://localhost:4321, `bun run build`, typecheck with `./node_modules/.bin/tsc --noEmit -p .`
- WebGPU in automation: `agent-browser --headed --args "--enable-unsafe-webgpu" open http://localhost:4321/`
- Netlify builds with Bun and `--frozen-lockfile`; commit `bun.lock` with any dependency change.

## Page map (`src/pages/index.astro`)

| Zone | Section | File |
|---|---|---|
| night | Sticky pill nav (all pages) | `src/components/SiteNav.astro` |
| night | Hero: CONTINUUM wordmark, black-hole O, starfield, shimmer CTA, logo strip `#logos` | `Hero.astro`, `react/HeroStage.tsx`, `LogoCloud.astro` |
| night | Video masonry `#showcase` (no visible heading) | `MasonryGrid.astro` |
| dawn band | (decorative, no text) | `Sky.astro` |
| day | Three lines. One factory.: `#organic` `#performance` `#automation` | `Product.astro`, `react/product/*` |
| day | Measured, not demoed. `#results` | `Proof.astro` |
| day | Founder strip → /about | `FounderStrip.astro` |
| day | Pricing `#pricing` | `react/Pricing.tsx` |
| dusk band | (decorative) | `Sky.astro` |
| night | CTA `#demo` + footer with wordmark bookend | `CTA.astro`, `Footer.astro` |

`/about` (`src/pages/about.astro`): story line, founders + team (`Team.astro`, static, bios visible), press/podcasts/blog cards.

## Systems worth knowing

- **Black hole O:** vendored vgpu `optimized-black-hole` (MIT) in `src/lib/black-hole/`. Look in `settings.ts` (pitch 0.62, diskRadius 5.5, fov 2.9, stars off). `renderer.ts` exposes `setPitch` (drag to tilt, re-bake throttled to measured bake cost) and `canTilt`. WebGPU only; poster fallback `public/assets/hero/black-hole.webp` (re-capture if settings change).
- **Hero starfield:** `src/lib/starfield.ts`, Canvas2D, stars spiral into the O through a point lens; static frame under reduced motion.
- **Page sky:** `Sky.astro`. A fixed SVG starfield (`public/assets/sky/stars-*.svg`) with dawn/dusk bands and a `.daylight` wrapper. Night sections are transparent. Tokens `--night`, `--day-top`, `--day-low`, `--hero-cyan`, `--hero-violet` in `src/styles/global.css`.
- **`.dark` works when nested:** the shadcn aliases are declared on `:root, .dark`, so a nested `.dark` wrapper re-resolves them. Don't move them back to `:root` only.
- **Buttons:** primary CTAs use `components/ui/shimmer-button.tsx` (Magic UI, house change: `href` renders `<a>`). Every button uses the app's `btn-fill` bloom; `Layout.astro` has the PointerOrigin script (fill blooms from the pointer). In `.astro` files pass `className`, not `class`, to React components.
- **Product windows:** `.app-theme` scope = the shipped app's tokens (Geist, #fdfdfd, #5a48f9). Primitives in `components/ui/*` and `components/ai-elements/*` are copied from `Continuum-Monorepo/Continuum-Frontend` (shadcn base-nova on Base UI). The demos are scripted, no network. One fictional brand across all three: Aurel Audio studio launch.
- **Type:** self-hosted Satoshi variable (`public/assets/fonts/Satoshi-Variable.woff2`), Futura Maxi wordmark only, Geist inside windows. Scale tokens `text-display`, `text-h2`, `text-h3`, `text-lead` in `@theme`. Shimmer (`.shimmer`) is used on exactly two words: the hero audience word and the CTA's "Continuum?".
- **Docs of record:** `PRODUCT.md`, `design.md` (sections 9b and 10 are current).

## Masonry grid

`src/components/MasonryGrid.astro`, 19 clips (12 added 2026-09-23, owner-confirmed live client work; 7 kept from the old set).
- **Rights caveat:** of the 7 kept, only Kamay traces to a known client. Heineken, Claro and Mercado Libre may be spec or agency-era work; the owner chose to keep them (2026-09-23), but the sr-only heading says "clips from live campaigns", so confirm them or drop them before launch.
- **Adding a clip:** put the master in `media/` (gitignored) or point `MASTERS` at its folder, add a `name|file|seconds|start|poster-time` line to `clips=(...)` in `scripts/optimize-media.sh`, run `MASTERS=~/Downloads bun run optimize:media`, then add `[name, aria-label]` to `CLIPS` in the grid. Order in `CLIPS` = display order.
- **Encoding:** 480px wide, 24fps, H.264 CRF 30, no audio, **boomerang** (forward then reversed) so the loop never jumps. Posters are taken `poster-time` seconds in (default 1.5) to skip intros. A clip with no master but existing output is kept. Old masters can be restored from git history: `git show 7fa0bd4:public/assets/<file>`.
- **Layout:** ratio comes from the poster's real dimensions; clips are packed greedily into the shortest of 5 columns (cols 1-2 are the only ones on mobile); each column's scroll duration scales with its height (13s per column-width) so all move at one speed; the track is padded by one gap so the -50% loop is seamless; top/bottom fade into the stars. It never pauses (owner call).
- **Playback:** `preload="none"`, src attached by IntersectionObserver, up to 16 playing at once, reduced motion shows posters only.
- Not built: padding short columns by repeating clips. Needed if the set drops below ~15.

## Pricing

`src/components/react/Pricing.tsx` (day zone). Each card has a Platonic solid in the top-right (`src/lib/polyhedra.ts`, Canvas2D): tetrahedron, octahedron, icosahedron. At rest it is a flat line glyph (the solid seen down a vertex); on hover or keyboard focus it grows into the shaded, turning, pointer-tilted solid and eases back on leave. Reduced motion: static three-quarter view on hover. Geometry check: `bun src/lib/polyhedra.check.ts`. Billing uses the shadcn Switch (`ui/switch.tsx`). No spec strip or trial line: no real limits exist yet.

## Waiting on the owners

- Pilot numbers in Results (~50% / ~40% / ~29%) come from the published CMO blog post. Confirm they're cleared (a sibling post says "do not insert a result number until cleared").
- Production counts (299 Meta ad accounts, 195K ad-days, 8.6K assets, 947 Jaina runs) are real but marked internal-only in the monorepo. Add them only once cleared.
- Unsourced stats are still live on `/social-plus` and `/technology` (−60% ad time, 10K+ variants/day, <2s per variant, 100% brand-consistent). Recommend pulling them.
- Logo strip: only Privalia is a confirmed customer in the monorepo. Confirm permission for the rest; confirm "Wooloo" spelling.
- Organic+ publishing is live only on Instagram (TikTok/LinkedIn pending platform approval). Decide the wording.
- Team: roles for Marcos, Michael, Alexia; Alexia's headshot (drop `src/assets/team/alexia.jpg`, it's picked up by filename).
- Not YC-backed: no YC badge anywhere.
- The CTA email form (`CTA.astro`) still sends nowhere.

## Gotchas

- Don't `git add -A src`: untracked local leftovers (`src/assets/hero/`, `src/assets/world/`, `src/assets/*_Headshot.png`, planet JPGs) are listed in `.git/info/exclude`, but add files explicitly anyway.
- IDs in use: `#logos`, `#showcase`, `#product`, `#organic`, `#performance`, `#automation`, `#results`, `#pricing`, `#demo`. Keep them unique.
- `/social-plus` is the Social+ plugin for Claude (a separate product), not Organic+.
