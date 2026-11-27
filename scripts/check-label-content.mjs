#!/usr/bin/env node
/**
 * Erişilebilir ad / görünen metin uyuşmazlığı (WCAG 2.5.3) için statik kapı.
 *
 * `aria-label` taşıyan bir buton ya da bağlantının içinde yuvarlanan sayı
 * (`DigitRoll`, `SlotText`) olursa animasyon sırasında ara rakamlar görünen
 * metne karışır; axe `label-content-name-mismatch` der. Yerelde geçip CI'da
 * düşen bu test main'i üç kez kırmızıya düşürdü (mistakes.md #127).
 * Doğru kalıp: `aria-label` yok, ad içerikten (gizli metin + sayı `aria-hidden`).
 *
 * Kullanım: node scripts/check-label-content.mjs [dizin...]  (varsayılan: snippets/ui storybook/stories templates)
 * Bulgu varsa exit 1 ve dosya:satır.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ["snippets/ui", "storybook/stories", "templates"];
const SKIP = new Set(["node_modules", ".next", "dist", "storybook-static"]);

function* walk(dir) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (p.endsWith(".tsx")) yield p;
  }
}

const findings = [];
const open = /<(button|a|Link)\b[^>]*\baria-label=[^>]*>/g;
for (const root of roots) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    if (!/<(DigitRoll|SlotText)\b/.test(src)) continue;
    for (const m of src.matchAll(open)) {
      const close = src.indexOf(`</${m[1]}`, m.index + m[0].length);
      if (close < 0) continue;
      const body = src.slice(m.index + m[0].length, close);
      if (/<(DigitRoll|SlotText)\b/.test(body)) {
        findings.push(`${file}:${src.slice(0, m.index).split("\n").length}`);
      }
    }
  }
}

if (findings.length) {
  console.error("✖ aria-label'lı buton/bağlantı içinde yuvarlanan sayı (DigitRoll/SlotText):");
  for (const f of findings) console.error(`   ${f}`);
  console.error("  Düzeltme: aria-label'ı kaldır, adı içerikten kur (gizli metin + sayıyı aria-hidden sarmala).");
  process.exit(1);
}
console.log("✓ Erişilebilir ad ile görünen metin uyumlu (DigitRoll/SlotText kapısı)");
