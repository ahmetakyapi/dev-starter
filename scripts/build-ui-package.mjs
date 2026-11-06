#!/usr/bin/env node
/**
 * snippets/ui → packages/@ahmet/ui/src/kit — paketin bileşen kiti ÜRETİLİR.
 *
 * Tek kaynak `snippets/ui/*.tsx`. Paket onların kopyasını taşır ama elle
 * yazılmaz: bu betik her dosyanın içe aktarımlarına bakar, yalnız pakette
 * karşılığı olanlara dayanan bileşenleri alır ve yolları çevirir:
 *
 *   @/lib/utils            → ../utils        (paketin cn()'i, aynı twMerge kaydı)
 *   @/lib/motion           → ../variants     (EASE, DUR, SPRING aynı değerler)
 *   @/components/ui/<ad>   → ./<ad>          (kardeş kit dosyası)
 *
 * İzin verilen dış paketler: react, react-dom, motion/react, lucide-react.
 * `next/*`, `@base-ui/*`, şablonun kendi dosyaları (`@/components/ui/Button`,
 * `@/lib/theme`) ve onlara dayanan her snippet DIŞARIDA kalır: paket Next'e
 * ve headless kütüphaneye bağlanmaz. Dışarıda kalanlar raporlanır.
 *
 * Kullanım:
 *   node scripts/build-ui-package.mjs           # üret
 *   node scripts/build-ui-package.mjs --check   # bayat mı (CI: verify:ui-package)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "snippets/ui");
const OUT = path.join(root, "packages/@ahmet/ui/src/kit");
const CHECK = process.argv.includes("--check");

const ALLOWED_PACKAGES = new Set(["react", "react-dom", "motion/react", "lucide-react"]);
const HEADER = "// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/";

const files = readdirSync(SRC)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(/\.tsx$/, ""))
  .sort();

const sources = Object.fromEntries(files.map((name) => [name, readFileSync(path.join(SRC, `${name}.tsx`), "utf8")]));
const importsOf = (text) => [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

/** Sabit nokta: uygun kardeşe dayanan uygun dosya. */
const reason = {};
let eligible = new Set(files);
for (let changed = true; changed; ) {
  changed = false;
  for (const name of [...eligible]) {
    for (const spec of importsOf(sources[name])) {
      let bad = null;
      if (spec === "@/lib/utils" || spec === "@/lib/motion") continue;
      if (spec.startsWith("@/components/ui/")) {
        const dep = spec.slice("@/components/ui/".length);
        if (!eligible.has(dep)) bad = files.includes(dep) ? `${dep} (dışarıda)` : `${dep} (şablon dosyası)`;
      } else if (spec.startsWith("@/")) bad = spec;
      else if (!ALLOWED_PACKAGES.has(spec)) bad = spec;
      if (bad) {
        eligible.delete(name);
        reason[name] = bad;
        changed = true;
        break;
      }
    }
  }
}

const kit = [...eligible].sort();
const rewrite = (text) =>
  `${HEADER}\n${text
    .replace(/^["']use client["'];?\n\n?/m, "")
    .replace(/(["'])@\/lib\/utils\1/g, '"../utils"')
    .replace(/(["'])@\/lib\/motion\1/g, '"../variants"')
    .replace(/(["'])@\/components\/ui\/([\w-]+)\1/g, '"./$2"')}`;

const expected = new Map(kit.map((name) => [`${name}.tsx`, rewrite(sources[name])]));
expected.set(
  "index.ts",
  `${HEADER}\n// Bütün kit bileşenleri. Ana girişte (\`@ahmetakyapi/ui\`) 'use client' banner'ı altında.\n${kit
    .map((n) => `export * from "./${n}";`)
    .join("\n")}\n`,
);

if (CHECK) {
  const stale = [];
  for (const [file, body] of expected) {
    const p = path.join(OUT, file);
    if (!existsSync(p) || readFileSync(p, "utf8") !== body) stale.push(file);
  }
  const extra = existsSync(OUT) ? readdirSync(OUT).filter((f) => !expected.has(f)) : [];
  if (stale.length || extra.length) {
    console.error(`✗ packages/@ahmet/ui/src/kit bayat: ${[...stale, ...extra].join(", ")}`);
    console.error("  → node scripts/build-ui-package.mjs");
    process.exit(1);
  }
  console.log(`✓ kit güncel: ${kit.length} bileşen`);
  process.exit(0);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const [file, body] of expected) writeFileSync(path.join(OUT, file), body);
console.log(`✓ packages/@ahmet/ui/src/kit: ${kit.length} bileşen`);
const out = Object.entries(reason).sort();
console.log(`  dışarıda ${out.length}: ${out.map(([n, r]) => `${n} ← ${r}`).join(" · ")}`);
