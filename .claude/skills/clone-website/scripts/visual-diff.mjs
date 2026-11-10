#!/usr/bin/env node
// Measured fidelity: original vs clone, band by band, pixel by pixel, box by box.
//
//   node visual-diff.mjs <originalUrl> <cloneUrl> <outDir> [--widths 1440,390] [--threshold 0.03] [--tolerance 40]
//
// Both pages are captured under IDENTICAL conditions (same viewport, DPR 1,
// fonts loaded, lazy content walked, animations frozen at their end state).
// Then, per width:
//   1. BANDS   both pages are cut into bands with the same algorithm; band i of
//              the original is compared with band i of the clone. Score = share of
//              pixels whose RGB distance exceeds --tolerance (anti-aliasing noise
//              stays under it). Writes <outDir>/<w>/band-NN.png: original | clone | diff.
//   2. BOXES   every text-bearing element (and img) is matched by tag+text; reports
//              position/size drift > 2px and font size/weight/family/line-height/
//              letter-spacing/color mismatches, plus texts MISSING from the clone.
//   3. HEIGHT  total page height and per-band height deltas (layout drift compounds).
//   4. NOISE   the original is captured TWICE; pixels that differ between those two
//              captures (JS/canvas animation, carousels, counters, video) form a
//              volatile mask and are excluded, and elements that drift between the
//              two originals are excluded from the box diff. A self-diff therefore
//              scores ~0% and the score measures the clone, not the site's motion.
// Verdict PASS only if every band ≤ threshold, no missing text, no band count mismatch.
// <outDir>/report.md is the fix list: worst band first, each with concrete deltas.
import { writeFileSync } from "node:fs";
import { args, BANDS_FN, ensureDir, loadPlaywright, openPage, settle, TEXT_BOXES_FN, widthsOf } from "./_browser.mjs";

const { pos, opt } = args();
const [origUrl, cloneUrl, outDir] = pos;
if (!origUrl || !cloneUrl || !outDir) {
  console.error("usage: node visual-diff.mjs <originalUrl> <cloneUrl> <outDir> [--widths 1440,390] [--threshold 0.03] [--tolerance 40]");
  process.exit(2);
}
const widths = widthsOf(opt, "1440,390");
const threshold = Number(opt.threshold ?? 0.03);
const tolerance = Number(opt.tolerance ?? 40);
const { chromium } = loadPlaywright();
const browser = await chromium.launch();

async function grab(url, width) {
  const { context, page, errors } = await openPage(browser, url, width);
  await settle(page, { freeze: true });
  const bands = await page.evaluate(BANDS_FN);
  const boxes = await page.evaluate(TEXT_BOXES_FN);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const png = await page.screenshot({ fullPage: true });
  await context.close();
  return { bands, boxes, height, png: png.toString("base64"), errors };
}

// Pixel comparison runs inside a blank page (canvas): no image library needed.
const lab = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
async function compareBand(a, a2, b, ra, ra2, rb, out) {
  return lab.evaluate(
    async ({ a, a2, b, ra, ra2, rb, tolerance }) => {
      const load = (src) =>
        new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = "data:image/png;base64," + src;
        });
      const [ia, ia2, ib] = await Promise.all([load(a), load(a2), load(b)]);
      const w = Math.min(ra.w, rb.w, ia.width, ib.width);
      const h = Math.max(1, Math.min(ra.h, rb.h, ra2.h));
      const crop = (img, r) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, r.x, r.y, w, h, 0, 0, w, h);
        return c.getContext("2d").getImageData(0, 0, w, h);
      };
      const da = crop(ia, ra);
      const da2 = crop(ia2, ra2);
      const db = crop(ib, rb);
      const sheet = document.createElement("canvas");
      sheet.width = w * 3 + 16;
      sheet.height = h;
      const ctx = sheet.getContext("2d");
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, sheet.width, sheet.height);
      ctx.putImageData(da, 0, 0);
      ctx.putImageData(db, w + 8, 0);
      const diff = ctx.createImageData(w, h);
      let bad = 0;
      let volatile = 0;
      const dist = (x, y, p) => Math.abs(x.data[p] - y.data[p]) + Math.abs(x.data[p + 1] - y.data[p + 1]) + Math.abs(x.data[p + 2] - y.data[p + 2]);
      for (let p = 0; p < da.data.length; p += 4) {
        if (dist(da, da2, p) > tolerance) {
          // The original changes by itself here: not the clone's fault. Blue.
          volatile++;
          diff.data[p] = 90;
          diff.data[p + 1] = 150;
          diff.data[p + 2] = 255;
          diff.data[p + 3] = 255;
          continue;
        }
        const d = dist(da, db, p);
        if (d > tolerance) {
          bad++;
          diff.data[p] = 255;
          diff.data[p + 1] = 40;
          diff.data[p + 2] = 60;
          diff.data[p + 3] = 255;
        } else {
          const g = (da.data[p] + da.data[p + 1] + da.data[p + 2]) / 3;
          diff.data[p] = diff.data[p + 1] = diff.data[p + 2] = 200 + g * 0.2;
          diff.data[p + 3] = 255;
        }
      }
      ctx.putImageData(diff, w * 2 + 16, 0);
      const stable = Math.max(1, w * h - volatile);
      return { ratio: bad / stable, volatile: volatile / (w * h), w, h, png: sheet.toDataURL("image/png").split(",")[1] };
    },
    { a, a2, b, ra, ra2, rb, tolerance },
  ).then((r) => {
    writeFileSync(out, Buffer.from(r.png, "base64"));
    return { ratio: r.ratio, volatile: r.volatile, comparedHeight: r.h };
  });
}

const px = (v) => parseFloat(v) || 0;
const report = { origUrl, cloneUrl, threshold, tolerance, widths: {}, pass: true };
const md = [`# Visual diff\n`, `Original: ${origUrl}  \nClone: ${cloneUrl}  \nThreshold: ${(threshold * 100).toFixed(1)}% of band pixels, tolerance ${tolerance}\n`];

for (const width of widths) {
  ensureDir(`${outDir}/${width}`);
  const [o, o2, c] = [await grab(origUrl, width), await grab(origUrl, width), await grab(cloneUrl, width)];
  // Elements that move between two captures of the ORIGINAL are noise.
  const o2map = new Map(o2.boxes.map((b) => [b.key, b]));
  const unstable = new Set(o.boxes.filter((b) => {
    const t = o2map.get(b.key);
    return !t || Math.abs(t.box.x - b.box.x) > 2 || Math.abs(t.box.y - b.box.y) > 2;
  }).map((b) => b.key));
  const n = Math.min(o.bands.length, c.bands.length);
  const bands = [];
  for (let i = 0; i < n; i++) {
    const ob = o.bands[i];
    const cb = c.bands[i];
    const ob2 = o2.bands[i] || ob;
    const r = await compareBand(o.png, o2.png, c.png, ob.bbox, ob2.bbox, cb.bbox, `${outDir}/${width}/band-${String(i).padStart(2, "0")}.png`);
    bands.push({
      index: i,
      label: ob.id || ob.heading || ob.tag,
      ratio: r.ratio,
      volatile: r.volatile,
      heightDelta: cb.bbox.h - ob.bbox.h,
      yDelta: cb.bbox.y - ob.bbox.y,
      pass: r.ratio <= threshold,
    });
  }
  // Box/text diff
  const cmap = new Map(c.boxes.map((b) => [b.key, b]));
  const missing = [];
  const drift = [];
  const typeMismatch = [];
  for (const ob of o.boxes) {
    if (unstable.has(ob.key)) continue;
    const cb = cmap.get(ob.key);
    if (!cb) {
      missing.push(ob);
      continue;
    }
    const d = { x: cb.box.x - ob.box.x, y: cb.box.y - ob.box.y, w: cb.box.w - ob.box.w, h: cb.box.h - ob.box.h };
    if (Object.values(d).some((v) => Math.abs(v) > 2)) drift.push({ key: ob.key, text: ob.text, delta: d, original: ob.box });
    const tm = {};
    for (const k of ["size", "weight", "family", "lineHeight", "letterSpacing", "color"]) {
      const same = ["size", "lineHeight", "letterSpacing"].includes(k) ? Math.abs(px(ob.type[k]) - px(cb.type[k])) < 0.5 : ob.type[k] === cb.type[k];
      if (!same) tm[k] = { original: ob.type[k], clone: cb.type[k] };
    }
    if (Object.keys(tm).length) typeMismatch.push({ key: ob.key, text: ob.text, ...tm });
  }
  const bandCountOk = o.bands.length === c.bands.length;
  const pass = bandCountOk && missing.length === 0 && bands.every((b) => b.pass);
  report.pass &&= pass;
  report.widths[width] = { pass, pageHeight: { original: o.height, clone: c.height }, bandCount: { original: o.bands.length, clone: c.bands.length }, bands, missing: missing.slice(0, 80), drift: drift.sort((a, b) => Math.abs(b.delta.y) - Math.abs(a.delta.y)).slice(0, 80), typeMismatch: typeMismatch.slice(0, 80), cloneErrors: c.errors };

  md.push(`\n## ${width}px — ${pass ? "PASS" : "FAIL"}\n`);
  md.push(`Page height: original ${o.height}px, clone ${c.height}px (Δ ${c.height - o.height}px). Bands: original ${o.bands.length}, clone ${c.bands.length}${bandCountOk ? "" : " **(mismatch: a section is missing or split differently)**"}.\n`);
  md.push(`| # | Band | Diff | Volatile (excluded) | Height Δ | Top Δ | |\n|---|---|---|---|---|---|---|`);
  for (const b of [...bands].sort((x, y) => y.ratio - x.ratio)) md.push(`| ${b.index} | ${String(b.label).slice(0, 40)} | ${(b.ratio * 100).toFixed(1)}% | ${(b.volatile * 100).toFixed(1)}% | ${b.heightDelta}px | ${b.yDelta}px | ${b.pass ? "ok" : "**fix**"} |`);
  if (missing.length) md.push(`\n**Missing in clone (${missing.length}):** ${missing.slice(0, 25).map((m) => `\`${m.text}\``).join(", ")}`);
  if (typeMismatch.length) {
    md.push(`\n**Typography mismatches (${typeMismatch.length}, first 20):**`);
    for (const t of typeMismatch.slice(0, 20)) md.push(`- \`${t.text}\`: ${Object.entries(t).filter(([k]) => !["key", "text"].includes(k)).map(([k, v]) => `${k} ${v.original} → ${v.clone}`).join("; ")}`);
  }
  if (drift.length) {
    md.push(`\n**Geometry drift > 2px (${drift.length}, largest 20):**`);
    for (const d of report.widths[width].drift.slice(0, 20)) md.push(`- \`${d.text}\`: x ${d.delta.x}, y ${d.delta.y}, w ${d.delta.w}, h ${d.delta.h}`);
  }
  md.push(`\nBand images: \`${outDir}/${width}/band-NN.png\` (original | clone | diff: red = clone differs, blue = original moves by itself and is ignored).`);
}
md.splice(1, 0, `\n**Verdict: ${report.pass ? "PASS" : "FAIL"}**\n`);
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
writeFileSync(`${outDir}/report.md`, md.join("\n") + "\n");
await browser.close();
for (const [w, r] of Object.entries(report.widths)) {
  const worst = [...r.bands].sort((a, b) => b.ratio - a.ratio)[0];
  console.log(`${w}px ${r.pass ? "PASS" : "FAIL"}  bands ${r.bandCount.original}/${r.bandCount.clone}  worst ${worst ? `${(worst.ratio * 100).toFixed(1)}% (${String(worst.label).slice(0, 30)})` : "-"}  missing ${r.missing.length}  type ${r.typeMismatch.length}  drift ${r.drift.length}`);
}
console.log(`report: ${outDir}/report.md`);
process.exit(report.pass ? 0 : 1);
