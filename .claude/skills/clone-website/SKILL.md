---
name: clone-website
description: Reverse-engineer and clone one or more websites with MEASURED fidelity — scripted capture (DOM, tokens, fonts, keyframes, breakpoints, scroll-state diffs, assets), per-component exact computed styles (incl. ::before/::after and hover), section-by-section builder dispatch, then a pixel + geometry + typography diff loop against the original until every band passes. Use whenever the user wants to clone, replicate, rebuild, reverse-engineer, or copy any website ("make a copy of this site", "rebuild this page", "pixel-perfect clone"). Provide one or more target URLs. dev-starter only.
argument-hint: "<url1> [<url2> ...] [--widths 1440,768,390] [--threshold 0.03]"
user-invocable: true
---

# Clone Website

You are about to reverse-engineer and rebuild **$ARGUMENTS** as a clone that matches the original in **structure, visuals and behavior** — and you will PROVE it with numbers, not with "looks right to me".

When multiple URLs are provided, process them independently (in parallel where resources allow), each in its own artifact folder (`docs/research/<hostname>/`).

This is not a two-phase process (inspect then build). You are a **foreman walking the job site**: as you inspect each section you write a detailed spec file, then hand it to a specialist builder agent. Extraction and construction run in parallel; extraction is scripted, meticulous and produces auditable artifacts; the finish line is a passing visual diff.

## Scope, Rights and Where Clones Live

- **Purpose:** learning how a site is built, rebuilding a site the user owns or has rights to, or producing a private reference. A clone of someone else's site is NOT deployed publicly, NOT presented as the original, and NOT committed to a public repository with the third party's text, images, logos, fonts or video. For a product of our own, use `/reference` (structure only, our tokens) or `/harvest` (patterns into the library) instead.
- **Location:** a separate project, never inside dev-starter's tracked tree: `~/clones/<hostname>/` (or a scratch folder). Third-party screenshots and assets stay there (`knowledge/design-references.md` → Kullanım Şartı).
- **Fonts:** commercial font files are copied for local reference only; if the clone must ship, switch to a licensed or open equivalent and say so in the report.

## Fidelity Targets (Defaults)

| Measure | Pixel-perfect | Acceptable |
|---|---|---|
| Band pixel diff (stable pixels, tolerance 40) | ≤ 1.5% | ≤ 3% (default `--threshold 0.03`) |
| Page height delta | ≤ 0.5% | ≤ 1% |
| Band count | equal | equal |
| Missing texts | 0 | 0 |
| Typography mismatches (size/weight/family/line-height/letter-spacing/color) | 0 | 0 on headings and body |
| Geometry drift > 2px | 0 | only inside one band being fixed |
| Scroll-state behavior (`fixed-<w>.json` → `changes`) | same properties, same values | same properties |

Unless the user says otherwise: in scope = layout, styling, components, interactions, responsive behavior, motion, mock data; out of scope = real backend, auth, real-time, SEO, a11y audit; customization = none.

## The Toolkit (scripts in this skill)

Run them with Node 22+. Playwright is resolved from the project, then globally (cloud sessions have it preinstalled; locally `npm i -D playwright && npx playwright install chromium`). Browser MCP tools are optional, for interactive exploration only — every extraction step below is a script. `SK=~/dev-starter/.claude/skills/clone-website/scripts`.

| Script | What it produces |
|---|---|
| `node $SK/capture.mjs <url> <dir> [--widths 1440,768,390]` | `shots/<w>-full.png` (frozen, deterministic) + `shots/<w>-live-NN.png` (real motion frames), `dom.html`, `tokens.json` (every CSS custom property with its selector, `@font-face` with source URLs, `@keyframes` verbatim, media-query breakpoints, page font/background), `tech.json` (Next/Nuxt/Astro/Webflow/Framer/WordPress, Tailwind likelihood, GSAP + ScrollTrigger list, Lenis/Locomotive, Lottie, Swiper, canvas, video, scroll timelines, running Web Animations), `sections.json` (page bands per width), `assets.json` (images incl. largest srcset, CSS backgrounds incl. `::before/::after`, videos + posters, SVG count, icons, og/meta), `fixed-<w>.json` (fixed/sticky elements and descendants at scroll 0 vs 600, with a `changes` list = the scroll behavior spec), `text.json` (all visible text, verbatim, in order) |
| `node $SK/styles.mjs <url> "<selector>" <out.json> [--widths] [--hover]` | Exact computed styles of a component subtree: only values that differ from a pristine element (no 300 browser defaults), shorthands collapsed, Tailwind internals dropped, `::before/::after` when rendered, inline SVG markup, image sources, bbox relative to the component, and with `--hover` the hovered state of the root and its first link/button |
| `node $SK/download-assets.mjs <dir> <public> [--prefer-largest]` | Every image, background, video, poster, font file (woff2 first), icon and og image into `public/{images,backgrounds,videos,fonts,icons,og}` + `<dir>/asset-map.json` (original URL → local path; builders use ONLY local paths) |
| `node $SK/visual-diff.mjs <originalUrl> <cloneUrl> <outDir> [--widths] [--threshold]` | The judge. Both pages captured identically; band-by-band pixel diff (original captured twice, self-moving pixels masked and ignored), text/box matching with position, size and typography deltas, missing texts, page and band height deltas → `report.md` (fix list, worst first) + `band-NN.png` (original \| clone \| diff). Exit 0 = PASS |

**Determinism (built into the scripts):** viewport and DPR fixed, `timezone UTC`, fonts awaited (`document.fonts.ready`), the page walked top to bottom so lazy images and reveal-on-scroll fire, a 1px scroll nudge so scroll-state UI settles, every CSS animation jumped to its END state, transitions off, videos paused at frame 0. A self-diff (`visual-diff.mjs <url> <url>`) scores 0.0% — if it does not, the page has nondeterminism the mask did not catch; note it before trusting scores.

## Pre-Flight

1. Parse `$ARGUMENTS` (URLs, optional `--widths`, `--threshold`). Validate each URL; if `curl -sI` fails, ask.
2. **Workspace:** create or reuse the clone project outside dev-starter:
   ```bash
   npx create-next-app@latest ~/clones/<host> --ts --tailwind --app --eslint --no-src-dir --use-npm --yes
   cd ~/clones/<host> && npm i motion lucide-react
   mkdir -p docs/research/<host>/{components,qa} docs/design-references/<host>
   npm run build   # must pass before anything else
   ```
   The clone does NOT use dev-starter's palette/tokens: it reproduces the target's own tokens.
3. Run capture (step 1 below) and read `tech.json` BEFORE planning; it changes the plan (see Phase 1).

## Guiding Principles

### 1. Completeness Beats Speed
Every builder agent receives **everything**: section screenshot, exact CSS values from `styles.mjs`, local asset paths from `asset-map.json`, verbatim text from `text.json`, component structure. If a builder has to guess a color, a font size or a padding value, extraction failed.

### 2. Small Tasks, Perfect Results
One focused component with exact values beats "build the features section". **Complexity budget:** if a builder spec exceeds ~150 lines, split it (one agent per card variant + one for the wrapper). This is a mechanical check.

### 3. Real Content, Real Assets — and Layers
Use the downloaded assets and verbatim text. A section that looks like one image is often several layers (background art, foreground mockup, overlay icon, a `::before` glow). `assets.json` lists every `<img>`, every CSS background including pseudo-elements, and `styles.mjs` shows `::before/::after` — reproduce all of them.

### 4. Foundation First
Fonts (exact files), global tokens, global keyframes, scroll library, icons and asset map come first, sequentially, before any builder. Everything after is parallel.

### 5. Extract How It Looks AND How It Behaves
Appearance = `styles.mjs` output. Behavior = what changes, the trigger and the transition: `fixed-<w>.json → changes` (scroll states), `styles.mjs --hover` (hover), `tech.json` (GSAP ScrollTrigger start/end/pin/scrub, Lenis, scroll timelines, running Web Animations with duration/easing), the live frames `shots/<w>-live-NN.png`, and manual clicks for tabs/accordions/carousels. Watch for: shrinking/docking headers, reveal-on-scroll with stagger, scroll-snap, parallax, pinned sections, scroll-driven tabs (IntersectionObserver, not clicks), auto-cycling carousels, theme changes between sections, smooth-scroll libraries, view transitions.

### 6. Identify the Interaction Model Before Building
The single most expensive mistake: building click-driven UI for a scroll-driven section or vice versa. Scroll first (does it change by itself?), then click/hover. Write `INTERACTION MODEL: scroll-driven (IntersectionObserver, rootMargin -30%)` or `click-driven (opacity 200ms)` in the spec.

### 7. Extract Every State, Not Just the Default
Tabs: click each, extract content + styles per state. Scroll: state at 0 and after the threshold (the `changes` diff). Hover: `--hover`. Open/closed menus, accordions, modals: capture both.

### 8. Spec Files Are the Source of Truth
Every component gets `docs/research/<host>/components/<name>.spec.md` BEFORE dispatch, filled from script output (not memory). The builder receives the spec inline.

### 9. Build Must Always Compile
Builders verify `npx tsc --noEmit`; after each merge `npm run build`. Never broken, even temporarily.

### 10. The Diff Decides
"Done" means `visual-diff.mjs` PASS at every width. Opinions about closeness do not count; the report's numbers do.

## Phase 1: Reconnaissance (scripted)

```bash
node $SK/capture.mjs <url> docs/research/<host> --widths 1440,768,390
```

Read, in this order, and write `docs/research/<host>/RECON.md`:

1. **`tech.json` → strategy.** It changes how you build:
   | Finding | Consequence |
   |---|---|
   | `tailwindLikely: true` | Class names in `dom.html` are reusable almost verbatim (same Tailwind v4 scale); still verify with `styles.mjs` |
   | `gsap` / `scrollTrigger` list | Reproduce each trigger (start/end/pin/scrub) with `motion/react` + `useScroll`, CSS `animation-timeline`, or install GSAP if pinning/scrub is heavy — match timing, not just effect |
   | `lenis` / `locomotive` | Install the same library with the same options; native scroll feels different and the user notices |
   | `lottie` | Download the JSON animation and use a Lottie player; do not redraw it in HTML |
   | `videos > 0` | Use the real video file with the same `autoplay muted loop playsinline` flags and poster |
   | `threeOrCanvas` | Canvas/WebGL: reproduce with the same technique or a looping video of it; never a static mockup |
   | `webflow` / `framer` | Expect interaction attributes (`data-w-id`, Framer variants): extract their effect from the live frames |
   | `scrollTimeline: true` | The site uses CSS scroll-driven animations: copy the `@keyframes` from `tokens.json` and the timeline properties from `styles.mjs` |
2. **`tokens.json`** → fonts (`fontFaces` with exact source URLs), `breakpoints` (the site's REAL breakpoints — use them, not Tailwind's defaults, if they differ), `keyframes` (verbatim, paste into globals.css), `customProperties` (the site's own design tokens), `page` (body font, color, background), `rootFontSize` (if not 16px, every rem differs).
3. **`sections.json`** → page topology: bands in order with id, heading, bbox per width. Name each band; this is `PAGE_TOPOLOGY.md`. Sections that stack differently per width show up as bbox changes.
4. **`fixed-<w>.json` → `changes`** → every scroll-state behavior with before/after values.
5. **Interaction sweep (manual, short):** click every tab/pill/accordion/carousel control and hover the main CTAs; record per-state content. Look at `shots/<w>-live-NN.png` for motion the frozen shot hides.

Save findings to `docs/research/<host>/BEHAVIORS.md`.

## Phase 2: Foundation (sequential, by you)

1. **Assets:** `node $SK/download-assets.mjs docs/research/<host> public --prefer-largest`. Check the FAILED list; fetch failures manually (auth headers, hotlink protection) or note them.
2. **Fonts — exact files:** use `public/fonts/*` via `next/font/local` with the SAME family names, weight ranges, styles and `unicode-range` as `tokens.json → fontFaces`. Never substitute "a similar Google font": font metrics drive line breaks, and one different line break shifts every band below (the diff will show it as height drift).
3. **globals.css:** the site's custom properties (as tokens), `@keyframes` verbatim, `html { font-size }` if `rootFontSize` ≠ 16px, scrollbar/selection/smooth-scroll rules, the page background and text color.
4. **Breakpoints:** if `tokens.json → breakpoints` differ from Tailwind's, define them in `@theme` (`--breakpoint-*`) so `md:`/`lg:` switch at the same widths as the original.
5. **Icons:** extract inline SVGs (`styles.mjs` includes their markup) into `components/icons.tsx`, named by function.
6. **Metadata:** title, description, favicon, og from `assets.json → meta/icons`.
7. `npm run build` passes.

## Phase 3: Component Specification & Dispatch

For each band in the topology, top to bottom: **extract → spec → dispatch**.

### Step 1: Extract (scripted)
```bash
node $SK/styles.mjs <url> "#pricing" docs/research/<host>/components/pricing.styles.json --widths 1440,768,390 --hover
```
- Pick the selector from `sections.json` (id or a stable class). For large bands run it per sub-component (cards, nav, footer columns) — the output warns when truncated.
- Crop the band from `shots/<w>-full.png` (bbox in `sections.json`) into `docs/design-references/<host>/<band>-<w>.png`.
- Multi-state: run `styles.mjs` after clicking each tab (or extract per-state content manually); scroll states come from `fixed-<w>.json`.
- Assess complexity: distinct sub-components → separate specs.

### Step 2: Write the Spec File
`docs/research/<host>/components/<name>.spec.md`, every value copied from `styles.mjs` output:

```markdown
# <ComponentName> Specification

## Overview
- **Target file:** `components/<ComponentName>.tsx`
- **Screenshots:** `docs/design-references/<host>/<band>-1440.png`, `-768`, `-390`
- **Interaction model:** <static | click-driven | scroll-driven | time-driven>
- **Source selector:** `<selector>` (styles: `components/<name>.styles.json`)

## DOM Structure
<hierarchy from the styles.json `path` column — what contains what, semantic tags kept>

## Computed Styles (exact, from styles.mjs)
### Container
- display: grid; grid-template-columns: …; gap: …; padding: …; max-width: …; border-radius: …; box-shadow: …
### <Child 1>
- font-size: …; font-weight: …; line-height: …; letter-spacing: …; color: …
### Pseudo-elements
- `.card::before`: content ""; background: radial-gradient(…); inset: …; filter: blur(…)

## States & Behaviors
### <Behavior, e.g. "Header docks on scroll">
- **Trigger:** scroll > N px (from fixed-<w>.json) | IntersectionObserver | click on … | hover
- **State A:** <exact values>
- **State B:** <exact values>
- **Transition:** <property duration easing> (from styles.json `transition-*`)
- **Implementation:** <CSS transition + scroll listener | useScroll | animation-timeline | …>
### Hover
- <element>: <property> <before> → <after>, transition <value>

## Per-State Content (if applicable)
### State "<tab>"
- <verbatim content>

## Assets (local paths from asset-map.json)
- `/images/…` (layer: background) · `/images/…` (layer: foreground) · icons: …

## Text Content (verbatim, from text.json)

## Responsive Behavior
- **1440:** … · **768:** … · **390:** … · switches at the site's breakpoint `min:48rem` (tokens.json)
```

Fill every section; "N/A" only after checking (even a footer has hover states).

### Step 3: Dispatch Builders
Simple band → one builder; complex band → one builder per sub-component + one for the wrapper (sub-components first). Each builder receives inline: the full spec, screenshot paths, shared imports (`icons.tsx`, `cn()`), target path, the site breakpoints, and "verify with `npx tsc --noEmit`". Use worktree isolation for parallel builders. **Don't wait** — extract the next band while builders work.

### Step 4: Merge
Merge each worktree, resolve conflicts with full context, `npm run build` after every merge.

## Phase 4: Page Assembly
Wire bands in `app/page.tsx` in topology order; implement page-level layout (scroll containers, sticky/fixed layers, z-index), page-level behaviors (smooth scroll library, scroll-driven animation, theme changes between sections). `npm run build` passes.

## Phase 5: Measured QA Loop (the finish line)

```bash
npm run build && npm run start -- -p 3100 &
node $SK/visual-diff.mjs <originalUrl> http://localhost:3100 docs/research/<host>/qa/round-1 --widths 1440,768,390 --threshold 0.03
```

Loop until PASS at every width (cap: 8 rounds; if still failing, report the remaining bands honestly):

1. Open `report.md`. Fix in this order — each class causes the next:
   1. **Band count mismatch** → a section is missing or wrapped differently; fix structure first.
   2. **Missing texts** → content not rendered or different wording.
   3. **Typography mismatches** → wrong font file/weight/size/line-height/letter-spacing/color. These shift line breaks and therefore heights.
   4. **Band height deltas** → padding/margin/gap/line-height; fix the FIRST band with a non-zero delta, later bands inherit its drift.
   5. **Pixel diff per band, worst first** → open `band-NN.png` (red = clone differs; blue = original moves by itself, ignored): colors, radii, shadows, images, missing `::before` layers, icon sizes.
2. Re-run `styles.mjs` on the CLONE for the failing component and compare with the original's styles.json side by side — the differing properties are the fix.
3. **Behavior parity:** run `capture.mjs` on the clone and compare its `fixed-<w>.json → changes` with the original's (same properties, same before/after values); hover the main CTAs on both; click each tab; compare `shots/<w>-live-NN.png` frames for motion timing.
4. Save each round under `qa/round-N/`; never overwrite — the history shows convergence.

Only after PASS (or an honest cap report) is the clone complete.

## Pre-Dispatch Checklist
- [ ] Spec written from `styles.mjs` output, every value exact (no estimates)
- [ ] Interaction model identified (static / click / scroll / time)
- [ ] Every state captured (tabs, scroll `changes`, hover)
- [ ] All layers identified (images, CSS backgrounds, `::before/::after`)
- [ ] Assets referenced by LOCAL path from `asset-map.json`
- [ ] Responsive behavior for 1440/768/390 with the site's breakpoints
- [ ] Text verbatim from `text.json`
- [ ] Spec under ~150 lines, else split

## What NOT to Do
Lessons from failed clones, each cost hours:
- **Don't trust your eyes over the diff.** "Close enough" at a glance is routinely 8–15% off per band.
- **Don't screenshot mid-animation.** Unfrozen captures differ run to run; the scripts freeze — hand-made screenshots don't.
- **Don't substitute fonts.** A similar family changes line breaks; everything below drifts.
- **Don't miss pseudo-elements.** Glows, gradients, dividers and icons often live in `::before/::after`.
- **Don't use Tailwind's breakpoints blindly.** The site switches layout where ITS media queries say.
- **Don't ignore `rootFontSize`.** A 15px or 10px root changes every rem.
- **Don't build click tabs for scroll-driven content (or vice versa).** Scroll first.
- **Don't extract only the default state.**
- **Don't build HTML mockups of what is actually video, Lottie or canvas.**
- **Don't approximate classes.** `text-lg` is 18px/28px; if line-height is 24px, write 24px.
- **Don't reference docs from builder prompts.** Spec inline, always.
- **Don't skip assets, responsive extraction or smooth-scroll libraries.**
- **Don't fix later bands before the first band with height drift.** Drift compounds downward.
- **Don't commit third-party assets into dev-starter or a public repo.**

## Completion Report
- Sections (bands) built / components / spec files (should match) / assets downloaded (and failed)
- Build status
- Final `visual-diff` table per width (band diff %, height Δ, missing, typography, drift) and the round count
- Behavior parity (scroll `changes`, hover, tabs, motion) — same / differs (how)
- Known gaps (e.g. canvas reproduced as video, commercial font not shippable, auth-only content)
