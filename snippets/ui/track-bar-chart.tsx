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
 * EŞİK (`threshold`): hedef ya da sınır değeri (ör. "yanıt süresi hedefi 4 sa").
 * Eşiği AŞAN sütunlar `warning` tonuna döner ve her sütunun içinden kesikli bir
 * çizgi geçer; altta "Kesikli çizgi: Hedef 4 sa" notu yazar. Renk tek işaret
 * değil: `sr-only` tabloda aşan satırın değerine ", eşiği aştı" eklenir ve
 * başlığa eşik yazılır. Eşik `series` renginin yerine geçmez, yalnız aşanı boyar.
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
  threshold,
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
  /** Hedef/sınır: aşan sütun `warning` olur, kesikli çizgi çizilir. */
  threshold?: { value: number; label?: string };
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), ...(ticks ?? []), threshold?.value ?? 0, 1);
  const thLabel = threshold ? `${threshold.label ?? "Hedef"} ${format(threshold.value)}` : "";
  const exceeds = (value: number) => threshold !== undefined && value > threshold.value;
  const axis = ticks ?? [0, max];
  return (
    <figure className={cn("w-full", className)}>
      <div className="sr-only">
        {/* sr-only kap DIŞTA: <table> width: 1px'i yok sayar, uzun etiketle sayfayı yana taşırır. */}
        <table>
        <caption>{threshold ? `${title}. ${thLabel}` : title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>
                {format(d.value)}
                {exceeds(d.value) ? ", eşiği aştı" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

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
                    className={cn("bar absolute inset-x-0 bottom-0 rounded-md transition-[height] duration-500", exceeds(d.value) ? "bg-warning-fill" : SERIES_BG[series - 1])}
                    style={{ height: `${pct}%` }}
                  />
                  {threshold ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 z-[1] border-t border-dashed border-strong/60"
                      style={{ bottom: `${(threshold.value / max) * 100}%` }}
                    />
                  ) : null}
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
      {threshold ? (
        <p aria-hidden className="mt-2 ps-14 text-micro text-muted">
          Kesikli çizgi: {thLabel}
        </p>
      ) : null}
    </figure>
  );
}
