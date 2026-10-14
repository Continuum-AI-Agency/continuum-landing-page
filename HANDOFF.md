# Handoff: landing overhaul (branch `overhaul`)

State as of 2026-09-23. `overhaul` was fast-forwarded into `main` and pushed; both branches point at the same commit.
Merging `overhaul` into main also closes Michelle's PRs #5, #6, #7 (merged in locally).

Masonry grid refresh and pricing solids landed on 2026-09-23 (see [Masonry grid](#masonry-grid) and [Pricing](#pricing)).

## Run

- `bun run dev` on http://localhost:4321, `bun run build`, typecheck with `./node_modules/.bin/tsc --noEmit -p .`
- Checks: `bun src/lib/polyhedra.check.ts`, `bun src/lib/engraving.check.ts`
- WebGPU in automation: `agent-browser --headed --args "--enable-unsafe-webgpu" open http://localhost:4321/`
- Netlify builds with Bun and `--frozen-lockfile`; commit `bun.lock` with any dependency change.

## Page map (`src/pages/index.astro`)

| Zone | Section | File |
|---|---|---|
| night | Sticky pill nav (all pages) | `src/components/SiteNav.astro` |
| night | Hero: CONTINUUM wordmark, black-hole O, starfield, shimmer CTA, logo strip `#logos` | `Hero.astro`, `react/HeroStage.tsx`, `LogoCloud.astro` |
| night | Video masonry `#showcase` (no visible heading) | `MasonryGrid.astro` |
| dawn band | (decorative, no text) | `Sky.astro` |
| day | Data in. Better creative out.: `#organic` `#performance` `#automation`, handoff lines, Control / Brand / Setup strip + Book a demo | `Product.astro`, `react/product/*` |
| day | Measured, not demoed. `#results` | `Proof.astro` |
| day | Founder strip → /about | `FounderStrip.astro` |
| day | Pricing `#pricing` | `react/Pricing.tsx` |
| dusk band | (decorative) | `Sky.astro` |
| night | CTA `#demo` + footer: links, legal row, engraved night with the wordmark bookend in its sky | `CTA.astro`, `Footer.astro`, `Engraving.astro` |

`/about` (`src/pages/about.astro`): story line, founders + team (`Team.astro`, static, bios visible), press/podcasts/blog cards.

## Systems worth knowing

- **Black hole O:** vendored vgpu `optimized-black-hole` (MIT) in `src/lib/black-hole/`. Look in `settings.ts` (pitch 0.62, diskRadius 5.5, fov 2.9, stars off). `renderer.ts` exposes `setPitch` (drag to tilt, re-bake throttled to measured bake cost) and `canTilt`. WebGPU only; poster fallback `public/assets/hero/black-hole.webp` (re-capture if settings change).
- **Hero starfield:** `src/lib/starfield.ts`, Canvas2D, stars spiral into the O through a point lens; static frame under reduced motion.
- **Page sky:** `Sky.astro`. A fixed SVG starfield (`public/assets/sky/stars-*.svg`) with dawn/dusk bands and a `.daylight` wrapper. Night sections are transparent. The bands use dense oklab stops with eased lightness, grain to stop banding, and a sun glow (`::before`) that rises at dawn and sets at dusk on a scroll-driven `view-timeline`. The glow is anchored on the daylight edge, and each band overlaps the daylight by 1px so no seam shows. Tokens `--night`, `--day-top`, `--day-low`, `--hero-cyan`, `--hero-violet` in `src/styles/global.css`.
- **Engraved scenes:** `src/lib/engraving.ts` (pure) + `Engraving.astro` (canvas lifecycle). Procedural pen-and-ink, no assets: aurora over three ranges under the footer (`night`), and a backlit range on every dawn band (`dawn`: index, /social-plus, /technology). Each inks in once, outward from the summits, when 30% is on screen, and fires a bubbling `engrave` event; the footer stars twinkle in on it. All numbers are in the lib's "Tune here" block (design-spec §8.1). Check: `bun src/lib/engraving.check.ts`.
- **Logo strip:** `LogoCloud.astro` shows one-colour marks with no tiles. Each logo has a `tone` (`white` / `invert` / `keep`) and a `scale` knob, and is sized by equal area. New logos need a transparent background (see `la-corte.png`, converted from a white-ground jpg).
- **`.dark` works when nested:** the shadcn aliases are declared on `:root, .dark`, so a nested `.dark` wrapper re-resolves them. Don't move them back to `:root` only.
- **Buttons:** primary CTAs use `components/ui/shimmer-button.tsx` (Magic UI, house change: `href` renders `<a>`). Every button uses the app's `btn-fill` bloom; `Layout.astro` has the PointerOrigin script (fill blooms from the pointer). In `.astro` files pass `className`, not `class`, to React components.
- **Product windows:** `.app-theme` scope = the shipped app's tokens (Geist, #fdfdfd, #5a48f9). Primitives in `components/ui/*` and `components/ai-elements/*` are copied from `Continuum-Monorepo/Continuum-Frontend` (shadcn base-nova on Base UI). The demos are scripted, no network. One fictional brand across all three: Aurel Audio studio launch.
  - **Rebuilt 2026-10-06 to app truth** (owner: "data in, better creative out"; focus on media delivery and performance). Organic+ is the real planner (bulk plan, streaming drafts, hook score, "See it on") plus the Agent's trend and AEO receipts. Performance+ is Jaina (thinking row, cited `creative_supply` card, approval card; approve records the sign-off, then a second tool applies) beside the Optimizer (Autopilot pill · budget moves only · Pilot, guardrails, a hand-drawn SVG CPA chart with pin buttons, held moves). Creative Automation is Forge: ingest → mapping → render tray (Review › Deliver › Confirm › Running) → Library + Meta "new paused ad" → "Waiting on you".
  - **Claims come from the sales register** (`Continuum-Monorepo/docs/capability-matrix.md`): pilot rows wear a "Pilot" mark; Slack, WhatsApp, Photoshop, TikTok Ads, Google Ads, DCO and "write results back" never appear; Meta is the only ad destination; everything created ships paused. Check the register before adding a claim.
  - No recharts: charts are hand-drawn SVG like the app's `AccountChartView`. The product islands are about 32 KB gzip (were about 154 KB).
- **Type:** Clash Display variable for headlines (`font-display`: hero tagline, h2, h3), self-hosted Satoshi variable for body (`public/assets/fonts/`, both ITF Free Font License), Futura Maxi for the wordmark only, Geist inside windows. The hero tagline contrasts weights: a light set-up line and a semibold audience word. Gradient type (`.shimmer`, `.hero-letter`) gets a `drop-shadow` glow on hover. Scale tokens `text-display`, `text-h2`, `text-h3`, `text-lead` in `@theme`. Shimmer (`.shimmer`) is used on exactly two words: the hero audience word and the CTA's "Continuum?".
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

## EmDash local CMS

Blog and press now read the `posts` collection in EmDash 1.2.0. Astro 6 uses the standalone Node adapter; Bun remains the package manager, with Node 22.16+ executing scripts. The five marketing pages remain prerendered.

- First checkout: `bun install --frozen-lockfile`, `bunx emdash secrets generate --write .env`, `bun run cms:seed`, then `bun run dev`.
- Site: http://localhost:4321/blog/ and http://localhost:4321/press/. Admin: http://localhost:4321/_emdash/admin/. Complete setup with your own passkey. The seed's sample content is the 14 imported articles.
- SQLite and uploads live in ignored `data/`; the encryption key lives in ignored `.env`. Back these up before changing machines. Do not commit credentials or databases.
- `bun run cms:test` tests the Markdown conversion; `bun run cms:check` validates the seed. `bun run cms:import` regenerates the seed from retained Markdown originals. `cms:seed` skips existing records and does not overwrite edits made in EmDash.
- Published content appears on reload, including the live sitemap. Saving a draft revision does not change the published version until it is published.
- This integration is local only. The existing static Netlify configuration is not configured to deploy the Node CMS or persist its database/uploads. Choose the hosting adapter and persistent storage after the owner reviews the local site; do not deploy this setup as the old static build.
