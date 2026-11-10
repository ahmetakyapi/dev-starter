#!/usr/bin/env node
// Download every asset capture.mjs found, preserving a readable folder layout.
//
//   node download-assets.mjs <captureDir> <publicDir> [--prefer-largest] [--concurrency 6]
//
// Reads <captureDir>/assets.json + tokens.json and writes into <publicDir>:
//   images/  backgrounds/  videos/  fonts/  icons/  og/
// plus <captureDir>/asset-map.json: { originalUrl: "/images/hero.avif", ... }
// so builders reference LOCAL paths (the map is the single source).
//
// - srcset: with --prefer-largest the biggest candidate is downloaded (retina-sharp).
// - Next.js image optimizer URLs (/_next/image?url=...) are unwrapped to the original.
// - Fonts come from @font-face src (woff2 first) so the clone uses the EXACT files,
//   not a "similar" Google font.
// - data: URIs are skipped (already inline); failures are listed, never silent.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { args } from "./_browser.mjs";

const { pos, opt } = args();
const [captureDir, publicDir] = pos;
if (!captureDir || !publicDir) {
  console.error("usage: node download-assets.mjs <captureDir> <publicDir> [--prefer-largest] [--concurrency 6]");
  process.exit(2);
}
const assets = JSON.parse(readFileSync(join(captureDir, "assets.json"), "utf8"));
const tokens = JSON.parse(readFileSync(join(captureDir, "tokens.json"), "utf8"));
const report = JSON.parse(readFileSync(join(captureDir, "capture-report.json"), "utf8"));
const concurrency = Number(opt.concurrency ?? 6);

const unwrap = (u) => {
  try {
    const x = new URL(u);
    if (x.pathname.startsWith("/_next/image") && x.searchParams.get("url")) return new URL(x.searchParams.get("url"), x.origin).href;
    return x.href;
  } catch {
    return null;
  }
};

const jobs = new Map(); // url -> folder
const add = (u, folder) => {
  const url = u && unwrap(u);
  if (!url || url.startsWith("data:") || jobs.has(url)) return;
  jobs.set(url, folder);
};
for (const img of assets.images) add(opt["prefer-largest"] && img.largest ? img.largest : img.src, "images");
for (const bg of assets.backgrounds) add(bg.url, "backgrounds");
for (const v of assets.videos) {
  add(v.src, "videos");
  v.sources.forEach((s) => add(s.src, "videos"));
  add(v.poster, "videos");
}
for (const i of assets.icons) add(i.href, "icons");
if (assets.meta?.["og:image"]) add(new URL(assets.meta["og:image"], report.url).href, "og");
for (const f of tokens.fontFaces) {
  const woff2 = f.src.find((s) => /\.woff2(\?|$)/.test(s)) || f.src[0];
  add(woff2, "fonts");
}

const used = new Set();
const nameFor = (url, folder) => {
  const u = new URL(url);
  let name = decodeURIComponent(basename(u.pathname)) || "index";
  if (!extname(name)) name += ".bin";
  name = name.replace(/[^\w.\-]+/g, "-");
  let candidate = `${folder}/${name}`;
  for (let i = 2; used.has(candidate); i++) candidate = `${folder}/${name.replace(/(\.[^.]+)$/, `-${i}$1`)}`;
  used.add(candidate);
  return candidate;
};

const map = {};
const failed = [];
const entries = [...jobs.entries()];
let done = 0;
async function worker() {
  while (entries.length) {
    const [url, folder] = entries.shift();
    const rel = nameFor(url, folder);
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (clone-website asset fetch)", referer: report.url } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      mkdirSync(join(publicDir, folder), { recursive: true });
      writeFileSync(join(publicDir, rel), buf);
      map[url] = `/${rel}`;
      done++;
    } catch (e) {
      failed.push({ url, error: String(e.message || e) });
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
writeFileSync(join(captureDir, "asset-map.json"), JSON.stringify({ map, failed }, null, 2));
console.log(`downloaded ${done}/${jobs.size} assets → ${publicDir} (map: ${join(captureDir, "asset-map.json")})`);
if (failed.length) console.log(`  FAILED ${failed.length}: ${failed.slice(0, 5).map((f) => f.url + " (" + f.error + ")").join(", ")}`);
