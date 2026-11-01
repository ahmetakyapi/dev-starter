import { cn } from "@/lib/utils";
import { SERIES_BG, type Series } from "@/components/ui/chart-card";

/**
 * İz üstünde sütun grafiği: her sütunun arkasında tam boy, soluk bir iz
 * (track); dolgu onun içinde yükselir. Ay, gün, hafta gibi SIRALI tek seri
 * için. Sunucu bileşeni, SVG yok: sütunlar düz `div`, yükseklik yüzde.
 *
 * NEDEN İZ: iz tavanı gösterir; boş kalan kısım da okunur ("Haziran yılın
 * en düşüğü") ve ızgara çizgisine gerek kalmaz. Eksen yalnızca birkaç sabit
 * değerde (`ticks`), çizgisiz.
 *
 * Fareyle sütunun üstüne gelince kendi değeri yazılır, diğerleri geri
 * çekilir (CSS `:has`, JS yok). Bu bir süs: dokunmatikte ve klavyede değer
 * `sr-only` TABLODAN okunur; görsel kısım `aria-hidden`. Telefonda okunması
 * gereken tek değer varsa onu `ChartCard` başlığına yaz.
 *
 * Etiketler kısa olmalı: 12 sütun telefonda sütun başına ~24 px bırakır;
 * "Oca", "Şub" sığar, "Ocak" sığmaz. Eksen değeri de kısa ("₺10 bin").
 *
 * `format`: değer biçimi (ör. `(v) => "₺" + v.toLocaleString("tr-TR")`).
 * Sunucu bileşeni olduğu için fonksiyon prop'u serbest.
 */

type Point = { label: string; value: number };

export function TrackBarChart({
  data,
  title,
  ticks,
  series = 1,
  format = (v) => v.toLocaleString("tr-TR"),
  height = "h-48",
  className,
}: {
  data: readonly Point[];
  /** Tablo başlığı ve grafiğin adı: "Aylık Kazanç". */
  title: string;
  /** Eksen değerleri, küçükten büyüğe. Verilmezse 0 ve en büyük değer. */
  ticks?: readonly number[];
  series?: Series;
  format?: (value: number) => string;
  /** Çizim alanı yüksekliği: Tailwind sınıfı. */
  height?: string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), ...(ticks ?? []), 1);
  const axis = ticks ?? [0, max];
  return (
    <figure className={cn("w-full", className)}>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div aria-hidden className="flex gap-3">
        {/* Eksen: değerler gerçek konumunda, çizgisiz */}
        <div className={cn("relative w-11 shrink-0 text-micro text-muted tabular-nums", height)}>
          {axis.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
              {format(t)}
            </span>
          ))}
        </div>

        <div className="group/chart flex min-w-0 flex-1 items-end gap-1.5 sm:gap-2">
          {data.map((d) => {
            const pct = Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0);
            return (
              <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className={cn(
                    "group/bar relative w-full max-w-10 overflow-visible rounded-md bg-chart-track transition-opacity duration-200",
                    "group-has-[.bar:hover]/chart:opacity-45 has-[.bar:hover]:opacity-100!",
                    height,
                  )}
                >
                  <div
                    className={cn("bar absolute inset-x-0 bottom-0 rounded-md transition-[height] duration-500", SERIES_BG[series - 1])}
                    style={{ height: `${pct}%` }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-sm bg-overlay px-1.5 py-0.5 text-micro font-semibold whitespace-nowrap text-strong tabular-nums opacity-0 shadow-floating transition-opacity group-has-[.bar:hover]/bar:opacity-100">
                    {format(d.value)}
                  </span>
                </div>
                <span className="text-center text-micro whitespace-nowrap text-muted">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
