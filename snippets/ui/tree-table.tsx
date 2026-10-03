"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Açılır satırlı tablo: WAI-ARIA "treegrid" (gelir tablosu → kalemler,
 * bütçe → alt kalemler, portföy → pozisyonlar). Satırlar bir ağaç, sütunlar
 * bir tablo.
 *
 * ROLLER: `<table role="treegrid">`, her `<tr>` aria-level, aria-setsize,
 * aria-posinset ve çocuklu satırda aria-expanded taşır. Kapalı satırın
 * çocukları DOM'da yok; ekran okuyucu yalnızca görüneni sayar.
 *
 * SATIR ODAĞI: odak hücrede değil SATIRDA gezer (APG'nin satır odaklı
 * treegrid biçimi). Hücreleri tek tek gezmek, içinde düğme olmayan bir
 * okuma tablosunda ok tuşuna dört kat fazla bastırır. Tablo Tab sırasına
 * tek durak olarak girer.
 *
 * KLAVYE HARİTASI:
 *   ↓ / ↑        sonraki / önceki görünen satır
 *   →            kapalıysa aç; açıksa ilk alt satıra git
 *   ←            açıksa kapat; kapalıysa üst satıra git
 *   Home / End   ilk / son satır
 *   Enter        aç/kapa
 *
 * Hücreler HAZIR İÇERİK (`cells: { gelir: "1.240 ₺" }`): fonksiyon değil
 * ReactNode, yani satırlar bir sunucu bileşeninden olduğu gibi geçer. Sayı
 * biçimlemesi sunucuda yapılır, tarayıcıya yalnızca sonuç iner.
 */

export type TreeTableColumn = { key: string; header: ReactNode; numeric?: boolean; width?: string };
export type TreeTableRow = { id: string; cells: Record<string, ReactNode>; children?: readonly TreeTableRow[] };

type Visible = { row: TreeTableRow; level: number; parent: string | null; posinset: number; setsize: number };

function flatten(rows: readonly TreeTableRow[], expanded: ReadonlySet<string>, level = 1, parent: string | null = null): Visible[] {
  return rows.flatMap((row, index) => {
    const self: Visible = { row, level, parent, posinset: index + 1, setsize: rows.length };
    return row.children?.length && expanded.has(row.id)
      ? [self, ...flatten(row.children, expanded, level + 1, row.id)]
      : [self];
  });
}

type TreeTableProps = {
  caption: string;
  columns: readonly TreeTableColumn[];
  rows: readonly TreeTableRow[];
  defaultExpanded?: readonly string[];
  /** Dar ekranda tablonun taban genişliği; altında kap kayar. */
  minWidth?: string;
  className?: string;
};

export function TreeTable({ caption, columns, rows, defaultExpanded = [], minWidth = "24rem", className }: TreeTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const visible = useMemo(() => flatten(rows, expanded), [rows, expanded]);
  const tabStop = (focusedId && visible.some((v) => v.row.id === focusedId) && focusedId) || visible[0]?.row.id;
  const refs = useRef(new Map<string, HTMLTableRowElement>());

  function focus(id: string | null | undefined) {
    if (!id) return;
    setFocusedId(id);
    refs.current.get(id)?.focus();
  }

  function toggle(id: string, open?: boolean) {
    setExpanded((current) => {
      const next = new Set(current);
      if (open ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableSectionElement>) {
    const index = visible.findIndex((v) => v.row.id === tabStop);
    const current = visible[index];
    if (!current) return;
    const hasChildren = Boolean(current.row.children?.length);
    const isOpen = expanded.has(current.row.id);
    const actions: Record<string, () => void> = {
      ArrowDown: () => focus(visible[index + 1]?.row.id),
      ArrowUp: () => focus(visible[index - 1]?.row.id),
      ArrowRight: () => (hasChildren && !isOpen ? toggle(current.row.id, true) : hasChildren && focus(visible[index + 1]?.row.id)),
      ArrowLeft: () => (hasChildren && isOpen ? toggle(current.row.id, false) : focus(current.parent)),
      Home: () => focus(visible[0]?.row.id),
      End: () => focus(visible.at(-1)?.row.id),
      Enter: () => hasChildren && toggle(current.row.id),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  /* Kabın kendisi odak durağı değil: satırlar odaklanabilir ve odaklanan
     satır görünür alana kendiliğinden kayar. */
  return (
    <div className={cn("min-w-0 overflow-x-auto", className)}>
      <table role="treegrid" aria-label={caption} className="w-full border-collapse text-base" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn("px-3 py-2.5 text-small font-semibold whitespace-nowrap text-muted", column.numeric ? "text-end" : "text-start")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody onKeyDown={onKeyDown}>
          {visible.map(({ row, level, posinset, setsize }) => {
            const hasChildren = Boolean(row.children?.length);
            const isOpen = expanded.has(row.id);
            return (
              <tr
                key={row.id}
                ref={(element) => {
                  if (element) refs.current.set(row.id, element);
                  else refs.current.delete(row.id);
                }}
                aria-level={level}
                aria-setsize={setsize}
                aria-posinset={posinset}
                aria-expanded={hasChildren ? isOpen : undefined}
                tabIndex={row.id === tabStop ? 0 : -1}
                onFocus={() => setFocusedId(row.id)}
                onClick={() => {
                  focus(row.id);
                  if (hasChildren) toggle(row.id);
                }}
                className={cn(
                  "border-b border-line-soft transition-colors last:border-0 hover:bg-surface focus-visible:bg-primary-wash",
                  hasChildren && "cursor-pointer",
                  level === 1 ? "text-strong" : "text-body",
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-2.5 align-middle",
                      column.numeric && "text-end whitespace-nowrap tabular-nums",
                      index === 0 && level === 1 && "font-medium",
                    )}
                  >
                    {index === 0 ? (
                      <span className="flex min-h-6 items-center gap-1.5" style={{ paddingLeft: `${(level - 1) * 1.25}rem` }}>
                        <span aria-hidden className="grid size-4 shrink-0 place-items-center text-muted">
                          {hasChildren ? (
                            <ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} strokeWidth={1.75} />
                          ) : null}
                        </span>
                        <span className="min-w-0">{row.cells[column.key]}</span>
                      </span>
                    ) : (
                      row.cells[column.key]
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
