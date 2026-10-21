/**
 * film-browser — film-sheet, film-video ve film-read'in ortak tarayıcı katmanı.
 * Komut değil, modül: üç betik aynı tarayıcıyı aynı bayraklarla açsın ki temas
 * sayfasında görülen kare videodaki kareyle aynı olsun.
 *
 * Fail-fast, READY tanısı ve yazılım WebGL uyarısı lemo-opuscar'ın
 * core/render/{browser,page}.mjs'inden uyarlandı (MIT, © 2026 LemoLab).
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** `--k=v` ve çıplak `--k` (true). Tekrar eden bayrağın sonuncusu kalır; çoklu bayrağı betik argv'den toplar. */
export function parseArgs(argv = process.argv.slice(2)) {
  const args = Object.fromEntries(argv.filter(a => a.startsWith("--")).map(a => {
    const [k, ...v] = a.slice(2).split("="); return [k, v.length ? v.join("=") : true];
  }));
  return { args, target: argv.find(a => !a.startsWith("--")) };
}

/** Sorgu dosya adına gömülmesin: pathToFileURL `?`i %3F yapar, film.html?counter yok bir dosyaya gider.
    Sözleşme kipinde http hedefi de ?capture alır; almazsa önizleme döngüsü renderAt(t) ile
    ekran görüntüsü arasında tuvali önizleme saatiyle yeniden çizer. */
export function filmUrl(target, capture) {
  const [p, q = ""] = target.split(/\?(.*)/s);
  const u = /^https?:/.test(target) ? new URL(target) : new URL(pathToFileURL(resolve(p)).href + (q ? "?" + q : ""));
  if (capture) u.searchParams.set("capture", "");
  return u.href;
}

/* sRGB profili zorlanmazsa tuval rengi makinenin ekran profiline göre çevrilir:
   aynı film iki makinede iki renk verir. Hinting kapalı değilse yazı genişliği
   piksel ızgarasına göre oynar ve --scale=2 kare 1×'in büyütülmüşü olmaz. */
export const LAUNCH_ARGS = ["--no-sandbox", "--force-color-profile=srgb", "--font-render-hinting=none", "--autoplay-policy=no-user-gesture-required"];

/** Tarayıcı: CHROME_PATH ya da bilinen yerler; kütüphane çalıştırılan projeden çözülür. */
export async function launch() {
  const req = createRequire(resolve(process.cwd(), "package.json"));
  const chrome = process.env.CHROME_PATH || [
    "/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find(p => existsSync(p));
  for (const name of ["puppeteer-core", "puppeteer", "playwright-core", "playwright"]) {
    let lib;
    try { lib = req(name); } catch (e) { if (e.code === "MODULE_NOT_FOUND") continue; throw e; }
    if (name.startsWith("playwright")) {
      const browser = await lib.chromium.launch({ executablePath: chrome, headless: true, args: LAUNCH_ARGS });
      return { browser, kind: "playwright", name };
    }
    const browser = await lib.launch({ executablePath: chrome, headless: true, args: LAUNCH_ARGS });
    return { browser, kind: "puppeteer", name };
  }
  throw new Error("puppeteer(-core) ya da playwright(-core) bulunamadı: projede `npm i -D puppeteer-core` (ya da playwright).");
}

export async function newPage({ browser, kind }, { w, h, dpr = 1, colorScheme, reducedMotion } = {}) {
  if (kind === "playwright") {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme, reducedMotion });
    return ctx.newPage();
  }
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  const feats = [];
  if (colorScheme) feats.push({ name: "prefers-color-scheme", value: colorScheme });
  if (reducedMotion) feats.push({ name: "prefers-reduced-motion", value: reducedMotion });
  if (feats.length) await page.emulateMediaFeatures(feats);
  return page;
}

/* Sayfanın varlık sebebi olan kaynaklar: biri gelmezse film yarım çizilir.
   Font, görsel, fetch 404'ü yalnız uyarıdır (sayfanın yedeği olabilir). */
const FATAL_TYPES = new Set(["script", "document"]);

/**
 * Sayfayı dinler. `fatal(msg)` verilirse JS hatası ve gelmeyen betik onu hemen
 * çağırır: bütün film çizilip sonda "sayfa hataları" demek, bozuk ama bitmiş
 * görünen bir MP4 bırakıyordu. Verilmezse hatalar `errors`a toplanır.
 */
export function watchPage(page, { fatal, label = "" } = {}) {
  const log = [], errors = [], requests = [];
  const note = (s) => { log.push(s); if (log.length > 10) log.shift(); };
  const bad = (s) => { note(s); if (fatal) fatal(label + s); else errors.push(s); };
  page.on("pageerror", e => bad(`sayfa hatası: ${String(e?.message || e).split("\n")[0]}`));
  page.on("console", m => {
    const t = m.text();
    // Kaynak hatası aşağıda URL'siyle yazılır; konsoldaki kopyası adres taşımaz.
    if (m.type() === "error" && !/^Failed to load resource/.test(t)) { note(`konsol: ${t.slice(0, 300)}`); if (!fatal) errors.push(t); }
  });
  page.on("request", r => requests.push(r.url()));
  page.on("requestfailed", r => {
    const type = r.resourceType(), why = r.failure()?.errorText;
    if (why === "net::ERR_ABORTED" || /favicon/.test(r.url())) return;
    if (FATAL_TYPES.has(type)) bad(`${type} gelmedi: ${r.url()} (${why})`);
    else note(`istek düştü: ${r.url()} (${why})`);
  });
  page.on("response", r => {
    if (r.status() < 400 || /favicon/.test(r.url())) return;
    const type = r.request().resourceType();
    if (FATAL_TYPES.has(type)) bad(`${type} ${r.status()}: ${r.url()}`);
    else note(`${r.status()} ${r.url()} (${type}; sayfanın yedeği varsa sorun değil)`);
  });
  return { log, errors, requests };
}

/** waitForFunction iki kütüphanede farklı imzalı: playwright'ta ikinci argüman sayfaya giden değer. */
export function waitFor(page, kind, expr, timeout) {
  return kind === "playwright" ? page.waitForFunction(expr, undefined, { timeout }) : page.waitForFunction(expr, { timeout });
}

export const READY_EXPR = "window.READY === true && (typeof window.renderAt === 'function' || typeof window.render === 'function')";

/** READY gelmezse yalnız "timeout" demek, hangi parçanın eksik olduğunu aratır: sayfanın durumunu da yaz. */
export async function waitReady(page, kind, watch, timeout = 20_000) {
  try { await waitFor(page, kind, READY_EXPR, timeout); }
  catch (e) {
    let state = null;
    try {
      state = await page.evaluate(() => ({
        READY: window.READY, render: typeof window.render, renderAt: typeof window.renderAt, DUR: window.DUR,
        fonts: document.fonts?.status, images: [...document.images].filter(i => !i.complete).map(i => i.src).slice(0, 5),
      }));
    } catch {}
    const lines = [`window.READY ${timeout / 1000} sn içinde gelmedi (${String(e.message).split("\n")[0]}).`];
    if (state) {
      lines.push(`  READY=${state.READY} · render=${state.render} · renderAt=${state.renderAt} · DUR=${state.DUR} · fontlar=${state.fonts}`);
      if (state.images.length) lines.push(`  inmemiş görseller: ${state.images.join(", ")}`);
      if (state.render !== "function" && state.renderAt !== "function") lines.push("  render(t) yok: <script> sona kadar koşuyor mu, bundle yüklendi mi?");
      else if (state.READY !== true) lines.push("  render var ama READY true değil: READY'yi fontlar ve görseller hazır olunca ver (document.fonts.ready).");
    }
    lines.push(watch?.log.length ? "  görülen sorunlar:\n    " + watch.log.join("\n    ") : "  konsolda hata yok.");
    throw new Error(lines.join("\n"));
  }
}

/** WebGL yazılımla (SwiftShader/llvmpipe) çiziliyorsa bir kez söyle: render yavaşlar, nedeni görünmez. */
let glWarned = false;
export async function warnSoftwareGL(page) {
  if (glWarned) return; glWarned = true;
  try {
    const r = await page.evaluate(() => {
      const c = document.createElement("canvas"), g = c.getContext("webgl2") || c.getContext("webgl"); if (!g) return null;
      const e = g.getExtension("WEBGL_debug_renderer_info"), name = e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "";
      g.getExtension("WEBGL_lose_context")?.loseContext(); return String(name);
    });
    if (r && /swiftshader|llvmpipe|software/i.test(r)) console.error(`not: WebGL yazılımla çiziliyor (${r.slice(0, 80)}). WebGL/three.js filmler yavaş olur; Canvas 2D ve DOM etkilenmez.`);
  } catch {}
}

/** Sözleşmenin ortak adı önce: renderAt CSS/WAAPI animasyonlarını da aynı ana dondurur. */
export const renderAt = (page, t) => page.evaluate(tt => (window.renderAt ?? window.render)(tt), t);
