# Plan: Marquee Optimization and Flicker Fix

## TL;DR

> **Quick Summary**: Fix rendering artifacts ("black bars") during scroll by offloading WebGL/Filter work and optimizing the marquee component for a "premium" feel.
> 
> **Deliverables**:
> - Refactored `TrustMarquee.astro` and `TrustMarqueeClient.tsx`
> - Optimized CSS for high-performance glass effects
> - Hardware-accelerated marquee track
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential optimization
> **Critical Path**: Optimization → Layout Cleanup → Verification

---

## Context

### Original Request
Components getting a "black bar" or flickering effect when scrolling. Desire to upgrade the client marquee for smoother performance and a premium feel.

### Interview Summary
**Key Discussions**:
- Performance issue is likely GPU bottleneck from combining `backdrop-filter`, `LiquidGlass` (WebGL), and CSS `mask-image`.
- User wants "premium" feel, willing to switch to high-quality CSS glass for performance gains.
- Verification is purely visual.

### Metis Review (Self-Correction)
**Identified Gaps** (addressed):
- **Image Decoding**: Need to use `decoding="async"` and `loading="eager"` to prevent layout thrashing during animation.
- **Hardware Acceleration**: Promote marquee track to GPU layer using `will-change`.
- **Masking**: Use pseudo-element gradients instead of CSS `mask-image` for broader compatibility and performance.

---

## Work Objectives

### Core Objective
Eliminate rendering artifacts and provide a buttery-smooth, premium marquee experience.

### Concrete Deliverables
- `src/components/TrustMarquee.astro`
- `src/components/react/TrustMarqueeClient.tsx`
- `src/styles/global.css` (Glass & Marquee updates)

### Definition of Done
- [ ] No flickering or black bars during fast scroll on mobile/desktop.
- [ ] Marquee animation is consistent and infinite without hitches.
- [ ] Logos are crisp and maintain aspect ratios.

### Must Have
- GPU-accelerated transforms.
- Pre-loaded logos for the marquee.
- Clean CSS-based glass effect.

### Must NOT Have (Guardrails)
- NO WebGL (`LiquidGlass`) on the marquee strip (too heavy for scrolling UI).
- NO `mask-image` on the marquee container (performance hit).

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: NO
- **QA approach**: Automated Visual Verification (Playwright) + Manual check

### Automated Verification (Agent-Executable)

**For Frontend/UI changes**:
```
# Agent executes via playwright browser automation:
1. Navigate to: http://localhost:3000
2. Wait for: selector ".ch-trust-strip" to be visible
3. Perform rapid scroll up and down (simulating user behavior)
4. Screenshot: .sisyphus/evidence/marquee-scroll-performance.png
5. Verify: Marquee track is animating (check transform property change)
```

---

## Execution Strategy

### Parallel Execution Waves
Sequential due to the integrated nature of the components.

---

## TODOs

- [ ] 1. Optimize CSS Glass & Global Marquee Styles

  **What to do**:
  - Add high-performance `.premium-glass` class to `global.css`.
  - Use `background: rgba(...)`, `border`, and `backdrop-filter: blur(...)` WITHOUT WebGL.
  - Add `will-change: transform` to marquee animation classes.
  - Implement gradient fade overlays using `:before` and `:after` pseudo-elements.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Acceptance Criteria**:
  - CSS contains `.premium-glass` and updated `.ch-trust-marquee` styles.
  - No WebGL calls in the new styles.

- [ ] 2. Refactor Marquee Components

  **What to do**:
  - Update `TrustMarqueeClient.tsx` to use optimized image props (`loading="eager"`, `decoding="async"`).
  - Simplify the structure to reduce DOM depth.
  - Update `TrustMarquee.astro` to remove `GlassPanel` (LiquidGlass) and use the new `.premium-glass` CSS class.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `vercel-react-best-practices`]

  **Acceptance Criteria**:
  - Logos load immediately.
  - Visual matches the "premium" glass look.
  - `LiquidGlass` is removed from the marquee path.

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `style(marquee): optimize glass and animation performance` | global.css |
| 2 | `feat(marquee): refactor for premium feel and scroll stability` | TrustMarquee.astro, TrustMarqueeClient.tsx |

---

## Success Criteria

### Final Checklist
- [ ] Black bars/flickering eliminated.
- [ ] Marquee looks "premium" with smooth gradients and glass.
- [ ] No performance regressions in other sections.
