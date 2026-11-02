import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * `@/` takma adını İÇE AKTARAN DOSYANIN yerine göre çözer.
 *
 * Storybook üç kaynağı aynı anda derler ve üçü de `@/` yazar:
 *   - `snippets/ui/*.tsx` → birbirini `@/components/ui/<ad>` ile, yardımcıları
 *     `@/lib/utils`, `@/lib/motion` ile ister (projeye kopyalanınca böyle).
 *   - `templates/<şablon>/**` → kendi kökünü ister (`@/components/sections/…`).
 *   - `storybook/**` hikâyeleri → snippet'leri ve landing şablonunu ister.
 * Tek bir `alias` bunlardan yalnızca birini doğru çözer. Kural:
 *   1. İçe aktaran bir şablonun içindeyse kök O ŞABLON.
 *   2. Değilse `@/components/ui/<ad>` önce `snippets/ui/<ad>`, yoksa landing
 *      şablonunun `components/ui/<ad>`ı (Button, Field, ThemeToggle…).
 *   3. Geri kalan her `@/…` landing şablonundan (`lib`, `hooks`, `app`…).
 * Büyük/küçük harf ayrıdır: `skeleton` snippet, `Skeleton` şablonun dosyası.
 */
const EXT = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"];

function firstExisting(base: string): string | null {
  for (const ext of EXT) {
    const file = base + ext;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

export function resolveAt(repoRoot: string): Plugin {
  const snippetsUi = path.join(repoRoot, "snippets/ui");
  const templates = path.join(repoRoot, "templates");
  const landing = path.join(templates, "landing");
  return {
    name: "dev-starter:resolve-at",
    enforce: "pre",
    resolveId(source, importer) {
      if (!source.startsWith("@/")) return null;
      const rest = source.slice(2);
      const from = importer ? path.normalize(importer.split("?")[0]) : "";
      if (from.startsWith(templates + path.sep)) {
        const tpl = from.slice(templates.length + 1).split(path.sep)[0];
        return firstExisting(path.join(templates, tpl, rest));
      }
      if (rest.startsWith("components/ui/")) {
        const name = rest.slice("components/ui/".length);
        return firstExisting(path.join(snippetsUi, name)) ?? firstExisting(path.join(landing, rest));
      }
      return firstExisting(path.join(landing, rest));
    },
  };
}
