#!/usr/bin/env node
/**
 * film-read — ekrandaki her yazı okunacak kadar duruyor mu?
 *
 * Kural (tek kaynak: reference/yonetmenlik.md §2): bir yazı ekranda en az
 *   harf ÷ 15 + 1,5 sn
 * kalır. Harf = boşluk dışındaki karakterler. Daktilo yazısı ilk karesinden
 * sayılır ama süresi TAM metnin uzunluğundan hesaplanır: yazılırken de okunuyor,
 * yine de son harf ekrana gelip oturmalı.
 *
 *   node film-read.mjs film.html [--size=1920x1080] [--step=0.0417] [--samples=7]
 *
 * Sözleşme (reference/video-uretimi.md): window.TEXTS iki biçimde gelir.
 *   Dizi:   [{ id, text, from, to, box? | sel? }]  — from/to saniye; box (t) => [x0, y0, x1, y1]
 *           ya da sabit [x0, y0, x1, y1], sel bir CSS seçicisi. Kutu varsa yazının
 *           ömrü boyunca --samples anda ölçülür: hiç tam kadrajda değilse ihlal.
 *   İşlev:  (t) => [{ id, text, x0, y0, x1, y1 }]  — o an ekranda olan yazılar.
 *           Süre, yazının ilk TAM kadraja girdiği kareden kesintisiz kaldığı süredir.
 *           Aynı id'de metin uzuyorsa (daktilo) aynı yazı sayılır.
 *
 * Çıkış: 0 hepsi yeterli · 1 ihlal var · 2 denetlenmedi (TEXTS yok ya da hiç yazı
 * dönmedi). 2 geçti demek değildir.
 *
 * lemo-opuscar'ın core/render/readcheck.mjs'inden uyarlandı (MIT, © 2026 LemoLab).
 */
import { filmUrl, launch, newPage, parseArgs, waitReady, watchPage } from "./film-browser.mjs";

/** Okuma hızı ve oturma payı: yonetmenlik.md §2 ile aynı sayılar; biri değişirse öteki de. */
const LETTERS_PER_SEC = 15, SETTLE_SEC = 1.5;

const { args, target } = parseArgs();
if (!target) { console.error("Kullanım: film-read.mjs <html|url> [--size=1920x1080] [--step=0.0417] [--samples=7]"); process.exit(2); }
const [W, H] = String(args.size || "1920x1080").split("x").map(Number);
const STEP = Number(args.step || 1 / 24), SAMPLES = Math.max(2, Math.round(Number(args.samples || 7)));
if (!(STEP > 0 && W > 0 && H > 0)) { console.error("--step ve --size pozitif olmalı."); process.exit(2); }

const letters = (text) => [...String(text)].filter(c => !/\s/.test(c)).length;
const need = (text) => letters(text) / LETTERS_PER_SEC + SETTLE_SEC;

const env = await launch();
const page = await newPage(env, { w: W, h: H });
const watch = watchPage(page);
await page.goto(filmUrl(target, true), { waitUntil: "load", timeout: 120_000 });
try { await waitReady(page, env.kind, watch); }
catch (e) { console.error(String(e.message)); await env.browser.close(); process.exit(2); }

const res = await page.evaluate(({ STEP, SAMPLES }) => {
  const draw = (t) => (window.renderAt ?? window.render)(t);
  const DUR = window.DUR, W = innerWidth, H = innerHeight;
  if (!window.TEXTS) return { missing: "window.TEXTS yok" };
  if (!(DUR > 0)) return { missing: `window.DUR pozitif değil (${DUR})` };
  const rect = (b) => Array.isArray(b) ? b : b && typeof b === "object" ? [b.x0, b.y0, b.x1, b.y1] : null;
  const inside = (r) => r[0] >= 0 && r[1] >= 0 && r[2] <= W && r[3] <= H;

  if (Array.isArray(window.TEXTS)) {
    return { kind: "dizi", items: window.TEXTS.map((x) => {
      const from = Math.max(0, Number(x.from)), to = Math.min(DUR, Number(x.to));
      const boxAt = (t) => {
        if (typeof x.box === "function") return rect(x.box(t));
        if (x.box) return rect(x.box);
        if (x.sel) { const el = document.querySelector(x.sel); if (!el) return [-1, -1, -1, -1]; const r = el.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }
        return x.x0 !== undefined ? rect(x) : null;
      };
      const samples = [];
      if ((x.box || x.sel || x.x0 !== undefined) && to > from) {
        // Uçlar dahil, son örnek "to"dan bir kare önce: to anında yazı artık ekranda değil.
        for (let k = 0; k < SAMPLES; k++) {
          const t = from + (Math.max(from, to - STEP) - from) * (k / (SAMPLES - 1));
          draw(t); const r = boxAt(t);
          samples.push({ t, ok: r ? inside(r) : null });
        }
      }
      return { id: String(x.id ?? x.text), text: String(x.text), from, to, run: Math.max(0, to - from), samples };
    }) };
  }
  if (typeof window.TEXTS !== "function") return { missing: "window.TEXTS ne dizi ne işlev" };

  const open = {}, segs = [], everIn = new Set(), out = {};
  for (let i = 0, t = 0; t <= DUR + 1e-9; t = ++i * STEP) {
    draw(t);
    const seenNow = new Set();
    for (const b of window.TEXTS(t) || []) {
      const id = String(b.id ?? b.text), text = String(b.text);
      if (!inside(rect(b))) { out[id] ??= { id, text, t0: t }; continue; }
      everIn.add(id);
      let s = open[id];
      // Daktilo: metin aynı id'de uzuyor ya da kısalıyorsa aynı yazı; başka metin yeni yazıdır.
      if (s && !s.done && (text.startsWith(s.text) || s.text.startsWith(text))) { if (text.length > s.text.length) s.text = text; }
      else { s = open[id] = { id, text, t0: t, run: 0, done: false }; segs.push(s); }
      s.run = Math.min(t + STEP, DUR) - s.t0;
      seenNow.add(id);
    }
    // Yalnız ilk kesintisiz görünüş sayılır: çıkıp geri gelen yazı yeniden okunur.
    for (const id in open) if (!seenNow.has(id)) open[id].done = true;
  }
  return { kind: "işlev", items: segs.map(s => ({ id: s.id, text: s.text, from: s.t0, to: s.t0 + s.run, run: s.run, samples: [] })),
    never: Object.values(out).filter(o => !everIn.has(o.id)) };
}, { STEP, SAMPLES });
await env.browser.close();

if (res.missing || (!res.items.length && !res.never?.length)) {
  console.error(`film-read: DENETLENMEDİ — ${res.missing || "window.TEXTS bütün film boyunca hiç yazı döndürmedi"}. ` +
    "Sözleşme: reference/video-uretimi.md § TEXTS. Bu geçti demek değil.");
  process.exit(2);
}

const short = (s) => JSON.stringify(s.length > 28 ? s.slice(0, 27) + "…" : s);
let bad = 0;
for (const x of res.items) {
  const n = need(x.text), enough = x.run >= n - 1e-6;
  const off = x.samples.filter(s => s.ok === false);
  const never = x.samples.length > 0 && off.length === x.samples.length;
  if (!enough || never) bad++;
  const tag = never ? "GÖRÜNMÜYOR" : enough ? "TAMAM" : "KISA";
  console.log(`${tag.padEnd(10)} ${x.id.padEnd(16)} ${x.from.toFixed(2)}–${x.to.toFixed(2)} sn  ${String(letters(x.text)).padStart(3)} harf  gerek ${n.toFixed(2)} sn  var ${x.run.toFixed(2)} sn  ${short(x.text)}`);
  if (never) console.log(`           hiçbir örnekte tam kadrajda değil (${x.samples.length} örnek): kutu kadraj dışına taşıyor.`);
  else if (off.length) console.log(`           uyarı: ${off.map(s => s.t.toFixed(2)).join(", ")} sn'de kısmen kadraj dışında.`);
}
for (const x of res.never ?? []) {
  bad++;
  console.log(`${"GÖRÜNMÜYOR".padEnd(10)} ${x.id.padEnd(16)} ${x.t0.toFixed(2)} sn'den  hiç tam kadraja girmedi: kutu kadraj dışına taşıyor  ${short(x.text)}`);
}
console.log(`${res.items.length + (res.never?.length ?? 0)} yazı (${res.kind} biçimi) · kural harf ÷ ${LETTERS_PER_SEC} + ${SETTLE_SEC} sn · ${bad ? `${bad} ihlal` : "hepsi yeterli"}`);
if (watch.errors.length) console.error(`sayfa hataları (${watch.errors.length}):\n  ${watch.errors.slice(0, 5).join("\n  ")}`);
process.exit(bad ? 1 : 0);
