import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Veri tablosu. Sunucu bileşeni: `render` ve `sortHref` fonksiyon olarak
 * geçebilir, tarayıcıya JavaScript inmez.
 *
 * SIRALAMA ADRESTE. Başlık bir bağlantı (`?sort=price&dir=desc`); sayfa
 * `searchParams`ı okuyup veriyi sunucuda sıralar (`parseSort` + `sortRows`
 * yardımcıları aşağıda). Paylaşılan bağlantı aynı sıralamayla açılır, geri
 * tuşu önceki sıralamaya döner, JavaScript kapalıyken de çalışır.
 * Bağlantılar `scroll={false}`: App Router her gezinmede en üste kaydırır ve
 * tablonun ortasında sıralamayı değiştiren okuyucu sayfanın başına fırlardı.
 * Başlık `aria-sort` taşır; ekran okuyucu hangi sütunun hangi yönde
 * sıralandığını duyar.
 *
 * KAYDIRMA SAKLANMAZ. Dar ekranda sığmayan tablo `table-fixed` ile kabına
 * zorlanmaz (bölünemeyen bir değer komşu sayının üstüne biner: kaydırma
 * yerine çakışma). Tabana bir genişlik verilir (`minWidth`), kap yatay
 * kayar, ilk sütun yapışkan kalır ve sağ kenardaki solma "devamı var" der.
 * Solma kaydırmaya bağlı CSS animasyonu (`animation-timeline: scroll()`):
 * sona gelince kaybolur, tablo sığıyorsa hiç görünmez. Desteklemeyen
 * tarayıcıda solma yok, kaydırma çubuğu var. Kap klavyeyle odaklanabilir
 * (`tabIndex=0`) ve adlı bir bölge: klavye kullanıcısı da kaydırabilir.
 *
 * SAYILAR SAĞA YASLI ve `tabular-nums`: basamaklar alt alta hizalanır,
 * başlık da sayısıyla aynı kenarda durur.
 *
 * KARŞILAŞTIRMA ÇUBUĞU (`bar`): sayının altında ince bir çizgi, aynı
 * büyüklüğü bir de UZUNLUK olarak söyler; sıralama okumadan çıkar. Çubuk bir
 * BÜYÜKLÜK, bir yargı değil: renk yalnızca işaretten gelir (`tone:
 * "signal"`), lider vurgulanmaz. Karşılaştırılamayan bir ölçüde (farklı
 * şirketlerin hisse fiyatı) çubuk HİÇ verilmez; olmayan bir sıralamayı
 * varmış gibi gösterirdi. Çubuk `aria-hidden`: sayının kopyası.
 *
 * Durumlar: `loading` iskelet satır basar, `error` mesaj ve isteğe bağlı
 * eylem, boş veri `empty` metnini gösterir. Üçü de tablonun yerini tutar,
 * sayfa zıplamaz.
 */

export type SortDir = "asc" | "desc";
export type SortState = { key: string; dir: SortDir };

export type Column<Row> = {
  key: string;
  header: ReactNode;
  /** Hücre içeriği. Verilmezse `row[key]` düz metin olarak basılır. */
  render?: (row: Row) => ReactNode;
  /** Sayı sütunu: sağa yaslı, tabular-nums. */
  numeric?: boolean;
  /** Sıralanabilir mi; `sortValue` sıralamanın okuduğu değer. */
  sortable?: boolean;
  sortValue?: (row: Row) => number | string | null;
  /** Karşılaştırma çubuğu. Yalnızca karşılaştırılabilir ölçülerde. */
  bar?: { value: (row: Row) => number | null; tone?: "neutral" | "signal" };
  /** Sütun genişliği (`colgroup`): "8rem", "30%". */
  width?: string;
};

type TableState = "ready" | "loading" | "error";

type DataTableProps<Row> = {
  /** Tablonun adı: `<caption>` (görünmez) ve kaydırma bölgesinin adı. */
  caption: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  sort?: SortState;
  /** Sıralama bağlantısını kurar: `(key, dir) => "?sort=" + key + "&dir=" + dir`. */
  sortHref?: (key: string, dir: SortDir) => string;
  density?: "compact" | "comfortable";
  /** İlk sütun yatay kaydırmada yerinde kalsın. */
  stickyFirst?: boolean;
  /** Yapışkan hücrenin zemini: tablo bir Panel içindeyse "surface". */
  on?: "page" | "surface";
  /** Tablonun taban genişliği; altında kap kayar. */
  minWidth?: string;
  state?: TableState;
  empty?: ReactNode;
  error?: ReactNode;
  /** Hata durumunda mesajın altındaki eylem ("Tekrar Dene"). */
  errorAction?: ReactNode;
  /** Yükleme iskeletinin satır sayısı. */
  loadingRows?: number;
  className?: string;
};

const STYLES = `
@property --dt-fade { syntax: "<length>"; inherits: false; initial-value: 0px; }
@keyframes dt-fade { from { --dt-fade: 2.5rem } to { --dt-fade: 0px } }
@supports (animation-timeline: scroll()) {
  .dt-scroller {
    mask-image: linear-gradient(to left, transparent, black var(--dt-fade));
    animation: dt-fade linear both;
    animation-timeline: scroll(self inline);
  }
}
`;

/* Yapışkan hücre opak olmak ZORUNDA, yoksa altından kayan sayılar görünür.
   Panel zemini yarı saydam bir ton (`--surface`); opak karşılığı sayfa
   zemininin üstüne aynı tonu bir degrade katmanı olarak sermek. */
const STICKY_BG = {
  page: "bg-page",
  surface: "bg-page bg-[linear-gradient(var(--surface),var(--surface))]",
} as const;

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  sort,
  sortHref,
  density = "comfortable",
  stickyFirst = true,
  on = "surface",
  minWidth = "40rem",
  state = "ready",
  empty = "Gösterilecek kayıt yok.",
  error = "Veriler alınamadı.",
  errorAction,
  loadingRows = 5,
  className,
}: DataTableProps<Row>) {
  const cellY = density === "compact" ? "py-2" : "py-3";
  const maxima = new Map<string, number>();
  for (const column of columns) {
    if (!column.bar) continue;
    const values = rows.map((row) => Math.abs(column.bar!.value(row) ?? 0));
    maxima.set(column.key, Math.max(0, ...values));
  }
  const message =
    state === "error" ? error : state === "ready" && rows.length === 0 ? empty : null;

  return (
    // `min-w-0`: ızgara ya da flex öğesi olunca varsayılan `min-width: auto`
    // kökü tablonun taban genişliğine (`minWidth`) şişirir ve kaydırma kabı
    // hiç devreye girmez; ölçüldü, 390 pikselde kök 677'ye taşıyordu.
    <div className={cn("relative min-w-0", className)}>
      <style href="ui-data-table" precedence="default">
        {STYLES}
      </style>
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className="dt-scroller overflow-x-auto overscroll-x-contain rounded-md"
      >
        <table className="w-full border-collapse text-base" style={{ minWidth }} aria-busy={state === "loading" || undefined}>
          <caption className="sr-only">{caption}</caption>
          {columns.some((column) => column.width) ? (
            <colgroup>
              {columns.map((column) => (
                <col key={column.key} style={column.width ? { width: column.width } : undefined} />
              ))}
            </colgroup>
          ) : null}
          <thead>
            <tr className="border-b border-line">
              {columns.map((column, index) => {
                const current = sort?.key === column.key ? sort.dir : undefined;
                const next: SortDir = current === "desc" ? "asc" : "desc";
                const SortIcon = current === "asc" ? ArrowUp : current === "desc" ? ArrowDown : ArrowUpDown;
                const sticky = stickyFirst && index === 0;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={current === "asc" ? "ascending" : current === "desc" ? "descending" : undefined}
                    className={cn(
                      "px-3 py-2.5 text-small font-semibold whitespace-nowrap text-muted",
                      column.numeric ? "text-end" : "text-start",
                      sticky && cn("sticky left-0 z-[1]", STICKY_BG[on]),
                    )}
                  >
                    {column.sortable && sortHref ? (
                      <Link
                        href={sortHref(column.key, next)}
                        scroll={false}
                        className={cn(
                          "-mx-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-sm px-1.5 transition-colors hover:text-strong pointer-fine:min-h-8",
                          column.numeric && "flex-row-reverse",
                          current && "text-strong",
                        )}
                      >
                        {column.header}
                        <SortIcon aria-hidden className={cn("size-3.5", !current && "opacity-50")} strokeWidth={2} />
                      </Link>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {state === "loading"
              ? Array.from({ length: loadingRows }, (_, i) => (
                  <tr key={i} aria-hidden className="border-b border-line-soft last:border-0">
                    {columns.map((column, index) => (
                      <td key={column.key} className={cn("px-3", cellY)}>
                        <span
                          className={cn(
                            "skeleton block h-3.5 rounded-sm",
                            column.numeric ? "ml-auto w-14" : index === 0 ? "w-32" : "w-20",
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={rowKey(row)} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface">
                    {columns.map((column, index) => {
                      const content = column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "");
                      const sticky = stickyFirst && index === 0;
                      const Cell = index === 0 ? "th" : "td";
                      return (
                        <Cell
                          key={column.key}
                          scope={index === 0 ? "row" : undefined}
                          className={cn(
                            "px-3 text-start align-middle font-normal",
                            cellY,
                            column.numeric && "text-end whitespace-nowrap tabular-nums",
                            index === 0 ? "font-medium text-strong" : "text-body",
                            sticky && cn("sticky left-0 z-[1]", STICKY_BG[on]),
                          )}
                        >
                          {content}
                          {column.bar ? (
                            <ScaleBar
                              value={column.bar.value(row)}
                              max={maxima.get(column.key) ?? 0}
                              signed={rows.some((r) => (column.bar!.value(r) ?? 0) < 0)}
                              tone={column.bar.tone}
                            />
                          ) : null}
                        </Cell>
                      );
                    })}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {message ? (
        <div role={state === "error" ? "alert" : undefined} className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <p className={cn("text-base", state === "error" ? "text-danger" : "text-muted")}>{message}</p>
          {state === "error" && errorAction ? errorAction : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Karşılaştırma çubuğu: sağa yaslı ray, sayının sağ kenarıyla aynı hatta
 * biter. `signed`: sütunda eksi değer var, sıfır ortada (artı sağa, eksi
 * sola açılır). Tek başına da kullanılabilir.
 */
export function ScaleBar({
  value,
  max,
  signed = false,
  tone = "neutral",
}: {
  value: number | null;
  max: number;
  signed?: boolean;
  tone?: "neutral" | "signal";
}) {
  if (value === null || max <= 0) return null;
  const ratio = Math.min(1, Math.abs(value) / max) * 100;
  const negative = value < 0;
  return (
    <span aria-hidden className="mt-1.5 ml-auto block h-[3px] w-full max-w-32 rounded-full bg-line-soft">
      <span
        className={cn(
          "block h-full rounded-full",
          tone === "signal" ? (negative ? "bg-danger" : "bg-success") : "bg-primary/60",
        )}
        style={
          signed
            ? { marginLeft: negative ? `${50 - ratio / 2}%` : "50%", width: `${ratio / 2}%` }
            : { marginLeft: `${100 - ratio}%`, width: `${ratio}%` }
        }
      />
    </span>
  );
}

/** `searchParams`tan sıralamayı okur; bilinmeyen sütun ya da yön yok sayılır. */
export function parseSort(
  params: Record<string, string | string[] | undefined>,
  sortable: readonly string[],
  fallback?: SortState,
): SortState | undefined {
  const key = typeof params.sort === "string" ? params.sort : undefined;
  const dir = params.dir === "asc" || params.dir === "desc" ? params.dir : "desc";
  return key && sortable.includes(key) ? { key, dir } : fallback;
}

/** Sunucuda sıralama. Boş değerler yönden bağımsız olarak SONA gider. */
export function sortRows<Row>(rows: readonly Row[], columns: readonly Column<Row>[], sort?: SortState): Row[] {
  const column = sort && columns.find((c) => c.key === sort.key);
  if (!sort || !column?.sortValue) return [...rows];
  const read = column.sortValue;
  const factor = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = read(a);
    const y = read(b);
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
    return String(x).localeCompare(String(y), "tr-TR") * factor;
  });
}
