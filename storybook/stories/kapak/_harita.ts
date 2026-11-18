/// <reference types="vite/client" />

/**
 * Katalog haritası ELLE YAZILMAZ. Bütün hikaye dosyaları derleme anında ham
 * metin olarak okunur; her dosyanın `meta` nesnesinden `title` ve `id`,
 * `export const X: Story` bildirimlerinden hikaye adresleri çıkarılır
 * (Storybook'un kuralıyla: `AllInOne` → `all-in-one`, `Last7Days` →
 * `last-7-days`). Kapaktaki sayılar ve bağlantılar böylece kenar çubuğuyla
 * aynı kaynaktan gelir: yeni bileşen eklenince harita kendiliğinden büyür,
 * bir sayfa taşınınca bağlantı kırılmaz.
 */

const RAW = import.meta.glob("../**/*.stories.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const words = (name: string) =>
  name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-zA-Z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-zA-Z])/g, "$1 $2");
const storyId = (metaId: string, exportName: string) => `${metaId}--${words(exportName).toLowerCase().split(/\s+/).join("-")}`;

export type CatalogComponent = { title: string; path: readonly string[]; first: string; stories: number };

export const COMPONENTS: readonly CatalogComponent[] = Object.values(RAW)
  .flatMap((text) => {
    const meta = text.match(/const meta[^=]*=\s*\{([\s\S]*?)\n\}/)?.[1];
    const title = meta?.match(/\btitle:\s*"([^"]+)"/)?.[1];
    const id = meta?.match(/\bid:\s*"([^"]+)"/)?.[1];
    const exports = [...text.matchAll(/^export const (\w+)\s*:\s*Story\b/gm)].map((m) => m[1]);
    if (!title || !id || !exports.length) return [];
    return [{ title, path: title.split("/"), first: storyId(id, exports[0]), stories: exports.length }];
  })
  .sort((a, b) => a.title.localeCompare(b.title, "tr-TR"));

/** Bir üst düzey bölümün (ya da alt grubun) bileşenleri. */
export const under = (...path: string[]) => COMPONENTS.filter((c) => path.every((p, i) => c.path[i] === p));

/** Kenar çubuğundaki sırayla ilk bileşenin ilk hikayesi (storySort sırası verilir). */
export function firstOf(path: readonly string[], order?: readonly string[]) {
  const list = under(...path);
  if (!order) return list[0]?.first;
  const depth = path.length;
  const sorted = [...list].sort((a, b) => {
    const ia = order.indexOf(a.path[depth]);
    const ib = order.indexOf(b.path[depth]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.title.localeCompare(b.title, "tr-TR");
  });
  return sorted[0]?.first;
}

export const STORIES = COMPONENTS.reduce((n, c) => n + c.stories, 0);
