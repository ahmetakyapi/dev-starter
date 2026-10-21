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
 *   --crop=x,y,w,h   yalnız bu bölge (mantıksal px), tam çözünürlükte: --scale=2 ile
 *                    kıl çizgi, gren ve harf kenarı küçültülmeden görülür
 *   --cuts[=k]       window.TIMELINE'daki her sahne sınırının iki yanından k kare (2);
 *                    her satır bir kesme. --fps=24 kare ızgarası
 *
 * Animatör görünümleri (Florence, "Opus 5.5 Motion Lab"):
 *   --onion          seçilen kareleri %25 opaklıkla TEK görüntüde üst üste bindirir.
 *                    Eşit aralık = robotik; anahtar karelere yaklaşırken sıklaşan
 *                    aralık = eğri çalışıyor.  örn. --strip=1:2 --onion
 *   --probe="ifade"  her karede sayfada bir JS ifadesi ölçer (sayı ya da sayı
 *                    dizisi) ve değer + kare başına değişim grafiği çizer.
 *                    Düz çizgi = doğrusal hareket, keskin köşe = ölü duruş/kalkış.
 *                    örn. --range=0:3:0.0417 --probe="document.querySelector('.hero').getBoundingClientRect().x"
 *
 * Tarayıcı: CHROME_PATH ya da bilinen yerler; kütüphane çalıştırdığın
 * projeden çözülür (puppeteer-core / puppeteer / playwright-core / playwright).
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { filmUrl, launch, newPage as openPage, parseArgs, renderAt, waitReady, watchPage } from "./film-browser.mjs";

const { args, target } = parseArgs();
if (!target) { console.error("Kullanım: film-sheet.mjs <html|url> [--times|--range|--strip|--cuts] [--crop=x,y,w,h] [--out=...]"); process.exit(2); }
const url = filmUrl(target, !args.live);
const [W, H] = String(args.size || "1280x720").split("x").map(Number);
const scale = Number(args.scale || 1);
const crop = args.crop ? String(args.crop).split(",").map(Number) : null;
if (crop && (crop.length !== 4 || crop.some(n => !Number.isFinite(n)) || crop[2] <= 0 || crop[3] <= 0)) { console.error("--crop=x,y,w,h (mantıksal px)"); process.exit(2); }
const cutK = args.cuts ? (args.cuts === true ? 2 : Math.max(1, Number(args.cuts))) : 0;
const cutFps = Number(args.fps || 24);
let cutEdges = [];
// Kırpılmış kare küçültülürse kırpmanın anlamı kalmaz: varsayılan küçük resim kırpmanın fiziksel genişliği.
const cols = Number(args.cols || (cutK ? cutK * 2 : 4)), thumb = Number(args.thumb || (crop ? Math.round(crop[2] * scale) : 480));
const out = resolve(args.out || "out/film-sheet.png");

function times() {
  if (args.times) return String(args.times).split(",").map(Number);
  const [spec, step] = args.strip ? [args.strip, 1 / 12] : args.range ? [args.range, null] : ["0:4:0.5", null];
  const [a, b, s] = String(spec).split(":").map(Number);
  const st = step ?? s ?? 0.5, list = [];
  for (let t = a; t <= b + 1e-9; t += st) list.push(Math.round(t * 1000) / 1000);
  return list;
}

const newPage = (env, w, h, dpr) => openPage(env, { w, h, dpr,
  colorScheme: args.dark ? "dark" : args.light ? "light" : undefined, reducedMotion: args["reduced-motion"] ? "reduce" : undefined });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const b64 = async (page, sel) => {
  // Kırpma tüm sayfadan alınır ve seçiciden önce gelir: ayrıntı, öğenin sınırında kesilmesin.
  const el = sel && !crop ? await page.$(sel) : null;
  const buf = el ? await el.screenshot({ type: "png" })
    : await page.screenshot({ type: "png", ...(crop ? { clip: { x: crop[0], y: crop[1], width: crop[2], height: crop[3] } } : {}) });
  return Buffer.from(buf).toString("base64");
};

const env = await launch();
const page = await newPage(env, W, H, scale);
// Hatalar toplanır, render durmaz: temas sayfası hatalı filmi de göstermeli (--allow-errors).
const watch = watchPage(page);
const errors = watch.errors;
// args tekrar eden bayrağın yalnız sonuncusunu tutar; --cookie çoklu verilir, argv'den toplanır.
const cookies = process.argv.slice(2).filter(a => a.startsWith("--cookie=")).map(a => a.slice("--cookie=".length)).filter(Boolean);
if (cookies.length && /^https?:/.test(url)) {
  const list = cookies.map(c => { const [name, ...v] = c.split("="); return { name, value: v.join("="), url }; });
  if (env.kind === "puppeteer") await page.setCookie(...list);
  else await page.context().addCookies(list);
} else if (cookies.length) console.warn("--cookie yalnız http(s) hedefte uygulanır; yok sayıldı.");
// Ağ susana kadar: canlı sayfada fontlar ve logolar insin (puppeteer ve playwright adları farklı).
await page.goto(url, { waitUntil: env.kind === "playwright" ? "networkidle" : "networkidle0", timeout: 120_000 });

let list = times();
const shots = [];
const probes = [];
const probe = args.probe ? String(args.probe) : null;
const measure = async () => probe ? probes.push(await page.evaluate((expr) => { const v = (0, eval)(expr); return Array.isArray(v) ? v.map(Number) : [Number(v)]; }, probe)) : 0;
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
    await measure();
  }
  timing = await page.evaluate(() => { const f = window.__frames.slice(5).sort((a, b) => a - b); return f.length ? { n: f.length, p50: f[f.length >> 1], p95: f[Math.floor(f.length * 0.95)], max: f[f.length - 1] } : null; });
} else {
  try { await waitReady(page, env.kind, watch); }
  catch (e) { console.error(String(e.message)); await env.browser.close(); process.exit(1); }
  if (cutK) list = await cutTimes();
  for (const t of list) {
    await renderAt(page, t);
    shots.push({ t, data: await b64(page, args.selector), label: cutK ? cutLabel(t) : null });
    await measure();
  }
}

// Döşeme: ayrı bir sayfada ızgara, her karenin köşesinde saniyesi.
// Düşük başlangıç yüksekliği: tam sayfa görüntüsü içerik kadar uzar, altta boşluk kalmaz.
const onion = Boolean(args.onion);
const sheet = await newPage(env, onion ? thumb * 2 + 16 : Math.max(1, Math.min(cols, shots.length)) * (thumb + 8) + 8, 60, 1);
const chart = probes.length ? chartSvg(list, probes) : "";
await sheet.setContent(onion ? `<!doctype html><style>
  body{margin:0;padding:8px;background:#fff;font:600 12px ui-monospace,monospace}
  .o{position:relative;width:${thumb * 2}px} .o img{position:absolute;inset:0;width:100%;opacity:.25;mix-blend-mode:multiply}
  .o img:first-child{position:relative} p{margin:6px 0 0}
</style><div class="o">${shots.map(s => `<img src="data:image/png;base64,${s.data}">`).join("")}</div><p>onion ${shots[0]?.t}–${shots.at(-1)?.t} sn · ${shots.length} kare</p>${chart}` : `<!doctype html><style>
  body{margin:0;padding:8px;background:#0e1013;font:600 12px ui-monospace,monospace;color:#fff}
  .g{display:grid;grid-template-columns:repeat(${Math.max(1, Math.min(cols, shots.length))},${thumb}px);gap:8px}
  figure{margin:0;position:relative} img{width:${thumb}px;display:block;border-radius:6px}
  figcaption{position:absolute;left:6px;top:6px;padding:2px 6px;border-radius:4px;background:#c0262d}
</style><div class="g">${shots.map(s => `<figure><img src="data:image/png;base64,${s.data}"><figcaption>${s.label ?? s.t + "s"}</figcaption></figure>`).join("")}</div>${chart}`);
await sheet.waitForFunction("[...document.images].every(i => i.complete)");
mkdirSync(dirname(out), { recursive: true });
await sheet.screenshot({ path: out, fullPage: true });
await env.browser.close();

console.log(`${shots.length} kare → ${out}`);
if (probes.length) {
  const deltas = probes.slice(1).map((p, i) => Math.abs(p[0] - probes[i][0]));
  const still = deltas.filter(d => d < 1e-3).length, max = Math.max(...deltas);
  console.log(`probe: ${probes.length} ölçüm · en büyük kare adımı ${max.toFixed(3)} · durağan kare ${still}`);
}
if (timing) console.log(`kare süresi: p50 ${timing.p50.toFixed(1)} ms · p95 ${timing.p95.toFixed(1)} ms · en kötü ${timing.max.toFixed(1)} ms (${timing.n} kare)`);
if (errors.length) {
  console.error(`sayfa hataları (${errors.length}):\n  ` + errors.slice(0, 10).join("\n  "));
  if (!args["allow-errors"]) process.exit(1);
}

/**
 * Kesme anları: her sahne sınırının (TIMELINE start/end, 0 ve DUR hariç) iki
 * yanından k kare, kare ızgarasında. Sınır karesi yeni sahnenin ilk karesidir;
 * satır "öncekinin son k karesi | yeninin ilk k karesi" diye okunur.
 */
async function cutTimes() {
  const { TL, DUR } = await page.evaluate(() => ({ TL: Array.isArray(window.TIMELINE) ? window.TIMELINE : null, DUR: window.DUR }));
  if (!TL) { console.error("--cuts window.TIMELINE ister: [{ id, start, end }] (video-uretimi.md)."); await env.browser.close(); process.exit(2); }
  const edges = [...new Set(TL.flatMap(e => [e.start, e.end]).map(b => Math.round(b * cutFps)))]
    .filter(f => f > 0 && f < Math.round(DUR * cutFps)).sort((a, b) => a - b);
  if (!edges.length) { console.error("TIMELINE'da 0 ile DUR arasında sahne sınırı yok."); await env.browser.close(); process.exit(2); }
  cutEdges = edges;
  return edges.flatMap(f => Array.from({ length: cutK * 2 }, (_, i) => Math.max(0, f - cutK + i) / cutFps));
}
/** Kesme karesinin etiketi: kare numarası ve sınırın hangi yanında olduğu. */
function cutLabel(t) {
  const f = Math.round(t * cutFps), b = cutEdges.reduce((best, e) => (Math.abs(e - f) < Math.abs(best - f) ? e : best), cutEdges[0]);
  return `${f < b ? "◀" : "▶"} ${f}. kare · ${(f / cutFps).toFixed(3)}s`;
}

/** Değer (üst) ve kare başına değişim (alt) grafiği: hız grafiği okunur — doğrusal kesim düz, ölü duruş köşe. */
function chartSvg(ts, rows) {
  const W = 960, H = 220, pad = 28, series = rows[0].length;
  const plot = (vals, y0, h, color) => {
    const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
    const pts = vals.map((v, i) => `${(pad + (i / Math.max(1, vals.length - 1)) * (W - 2 * pad)).toFixed(1)},${(y0 + h - ((v - lo) / span) * h).toFixed(1)}`).join(" ");
    return `<polyline fill="none" stroke="${color}" stroke-width="1.6" points="${pts}"/><text x="${pad}" y="${y0 - 4}" font-size="11">${lo.toFixed(2)} … ${hi.toFixed(2)}</text>`;
  };
  const colors = ["#1f6feb", "#c2353b", "#0f8a5f", "#a4720f"];
  let g = "";
  for (let k = 0; k < series; k++) {
    const vals = rows.map(r => r[k]);
    const d = vals.slice(1).map((v, i) => v - vals[i]);
    g += plot(vals, 24, 70, colors[k % 4]) + plot(d.length ? d : [0], 130, 70, colors[k % 4]);
  }
  return `<svg width="${W}" height="${H}" style="display:block;margin-top:8px;background:#fff;font-family:ui-monospace,monospace"><text x="${W - pad}" y="16" text-anchor="end" font-size="11">değer · ${ts[0]}–${ts.at(-1)} sn</text><text x="${W - pad}" y="122" text-anchor="end" font-size="11">kare başına değişim (hız)</text>${g}</svg>`;
}
