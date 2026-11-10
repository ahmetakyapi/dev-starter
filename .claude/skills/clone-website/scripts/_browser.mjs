// Shared helpers for the clone-website scripts.
// Playwright is resolved from the project first, then from the global install
// (cloud sessions ship it preinstalled; locally `npm i -D playwright`).
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);

export function loadPlaywright() {
  for (const from of [process.cwd() + "/", import.meta.url]) {
    try {
      return createRequire(from)("playwright");
    } catch {
      /* try next */
    }
  }
  try {
    return require("playwright");
  } catch {
    console.error("playwright not found. Install it: npm i -D playwright && npx playwright install chromium");
    process.exit(2);
  }
}

export function args(argv = process.argv.slice(2)) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      opt[k] = v ?? (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true);
    } else pos.push(a);
  }
  return { pos, opt };
}

export const widthsOf = (opt, fallback = "1440,768,390") => String(opt.widths ?? fallback).split(",").map(Number);
export const ensureDir = (d) => mkdirSync(d, { recursive: true });

/**
 * Deterministic page state: every animation jumps to its END state, transitions
 * are off, carets hidden, videos paused at their first frame. Without this two
 * screenshots of the same page differ (mid-animation frames) and the visual
 * diff measures noise instead of fidelity.
 */
export const FREEZE_CSS = `
*,*::before,*::after{animation-delay:-1ms!important;animation-duration:1ms!important;animation-iteration-count:1!important;
transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}
html{scroll-behavior:auto!important}`;

export async function settle(page, { freeze = true, scrollLazy = true } = {}) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  if (scrollLazy) {
    // Walk the page so lazy images, IntersectionObserver reveals and
    // scroll-triggered sections all fire, then return to the top.
    await page.evaluate(async () => {
      const step = Math.max(200, Math.floor(innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  // Scroll-state UI (docking navs, shrinking headers) listens to `scroll`.
  // Nudge 1px and back so listeners see "top" for sure, then let them settle.
  await page.evaluate(async () => {
    scrollTo(0, 1);
    dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 80));
    scrollTo(0, 0);
    dispatchEvent(new Event("scroll"));
  });
  await page.waitForTimeout(500);
  if (freeze) {
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.evaluate(() => {
      document.querySelectorAll("video").forEach((v) => {
        try {
          v.pause();
          v.currentTime = 0;
        } catch {
          /* cross-origin or not ready */
        }
      });
    });
  }
  await page.waitForTimeout(400);
}

export async function openPage(browser, url, width, { height = 900, reducedMotion = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    locale: "en-US",
    timezoneId: "UTC",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  return { context, page, errors };
}

/**
 * Page bands (runs in the page): flatten the "section-like" tree to its leaves.
 * - absolute/fixed children are LAYERS of their parent, not bands
 * - <section>, <footer>, <article> and anchor targets ([id]) stop the descent
 * - a wrapper whose section-like children cover ≥ 60% of its height is opened
 * Shared by capture.mjs and visual-diff.mjs so both sides are cut identically.
 */
export const BANDS_FN = () => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const isSection = (el) => {
    if (!vis(el)) return false;
    if (["absolute", "fixed"].includes(getComputedStyle(el).position)) return false;
    const r = el.getBoundingClientRect();
    return r.width >= innerWidth * 0.35 && r.height >= 80;
  };
  const semantic = (el) => el !== document.body && isSection(el) && el.matches("section, footer, article, [id]") && !el.matches("#__next, #root, #app, main");
  const blocks = [];
  const collect = (el, depth) => {
    if (semantic(el)) return void blocks.push(el);
    const kids = [...el.children].filter(isSection);
    const h = el.getBoundingClientRect().height || 1;
    const covered = kids.reduce((n, k) => n + k.getBoundingClientRect().height, 0);
    if (depth < 8 && kids.length >= 2 && covered >= h * 0.6) kids.forEach((k) => collect(k, depth + 1));
    else if (depth < 8 && kids.length === 1 && kids[0].getBoundingClientRect().height >= h * 0.9) collect(kids[0], depth + 1);
    else if (el !== document.body && isSection(el)) blocks.push(el);
  };
  collect(document.body, 0);
  return blocks.map((el, i) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const h = el.querySelector("h1,h2,h3");
    return {
      index: i,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: typeof el.className === "string" && el.className ? el.className.slice(0, 300) : null,
      bbox: { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      heading: h ? h.textContent.trim().replace(/\s+/g, " ").slice(0, 120) : null,
      background: { color: cs.backgroundColor, image: cs.backgroundImage !== "none" ? cs.backgroundImage.slice(0, 300) : null },
      position: cs.position,
      zIndex: cs.zIndex,
    };
  });
};

/** Text-bearing elements with geometry + type (runs in the page): the geometry diff's input. */
export const TEXT_BOXES_FN = () => {
  const out = [];
  const seen = new Map();
  for (const el of document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,button,li,label,span,dt,dd,figcaption,blockquote,img")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const own = el.tagName === "IMG" ? `img:${el.alt || (el.currentSrc || "").split("/").pop()}` : [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").replace(/\s+/g, " ").trim();
    if (!own || own.length < 2) continue;
    const base = `${el.tagName.toLowerCase()}|${own.slice(0, 60)}`;
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    out.push({
      key: `${base}|${n}`,
      text: own.slice(0, 60),
      box: { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      type: { size: cs.fontSize, weight: cs.fontWeight, family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(), lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, color: cs.color },
    });
  }
  return out;
};
