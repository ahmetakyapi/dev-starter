#!/usr/bin/env node
/**
 * film-video — sözleşme sayfasını (window.render(t), DUR, READY) MP4'e çevirir.
 *
 * Video modeli yok: her kare render(t) ile tarayıcıda çizilir, JPEG olarak
 * ffmpeg'e akar (shipvideo ve lemo-opuscar'ın aynı yolu). Kare saf
 * fonksiyon olduğu için sıra ve hız önemsiz; çıktı her seferinde aynı.
 *
 *   node film-video.mjs film.html --fps=24 --size=1920x1080 --out=out/film.mp4
 *   node film-video.mjs film.html --subframes=4        # hareket bulanıklığı
 *
 * --subframes=N  her kare için N alt kare çizilir, ffmpeg `tmix` ile
 *                ortalanır: hızlı harekette gerçek bulanıklık (twoclipping'in
 *                "4 subframes, tmix" tarifi). Süre N katı.
 * --from=a --to=b  yalnız bir aralık (hızlı deneme).
 * --events        DUR ve EV'yi out yanına .events.json olarak yazar (miks için).
 * --gif           MP4 yerine tek paletli GIF (out .gif). GIF gecikmeleri yüzde bir
 *                 saniyedir: 24 fps (41,7 ms) yazılamaz, 40'a yuvarlanınca döngü %4
 *                 hızlı koşar ve vuruştan kayar. Bu yüzden GIF 25 fps'e (tam 40 ms)
 *                 sabitlenir. Tek palet kareler arası renk titremesini önler.
 * ffmpeg: PATH'te ya da FFMPEG ortam değişkeni. Tarayıcı: film-sheet.mjs ile aynı.
 */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith("--")).map(a => {
  const [k, ...v] = a.slice(2).split("="); return [k, v.length ? v.join("=") : true];
}));
const target = process.argv.slice(2).find(a => !a.startsWith("--"));
if (!target) { console.error("Kullanım: film-video.mjs <html|url> [--fps=24] [--size=1920x1080] [--subframes=1] [--out=out/film.mp4]"); process.exit(2); }
/** film-sheet.mjs ile aynı: sorgu dosya adına gömülmez, http hedefi de ?capture alır (önizleme döngüsü kapanır). */
const filmUrl = (target, capture) => {
  const [p, q = ""] = target.split(/\?(.*)/s);
  const u = /^https?:/.test(target) ? new URL(target) : new URL(pathToFileURL(resolve(p)).href + (q ? "?" + q : ""));
  if (capture) u.searchParams.set("capture", "");
  return u.href;
};
const url = filmUrl(target, true);
const [W, H] = String(args.size || "1920x1080").split("x").map(Number);
const gif = Boolean(args.gif);
/** Asıl çıktı: GIF kipinde uzantı .gif. */
const outOf = (o) => (gif ? o.replace(/\.mp4$/, ".gif") : o);
const fps = gif ? 25 : Number(args.fps || 24), sub = Math.max(1, Number(args.subframes || 1));
const out = resolve(args.out || "out/film.mp4");

const req = createRequire(resolve(process.cwd(), "package.json"));
const chrome = process.env.CHROME_PATH || ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(p => existsSync(p));
let browser, page, kind;
for (const name of ["puppeteer-core", "puppeteer", "playwright-core", "playwright"]) {
  try {
    const lib = req(name);
    if (name.startsWith("playwright")) {
      browser = await lib.chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
      page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
    } else {
      browser = await lib.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
      page = await browser.newPage(); await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    }
    kind = name; break;
  } catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; }
}
if (!page) { console.error("puppeteer(-core) ya da playwright(-core) yok: `npm i -D puppeteer-core`."); process.exit(1); }

const errors = [];
page.on("pageerror", e => errors.push(String(e.message || e)));
await page.goto(url, { waitUntil: "load", timeout: 120_000 });
await page.waitForFunction("window.READY === true && (typeof window.renderAt === 'function' || typeof window.render === 'function')", { timeout: 20_000 });
const { DUR, EV } = await page.evaluate(() => ({ DUR: window.DUR, EV: window.EV ?? [] }));
const from = Number(args.from ?? 0), to = Math.min(Number(args.to ?? DUR), DUR);
mkdirSync(dirname(out), { recursive: true });
// Uzantı ne olursa olsun değiştirilir: yalnız .mp4 değişseydi --out=x.gif'te JSON videonun yoluna yazılır, ffmpeg -y onu ezerdi.
if (args.events) writeFileSync(out.replace(/\.[^./\\]+$/, "") + ".events.json", JSON.stringify({ DUR, EV }, null, 2));

const blur = sub > 1 ? `tmix=frames=${sub}:weights='${Array(sub).fill(1).join(" ")}',fps=${fps}` : "";
const encode = gif
  ? ["-filter_complex", `[0:v]${blur ? blur + "," : ""}split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a`, "-loop", "0", outOf(out)]
  : [...(blur ? ["-vf", blur] : []), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", out];
const ff = spawn(process.env.FFMPEG || "ffmpeg", [
  // Girdi kodlayıcısı AÇIK (mjpeg): verilmezse ffmpeg borudan akışı tanıyamadı ve
  // "Output file does not contain any stream" ile düştü (11 Ekim, ffmpeg 6).
  "-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps * sub), "-i", "-", ...encode,
], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((ok, fail) => ff.on("close", c => (c === 0 ? ok() : fail(new Error(`ffmpeg ${c}`)))));

const total = Math.round((to - from) * fps * sub);
const started = Date.now();
for (let i = 0; i < total; i++) {
  const t = from + i / (fps * sub);
  await page.evaluate(tt => (window.renderAt ?? window.render)(tt), t);
  const buf = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  if (i % (fps * sub) === 0) process.stdout.write(`\r${(i / total * 100).toFixed(0)}% (${t.toFixed(1)}/${to} sn)`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(`\r${total} kare (${kind}) → ${outOf(out)} · ${((Date.now() - started) / 1000).toFixed(1)} sn`);
if (errors.length) { console.error(`sayfa hataları:\n  ${errors.slice(0, 10).join("\n  ")}`); process.exit(1); }
