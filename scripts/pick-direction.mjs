#!/usr/bin/env node
// Tasarim yonu onerici. Katalog (knowledge/design-directions.md) ve kayit
// (knowledge/direction-log.md) dosyalarini okur, son 5 kayittaki yonu disarida
// birakip ilk 3 adayi puanlar. Etkilesimsizdir: cevaplar bayrakla verilir.
//
// Kullanim:
//   node scripts/pick-direction.mjs --list [--json]
//   node scripts/pick-direction.mjs --sector enerji --audience kurumsal \
//        --density yuksek --tone ciddi --theme acik --kind uygulama [--json]
//   node scripts/pick-direction.mjs --check          # katalog <-> kayit tutarliligi
//   node scripts/pick-direction.mjs --sector oyun --include-recent   # dislamayi kapat
//
// Bayraklar (hepsi istege bagli, virgulle birden cok deger): --sector --audience
// --density --tone --theme --kind. Agirlik: sektor 3, kitle/yogunluk/ton 2,
// tema/tur 1.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "knowledge/design-directions.md");
const LOG = join(ROOT, "knowledge/direction-log.md");
const RECENT = 5;
const WEIGHTS = { sektor: 3, kitle: 2, yogunluk: 2, ton: 2, tema: 1, tur: 1 };
const FLAG_TO_KEY = { sector: "sektor", audience: "kitle", density: "yogunluk", tone: "ton", theme: "tema", kind: "tur" };

const fold = (s) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").trim();

export function parseCatalog(text) {
  const out = [];
  const parts = text.split(/^### `/m).slice(1);
  for (const part of parts) {
    const head = part.match(/^([a-z-]+)` — (.+)$/m);
    if (!head) continue;
    const field = (name) => {
      const m = part.match(new RegExp(`^- \\*\\*${name}:\\*\\* (.+)$`, "m"));
      return m ? m[1].trim() : "";
    };
    const tags = {};
    for (const seg of field("Etiket").split("·")) {
      const [k, v] = seg.split("=").map((x) => x.trim());
      if (k && v) tags[k] = v.split(",").map(fold);
    }
    out.push({
      id: head[1],
      name: head[2].trim(),
      tags,
      when: field("Ne zaman"),
      palette: field("Palet"),
      font: field("Yazı"),
      shape: field("Biçim"),
      hero: field("Hero"),
      shell: field("Kabuk"),
      card: field("Kart"),
      popup: field("Popup"),
      chart: field("Grafik"),
      empty: field("Boş Durum"),
      motion: field("Hareket"),
      ban: field("Yasak"),
    });
  }
  return out;
}

export function parseLog(text) {
  const rows = [];
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  for (const line of body.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 7 || cells[0] === "Tarih" || /^-+$/.test(cells[0])) continue;
    rows.push({ date: cells[0], project: cells[1], direction: cells[2].replace(/^~/, ""), palette: cells[3], hero: cells[4], shell: cells[5], note: cells[6] });
  }
  return rows;
}

export function recentDirections(rows, n = RECENT) {
  return rows.filter((r) => r.direction && r.direction !== "—").slice(-n).map((r) => r.direction);
}

export function score(dir, answers) {
  let total = 0;
  const why = [];
  for (const [key, values] of Object.entries(answers)) {
    const tag = dir.tags[key] ?? [];
    const hit = values.filter((v) => tag.includes(v));
    if (hit.length) {
      total += WEIGHTS[key] * hit.length;
      why.push(`${key}: ${hit.join("/")}`);
    }
  }
  return { total, why };
}

function parseArgs(argv) {
  const opts = { answers: {}, list: false, json: false, check: false, includeRecent: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") opts.list = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--check") opts.check = true;
    else if (a === "--include-recent") opts.includeRecent = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (a.startsWith("--") && FLAG_TO_KEY[a.slice(2)]) {
      const v = argv[++i];
      if (!v) throw new Error(`${a} icin deger gerekli`);
      opts.answers[FLAG_TO_KEY[a.slice(2)]] = v.split(",").map(fold);
    } else throw new Error(`Bilinmeyen bayrak: ${a}`);
  }
  return opts;
}

function check(dirs, rows) {
  const problems = [];
  const ids = new Set(dirs.map((d) => d.id));
  if (dirs.length < 8) problems.push(`katalogta ${dirs.length} yon var (en az 8)`);
  for (const d of dirs) {
    for (const f of ["when", "palette", "font", "shape", "hero", "shell", "card", "popup", "chart", "empty", "motion", "ban"]) {
      if (!d[f]) problems.push(`${d.id}: '${f}' alani bos`);
    }
    for (const k of Object.keys(WEIGHTS)) if (!d.tags[k]) problems.push(`${d.id}: Etiket '${k}' eksik`);
  }
  for (const r of rows) {
    if (r.direction !== "—" && !ids.has(r.direction)) problems.push(`kayit '${r.project}': bilinmeyen yon '${r.direction}'`);
  }
  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(2);
  }
  if (opts.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 16).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
    process.exit(0);
  }
  const dirs = parseCatalog(readFileSync(CATALOG, "utf8"));
  const rows = parseLog(readFileSync(LOG, "utf8"));
  if (opts.check) {
    const problems = check(dirs, rows);
    if (problems.length) {
      problems.forEach((p) => console.error(`❌ ${p}`));
      process.exit(1);
    }
    console.log(`✅ ${dirs.length} yon, ${rows.length} kayit tutarli`);
    process.exit(0);
  }
  const recent = recentDirections(rows);
  if (opts.list) {
    if (opts.json) console.log(JSON.stringify({ directions: dirs.map(({ id, name, tags }) => ({ id, name, tags })), recent }, null, 2));
    else {
      for (const d of dirs) console.log(`${d.id.padEnd(18)} ${d.name}${recent.includes(d.id) ? "   (son 5 projede kullanildi)" : ""}`);
    }
    process.exit(0);
  }
  if (!Object.keys(opts.answers).length) {
    console.error("❌ En az bir cevap ver (--sector, --audience, --density, --tone, --theme, --kind) ya da --list.");
    process.exit(2);
  }
  const scored = dirs
    .map((d) => ({ d, ...score(d, opts.answers), recent: recent.includes(d.id) }))
    .sort((a, b) => b.total - a.total || a.d.id.localeCompare(b.d.id));
  const pool = opts.includeRecent ? scored : scored.filter((s) => !s.recent);
  const picks = pool.slice(0, 3);
  const excluded = scored.filter((s) => s.recent && s.total > 0 && !picks.includes(s));
  if (opts.json) {
    console.log(JSON.stringify({
      answers: opts.answers,
      recent,
      candidates: picks.map(({ d, total, why }) => ({ id: d.id, name: d.name, score: total, why, palette: d.palette, font: d.font, hero: d.hero, shell: d.shell, card: d.card, popup: d.popup, motion: d.motion, ban: d.ban })),
      excluded: excluded.map(({ d, total }) => ({ id: d.id, score: total })),
    }, null, 2));
  } else {
    console.log(`Son ${RECENT} kayittaki yonler (disarida): ${recent.join(", ") || "—"}\n`);
    picks.forEach(({ d, total, why }, i) => {
      console.log(`${i + 1}. ${d.name} (${d.id}) — puan ${total}${why.length ? ` [${why.join("; ")}]` : ""}`);
      console.log(`   Hero:  ${d.hero}\n   Kabuk: ${d.shell}\n   Kart:  ${d.card}\n   Popup: ${d.popup}\n   Yasak: ${d.ban}\n`);
    });
    if (excluded.length) console.log(`Not: ${excluded.map((e) => `${e.d.id} (${e.total})`).join(", ")} son 5 projede kullanildigi icin elendi; ayni yone donmek icin yazili gerekce gerekir.`);
  }
}
