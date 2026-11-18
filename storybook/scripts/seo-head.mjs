#!/usr/bin/env node
/**
 * Derleme sonrası: `storybook-static/index.html` başlığı. Storybook kabuğun
 * başlığını "<paket adı> - Storybook" diye basar; paylaşım önizlemesinde ve
 * sekmede "dev-starter · Görsel Katalog" görünsün. Gezinince Storybook
 * başlığı hikayeye göre kendisi günceller (sorun değil, ilk yük bu).
 */
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../storybook-static/index.html", import.meta.url);
const html = readFileSync(file, "utf8");
const next = html.replace(/<title>[^<]*<\/title>/, "<title>dev-starter · Görsel Katalog</title>");
if (next === html && !html.includes("dev-starter · Görsel Katalog")) {
  console.error("✗ storybook-static/index.html içinde <title> bulunamadı");
  process.exit(1);
}
writeFileSync(file, next);
console.log("✓ başlık: dev-starter · Görsel Katalog");
