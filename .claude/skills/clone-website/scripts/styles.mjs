#!/usr/bin/env node
// Exact computed styles of one component subtree — the raw material of a spec file.
//
//   node styles.mjs <url> "<css selector>" <out.json> [--widths 1440,390] [--hover] [--depth 6] [--max 250]
//
// For every element under the selector (depth-limited) it records:
//   - path (tag.class:nth), text (first 80 chars), bbox relative to the component
//   - ONLY the properties that differ from a pristine element of the same tag
//     (so the spec lists what the site set, not 300 browser defaults)
//   - ::before / ::after when they render (content != none): decorative
//     gradients, glows and icons often live here and are the #1 thing clones miss
//   - with --hover: the same diff after hovering the component's root (and each
//     link/button), i.e. the hover state spec
// Runs per width so responsive differences are explicit.
import { writeFileSync } from "node:fs";
import { args, loadPlaywright, openPage, settle, widthsOf } from "./_browser.mjs";

const { pos, opt } = args();
const [url, selector, out] = pos;
if (!url || !selector || !out) {
  console.error('usage: node styles.mjs <url> "<selector>" <out.json> [--widths 1440,390] [--hover] [--depth 6] [--max 250]');
  process.exit(2);
}
const widths = widthsOf(opt, "1440,390");
const depth = Number(opt.depth ?? 6);
const max = Number(opt.max ?? 250);
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const result = { url, selector, widths: {} };

const dump = ({ sel, maxDepth, limit }) => {
  const root = document.querySelector(sel);
  if (!root) return { error: `selector not found: ${sel}` };
  const sandbox = document.createElement("div");
  sandbox.style.cssText = "position:absolute;left:-99999px;top:0;all:initial";
  document.body.appendChild(sandbox);
  const defaults = {};
  const baseline = (tag) => {
    if (defaults[tag]) return defaults[tag];
    const probe = document.createElement(tag);
    sandbox.appendChild(probe);
    const cs = getComputedStyle(probe);
    defaults[tag] = Object.fromEntries([...cs].map((k) => [k, cs.getPropertyValue(k)]));
    probe.remove();
    return defaults[tag];
  };
  // Inherited text properties are noise on every descendant; keep them only
  // where they change relative to the parent.
  const INHERITED = new Set(["tab-size", "text-size-adjust", "-webkit-text-fill-color", "-webkit-text-stroke-color", "row-rule-color", "quotes", "hyphens", "word-break", "overflow-wrap", "list-style-type", "list-style-position", "color", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "font-style", "text-align", "text-transform", "white-space", "word-spacing", "visibility", "cursor", "direction", "-webkit-font-smoothing", "font-feature-settings", "font-variation-settings", "text-rendering"]);
  // Logical duplicates (border-start-start-radius, margin-inline…) and values
  // that merely mirror `color` (column-rule, outline, caret, text-decoration,
  // text-emphasis) are dropped: they are derived, not set.
  const SKIP = /^(-webkit-(?!backdrop|text-stroke|text-fill|line-clamp|mask)|inset-|block-size|inline-size|min-block|min-inline|max-block|max-inline|perspective-origin|transform-origin|border-(block|inline)|border-(start|end)-(start|end)-radius|margin-(block|inline)|padding-(block|inline)|offset-|scroll-|overscroll-|contain-intrinsic|column-rule-color|outline-color|caret-color|text-decoration-color|text-emphasis-color|color-scheme)/;
  // Four equal sides → one shorthand (spec reads like CSS a human would write).
  const collapse = (o) => {
    const groups = [
      ["border-radius", ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"]],
      ["padding", ["padding-top", "padding-right", "padding-bottom", "padding-left"]],
      ["margin", ["margin-top", "margin-right", "margin-bottom", "margin-left"]],
      ["border-width", ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"]],
      ["border-style", ["border-top-style", "border-right-style", "border-bottom-style", "border-left-style"]],
      ["border-color", ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"]],
    ];
    for (const [short, longs] of groups) {
      if (!longs.some((k) => k in o)) continue;
      const vals = longs.map((k) => o[k] ?? null);
      if (vals.every((v) => v !== null && v === vals[0])) {
        longs.forEach((k) => delete o[k]);
        o[short] = vals[0].replace(/^3\.35544e\+07px$/, "9999px");
      }
    }
    for (const k of Object.keys(o)) if (/radius/.test(k)) o[k] = o[k].replace(/3\.35544e\+07px/g, "9999px");
    return o;
  };
  const rootBox = root.getBoundingClientRect();
  const diffStyles = (cs, base, parentCs) => {
    const o = {};
    for (const k of cs) {
      if (SKIP.test(k)) continue;
      const v = cs.getPropertyValue(k);
      if (INHERITED.has(k)) {
        if (parentCs && parentCs.getPropertyValue(k) === v) continue;
      } else if (base[k] === v) continue;
      if (k === "width" || k === "height") continue; // bbox carries the size
      if ((k === "min-width" || k === "min-height") && v === "auto") continue; // flex item default
      if (k.startsWith("--tw-")) continue; // Tailwind internals; the resolved values are already listed
      if (["-webkit-text-fill-color", "-webkit-text-stroke-color", "row-rule-color"].includes(k) && v === cs.getPropertyValue("color")) continue;
      if (k === "box-shadow" || k === "text-shadow") {
        // Tailwind stacks transparent zero layers (ring/shadow slots): keep only visible ones.
        const layers = v.split(/,(?![^(]*\))/).map((x) => x.trim()).filter((x) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px( 0px)?$/.test(x));
        if (!layers.length) continue;
        o[k] = layers.join(", ");
        continue;
      }
      o[k] = v;
    }
    return collapse(o);
  };
  const items = [];
  const walk = (el, d, parentCs) => {
    if (items.length >= limit || d > maxDepth) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none") return;
    const r = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const idx = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").replace(/\s+/g, " ");
    const entry = {
      path: `${"  ".repeat(d)}${tag}${cls ? "." + cls : ""}:${idx}`,
      text: own ? own.slice(0, 80) : undefined,
      bbox: { x: Math.round(r.left - rootBox.left), y: Math.round(r.top - rootBox.top), w: Math.round(r.width), h: Math.round(r.height) },
      styles: diffStyles(cs, baseline(tag), parentCs),
    };
    for (const pseudo of ["::before", "::after"]) {
      const ps = getComputedStyle(el, pseudo);
      const content = ps.getPropertyValue("content");
      if (content && content !== "none" && content !== "normal") {
        entry[pseudo] = { content, ...diffStyles(ps, baseline("span"), cs) };
      }
    }
    if (tag === "svg") entry.svg = el.outerHTML.slice(0, 4000);
    if (tag === "img") entry.img = { src: el.currentSrc, alt: el.alt, natural: [el.naturalWidth, el.naturalHeight] };
    items.push(entry);
    if (tag !== "svg") for (const c of el.children) walk(c, d + 1, cs);
  };
  walk(root, 0, root.parentElement ? getComputedStyle(root.parentElement) : null);
  sandbox.remove();
  return { rootBox: { w: Math.round(rootBox.width), h: Math.round(rootBox.height) }, count: items.length, truncated: items.length >= limit, items };
};

for (const width of widths) {
  const { context, page } = await openPage(browser, url, width);
  await settle(page, { freeze: true });
  await page.locator(selector).first().scrollIntoViewIfNeeded().catch(() => {});
  const base = await page.evaluate(dump, { sel: selector, maxDepth: depth, limit: max });
  const entry = { default: base };
  if (opt.hover && !base.error) {
    // Hover needs real transitions: reload WITHOUT freeze, hover, wait for the transition.
    const { context: c2, page: p2 } = await openPage(browser, url, width);
    await settle(p2, { freeze: false });
    const root = p2.locator(selector).first();
    await root.scrollIntoViewIfNeeded();
    await root.hover();
    await p2.waitForTimeout(700);
    entry.hoverRoot = await p2.evaluate(dump, { sel: selector, maxDepth: depth, limit: max });
    const targets = await root.locator("a, button").count();
    if (targets) {
      await root.locator("a, button").first().hover();
      await p2.waitForTimeout(700);
      entry.hoverFirstAction = await p2.evaluate(dump, { sel: selector, maxDepth: depth, limit: max });
    }
    await c2.close();
  }
  result.widths[width] = entry;
  await context.close();
}
await browser.close();
writeFileSync(out, JSON.stringify(result, null, 2));
const first = result.widths[widths[0]].default;
console.log(first.error ? first.error : `${selector}: ${first.count} elements${first.truncated ? " (truncated, raise --max or narrow the selector)" : ""} → ${out}`);
