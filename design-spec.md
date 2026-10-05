# Continuum landing: design spec

Everything needed to rebuild the look and motion of trycontinuum.ai (the landing page). Values are copied from the code; the source file is named in each section. `design.md` holds the brand reasoning, and this file holds the numbers.

Snapshot: branch `overhaul` @ `cbdf249`, plus the new logo mark in the nav and favicon.
Stack: Astro 5, React 19 islands, Tailwind 4, Motion 12, vgpu (WebGPU).

---

## 1. Two registers

| Register | Where | Look |
|---|---|---|
| **World** | The landing: sky, hero, sections | Night sky with stars → dawn → pale day → dusk → night. Cinematic once (the hero), quieter below. |
| **Tool** | Any product window shown on the page (`.app-theme`) | Looks exactly like the shipped app: light, matte, Geist, violet `#5a48f9`. Nothing from the World styling goes inside a product window. |

---

## 2. Logo, wordmark, icons

| Asset | File | Use |
|---|---|---|
| Logo mark (ring vortex, white strokes on transparent) | `public/logo-mark.png` (128 px) | Nav pill, 28 × 28 px, 10 px left of the wordmark. Dark grounds only. |
| Favicon | `public/favicon.png` (64 px, black ground) | Browser tab. |
| Touch icon | `public/apple-touch-icon.png` (180 px, black ground) | iOS home screen. |
| Black-hole O poster | `public/assets/hero/black-hole.webp` (412 px) | The O of the hero wordmark before WebGPU loads or when it is unavailable; the footer bookend O. |

The small icons are brightened (gamma 0.6) so the thin strokes survive downscaling. Source: the 900 px square crop of the supplied logo.

**Wordmark:** `CONTINUUM`, Futura Maxi Bold, ink `#f3efe6` (warm paper white).
- Hero: 9-column grid, one letter per cell; the O cell holds the live black hole (0.8em square). Size `clamp(2.15rem, 8.6vw, 11.5rem)`, line-height 0.82, tracking −0.03em, `text-wrap: balance`.
- Nav: 14 px, tracking 0.18em. Footer: 18 px, tracking 0.18em.
- Footer bookend: the full wordmark at `13.5vw` (max 11.5rem), `white/7%`, bleeding off the bottom (−0.18em), with the poster O at 50% opacity. The O turns on its own axis and can be grabbed and spun (§11).

**Icons:** lucide-react (`ArrowRight` on the hero CTA, `Check` on pricing features), 16–20 px, stroke icons. Text arrows (`→`, `↓`, `↑`) are used for inline links. No emoji.

---

## 3. Page map and sky zones (`src/pages/index.astro`)

| # | Section | Zone | Heading |
|---|---|---|---|
| 0 | Sticky pill nav | floats over all | Logo mark · CONTINUUM · Product · Results · Pricing · About · Blog · **Book a demo** |
| 1 | Hero (`#top`) | night, stars moving | Wordmark + "The intelligent creative factory for *performance marketers / designers / agencies*" + Book a demo + "See it work ↓" + logo strip "Shipping creative for" |
| 2 | Showcase (`#showcase`) | night | Hidden h2 "Made on Continuum"; 19-clip masonry grid |
| – | Dawn band | twilight gradient | no text, ever |
| 3 | Product (`#product`) | day | "Three lines. One factory." → Organic+, Performance+, Creative Automation |
| 4 | Results (`#results`) | day | "Measured, not demoed." |
| 5 | Founder strip | day | one line + "Meet the team →" |
| 6 | Pricing (`#pricing`) | day | "Start with one line." |
| – | Dusk band | twilight gradient | no text, ever |
| 7 | Close (`#demo`) | night | "What will you make on *Continuum?*" + email + Book a demo |
| 8 | Footer | night | link columns + wordmark bookend |

Night zones use the `.dark` class; the day zone is `.daylight`. The same components render in both: the semantic tokens switch underneath.

---

## 4. Color (`src/styles/global.css`)

All colors are authored in OKLCH. The hex values are sRGB conversions for design tools.

### 4.1 Sky and brand (the same in every zone)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--night` | `oklch(14.5% 0.005 285)` | `#0a0a0c` | Night sky: hero, showcase, close, footer. `html` background. |
| `--star` | `oklch(95% 0.012 85)` | `#f2eee6` | Star tint. |
| `--day-top` | `oklch(95.5% 0.012 245)` | `#eaf1f8` | Top of the daylight gradient. |
| `--day-low` | `oklch(97.5% 0.008 80)` | `#faf6f1` | Bottom of the daylight gradient. |
| `--hero-cyan` | `oklch(80% 0.13 195)` | `#2ad7d7` | Brand pair. Shimmer, letter hover, CTA glow. **Night only.** |
| `--hero-violet` | `oklch(62% 0.22 292)` | `#8e61fc` | Brand pair. Shimmer, letter hover. **Night only.** |
| wordmark ink | `#f3efe6` | `#f3efe6` | Wordmark in hero, nav, footer. |
| nav glass | `oklch(14.5% 0.005 285 / 0.72)` | `#0a0a0c` @ 72% | Nav pill, with a 12 px backdrop blur. |
| `brand-violet` | `oklch(52% 0.22 275)` | `#4c4ee4` | Violet ink for accents on day: eyebrows, footnote marks, text links. |
| `brand-magenta` | `oklch(65% 0.25 320)` | `#ce47eb` | Defined, unused on the landing. |
| `brand-green` | `oklch(72% 0.19 145)` | `#43c251` | Defined, unused on the landing. |

### 4.2 Primary CTA: ink + aura (`btn-aura` in `global.css`)

"Book a demo" in the nav, hero, close and the featured plan. On night it is the brightest object on the page; on day it inverts.

| Part | Night (`btn-aura`) | Day (`btn-aura btn-aura-day`) |
|---|---|---|
| Fill | wordmark ink `#f3efe6`, hover `#fffdf8` | `--night` `#0a0a0c`, hover `oklch(22% 0.02 285)` |
| Label | `--night`, Satoshi 600 (17:1) | `#f3efe6`, Satoshi 600 |
| Aura ring | a 1.5 px conic ring just outside the edge: transparent to 140°, `--hero-cyan` at 220°, `--hero-violet` at 300°, then transparent. Spins once per 2.6 s | same, with `oklch(58% 0.13 205)` and `--cs-violet` |
| Hover | ring fades in (300 ms) and spins; glow `0 0 22px -6px` cyan 60% + `0 0 36px -10px` violet 55%; arrow +4 px (300 ms) | same |
| Hero only (`data-live`) | ring always visible and turning; rest glow `0 0 32px -12px` cyan 45% | |
| Press | `scale(0.97)`, 120 ms | |
| Focus | 2 px ring-color outline, 4 px offset | |
| Reduced motion | ring shows on hover but doesn't spin; arrow doesn't move | |

The ring sits outside the edge, so these buttons don't use the `btn-fill` pointer bloom (its clipping would cut the ring off). Every other button keeps `btn-fill`. The ShimmerButton gradient is retired on the landing page; `/about`, `/technology` and `/social-plus` still use it.

### 4.3 Semantic tokens (switch between day and night)

| Token | Day (`:root`) | Night (`.dark`) |
|---|---|---|
| `background` / `cs-bg` | `oklch(99% 0.002 265)` `#fbfcfd` | `var(--night)` `#0a0a0c` |
| `foreground` / `cs-fg` | `oklch(20% 0.015 265)` `#13161d` | `oklch(98% 0.005 265)` `#f7f8fc` |
| `card` / `cs-card` | `oklch(96% 0.005 265)` `#f0f2f5` | `oklch(20% 0.015 265)` `#13161d` |
| `secondary` / `cs-surface-hover` | `oklch(92% 0.008 265)` `#e2e5ea` | `oklch(24% 0.015 265)` `#1c1f27` |
| `muted` / `cs-muted` | `oklch(94% 0.005 265)` `#e9ebef` | `oklch(24% 0.015 265)` `#1c1f27` |
| `muted-foreground` / `cs-muted-fg` | `oklch(45% 0.015 265)` `#51555e` | `oklch(75% 0.015 265)` `#a9aeb8` |
| `primary` / `cs-teal` (it is a violet despite the name) | `oklch(65% 0.13 275)` `#7987de` | `oklch(70% 0.14 275)` `#8696f5` |
| `primary-foreground` / `cs-teal-fg` | `oklch(14% 0.01 265)` `#07090d` | `oklch(10% 0.01 275)` `#030306` |
| `border` / `cs-border` | `oklch(88% 0.008 265)` `#d5d7dd` | `oklch(100% 0 0 / 10%)` |
| `input` / `cs-input` | `oklch(88% 0.008 265)` | `oklch(100% 0 0 / 15%)` |
| `ring` / `cs-ring` | `oklch(65% 0.13 275)` | `oklch(70% 0.14 275)` |
| `accent` | `color-mix(in oklch, cs-teal 15%, cs-muted)` | same formula |
| `cs-violet` | `oklch(52% 0.22 275)` `#4c4ee4` | same |
| `success` | `oklch(68% 0.11 150)` `#63ab74` | `oklch(72% 0.16 145)` `#5bbe62` |
| `warning` | `oklch(78% 0.17 80)` `#efa800` | `oklch(80% 0.16 85)` `#edb417` |
| `destructive` / `cs-error` | `oklch(55% 0.2 25)` `#cc272e` | `oklch(65% 0.2 25)` `#f14d4c` |
| `cs-error-fg` | `oklch(98% 0.005 265)` | same |
| `chart-1` | `oklch(65% 0.13 275)` | `oklch(70% 0.14 275)` |
| `chart-2` | `oklch(70% 0.15 220)` `#00b2de` | `oklch(60% 0.15 220)` `#0092bd` |
| `chart-3` | `oklch(55% 0.18 100)` `#8b7000` | same |
| `chart-4` | `oklch(60% 0.2 30)` `#de3e2d` | `oklch(65% 0.2 30)` `#f0503d` |

Contrast checked: `muted-foreground` on `background` is 7.2:1 (day) and 8.9:1 (night); `brand-violet` on `day-top` is 5.2:1; `primary` on the day background is 3.2:1, so use it for icons and borders only, never for text.

### 4.4 Product window (`.app-theme`, copied from the shipped app)

| Token | Value | Token | Value |
|---|---|---|---|
| background | `#fdfdfd` | primary | `#5a48f9` (white label) |
| rail | `#f9f8ff` | secondary | `#0ea5e9` |
| foreground | `#16162a` | accent | `#7b6bff` |
| card | `#f5f4ff` | muted | `#eeecfc` |
| popover | `#ffffff` | muted-foreground | `#5c5b7a` |
| border / input | `#e4e2f7` | destructive | `#ef4444` |
| ring | `#5a48f9` | success | `#16a34a` |
| warning | `#b45309` | charts | `#5a48f9` `#22c55e` `#f59e0b` `#7b6bff` `#ec4899` |

Font: Geist 400. Card padding 11 px, card gap 10 px, radius 8 px. Unloaded rows are quiet gray bars, and violet appears only on the selected station or the primary control.

---

## 5. Type

| Family | File | Weights | Role |
|---|---|---|---|
| **Clash Display** | `public/assets/fonts/ClashDisplay-Variable.woff2` | 200–700 variable | Headlines only: hero line, h2, h3, stats, prices |
| **Satoshi** | `public/assets/fonts/Satoshi-Variable.woff2` | 300–900 variable | Body. **500 (Medium) is the default weight.** 300 = "Lite" for secondary copy |
| **Futura Maxi** | `public/assets/fonts/FuturaMaxi-Bold.woff2` (+ `.woff`) | 700 | Wordmark only |
| **Geist Mono** | Google Fonts | 400–500 | Factory indexing only: footer column titles, `STEP 03 / 06`, IDs |
| **Geist** | Google Fonts | 400–700 | Inside product windows only |

Satoshi and Clash Display are under the ITF Free Font License (self-hosting allowed). Futura Maxi is a commercial face, so check that the license covers anyone you hand the file to. Fonts are preloaded in `Layout.astro` with `font-display: swap`. Body text uses `-webkit-font-smoothing: antialiased`.

| Role | Family | Size | Line height | Weight | Tracking | Notes |
|---|---|---|---|---|---|---|
| Hero wordmark | Futura Maxi | `clamp(2.15rem, 8.6vw, 11.5rem)` | 0.82 | 700 | −0.03em | |
| Hero line (`text-display`) | Clash Display | `clamp(1.625rem, 0.9rem + 2.9vw, 3.75rem)` | 1.08 | 300 | −0.005em | Audience word 600 + shimmer |
| Section h2 (`text-h2`) | Clash Display | `clamp(2.5rem, 1.25rem + 3.6vw, 4.5rem)` | 1 | 700 | −0.01em | `text-wrap: balance`, max-w 48rem |
| Chapter h3 (`text-h3`) | Clash Display | `clamp(1.625rem, 1.15rem + 1.5vw, 2.25rem)` | 1.12 | 700 | −0.005em | |
| Stat figure | Clash Display | `clamp(3.5rem, 2.5rem + 4vw, 6rem)` | 1 | 700 | −0.04em | tabular numerals |
| Price | Clash Display | 48 px | 1 | 700 | −0.025em | tabular numerals |
| Eyebrow (product line) | Clash Display | 16 px | 24 px | 600 | – | `brand-violet` |
| Lead (`text-lead`) | Satoshi | 18 px | 1.6 | 500 | – | max 46ch, `muted-foreground` |
| Body | Satoshi | 16 px | 24 px | 500 | – | |
| Small | Satoshi | 14 px | 20 px | 500 | – | nav links, card copy |
| Footnote | Satoshi | 12 px | 1.625 | 500 | – | |
| 2xs | Satoshi | 11 px | 15 px | 500 | – | `text-2xs` |
| Mono label | Geist Mono | 12 px | 16 px | 400 | 0.08em | uppercase |
| Data (`font-data`) | Geist Mono | 13 px | – | 400 | – | tabular numerals |

---

## 6. Layout, radius, borders, shadow

- Container: `max-w-7xl` (80rem), side padding 16 px (mobile) / 24 px (md+).
- Section padding: 96 px (mobile) / 128 px (md+) top and bottom. Product chapters sit 80–112 px apart.
- Breakpoints (Tailwind defaults): sm 640, md 768, lg 1024, xl 1280.
- Base radius `--radius: 0.5rem`. Scale: sm 4.8 px, md 6.4 px, lg 8 px (buttons, cards), xl 11.2 px (case card), 2xl 14.4 px (nav pill), 3xl 17.6 px. The primary CTA uses 12 px; badges, switch and avatars use full.
- Borders: 1 px hairline in `border`. Cards separate by border, not shadow.
- Shadows: nav `0 8px 24px -12px oklch(0% 0 0 / 0.5)`; showcase tiles `shadow-sm`; CTA glows in §4.2. Nothing else carries a shadow.
- Focus: `outline: 2px solid var(--cs-ring); outline-offset: 2px` on every focusable element. White outline (offset 4 px) on the gradient CTA.

---

## 7. Components

**Nav** (`SiteNav.astro`): fixed, 12 px from the top, max-w 64rem, 12 px side inset. Pill with `rounded-2xl`, `border white/10`, nav glass fill, `backdrop-blur-md`, nav shadow, padding 8 px 8 px 8 px 16 px. Contents: logo mark (28 px) + CONTINUUM, then links (14 px, `white/75` → white on hover, gap 24 px, hidden below md), then **Book a demo** (36 px tall, radius 8, 14 px/600, ink + aura button). The pill looks the same over night and day.

**Hero** (`Hero.astro`, `react/HeroStage.tsx`): `min-h-[100dvh]`, night ground. Wordmark, then 40–56 px gap, then the hero line (white, light) and the rotating audience word (shimmer, semibold). Then the CTA row: **Book a demo →** (ink + aura with `data-live`, 56 px tall, 36 px side padding, 18 px/600, radius 12) and "See it work ↓" (16 px/500, `white/75`, underline on hover). The logo strip sits 24–32 px from the bottom.

**Logo strip** (`LogoCloud.astro`): label "Shipping creative for" (14 px, `white/60`). Client marks at equal area (4761 px², 20–44 px tall), turned light with CSS filters (`brightness(0) invert(1)`, `grayscale(1) invert(1)` or `grayscale(1) brightness(1.6)`), 65% opacity (100% on hover), 24–36 px side padding. The edges fade out with a 12% mask. Only use owner-cleared logos.

**Showcase** (`MasonryGrid.astro`): 2 / 3 / 4 / 5 columns (base / sm / md / lg), gap 16 / 24 / 32 px, height `80vh` (500–1000 px), fading into the stars through a 10% mask at the top and bottom. Tiles have radius 8, `border/20`, `shadow-sm`, and a `primary/30` border on hover over 500 ms. Muted looping videos, at most 16 playing at once, lazy-loaded.

**Section heading**: h2 (`text-h2`, bold, foreground), then 20 px, then the lead (max 46ch, muted-foreground).

**Product chapter**: eyebrow (line name, `brand-violet`), 4 px, h3, 12 px, lead, 32 px, product window (Tool register).

**Stats** (`Proof.astro`): three columns separated by `divide-x border` (stacked on mobile). Each has a big Clash figure with a label under it (16 px muted, max 24ch) and a violet superscript footnote mark `1`. Only published, footnoted numbers are allowed.

**Case card**: `rounded-xl border bg-background`, 24 / 32 px padding, grid `0.8fr + 3 × 1fr`. Client line in Clash 20 px bold, meta in 14 px muted; three columns with a 14 px/600 title and 14 px muted relaxed body; a "Read the pilot →" link in `brand-violet`.

**Founder strip**: overlapping 48 px round avatars (−12 px overlap, 2 px border in the background color), one line of 16 px text with bold names, and "Meet the team →" in `brand-violet` (the arrow nudges 2 px on hover).

**Pricing** (`react/Pricing.tsx`): the header row has the h2 and lead on the left; on the right, "Monthly [switch] Yearly" plus a violet "Save 20%" badge. Three cards, 24 px gap, 3 columns from lg. Card: `rounded-lg border`, 28 px padding. Plan name 20 px bold; description 16 px muted (min 3rem); a price block with a bottom border (Clash 48 px + "/ month" muted, 14 px note under it); a full-width 44 px button (the featured plan uses the `cta` variant, the others `outline`); an "includes" label and a features list (14 px, violet `Check` icon, 10 px gap). The featured card has a `primary/50` border and a 10% primary tint fading to the card color at 45%. On hover the border turns `primary/40` over 300 ms. Yearly = monthly × 0.8.

**Buttons** (`ui/button.tsx`): radius 8, 14 px/500. Sizes: xs 24, sm 28, default 32, lg 36 px tall. Filled variants are quiet at rest (a 14% tint, a hairline border and a colored label), and a muted brand color blooms in from the pointer on hover. `cta` is solid primary at rest. `outline` uses the border color and background, blooming `muted`. Pressed = `translate-y: 1px`.

**Badge**: full radius, 1 px border, 8 × 2 px padding, 12 px/500. The violet variant has a `primary/30` border and `cs-violet` text.

**Switch**: 32 × 18.4 px track, 16 px thumb, `primary` when on and `input` when off.

**Close** (`CTA.astro`): centered h2 with "Continuum?" in shimmer, a lead, then a row with an email input (58 px tall, radius-sm, `muted-foreground/50` border, `primary` focus ring with 2 px offset) and a magnetic ink + aura Book a demo button (58 px, min-w 200 px, radius 12). The background is an interactive grid (below), with a rare shooting star (§11). The status line is announced with `role="status"`.

**Footer** (`Footer.astro`): night, top border `white/10`. Grid `1.4fr + 3 × 1fr`. The brand column has the wordmark (18 px), the tagline (16 px `white/70`, 30ch), the mono line "Signal in. Asset live. Loop closed." (12 px `white/50`) and social icons (20 px, `white/60` → white). The column titles use the mono label style in `white/45`, and the links are 15 px `white/80` → white. Then the bookend wordmark and a legal row (12 px `white/55`).

**Scroll-to-top**: fixed 24 px from the bottom-right corner, 40 px square, radius-md, `oklch(20% 0.01 285)` fill (`#15151a`), `white/15` border, bloom. It appears after 320 px of scroll and hides while the footer is on screen.

---

## 8. The sky (`src/components/Sky.astro`)

**Star tiles:** one fixed layer behind the page, 115 `lvh` tall, `z-index: -1`. Two SVG tiles of scattered dots at non-multiple sizes, so no lattice shows:
- `public/assets/sky/stars-a.svg`: 1200 × 1200, 210 dots, drawn at 1200 px from 0 0.
- `public/assets/sky/stars-b.svg`: 60 dots, drawn at 733 px, offset 311 px 173 px.
- Dots: radius 0.5–0.9 px, opacity 0.3–0.85. Colors: 88% wordmark cream `#f3efe6`, 8% cyan `#bfeaf2`, 4% lavender `#d6cbff`.
- On scroll the layer drifts up by 12% of its height (`animation-timeline: scroll(root)`).

**Daylight:** `linear-gradient(var(--day-top), var(--day-low))` behind product → pricing. It paints over the stars.

**Horizon bands** (no text inside, ever). Gradients are interpolated in `oklab`.

Dawn (height `clamp(11rem, 34svh, 22rem)`; it tucks 3 rem up into the showcase and overlaps the day by 1 px):

| Stop | Color | Hex |
|---|---|---|
| 0% | transparent | |
| 6% | `--night` | `#0a0a0c` |
| 18% | `oklch(20% 0.035 268)` | `#0f1526` |
| 32% | `oklch(30% 0.055 264)` | `#202d49` |
| 46% | `oklch(44% 0.065 285)` | `#4f4d75` |
| 59% | `oklch(61% 0.075 345)` | `#a4718d` |
| 72% | `oklch(77% 0.08 45)` | `#e0a48a` |
| 85% | `oklch(89% 0.045 75)` | `#edd7bb` |
| 100% | `--day-top` | `#eaf1f8` |

Dusk (height `clamp(10rem, 30svh, 20rem)`):

| Stop | Color | Hex |
|---|---|---|
| 0% | `--day-low` | `#faf6f1` |
| 11% | `oklch(93% 0.035 75)` | `#f6e5cf` |
| 23% | `oklch(84% 0.07 55)` | `#efbf9f` |
| 36% | `oklch(71% 0.085 30)` | `#d18e82` |
| 50% | `oklch(54% 0.075 350)` | `#905c75` |
| 63% | `oklch(38% 0.06 300)` | `#473b5e` |
| 77% | `oklch(25% 0.04 280)` | `#1e1f34` |
| 90% | `--night` | `#0a0a0c` |
| 100% | transparent | |

**Sun glow** (a `::before` on each band): an ellipse `max(76%, 36rem)` wide and 80% of the band tall, centered and anchored on the daylight edge.
- Dawn: `radial-gradient(closest-side, oklch(95% 0.07 85 / 0.7), oklch(84% 0.09 55 / 0.28) 50%, transparent)`.
- Dusk: `radial-gradient(closest-side, oklch(90% 0.09 65 / 0.65), oklch(74% 0.1 38 / 0.25) 50%, transparent)`.
- Scroll-driven (`view-timeline` on the band): at dawn the sun rises from `scale(0.8, 0.45)` at 25% opacity to full size; at dusk it sets to the same values.

**Grain** (a `::after` on each band): `feTurbulence` fractal noise (baseFrequency 0.8, 2 octaves, desaturated), 160 px tile, `mix-blend-mode: overlay`, 22% opacity, masked to the middle 70% of the band. It dithers the long ramps so they don't band.

---

## 9. Hero starfield (`src/lib/starfield-vgpu.ts`, fallback `src/lib/starfield.ts`)

Stars fall toward the black-hole O and are drawn through a point gravitational lens, so they bunch into a bright ring around the O and never show inside it. WebGPU draws them as instanced particles with additive blending; Canvas2D is the fallback for no WebGPU or reduced motion.

| Parameter | Value |
|---|---|
| Count | `(width × height) / 529`, clamped 730–2700 |
| Einstein radius E | 0.62 × the O's width |
| Colors | 62% cream `rgb(243,239,230)`, 20% cyan `rgb(191,234,242)`, 18% lavender `rgb(214,203,255)` (Canvas2D uses 4:1:1) |
| Size | 0.8–1.3 (12% of stars: 1.6–2.2) × 1.5 device px, soft round sprite |
| Brightness | `min(1, 0.42 × size × μ)`, where μ is the lens magnification (capped at 4) |
| Lensing | Drawn at `t = (r + √(r² + 4E²)) / 2`, the outer image, always outside E |
| Infall (WebGPU) | Each star's life lasts 7–20 s. Radius eases from its home to 0.55E by `life^1.7` while turning 0.5–1.7 rad; then it respawns at home. Homes inside 0.7E are remapped into a 0.7–1.8E annulus |
| Infall (Canvas2D) | Real gravity: G = 2.6e5 px³/s², softening 400, drag 0.035/s. Stars spawn tangential at 55–90% of orbital speed and respawn below 0.5E. Motion streaks under 40 px are drawn as lines |
| Absorption | Fades out with `smoothstep(0.5E, 1.15E, r)` and shrinks to 55% size |
| Twinkle | `0.72 + 0.28 × sin(time × (1–4) + phase)` |
| Frame | DPR capped at 2. Pauses when off screen or when the tab is hidden |

**Shooting stars:** 6 (WebGPU) or 5 (Canvas2D), right side only.
- Spawn: x at 55–100% of the width, y at 5–50% of the height. They travel down-left, about 30–47° below horizontal (18–40° in Canvas2D), crossing 28–43% of the width.
- Streak 90–180 px long and 1.4–2.6 px wide, color `rgb(217,240,255)`, peak alpha 0.9 with a `sin(π·t)` envelope, tail fading to 0.
- Timing: WebGPU cycles every 4–9 s, only 62% of cycles fire, and each is visible for 22% of its cycle. Canvas2D waits 2–7 s between streaks, and each lasts 0.7–1.2 s.

---

## 10. Black-hole O (`src/lib/black-hole/*`, WebGPU)

A ray-traced black hole with an accretion disk, rendered in grayscale inside the wordmark's O. Adapted from vgpu's optimized-black-hole example (MIT).

- Settings (`settings.ts`):
  - Camera: pitch 0.62 rad, distance 13.5, fov 2.9, disk radius 5.5.
  - Bloom: strength 0.7, threshold 0, knee 0.18, radius 1.5.
  - Disk: brightness 1.1, speed 0.75, stretch 5.75, detail 3.44, turbulence 4.46, density 1.38, doppler 1.21, clouds (scale 20, speed 0.3, strength 0.2).
  - Background stars: off (brightness 0).
- Ambient motion: the disk turns 0.035 rad/s (one lazy turn every ~3 min). The bloom breathes: `1 + 0.09·sin(0.55t) + 0.03·sin(1.7t + 1.3)`. Capped at 60 fps.
- CSS idle on the O layer (`.hero-o-ambient`):
  - Float: `translate 0 ±5px`, 7 s ease-in-out.
  - Breathe: `scale 1 → 1.018`, 6 s.
  - Rock: `rotate ±7°`, 11 s.
- Drag: vertical drag tilts the disk (pitch 0.25–1.1 rad, eased with a 0.18 s time constant; it re-bakes the geodesics, and GPUs slower than 30 ms per bake don't tilt). Horizontal drag rolls it up to ±25° in CSS. On release it springs back over 700 ms with `cubic-bezier(0.22, 1, 0.36, 1)`.
- The O is masked by `radial-gradient(closest-side, #000 70%, transparent)` at 140% size. The poster webp crossfades to the live canvas over 700 ms when it is ready.
- Fallback: no WebGPU, reduced motion or any error shows the poster.

---

## 11. Motion catalogue

| Effect | Where | Trigger | Timing | Easing | Reduced motion |
|---|---|---|---|---|---|
| Starfield + meteors | Hero | always, while visible | see §9 | physics | one still, lensed frame; no meteors |
| Black-hole O | Hero O | always | see §10 | – | static poster |
| O float / breathe / rock | Hero O | always | 7 s / 6 s / 11 s loops | ease-in-out | off |
| Wordmark letter light-up | Hero letters | hover (hover devices) | in 0.1 s, out 0.9 s | ease-out | – |
| Shimmer text | Audience word, "Continuum?" | always | 4 s loop, gradient 200% wide | linear | frozen |
| Shimmer hover lift | same | hover | 0.3 s | ease-out | – |
| Flip words | Audience word | timer | 2.6 s hold; 2 passes, then settles on the first word | spring (stiffness 140, damping 18), y ±10 px + fade | holds the first word |
| Aura ring | Primary CTAs (§4.2) | hover / focus; always on the hero CTA | 2.6 s per turn, ring fades in over 300 ms | linear spin | static ring |
| Button bloom (`btn-fill`) | every other button | hover / focus / press | circle 300% of the width grows from the pointer, 260 ms; label color changes after a 110 ms delay | `cubic-bezier(0.22, 1, 0.36, 1)` | fades 150 ms instead of growing |
| CTA arrow | Primary CTAs | hover | +4 px, 300 ms | `cubic-bezier(0.22, 1, 0.36, 1)` | none |
| Button press | all buttons | active | `translate-y: 1px` | – | – |
| Magnetic button | Close CTA | pointer move | follows pointer × 0.5 (spring: damping 20, stiffness 300, mass 0.5) | spring | off |
| Logo strip marquee | Hero bottom | always | 60 s loop; pauses on hover or focus | linear | static wrapped row |
| Showcase columns | Showcase | always | alternate up/down; duration = column height in widths × 13 s | linear | static |
| Showcase tile border | Showcase | hover | 500 ms | – | – |
| Star drift | Sky | scroll | −12% over the whole page | linear, scroll-linked | off |
| Sunrise / sunset | Horizon bands | scroll into view | scale (0.8, 0.45) ↔ 1, opacity 0.25 ↔ 1 | linear, view-linked | off |
| Pricing solids | Plan cards | hover / focus | glyph grows from radius 13 to 38 px and turns 0.7 rad/s; follows the pointer; eases home on leave (rate 7/s) | exponential ease | appears at a fixed 3/4 view, no turn |
| Plan card border | Plan cards | hover | 300 ms to `primary/40` | – | – |
| Interactive grid | Close background | hover per cell | 40 px cells, rx 4, lines at 7% opacity; a hovered cell fills cyan or violet at 15% (fill 0.3 s, fade 0.5 s); masked to a 500 px circle | ease | – |
| Section reveal (`.reveal`) | Close | scrolls in (15% visible) | fade + y 40 → 0 over 0.8 s; children stagger 0.1 s from 0.2 s (fade, scale 0.95 → 1, y 20 → 0, 0.5 s) | `cubic-bezier(0.16, 1, 0.3, 1)` | – |
| Scroll-to-top | Fixed | after 320 px of scroll | slide 40 px + fade, 300 ms | – | instant scroll |
| Footer O spin | Footer bookend O | always, while on screen | 3°/s idle (a lap every 2 min); drag spins it around its centre (up to 720°/s), then it settles back to idle (friction 1.4/s); float ±4 px 7 s, breathe 1.02 6 s | exponential settle | no idle turn or momentum; it moves only while dragged |
| Close shooting stars | Close section | while on screen | one at a time, 7–16 s apart (first after 2.5–6 s); 70–140 px streak, 1.2 px, `rgb(217,240,255)` peaking at 55%; 0.9–1.3 s; kept to the left and right thirds, 20–36° down-left | `sin(π·t)` envelope | none |
| Product autoplay | Product windows | window top passes 60% of the viewport, once | Organic: 2 agent asks; Performance: both questions, stops at approval; Forge: renders, stops at delivery. Stops on the visitor's first pointer or key press | – | off |
| Streaming caret | Jaina and Organic agent replies | while typing | 2 px violet bar, pulse | – | none (text is instant) |
| Number tweens | KPIs, budgets, Organic metrics | on change, or first time in view | 0.9 s | `[0.16, 1, 0.3, 1]` | instant |
| CPA line draw + flags | Performance chart | first time 50% in view | line draws over 1.2 s; each flag drops in (−10 px + fade, 0.5 s) as the line reaches it, then pings every 2.8 s (scale 1.9, fades out) | ease-out / `[0.16, 1, 0.3, 1]` | static |
| Row flash / row in | Performance table on approve | state change | flash 22% primary → rest, 1.4 s; new rows −4 px + fade, 0.45 s, 80 ms stagger | `[0.22, 1, 0.36, 1]` | none |
| Forge render | Automation window | render running | active row: indeterminate bar (1/3 width, 1.4 s); progress rule `scaleX` per row (500 ms); thumbnails go from 40% opacity, grayscale and 1.5 px blur to sharp (500 ms); badges crossfade (250 ms); "Delivered" ripples 70 ms per row | ease-in-out / ease-out | bar static |
| Hook swap | Organic previews | agent rewrites a post | text blurs in (6 px → 0, 0.45 s); layers glide to their new position and colour (500 ms) | `[0.16, 1, 0.3, 1]` | none |
| Scroll arrivals | Product windows, Results figures, Pricing cards, founder avatars | scroll-linked (`animation-timeline: view()`) | windows settle from +48 px, 97% scale, 35% opacity; figures print up from their baseline (clip); plan cards arrive in order (+28 px, 7% range stagger); avatars slide together (14 px) | `[0.22, 1, 0.36, 1]` | static; also static where scroll timelines aren't supported |
| Pricing solids colors | – | – | faces `#5a48f9`, edges zinc `rgb(113,113,122)` → white as the solid lifts, shadow `rgba(30,22,80,0.28)` | – | – |

**Rules:** motion is restrained. The hero is the one spectacle, and everything below it gets quieter. Every loop respects `prefers-reduced-motion`. The product window never bounces in; it is already there. Canvas loops pause off screen.

---

## 12. Accessibility

- WCAG AA for body copy and controls; the checked pairs are in §4.3.
- Keyboard focus is visible everywhere (2 px ring, 2 px offset).
- Color never carries meaning alone. Honor `prefers-reduced-motion` and `prefers-reduced-transparency`.
- The hero's real `<h1>` is screen-reader only; the visual wordmark is `aria-hidden`. Duplicate marquee and showcase copies are `aria-hidden`.

---

## 13. Voice

- Use: connect, analyze, recommend, generate, render, publish, sync, write back, review. Name the parts: the Optimizer acts, Jaina explains, you approve.
- Never: "AI Marketing Agency", magic, unleash, revolutionize, "our AI".
- Sentence case, short declaratives: "Three lines. One factory.", "Measured, not demoed.", "Start with one line."
- Only sourced, footnoted numbers. No counters and no unsourced logos.

## 14. Don'ts

- No gradient on headings (the shimmer is allowed on exactly two words, both on night).
- Cyan never on day zones; use violet ink (`brand-violet`) there.
- No text inside horizon bands.
- No display type or world art inside product windows.
- No neon rims, glass cards as the world, purple-cyan washes on the sky, or stars outside night zones.
- Mono type is for factory indexing only.
