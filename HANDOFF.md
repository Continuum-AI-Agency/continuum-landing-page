# Handoff: landing overhaul (branch `overhaul`)

State as of 2026-09-22. Branch `overhaul` is **local only, not pushed, no PR**. `main` equals `origin/main`.
Merging `overhaul` into main also closes Michelle's PRs #5, #6, #7 (merged in locally).

**Next task:** improve the masonry grid ("Made on Continuum") with new media. See [Masonry grid](#masonry-grid-next-task).

## Run

- `bun run dev` on http://localhost:4321, `bun run build`, typecheck with `./node_modules/.bin/tsc --noEmit -p .`
- WebGPU in automation: `agent-browser --headed --args "--enable-unsafe-webgpu" open http://localhost:4321/`
- Netlify builds with Bun and `--frozen-lockfile`; commit `bun.lock` with any dependency change.

## Page map (`src/pages/index.astro`)

| Zone | Section | File |
|---|---|---|
| night | Sticky pill nav (all pages) | `src/components/SiteNav.astro` |
| night | Hero: CONTINUUM wordmark, black-hole O, starfield, shimmer CTA, logo strip `#logos` | `Hero.astro`, `react/HeroStage.tsx`, `LogoCloud.astro` |
| night | **Made on Continuum** video masonry `#showcase` | `MasonryGrid.astro` |
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

## Masonry grid (next task)

Current implementation in `src/components/MasonryGrid.astro`:
- 15 clips, each an `.mp4` + `.jpg` poster in `src/assets/showcase/`, imported one by one; `raw[]` holds `{ src, poster, title, ratio }` with `ratio` 0.56 (9:16), 1, or 1.77 (16:9).
- Posters go through `getImage` (480px webp q65). Videos are raw `<video data-src poster preload="none">`; an IntersectionObserver attaches `src` on view and caps playback at 6 (`MAX_PLAYING`).
- Layout: 5 columns (2 on mobile, 3 at sm, 4 at md, 5 at lg), each column duplicated for a seamless CSS keyframe loop (`scroll-up` / `scroll-down`, 45s). The duplicates are `aria-hidden`. Reduced motion stops the scroll and skips video loading.
- The section sits in the night zone (`bg-transparent`, stars behind), heading "Made on Continuum." + one-line sub.
- Encoding: `scripts/optimize-media.sh` transcodes masters from `public/assets/` (8s, 480px, 24fps, H.264 CRF 30, faststart, no audio) into `src/assets/showcase/` with posters. Masters are not in the repo. Put new sources in `public/assets/`, add them to the `clips=(...)` list, run `bun run optimize:media`, and don't commit the masters (git history is already 600 MB from old videos).
- **Rights caveat (from the proof audit):** of the current clips, only Kamay traces to a known client. Heineken, Claro, and Mercado Libre may be spec or agency-era work. The sub-line says "Clips from live campaigns", so confirm every new clip is real, cleared client work (or change the copy).

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
