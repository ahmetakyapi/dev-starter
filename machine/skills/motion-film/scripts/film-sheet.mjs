#!/usr/bin/env node
/**
 * film-sheet — bir filmin karelerini tek görüntüde döşer (temas sayfası / şerit).
 *
 * Hareket kod okuyarak görülmez; bakılarak görülür (ClaudeAnimationBase,
 * ANIMATION_GUIDE "review loop"). Bu betik iki kipte kare toplar:
 *
 *   SÖZLEŞME (varsayılan): sayfa window.render(t) + window.READY açar
 *   (assets/film-page.html). Her kare render(t) ile, sırasız ve kesin.
 *
 *   CANLI (--live): gerçek bileşen, gerçek saat. İsteğe bağlı --click ile
 *   bir düğmeye basılır, kareler basıştan bu yana geçen saniyede alınır.
 *   Kare süresi (rAF aralığı p50/p95) de ölçülür.
 *
 * Kullanım:
 *   node film-sheet.mjs film.html --range=0:4:0.25 --out=out/sheet.png
 *   node film-sheet.mjs film.html --strip=1.2:1.8          # 1/12 sn adımla şerit
 *   node film-sheet.mjs http://localhost:3000/x --live --click="[data-start]" \
 *        --times=0.3,1,2,4 --selector=main --size=390x844 --dark --out=out/live.png
 *
 * Seçenekler:
 *   --times=a,b,c | --range=a:b:adım | --strip=a:b    kare anları (sn)
 *   --size=WxH (1280x720)  --scale=dpr (1)  --cols=n (4)  --thumb=px (480)
 *   --selector=css   yalnız bu öğenin karesi      --dark / --light   renk şeması
 *   --reduced-motion  hareketi azaltma taklidi    --cookie=ad=değer (çoklu)
 *   --wait=ms        canlıda tıklamadan önce bekleme (800)
 *   --allow-errors   sayfa hatasında yine de çık 0
 *
 * Tarayıcı: CHROME_PATH ya da bilinen yerler; kütüphane çalıştırdığın
 * projeden çözülür (puppeteer-core / puppeteer / playwright-core / playwright).
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith("--")).map(a => {
  const [k, ...v] = a.slice(2).split("="); return [k, v.length ? v.join("=") : true];
}));
const target = process.argv.slice(2).find(a => !a.startsWith("--"));
if (!target) { console.error("Kullanım: film-sheet.mjs <html|url> [--times|--range|--strip] [--out=...]"); process.exit(2); }
const url = /^https?:/.test(target) ? target : pathToFileURL(resolve(target)).href + (args.live ? "" : (target.includes("?") ? "&" : "?") + "capture");
const [W, H] = String(args.size || "1280x720").split("x").map(Number);
const scale = Number(args.scale || 1), cols = Number(args.cols || 4), thumb = Number(args.thumb || 480);
const out = resolve(args.out || "out/film-sheet.png");

function times() {
  if (args.times) return String(args.times).split(",").map(Number);
  const [spec, step] = args.strip ? [args.strip, 1 / 12] : args.range ? [args.range, null] : ["0:4:0.5", null];
  const [a, b, s] = String(spec).split(":").map(Number);
  const st = step ?? s ?? 0.5, list = [];
  for (let t = a; t <= b + 1e-9; t += st) list.push(Math.round(t * 1000) / 1000);
  return list;
}

/** Tarayıcı bağdaştırıcısı: puppeteer ya da playwright, aynı küçük yüzey. */
async function launch() {
  const req = createRequire(resolve(process.cwd(), "package.json"));
  const chrome = process.env.CHROME_PATH || [
    "/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find(p => existsSync(p));
  for (const name of ["puppeteer-core", "puppeteer"]) {
    try {
      const pptr = req(name);
      const browser = await pptr.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
      return { browser, kind: "puppeteer" };
    } catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; }
  }
  for (const name of ["playwright-core", "playwright"]) {
    try {
      const { chromium } = req(name);
      const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
      return { browser, kind: "playwright" };
    } catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; }
  }
  throw new Error("puppeteer(-core) ya da playwright(-core) bulunamadı: projede `npm i -D puppeteer-core` (ya da playwright).");
}

async function newPage({ browser, kind }, w, h, dpr) {
  if (kind === "playwright") {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: args.dark ? "dark" : args.light ? "light" : undefined, reducedMotion: args["reduced-motion"] ? "reduce" : undefined });
    return ctx.newPage();
  }
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  const feats = [];
  if (args.dark || args.light) feats.push({ name: "prefers-color-scheme", value: args.dark ? "dark" : "light" });
  if (args["reduced-motion"]) feats.push({ name: "prefers-reduced-motion", value: "reduce" });
  if (feats.length) await page.emulateMediaFeatures(feats);
  return page;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const b64 = async (page, sel) => {
  const el = sel ? await page.$(sel) : null;
  const buf = el ? await el.screenshot({ type: "png" }) : await page.screenshot({ type: "png" });
  return Buffer.from(buf).toString("base64");
};

const env = await launch();
const page = await newPage(env, W, H, scale);
const errors = [];
page.on("pageerror", e => errors.push(String(e.message || e)));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
const cookies = [].concat(args.cookie || []).filter(Boolean);
if (cookies.length && env.kind === "puppeteer" && /^https?:/.test(url)) {
  await page.setCookie(...cookies.map(c => { const [name, ...v] = String(c).split("="); return { name, value: v.join("="), url }; }));
}
// Ağ susana kadar: canlı sayfada fontlar ve logolar insin (puppeteer ve playwright adları farklı).
await page.goto(url, { waitUntil: env.kind === "playwright" ? "networkidle" : "networkidle0", timeout: 120_000 });

const list = times();
const shots = [];
let timing = null;
if (args.live) {
  await sleep(Number(args.wait || 800));
  if (args.click) await page.click(String(args.click));
  await page.evaluate(() => { window.__frames = []; let l = performance.now(); const f = n => { window.__frames.push(n - l); l = n; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const t0 = Date.now();
  for (const t of list) {
    const wait = t * 1000 - (Date.now() - t0);
    if (wait > 0) await sleep(wait);
    shots.push({ t, data: await b64(page, args.selector) });
  }
  timing = await page.evaluate(() => { const f = window.__frames.slice(5).sort((a, b) => a - b); return f.length ? { n: f.length, p50: f[f.length >> 1], p95: f[Math.floor(f.length * 0.95)], max: f[f.length - 1] } : null; });
} else {
  await page.waitForFunction("window.READY === true && typeof window.render === 'function'", { timeout: 20_000 });
  for (const t of list) {
    await page.evaluate(tt => window.render(tt), t);
    shots.push({ t, data: await b64(page, args.selector) });
  }
}

// Döşeme: ayrı bir sayfada ızgara, her karenin köşesinde saniyesi.
// Düşük başlangıç yüksekliği: tam sayfa görüntüsü içerik kadar uzar, altta boşluk kalmaz.
const sheet = await newPage(env, cols * (thumb + 8) + 8, 60, 1);
await sheet.setContent(`<!doctype html><style>
  body{margin:0;padding:8px;background:#0e1013;font:600 12px ui-monospace,monospace;color:#fff}
  .g{display:grid;grid-template-columns:repeat(${cols},${thumb}px);gap:8px}
  figure{margin:0;position:relative} img{width:${thumb}px;display:block;border-radius:6px}
  figcaption{position:absolute;left:6px;top:6px;padding:2px 6px;border-radius:4px;background:#c0262d}
</style><div class="g">${shots.map(s => `<figure><img src="data:image/png;base64,${s.data}"><figcaption>${s.t}s</figcaption></figure>`).join("")}</div>`);
await sheet.waitForFunction("[...document.images].every(i => i.complete)");
mkdirSync(dirname(out), { recursive: true });
await sheet.screenshot({ path: out, fullPage: true });
await env.browser.close();

console.log(`${shots.length} kare → ${out}`);
if (timing) console.log(`kare süresi: p50 ${timing.p50.toFixed(1)} ms · p95 ${timing.p95.toFixed(1)} ms · en kötü ${timing.max.toFixed(1)} ms (${timing.n} kare)`);
if (errors.length) {
  console.error(`sayfa hataları (${errors.length}):\n  ` + errors.slice(0, 10).join("\n  "));
  if (!args["allow-errors"]) process.exit(1);
}
