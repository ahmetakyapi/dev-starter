#!/usr/bin/env node
/**
 * Paylaşım görseli (WhatsApp, X, LinkedIn, Slack önizlemesi): `public/og.png`
 * (1200 × 630), README kapağı `.github/readme/cover-{light,dark}.png`
 * (aynı kompozisyon, 1,5×) ve `public/apple-touch-icon.png` (180 × 180).
 *
 * Görsel UYDURULMAZ: Tanıtım sayfasındaki vitrin kolajının (gerçek
 * bileşenler, Signature paleti, açık tema) ekran görüntüsü alınır, solda
 * başlıkla birleştirilir. Kolaj değişince görseli yeniden üret:
 *
 *   npm run storybook   # başka terminalde, 6006
 *   npm run og          # ya da: node scripts/build-og.mjs --url http://localhost:6006
 *
 * token-ok-file: Storybook dışında, kendi başına çizilen statik HTML; token CSS yüklenmez, renkler Signature paletinin değerleri.
 * Playwright ister (Google Fonts için ağ). Çıktı depoya girer: yayında
 * `/og.png` mutlak adresle okunur (`.storybook/manager-head.html`).
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Playwright global kurulu (bulut oturumu) ya da projede: check-alignment.mjs ile aynı yol.
const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg("url", "http://localhost:6006");
const favicon = readFileSync(path.join(root, "public/favicon.svg"), "utf8");
const pkg = JSON.parse(readFileSync(path.join(root, "../packages/@ahmet/ui/package.json"), "utf8"));

const browser = await chromium.launch();

/** Kolaj: gerçek sayfadan, 2× yoğunlukta, istenen temada. */
async function capture(theme) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(`${base}/iframe.html?id=cover--exhibit&viewMode=story&globals=theme:${theme};palette:signature`, { waitUntil: "networkidle" });
  await page.waitForTimeout(6000); // giriş hareketi ve play bitsin
  // Kolaj ilk ekranın altında: grafik görünüme girince çizilir. Önce kaydır, çizim bitsin, sonra çek.
  const shot = page.locator("section[aria-labelledby=kapak-baslik] > div.mt-14").first();
  await shot.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const collage = await shot.screenshot({ type: "png" });
  const h1 = await page.locator("#kapak-baslik").innerText();
  // Sayılar künye hapının `data-og-counts`ından (hap artık sürüm + yığın yazıyor).
  const counts = await page.locator("[data-og-counts]").first().getAttribute("data-og-counts");
  await page.close();
  return { collage, h1, counts };
}

const THEME = {
  light: { bg: "#ffffff", ink: "#0a0a0a", body: "#404040", muted: "#6b6b6b", accent: "#0c69b1", line: "rgb(13 116 196 / .07)", glow: "rgb(53 160 240 / .22)",
    display: "linear-gradient(112deg, #0a2140 0%, #0e4a8f 44%, #1272c9 76%, #2493dd 100%)", shadow: "0 30px 60px -20px rgb(10 33 64 / .35), 0 0 0 1px rgb(0 0 0 / .06)" },
  dark: { bg: "#0b0b0c", ink: "#f5f5f5", body: "#c4c4c4", muted: "#8a8a8a", accent: "#35b8ff", line: "rgb(53 184 255 / .08)", glow: "rgb(53 184 255 / .18)",
    display: "linear-gradient(112deg, #7fd2ff 0%, #35b8ff 50%, #1f86e0 100%)", shadow: "0 30px 60px -20px rgb(0 0 0 / .7), 0 0 0 1px rgb(255 255 255 / .08)" },
};

/** Solda künye + başlık, sağda kolaj taşarak (kırpılmış ürün fotoğrafı). Ölçüler 1200 × 630 tuvalinde. */
async function compose({ theme, shot, out, scale = 1 }) {
  const t = THEME[theme];
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: scale });
  await og.setContent(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Schibsted+Grotesk:wght@700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0 }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: Inter, sans-serif; color: ${t.ink}; background: ${t.bg}; position: relative }
  .grid { position: absolute; inset: 0; background-image: linear-gradient(${t.line} 1px, transparent 1px), linear-gradient(90deg, ${t.line} 1px, transparent 1px);
    background-size: 44px 44px; -webkit-mask: radial-gradient(ellipse 70% 80% at 22% 40%, #000 30%, transparent 80%) }
  .glow { position: absolute; left: -120px; top: -160px; width: 720px; height: 620px; border-radius: 50%; background: radial-gradient(closest-side, ${t.glow}, transparent) }
  .copy { position: absolute; left: 72px; top: 76px; width: 470px }
  .brand { display: flex; align-items: center; gap: 12px; font: 700 22px/1 "Schibsted Grotesk", sans-serif; letter-spacing: -.01em }
  .brand svg { width: 40px; height: 40px; border-radius: 11px; box-shadow: 0 6px 16px -6px rgb(11 63 134 / .5) }
  .brand small { display: block; margin-top: 5px; font: 500 15px/1 Inter, sans-serif; color: ${t.muted}; letter-spacing: 0 }
  h1 { margin-top: 64px; font: 800 82px/0.94 "Schibsted Grotesk", sans-serif; letter-spacing: -.05em }
  h1 span { display: block; background: ${t.display}; -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: .06em }
  p { margin-top: 28px; font: 500 21px/1.45 Inter, sans-serif; color: ${t.body}; max-width: 30ch }
  .meta { position: absolute; left: 72px; bottom: 60px; font: 500 16px/1 Inter, sans-serif; color: ${t.muted} }
  .meta b { color: ${t.accent}; font-weight: 600 }
  .shot { position: absolute; left: 600px; top: 92px; width: 700px; border-radius: 26px; overflow: hidden; box-shadow: ${t.shadow} }
  .shot img { display: block; width: 100% }
</style></head><body>
<div class="grid"></div><div class="glow"></div>
<div class="copy">
  <div class="brand">${favicon}<div>dev-starter<small>Görsel Katalog · v${pkg.version}</small></div></div>
  <h1>${shot.h1.replace(/,\s*/, ",<span>")}</span></h1>
  <p>Next 16 projeleri için kopyalanabilir bileşenler, desenler ve ekranlar.</p>
</div>
<div class="meta">${shot.counts.replace(/(\d[\d.]*)/g, "<b>$1</b>")}</div>
<div class="shot"><img src="data:image/png;base64,${shot.collage.toString("base64")}"></div>
</body></html>`, { waitUntil: "networkidle" });
  await og.waitForTimeout(500);
  await og.screenshot({ path: out, type: "png" });
  await og.close();
}

try {
  const light = await capture("light");
  // Paylaşım görseli: açık tema, 1×.
  await compose({ theme: "light", shot: light, out: path.join(root, "public/og.png") });
  // README kapağı: açık ve koyu, 1,5× (GitHub README'de 888 px'e kadar keskin).
  await compose({ theme: "light", shot: light, out: path.join(root, "../.github/readme/cover-light.png"), scale: 1.5 });
  await compose({ theme: "dark", shot: await capture("dark"), out: path.join(root, "../.github/readme/cover-dark.png"), scale: 1.5 });

  // 3. Ana ekrana ekleme ikonu (iOS): favicon'un büyük hali, beyaz kenarsız.
  const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await icon.setContent(`<html><body style="margin:0">${favicon.replace("<svg ", '<svg width="180" height="180" ')}</body></html>`);
  await icon.screenshot({ path: path.join(root, "public/apple-touch-icon.png"), type: "png", omitBackground: true });
  console.log("✓ public/og.png (1200×630), .github/readme/cover-{light,dark}.png, public/apple-touch-icon.png (180×180)");
} finally {
  await browser.close();
}
