#!/usr/bin/env node
/**
 * Hizalama denetimi (rules/design-tokens.md → "Hizalama Kuralı").
 *
 * Alt alta tekrar eden satırlarda (li, tr, role=row) küçük etiketler (rozet,
 * hap, çip, durum) AYNI SÜTUNDA mı? Aynı yapısal konumdaki etiketlerin hem
 * sol hem sağ kenarı 3 pikselden fazla oynuyorsa hizasız sayılır. Serbest
 * etiket listesinde (aynı biçimde çipler art arda: "Satış, Numune") yalnız
 * ilk çip denetlenir; sonrakiler metin gibi akar.
 *
 * Çalışan bir Storybook'a karşı koşar (yerel `npm run dev` ya da yayın):
 *   node scripts/check-alignment.mjs [--url http://localhost:6006] [--widths 1440,1024,390] [--filter demo-app--]
 * Playwright gerekir (bulut oturumunda kurulu; yerelde `npx playwright`).
 * Sayfa çizilmezse (h1 yoksa ya da hata ekranı) HATA sayılır: sessizce
 * "hizalı" demesin. Çıkış kodu: bulgu ya da hata varsa 1.
 */
/* global process, fetch, console, document, getComputedStyle */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg("url", "http://localhost:6006").replace(/\/$/, "");
const widths = arg("widths", "1440,1024,390").split(",").map(Number);
const filter = arg("filter", "demo-app--");

const index = await (await fetch(`${base}/index.json`)).json();
const ids = Object.values(index.entries)
  .filter((e) => e.type === "story" && e.id.startsWith(filter) && !/landing|signed-out|sample-account|loading/.test(e.id))
  .map((e) => e.id);

const browser = await chromium.launch();
let total = 0;
for (const width of widths) {
  const p = await browser.newPage({ viewport: { width, height: 1000 } });
  for (const fullId of ids) {
    const id = fullId;
    await p.goto(`${base}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "networkidle" });
    await p.waitForTimeout(6500);
      const rendered = await p.evaluate(() => Boolean(document.querySelector('#storybook-root h1')) && !/Failed to fetch|failed to render/i.test(document.body.innerText));
      if (!rendered) { console.log(`${id}: HATA — sayfa çizilmedi`); total += 1; continue; }
      const found = await p.evaluate(() => {
        const isPill = (el) => {
          const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
          if (!r.width || r.height < 14 || r.height > 30 || r.width > 160) return false;
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          const bg = cs.backgroundColor; const hasBg = bg && !/rgba?\(0, 0, 0, 0\)|transparent/.test(bg);
          const ring = cs.boxShadow && cs.boxShadow !== 'none'; const border = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopColor !== 'rgba(0, 0, 0, 0)';
          if (!(hasBg || ring || border)) return false;
          if (parseFloat(cs.borderTopLeftRadius) < 4) return false;
          const t = el.textContent.trim(); if (!t || t.length > 24) return false;
          if (el.matches('button, a, input, [role=button], [role=tab], [role=radio], [role=checkbox]')) return false;
          if (el.closest('[aria-hidden=true]')) return false;
          if ([...el.children].some((c) => isPillQuick(c))) return false;
          // Serbest etiket listesi: önceki görünür kardeş aynı biçimde bir etiketse (aynı yükseklik ve köşe) bu çip akışın devamı; denetlenmez.
          let prev = el.previousElementSibling;
          while (prev && (prev.getBoundingClientRect().width < 2)) prev = prev.previousElementSibling;
          if (prev && isPillQuick(prev)) {
            const a = prev.getBoundingClientRect(), b2 = el.getBoundingClientRect();
            if (Math.abs(a.height - b2.height) < 1 && getComputedStyle(prev).borderTopLeftRadius === cs.borderTopLeftRadius) return false;
          }
          return true;
        };
        const isPillQuick = (c) => { const r = c.getBoundingClientRect(); const cs = getComputedStyle(c); return r.height >= 14 && r.height <= 30 && parseFloat(cs.borderTopLeftRadius) >= 4 && !/rgba?\(0, 0, 0, 0\)/.test(cs.backgroundColor); };
        const pills = [...document.querySelectorAll('#storybook-root span, #storybook-root p, #storybook-root div')].filter(isPill);
        const groups = new Map();
        for (const el of pills) {
          const row = el.closest('li, tr, [role=row]');
          if (!row || !row.parentElement) continue;
          const rr = row.getBoundingClientRect(); if (!rr.width) continue;
          // Sütun anahtarı: satırdan etikete giden yapısal yol (tabloda hücre sırası, listede iç konum).
          const path = []; for (let n = el; n && n !== row; n = n.parentElement) path.push([...n.parentElement.children].indexOf(n));
          const idx = path.join('/');
          const key = row.parentElement; if (!groups.has(key)) groups.set(key, new Map());
          const m = groups.get(key); if (!m.has(idx)) m.set(idx, []);
          m.get(idx).push({ el, row, r: el.getBoundingClientRect() });
        }
        const out = [];
        for (const [list, m] of groups) for (const items of m.values()) {
          const rows = new Set(items.map((i) => i.row)); if (rows.size < 2) continue;
          // yalnız alt alta duranlar (aynı sütun bölgesi): satırlar dikey dizili
          const tops = items.map((i) => i.row.getBoundingClientRect().top); if (new Set(tops.map(Math.round)).size < 2) continue;
          const L = items.map((i) => i.r.left), R = items.map((i) => i.r.right);
          const spread = (a) => Math.max(...a) - Math.min(...a);
          if (spread(L) > 3 && spread(R) > 3) out.push({ list: (list.getAttribute('aria-label') || list.tagName.toLowerCase() + '.' + (list.className || '').toString().split(' ').slice(0, 3).join('.')).slice(0, 60), sample: items.slice(0, 3).map((i) => i.el.textContent.trim()).join(' | '), dx: Math.round(spread(L)) });
        }
        return out;
      });
    total += found.length;
    if (found.length) console.log(`${width}px ${id}:`);
    for (const f of found) console.log(`   ✗ [${f.list}] ${f.sample}  (sol kenar farkı ${f.dx}px)`);
  }
  await p.close();
}
await browser.close();
console.log(total ? `✗ ${total} hizalama sorunu` : `✓ ${ids.length} sayfa × ${widths.length} genişlik: alt alta satırlar hizalı`);
process.exit(total ? 1 : 0);
