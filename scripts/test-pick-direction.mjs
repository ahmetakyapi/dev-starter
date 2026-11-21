#!/usr/bin/env node
// pick-direction.mjs davranis testi: puanlama, son-5 dislamasi, kayit ayristirma.
// Kullanim: node scripts/test-pick-direction.mjs   (npm run verify:direction)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCatalog, parseLog, recentDirections, score } from "./pick-direction.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirs = parseCatalog(readFileSync(join(root, "knowledge/design-directions.md"), "utf8"));
let n = 0;
const t = (name, fn) => { fn(); n++; console.log(`  ✅ ${name}`); };

t("katalog en az 8 yon ve benzersiz kimlik tasir", () => {
  assert.ok(dirs.length >= 8);
  assert.equal(new Set(dirs.map((d) => d.id)).size, dirs.length);
});
t("oyun sektoru oyuncul-canli'yi one cikarir", () => {
  const best = dirs.map((d) => ({ id: d.id, ...score(d, { sektor: ["oyun"] }) })).sort((a, b) => b.total - a.total)[0];
  assert.equal(best.id, "oyuncul-canli");
});
t("enerji + yuksek yogunluk veri-yogun'u one cikarir", () => {
  const best = dirs.map((d) => ({ id: d.id, ...score(d, { sektor: ["enerji"], yogunluk: ["yuksek"], kitle: ["uzman"] }) })).sort((a, b) => b.total - a.total)[0];
  assert.equal(best.id, "veri-yogun");
});
t("kayit ayristirma: yorum satiri ve baslik sayilmaz", () => {
  const rows = parseLog("| Tarih | Proje | Yön | Palet | Hero | Kabuk | Not |\n|---|---|---|---|---|---|---|\n| 2026-01 | A | veri-yogun | s | h | k | n |\n<!--\n| 2026-02 | B | luks-minimal | s | h | k | n |\n-->");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].direction, "veri-yogun");
});
t("son 5 yon dislanir, '—' sayilmaz", () => {
  const mk = (d) => ({ direction: d });
  const rows = ["—", "a", "b", "c", "d", "e", "f"].map(mk);
  assert.deepEqual(recentDirections(rows), ["b", "c", "d", "e", "f"]);
});
console.log(`  ── ${n} pick-direction testi gecti`);
