# Product section review (for the next plan)

Three independent graders reviewed the landing's Product section (`src/components/Product.astro` and the three mockups in `src/components/react/product/`). Each graded it against the real app in `Continuum-Monorepo/Continuum-Frontend`. The graders used the same 10-point rubric, and each was weighted toward one lens:

- **Fidelity:** does it match the shipped app, and does it only claim what's true?
- **Story:** clarity and conversion for the buyer.
- **Craft:** visual quality, motion and mobile.

This is a proposal only. Section 8 lists what was already changed in the 2026-09-28 motion pass.

Paths: `FE` = `Continuum-Monorepo/Continuum-Frontend/src`, `LP` = `continuum-landing-page/src`.

---

## 1. Scores

| # | Criterion | Fidelity | Story | Craft | **Mean** |
|---|---|---|---|---|---|
| 1 | Product fidelity (layout, components, states match the app) | 4 | 6 | 6 | **5.3** |
| 2 | Factual accuracy (only claims what ships) | 4 | 5 | 7 | **5.3** |
| 3 | Clarity of value (understood in ~5 s) | 7 | 6 | 6 | **6.3** |
| 4 | Differentiation (DS ingestion, write-back, Jaina, guardrails, render) | 6 | 5 | 6 | **5.7** |
| 5 | Motion & liveliness | 6 | 4 | 5 | **5.0** |
| 6 | Visual craft | 7 | 7 | 7 | **7.0** |
| 7 | Narrative flow (three lines, one factory) | 7 | 5 | 7 | **6.3** |
| 8 | Conversion (builds to Book a demo) | 4 | 3 | 4 | **3.7** |
| 9 | Accessibility & performance | 7 | 7 | 6 | **6.7** |
| 10 | Mobile (~390 px) | 6 | 5 | 5 | **5.3** |
| | **Overall** | 5.8 | 5.3 | 5.9 | **5.7** |

**Where they agree:**
- The windows are well made and exactly on-token (craft 7/7/7).
- The section sells less than it should: no CTA, and the loop is never shown.
- Parts of the mockups show layouts or claims the app doesn't have.

**Where they disagree:** factual accuracy. The craft grader spot-checked features and gave it a 7. The fidelity and story graders read the contracts and gave it a 4 and a 5. Treat the "do not claim" list (section 3) as the working truth until someone confirms it against the backend.

---

## 2. Ranked suggestions

The ranking weighs how many graders raised a point and how much it matters.

1. **Fix the factual overclaims before anything else.** All three graders flagged this, and it is a trust risk for the buyers we most want. The claims are listed in section 3. Rewrite the Performance lead copy (`LP/components/Product.astro:43`) along these lines: *"The Optimizer paces budget inside your guardrails and flags every move. Jaina explains what changed and queues creative and audience changes for your sign-off. Anything new ships paused."* Borrow wording from `AUTOPILOT_SCOPE_COPY`.

2. **Add conversion points.** All three graders raised this, and conversion scored 3.7, the lowest criterion.
   - Close the section with **Book a demo** and a short objections strip:
     - **Control:** "Observe, Recommend or Autopilot. Every write is logged with who approved it, and budget moves can be reverted." Source: `RevertApplyDialog.tsx`.
     - **Brand:** "Built on your design system. Your edits survive re-import."
     - **Setup:** "Bring one live campaign. We connect your ad account and design system on the demo."
   - Replace each mockup's dead-end "Reset to run it again" with "Run this on your account → Book a demo".
   - Don't invent setup times.

3. **Swap bespoke UI for the real app components.** Fidelity and craft both raised this.
   - **Approval:** the app's approval card (`FE/components/paid-media/jaina/components/JainaToolApprovalCard.tsx`, `ApprovalChangeTable.tsx`) replaces the ai-elements `Confirmation`. It has "Awaiting your approval", a Field / Before / After / Change table with signed green or red %, an "Exact input" disclosure, and Approve / Deny. It resolves to "Approved" with a pulse, or "Declined, nothing ran".
   - **Jaina's reasoning:** `ThinkingWindow.tsx` and `SparkleSpinner.tsx`. Braille spinner frames every 150 ms, a "Thinking…" shimmer (1.6 s), a stage chip that slides in (x −4 → 0, 200 ms), agent-tree rows with durations, and "Thought for 1.4s". Use real tool names (`get_campaigns` → `get_key_metrics`), not `analyze_campaigns`.
   - **Render statuses:** follow `RenderJobsGrid.tsx:89-97, 368-373`. Queued is muted; Rendering is warning with `Loader2` and a %.
   - **CPA chart:** follow `CpaHeroTimeline.tsx:128, 183-235`. Pins sit on the axis (Wallet, Zap icons), with a target band drawn as a `ReferenceArea`. Pin types are Cycle / Applied / Status / Setting, not "A / ✓".
   - **Small details:** statuses use Pill, not Badge. Message avatars read U / A.

4. **Draw the guardrails.** All three raised this. Add the apply-mode pill (`FE/.../optimizer/ApplyModePill.tsx`, "Autopilot · budget only") and one guardrail line such as "Max change 20%/cycle · daily cap $1,200" (`service.ts:447-472`). Include one move marked "held, needs a person".

5. **Show design-system ingestion.** All three raised this. It is the headline claim and has no visual today. Either open the section with it or start the Forge chapter with it: drop an .aep or .psd, answer the mapping questions, pick font substitutions, publish as a template. Borrow from `FE/components/forge/ForgeProjectDrop.tsx`, `MappingQuestions.tsx`, `FontSubstitutions.tsx`, `ForgeRunProgress.tsx`, and `DesignSystemCard`.

6. **Make the loop visible.** All three raised this.
   - Add handoff lines between chapters, citing `organic/compare/OrganicPaidOverview.tsx` as the real bridge:
     - Organic → Performance: "The hook that won on TikTok goes to paid."
     - Performance → Forge: "When Jaina asks for new creative, Forge renders it."
     - After delivery: "Results sync back; the next cycle starts here."
   - Consider re-ordering the chapters into factory order: ingest → render → ship → optimize → write back.

7. **Rebuild Organic around the real planner.** Fidelity and story raised this.
   - Replace the drag-and-colour canvas, which isn't in the app, with the planner calendar and the draft preview panel.
   - Borrow from `FE/components/organic/primitives/OrganicDraftPreview.tsx`, `SocialPostFrame.tsx`, and `CalendarDraftCard.tsx` (the shimmer on streaming draft cards).
   - List all five networks (`postPlatforms.ts`).
   - Instagram feed is 1:1 in the app.
   - Real starter prompts: "Plan this week's posts", "Run an AEO snapshot", "Show me trending topics", "Draft an Instagram reel".

8. **Make Forge true to Forge.** Fidelity and story raised this.
   - Name it "Forge", not "Template Forge".
   - Lead copy: "Bring your After Effects project…"
   - Loop an MP4 in the preview and add a Formats column.
   - Replace one-click render with the Review → Deliver → Confirm → Running tray (`RenderReviewTray.tsx:966-1056`): Proof or Final, step ticks, rendering %.
   - End on the delivery chain Library › Slack › Meta account › campaign › ad set › "New paused ad" (`DeliveryChain.tsx`).
   - `Pricing.tsx:63` should read "Render templates from your After Effects projects".

9. **Mobile.** All three raised this.
   - The section is 5,371 px tall at 390 px wide (Organic alone is 2,287 px). Target 3,800 px or less.
   - Organic: put the agent suggestions under the carousel, and scroll the carousel to the post that changed.
   - Performance: Jaina's panel `min-h-[240px] max-h-[420px]`.
   - Hide ROAS and Forge's secondary columns below `sm`, or show Forge rows as cards.

10. **Performance and polish.**
    - The recharts chunk is about 107 KB gzipped (the islands total about 150 KB).
    - `MetricTile` animates `flex-grow`, which relays out and redraws recharts every frame. Use a Motion `layout` transition instead (0.28 s, `[0.2,0.8,0.2,1]`, as in `OrganicMetricsDashboard.tsx:1920`).
    - Use `table-fixed` so approving doesn't shift the columns.
    - Reserve new rows as quiet grey bars so the window doesn't grow 77 px on approve.
    - The TikTok headline covers the "1.9k" action column; clamp x as well as y.
    - White icons on the yellow photo need a text shadow.
    - SVG flags need Enter / Space handling.

**Packaging question for the owner:** the app gates Forge behind Performance+ (`routes.ts:177`), but the landing sells Creative Automation as a separate, custom-priced line.

---

## 3. Do not claim (until confirmed with the backend)

- **Organic "live canvas" with draggable headline layers and colour swatches.** Not in the app. The only colour input is the StudioCanvas shader controls.
- **"Apply our brand kit" as an Organic agent action.** Not found.
- **"Best time to post" as a one-click scheduling action.** It exists only as metric tiles.
- **Account-level engagement-rate and saves trends.** The app has these per post only.
- **"Creative swapped automatically".** True only under Autopilot with the `creative_swap` scope enabled. Otherwise fatigue produces a recommendation that needs approval (`contracts/optimization/service.ts:33-35, 61-76`). Say "inside autopilot scopes you enable".
- **New variants shown as "Learning".** Anything the Optimizer creates is born **paused**.
- **The `analyze_campaigns` tool, the 7-day projection (the app projects "next cycle"), the "Watching" status, and the "Apply changes" / "applied" state.** Not in the app.
- **The CPA chart marking automatic vs approved actions.** Real pins are Cycle / Applied / Status / Setting.
- **"I'll write results back on Sep 28" and "writes results back" in the intro.** The frontend shows no results-sync loop; "write back" there means reverting to a prior value (`useOptimizerData.ts:820`). Confirm with the backend.
- **"Template Forge" and static JPG output.** It's Forge, and it renders AE/PSD/AI templates, video included.
- **Ad platforms.** The Optimizer and Forge act on and deliver to **Meta only**. Don't imply TikTok or LinkedIn ads.

---

## 4. Bugs found

| Bug | Status |
|---|---|
| Organic agent log doesn't follow new replies | **Fixed** 2026-09-28 |
| Tapping or clicking a CPA flag closes its tooltip immediately | **Fixed**: click now opens it |
| Jaina's chart renders while her text is still typing, so the text pushes animating bars down | **Fixed**: the chart lands after the sentence |
| Shimmer and tool spinner keep animating under reduced motion | **Fixed** |
| Shimmer read `--color-*` aliases, which resolve at `:root`, so the landing's colours leaked into the app window | **Fixed**: it now reads `--background` and `--muted-foreground` |
| Flag markers have `role=button` but no Enter / Space handler | Open |
| TikTok headline overlaps the right-hand action column | Open |
| White icons and counts on the yellow photo fail contrast | Open |
| Approving grows the Performance window 77 px and shifts table columns | Open |
| React hydration warning: empty `style` attribute on inputs (Organic and Forge) | Open (harmless) |

---

## 5. Motion ideas, beyond what shipped

- **The conveyor.** A thin loop line in the section's left gutter links the three windows. A dot travels it as you scroll and rests at stations `01 CONNECT … 06 WRITE BACK`, then arcs back to the top. Under reduced motion it becomes a static line with labels.
- **The asset travels.** The TikTok "Hear the drop" card lifts out of Organic, lands as the Performance flag thumbnail, and then appears as a seeded Forge row with a "from Organic+" chip. One object, three stations.
- **Visible write-back.** After delivery, show a receipt ("2 paused ads · Meta · results sync nightly"), drop a new flag onto the CPA line, and send the conveyor dot back to 01.
- **Rebalance.** "Moving $76/day from Lookalike into Retargeting · Total daily spend unchanged", with a gain or loss bar in each Change cell (`OptimizerActionsPortfolioGroup.tsx:1306-1366`, `charts/ReallocationFlow.tsx`).
- **Pulse the referenced pin.** When Jaina mentions a flag, pulse that pin: the ring scales 1 → 1.6 while fading out, 700 ms, twice.
- Keep bounces, glow and stars out of product windows.

---

## 6. Already done in the 2026-09-28 motion pass

- **Autoplay once in view** (the top motion suggestion from all three graders). It triggers when the window's top passes 60% of the viewport, stops on the visitor's first pointer or key press, and is off under reduced motion.
  - Organic: rewrites the TikTok hook, then schedules.
  - Performance: answers both questions and stops at the approval step.
  - Forge: renders and stops at the delivery approval.
- **Performance:**
  - The CPA line draws in once it's in view, and flags drop in as the line reaches their day, with a slow ping.
  - On approve, KPI projections and budgets count up (0.9 s, the app's PortfolioHero timing), changed rows flash, and new rows slide in.
- **Forge:**
  - The active row shows Forge's indeterminate bar (`forge-indeterminate`, 1.4 s).
  - A farm progress rule fills as rows land, and thumbnails develop from dim to sharp as they finish.
  - Status badges crossfade, "Delivered" ripples down the table, and the approval slides in.
- **Organic:** the agent's hook swap blurs in, previews glide to new positions and colours, the scheduled badges pop in, and the metric tiles count up and draw in view.
- **Jaina:** a streaming caret while she types.
