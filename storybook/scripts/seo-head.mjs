#!/usr/bin/env node
/**
 * Derleme sonrası: `storybook-static/index.html` başlığı. Storybook kabuğun
 * başlığını "<paket adı> - Storybook" diye basar; paylaşım önizlemesinde ve
 * sekmede "Dev Starter - Görsel Katalog" görünsün. Gezinince Storybook
 * başlığı hikayeye göre kendisi günceller (sorun değil, ilk yük bu).
 */
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../storybook-static/index.html", import.meta.url);
const html = readFileSync(file, "utf8");
const next = html.replace(/<title>[^<]*<\/title>/, "<title>Dev Starter - Görsel Katalog</title>");
if (next === html && !html.includes("Dev Starter - Görsel Katalog")) {
  console.error("✗ storybook-static/index.html içinde <title> bulunamadı");
  process.exit(1);
}

/* Okunur adresler (.storybook/pretty-url.js): <head>'in EN BAŞINA, Storybook'un betiklerinden
   önce. `<base href="/">`: /portal/customers gibi iç adreste ./sb-manager/… göreli dosyaları
   kökten yüklensin. Açılış haritası: her grubun açılış kimliği (belge varsa belge, yoksa ilk hikaye). */
const entries = JSON.parse(readFileSync(new URL("../storybook-static/index.json", import.meta.url), "utf8")).entries;
const landing = {};
for (const [id, entry] of Object.entries(entries)) {
  const group = id.split("--")[0];
  if (!(group in landing) || (entry.type === "docs" && !landing[group].endsWith("--docs"))) landing[group] = id;
}
const pretty = readFileSync(new URL("../.storybook/pretty-url.js", import.meta.url), "utf8");
const headStart = `<base href="/" />\n<script>window.__SB_LANDING__=${JSON.stringify(landing)};\n${pretty}</script>\n`;
const withUrls = next.includes("window.__SB_LANDING__") ? next : next.replace(/<head>/i, (h) => `${h}\n${headStart}`);
if (!withUrls.includes("window.__SB_LANDING__")) {
  console.error("✗ storybook-static/index.html içinde <head> bulunamadı (okunur adresler gömülemedi)");
  process.exit(1);
}
writeFileSync(file, withUrls);
console.log("✓ başlık: Dev Starter - Görsel Katalog");
console.log(`✓ okunur adresler: ${Object.keys(landing).length} grup`);
