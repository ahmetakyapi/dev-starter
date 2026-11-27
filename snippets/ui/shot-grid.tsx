"use client";

import { ChevronDown, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useScrollHideBar } from "@/components/ui/scroll-hide-bar";
import { cn } from "@/lib/utils";

/**
 * Çalışma ızgarası: kartları iki düzende gösterir — AKIŞ (tek sütun, her
 * kart aynı genişlikte, sırayla okunur) ve MASONRY (2-3 sütun, her kart
 * kendi oranında, sıradaki kart en kısa sütuna). Üstüne süzgeç
 * (proje, tür, iş) ve "Karıştır". Sakin Akış turu (kişisel portfolyo
 * dili); yalnız davranış, kod alınmadı.
 *
 * NE ZAMAN: portfolyo akışı, ekran kaydı arşivi, ilham panosu; 8+ kart
 * ve en az bir anlamlı süzgeç ekseni.
 * NE ZAMAN DEĞİL: tablo verisi (`data-table`), tek tip ürün ızgarası
 * (CSS grid yeter), sonsuz akış (bu bileşen sanallaştırmaz; ~60 karta dek).
 *
 * PARÇALAR: durum `useShotGrid()` kancasında; `ShotGrid` kartları dizer,
 * `ShotGridToolbar` süzgeç + görünüm + karıştır çubuğudur. Ayrı oldukları
 * için çubuk `ScrollHideBar` içine konabilir:
 *
 *   const grid = useShotGrid({ items: WORKS, filters: FILTERS });
 *   <ShotGrid grid={grid} renderItem={(w) => <ShotCard … ratio={w.ratio} />} />
 *   <ScrollHideBar><ShotGridToolbar grid={grid} /></ScrollHideBar>
 *
 * DÜZEN: masonry sütun sayısı kabın genişliğinden (ResizeObserver;
 * < 640 px 1, < 1024 px 2, üstü `columns`). Kart yüksekliği oranından
 * tahmin edilir (`1 / ratio` + künye payı), DOM ölçülmez: ilk boyamada
 * sıçrama yok. Görünüm değişince ve karıştırınca akış 480 ms'de solarak,
 * 6 px aşağıdan, 2 px buğudan gelir (kartlar tek tek uçmaz; 30 kartlık
 * düzen animasyonu hem pahalı hem gürültülü). Sayfa yerinde kalır.
 * Görünüm tercihi `localStorage`da (`storageKey`); erişilemezse varsayılan.
 *
 * ERİŞİLEBİLİRLİK: çubuk `role="toolbar"` + ad, ← → ile öğeler arası,
 * tek Tab durağı (gezici tabindex). Süzgeçler yerel `<select>` (etiketi
 * "Proje: Tümü" görünür metinle aynı), görünüm basılı/basılı değil
 * buton çifti (`aria-pressed`; araç çubuğunda oklar öğeler arası gezer,
 * radyo grubu oklarla çakışırdı). Sonuç sayısı
 * canlı bölgede ("12 iş gösteriliyor"). Boş sonuçta "Süzgeçleri Temizle".
 * Hareketi azaltan kullanıcıda geçiş yalnız solma.
 */

const CSS = `
@keyframes ui-sg-enter { from { opacity: 0; translate: 0 6px; filter: blur(2px); } }
.ui-sg-enter { animation: ui-sg-enter 480ms var(--ease-brand) both; }
@media (prefers-reduced-motion: reduce) {
  @keyframes ui-sg-fade { from { opacity: 0; } }
  .ui-sg-enter { animation: ui-sg-fade 200ms linear both; }
}`;

export type ShotGridView = "feed" | "masonry";
export type ShotGridItem = { id: string; ratio?: number; tags?: Record<string, string> };
export type ShotFilter = { key: string; label: string; options: readonly { value: string; label: string }[] };

const ALL = "all";

type Options<T extends ShotGridItem> = {
  items: readonly T[];
  filters?: readonly ShotFilter[];
  defaultView?: ShotGridView;
  /** Görünüm tercihinin saklandığı anahtar; `null` saklamaz. */
  storageKey?: string | null;
};

export function useShotGrid<T extends ShotGridItem>({ items, filters = [], defaultView = "feed", storageKey = "shot-grid-view" }: Options<T>) {
  const [view, setViewState] = useState<ShotGridView>(defaultView);
  const [values, setValues] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[] | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      // Sunucuda bilinmeyen tercih ilk boyamadan sonra okunur (hidrasyon eşleşsin).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "feed" || saved === "masonry") setViewState(saved);
    } catch {}
  }, [storageKey]);

  const setView = useCallback(
    (next: ShotGridView) => {
      setViewState(next);
      setRound((r) => r + 1);
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, next);
      } catch {}
    },
    [storageKey],
  );

  const setValue = useCallback((key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setRound((r) => r + 1);
  }, []);

  const clear = useCallback(() => {
    setValues({});
    setRound((r) => r + 1);
  }, []);

  const shuffle = useCallback(() => {
    const ids = items.map((i) => i.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setOrder(ids);
    setRound((r) => r + 1);
  }, [items]);

  const visible = useMemo(() => {
    const rank = order ? new Map(order.map((id, i) => [id, i])) : null;
    const list = items.filter((item) =>
      Object.entries(values).every(([key, value]) => value === ALL || item.tags?.[key] === value),
    );
    return rank ? [...list].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)) : list;
  }, [items, values, order]);

  return { view, setView, filters, values, setValue, clear, shuffle, visible, total: items.length, round };
}

export type ShotGridState<T extends ShotGridItem> = ReturnType<typeof useShotGrid<T>>;

/* ── Izgara ─────────────────────────────────────────────────────────── */

type ShotGridProps<T extends ShotGridItem> = {
  grid: ShotGridState<T>;
  renderItem: (item: T, ctx: { view: ShotGridView; index: number }) => ReactNode;
  /** Masonry'de en çok sütun (geniş ekran). */
  columns?: 2 | 3;
  /** Kart altındaki künyenin oran cinsinden payı (yükseklik tahmini). */
  captionRatio?: number;
  emptyText?: string;
  className?: string;
};

export function ShotGrid<T extends ShotGridItem>({
  grid,
  renderItem,
  columns = 3,
  captionRatio = 0.16,
  emptyText = "Bu süzgeçlerle eşleşen iş yok.",
  className,
}: ShotGridProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState<number>(columns);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setCols(w < 640 ? 1 : w < 1024 ? Math.min(2, columns) : columns);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [columns]);

  const lanes = useMemo(() => {
    const n = grid.view === "masonry" ? cols : 1;
    const out: { item: T; index: number }[][] = Array.from({ length: n }, () => []);
    const heights = new Array(n).fill(0);
    grid.visible.forEach((item, index) => {
      const lane = heights.indexOf(Math.min(...heights));
      out[lane].push({ item, index });
      heights[lane] += 1 / (item.ratio ?? 1.6) + captionRatio;
    });
    return out;
  }, [grid.view, grid.visible, cols, captionRatio]);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <style href="ui-shot-grid" precedence="default">
        {CSS}
      </style>
      <p role="status" className="sr-only">
        {grid.visible.length} iş gösteriliyor
      </p>
      {grid.visible.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl bg-surface px-6 py-14 text-center">
          <p className="text-small text-muted">{emptyText}</p>
          <button
            type="button"
            onClick={grid.clear}
            className="rounded-full bg-overlay px-3 py-1.5 text-small text-strong shadow-raised ring-1 ring-line transition-transform active:scale-[0.97]"
          >
            Süzgeçleri Temizle
          </button>
        </div>
      ) : (
        <div
          key={`${grid.view}:${grid.round}`}
          data-view={grid.view}
          className={cn("ui-sg-enter flex items-start gap-6", grid.view === "feed" && "mx-auto max-w-3xl")}
        >
          {lanes.map((lane, i) => (
            <div key={i} className="grid min-w-0 flex-1 gap-8">
              {lane.map(({ item, index }) => (
                <div key={item.id}>{renderItem(item, { view: grid.view, index })}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Araç çubuğu ────────────────────────────────────────────────────── */

type ToolbarProps<T extends ShotGridItem> = {
  grid: ShotGridState<T>;
  label?: string;
  viewLabels?: Record<ShotGridView, string>;
  shuffleLabel?: string;
  allLabel?: string;
  className?: string;
};

const ITEM = "outline-none focus-visible:ring-2 focus-visible:ring-line-focus";

export function ShotGridToolbar<T extends ShotGridItem>({
  grid,
  label = "Akış Görünümü",
  viewLabels = { feed: "Akış", masonry: "Masonry" },
  shuffleLabel = "Karıştır",
  allLabel = "Tümü",
  className,
}: ToolbarProps<T>) {
  const { hold } = useScrollHideBar();
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function items() {
    return Array.from(root.current?.querySelectorAll<HTMLElement>("[data-tb]") ?? []);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLElement);
    if (current < 0) return;
    event.preventDefault();
    const last = list.length - 1;
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowRight" ? (current + 1) % list.length : (current - 1 + list.length) % list.length;
    setActive(next);
    list[next].focus();
  }

  // Gezici tabindex: her boyamada yalnız etkin öğe Tab durağı.
  useEffect(() => {
    items().forEach((el, i) => (el.tabIndex = i === active ? 0 : -1));
  });

  const sep = <span aria-hidden className="mx-1 h-5 w-px bg-line" />;

  return (
    <div
      ref={root}
      role="toolbar"
      aria-label={label}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        const i = items().indexOf(e.target as HTMLElement);
        if (i >= 0) setActive(i);
      }}
      className={cn("flex items-center gap-0.5 text-small", className)}
    >
      {grid.filters.map((filter) => {
        const value = grid.values[filter.key] ?? ALL;
        const current = value === ALL ? allLabel : filter.options.find((o) => o.value === value)?.label;
        return (
          <label key={filter.key} className="relative flex h-9 items-center gap-1.5 rounded-full px-2.5 hover:bg-surface sm:px-3 has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-line-focus">
            {/* Telefonda önek gizli (çubuk 390 px'e sığsın); seçim adı yine okunur. */}
            <span className="text-muted max-sm:sr-only">{filter.label}</span>
            <span className="font-medium text-strong">{current}</span>
            <ChevronDown aria-hidden className="size-3.5 text-soft" />
            <select
              data-tb
              value={value}
              onChange={(e) => {
                hold();
                grid.setValue(filter.key, e.target.value);
              }}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0 outline-none"
            >
              <option value={ALL}>{allLabel}</option>
              {filter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        );
      })}
      {grid.filters.length > 0 && sep}
      <div role="group" aria-label="Düzen" className="flex rounded-full bg-surface-sunken p-0.5">
        {(["feed", "masonry"] as const).map((v) => (
          <button
            key={v}
            data-tb
            type="button"
            aria-pressed={grid.view === v}
            onClick={() => {
              hold();
              grid.setView(v);
            }}
            className={cn(
              "h-8 rounded-full px-2.5 transition-[color,background-color,box-shadow] duration-200 sm:px-3",
              ITEM,
              grid.view === v ? "bg-overlay text-strong shadow-raised" : "text-muted hover:text-strong",
            )}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>
      {sep}
      <button
        data-tb
        type="button"
        onClick={() => {
          hold();
          grid.shuffle();
        }}
        aria-label={shuffleLabel}
        className={cn("group flex h-9 items-center gap-1.5 rounded-full px-2.5 font-medium text-strong hover:bg-surface active:scale-[0.97] sm:px-3", ITEM)}
      >
        <Shuffle aria-hidden className="size-4 transition-transform duration-300 group-active:rotate-180" />
        <span aria-hidden className="max-sm:hidden">
          {shuffleLabel}
        </span>
      </button>
    </div>
  );
}
