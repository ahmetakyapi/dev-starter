"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SERIES_BG, type Series } from "@/components/ui/chart-card";

/**
 * Yığılı sütun grafiği: aynı günün (haftanın, ayın) toplamı ve neyden
 * oluştuğu. Her sütun birkaç serinin üst üste yığılmış hali; "Gün başına
 * kredi" gibi bir toplamın hangi otomasyondan geldiğini göstermek için.
 * baobun.studio panosunun ("Credits per day") davranışı; kod alınmadı.
 *
 * NE ZAMAN DEĞİL: tek seri `track-bar-chart`, iki dönemin kıyası
 * `area-chart`. Yığılı çubukta alttaki dışındaki seriler ortak tabanda
 * durmaz, kıyaslanamaz: asıl soru TOPLAM ise buradasın, her serinin gidişi
 * ise `line-chart`.
 *
 * `highlight`: doygun kalan sütun (genelde bugün); ötekilerin DOYGUNLUĞU
 * düşer (`saturate`), saydamlığı değil: saydamlık seri renklerini zemine
 * karıştırır, koyu temada çamurlaştırıp "E-posta" ile "Telefon"u aynı
 * gösterirdi; doygunluk düşünce renk ayrımı korunur. Balon highlight'ta
 * kalıcı ("44/gün"), fareyle ya da oklarla başka sütuna gelince oraya geçer
 * ve seri DÖKÜMÜNÜ de yazar (renk tek işaret değil: ad + değer). Izgara
 * çizgileri soluk kesikli, yalnız `ticks`ta.
 *
 * SÜTUN SAYISI: en çok ~14 (hedef boyu ve etiket sığması). Daha fazlasında
 * etiketler seyrelir (her k'inci), sütunlar daralır; 30 günlük veriyi haftaya
 * topla ya da `area-chart` kullan.
 *
 * ERİŞİLEBİLİRLİK: çizim alanı bir `group`; her sütun odaklanabilir bir
 * buton (gezici tabindex: Tab grafiğe girer, ← → Home End sütun değiştirir)
 * ve adı bütün değeri söyler ("Sal 17: Destek 112, Özet 84, toplam 196").
 * Ayrı tablo ve `aria-describedby` yok: sütun adı aynı bilgiyi taşır, çift
 * okuma olmasın; balon yalnız görsel (`aria-hidden`). Butonlar bir eylem
 * yapmaz (Enter/Space etkisiz): odak yalnız değeri okutmak içindir.
 * Soluk sütun yalnız görsel ipucu, değer her sütunda aynı okunur. Hareket
 * azaltmada geçişler anında.
 *
 * `format`: tek değer biçimi (balon, eksen, lejant); `unit`: balonda
 * değerin ardına ("/gün"). Bu bileşen istemcidir: bir SUNUCU bileşeninden
 * fonksiyon (`format`) geçirilemez; sunucu sayfasında varsayılan biçimi
 * kullan ya da biçimi içeren küçük bir istemci sarmalayıcı yaz.
 *
 *   <StackedBarChart title="Gün başına kredi" series={[{ name: "Destek", color: 4 }]}
 *     data={[{ label: "Pzt", values: [40] }]} highlight={0} unit="/gün" />
 */

export type StackedSeries = { name: string; color: Series };
export type StackedPoint = { label: string; values: readonly number[] };

export function StackedBarChart({
  data,
  series,
  title,
  ticks,
  highlight,
  unit = "",
  format = (v) => v.toLocaleString("tr-TR"),
  showLegend = true,
  height = "h-56",
  className,
}: {
  data: readonly StackedPoint[];
  /** `values` dizisiyle aynı sırada. */
  series: readonly StackedSeries[];
  /** Grafiğin adı: "Gün başına kredi". */
  title: string;
  /** Eksen ve ızgara değerleri, küçükten büyüğe. Verilmezse 0 ve en büyük toplam. */
  ticks?: readonly number[];
  /** Doygun kalan ve balonu kalıcı olan sütun (indeks). */
  highlight?: number;
  unit?: string;
  format?: (value: number) => string;
  /** Lejant satırı: "Ad toplam". */
  showLegend?: boolean;
  height?: string;
  className?: string;
}) {
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndexRaw, setFocusIndex] = useState(highlight ?? 0);
  // Veri kısalırsa (30 gün → 7 gün) gezici tabindex'in sütunu kaybolmasın.
  const focusIndex = Math.min(focusIndexRaw, Math.max(data.length - 1, 0));
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);

  const totals = data.map((d) => d.values.reduce((a, b) => a + b, 0));
  const max = Math.max(...totals, ...(ticks ?? []), 1);
  const axis = ticks ?? [0, max];
  const active = hover ?? focused ?? highlight ?? null;
  const dimming = highlight !== undefined || hover !== null || focused !== null;
  const interacting = hover !== null || focused !== null;
  const labelStep = Math.max(1, Math.ceil(data.length / 12));
  const seriesName = (s: number) => series[s]?.name ?? `Seri ${s + 1}`;

  const move = (to: number) => {
    const next = (to + data.length) % data.length;
    setFocusIndex(next);
    refs.current[next]?.focus();
  };

  return (
    // Balon en yüksek sütunun ÜSTÜNE çıkar: highlight varken üst pay, dar kartta başlığa binmesin.
    <figure className={cn("w-full", highlight !== undefined && "pt-7", className)}>
      <div className="flex gap-3">
        <div aria-hidden className={cn("relative w-9 shrink-0 text-micro text-muted tabular-nums", height)}>
          {axis.map((t, ti) => (
            <span key={`${t}-${ti}`} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
              {format(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div role="group" aria-label={title} className={cn("relative", height)}>
            {axis.map((t, ti) => (
              <span
                key={`${t}-${ti}`}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line-soft"
                style={{ bottom: `${(t / max) * 100}%` }}
              />
            ))}
            <div
              className="absolute inset-0 flex items-end justify-between gap-1.5 sm:gap-3"
              onPointerLeave={() => setHover(null)}
            >
              {data.map((d, i) => {
                const total = totals[i];
                const isActive = active === i;
                const spoken = d.values
                  .map((v, s) => (v > 0 ? `${seriesName(s)} ${format(v)}` : null))
                  .filter(Boolean)
                  .join(", ");
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    type="button"
                    tabIndex={i === focusIndex ? 0 : -1}
                    aria-label={`${d.label}: ${spoken || "veri yok"}, toplam ${format(total)}${unit}`}
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => {
                      setFocusIndex(i);
                      setFocused(i);
                    }}
                    onBlur={() => setFocused(null)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight") move(i + 1);
                      else if (e.key === "ArrowLeft") move(i - 1);
                      else if (e.key === "Home") move(0);
                      else if (e.key === "End") move(data.length - 1);
                      else return;
                      e.preventDefault();
                    }}
                    className="group/col relative flex h-full min-w-px flex-1 cursor-default flex-col justify-end rounded-md outline-offset-4"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mx-auto flex w-full max-w-14 flex-col-reverse gap-px overflow-hidden rounded-md transition-[filter] duration-200 motion-reduce:transition-none",
                        dimming && !isActive ? "[filter:saturate(0.4)]" : "[filter:saturate(1)]",
                      )}
                      style={{ height: `${Math.max((total / max) * 100, total > 0 ? 2 : 0)}%` }}
                    >
                      {d.values.map((v, s) =>
                        v > 0 ? (
                          <span
                            key={s}
                            className={cn("block w-full", SERIES_BG[(series[s]?.color ?? 1) - 1])}
                            style={{ flexGrow: v, flexBasis: 0 }}
                          />
                        ) : null,
                      )}
                    </span>
                    {isActive ? (
                      <span
                        id={`${uid}-tip`}
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 -translate-y-full flex-col gap-0.5 rounded-md bg-strong px-2 py-1 text-left text-micro whitespace-nowrap text-page tabular-nums shadow-floating"
                        style={{ bottom: `calc(${Math.max((total / max) * 100, 2)}% + 0.375rem)` }}
                      >
                        <span className="font-semibold">
                          {format(total)}
                          {unit}
                        </span>
                        {interacting
                          ? d.values.map((v, s) =>
                              v > 0 ? (
                                <span key={s} className="flex items-center gap-1.5 font-normal">
                                  <span className={cn("size-1.5 shrink-0 rounded-full", SERIES_BG[(series[s]?.color ?? 1) - 1])} />
                                  {seriesName(s)} {format(v)}
                                </span>
                              ) : null,
                            )
                          : null}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div aria-hidden className="mt-2 flex justify-between gap-1.5 sm:gap-3">
            {data.map((d, i) => (
              <span
                key={i}
                className={cn(
                  "min-w-px flex-1 text-center text-micro whitespace-nowrap",
                  active === i ? "font-semibold text-strong" : "text-muted",
                )}
              >
                {i % labelStep === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showLegend ? (
        <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-small">
          {series.map((s, si) => (
            <div key={si} className="flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", SERIES_BG[s.color - 1])} />
              <dt className="text-body">{s.name}</dt>
              <dd className="font-semibold text-strong tabular-nums">{format(data.reduce((n, d) => n + (d.values[si] ?? 0), 0))}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </figure>
  );
}
