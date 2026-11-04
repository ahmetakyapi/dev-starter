/**
 * `knowledge/references.md` → kart verisi. Sayfa arşivin KOPYASINI tutmaz:
 * markdown derleme anında `?raw` ile okunur, `## ` başlıkları kategori,
 * tablolar kart olur. Arşive satır eklenince sayfa kendiliğinden güncellenir.
 *
 * Ayrıştırıcı bilerek dar: yalnız bu dosyanın kullandığı biçim (başlık
 * satırı + `|---|` ayracı + satırlar; hücrede `[metin](adres)` ve `kod`).
 * Hücrede `|` geçmez (arşiv yazım kuralı).
 */

export type Inline = { kind: "text"; text: string } | { kind: "link"; text: string; href: string } | { kind: "code"; text: string };
export type Cell = { header: string; parts: Inline[]; plain: string };
export type RefCard = { id: string; cells: Cell[] };
export type RefSection = { id: string; title: string; intro: string; cards: RefCard[] };

const INLINE = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g;

export function inline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: "link", text: m[1], href: m[2] });
    else out.push({ kind: "code", text: m[3] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

const plainOf = (parts: Inline[]) => parts.map((p) => p.text).join("").trim();
const cellsOf = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export function parseReferences(source: string): { sections: RefSection[]; reviewed?: string } {
  const reviewed = /Son gözden geçirme:\s*([0-9-]+)/.exec(source)?.[1];
  const sections: RefSection[] = [];
  for (const block of source.split(/^## /m).slice(1)) {
    const lines = block.split("\n");
    const title = lines[0].replace(/^\d+\.\s*/, "").trim();
    const table = lines.filter((l) => l.trim().startsWith("|"));
    if (table.length < 3) continue;
    const headers = cellsOf(table[0]);
    const intro = lines
      .slice(1)
      .filter((l) => l.trim() && !l.trim().startsWith("|"))
      .join(" ")
      .trim();
    const cards = table.slice(2).map((row, i) => {
      const values = cellsOf(row);
      const cells = headers.map((header, k) => {
        const parts = inline(values[k] ?? "");
        return { header, parts, plain: plainOf(parts) };
      });
      return { id: `${sections.length}-${i}`, cells };
    });
    sections.push({ id: `s${sections.length}`, title, intro, cards });
  }
  return { sections, reviewed };
}
