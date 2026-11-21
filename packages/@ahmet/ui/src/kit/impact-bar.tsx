// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { cn } from "../utils";

/**
 * Etki çubuğu: bir işlemin bir bütçeye, kotaya ya da limite EKLEDİĞİNİ
 * gösterir. Tek yatay çubuk üç parçadan kurulur: o ana kadar harcanan (dolu),
 * BU işlemin eklediği dilim (çizgili), kalan boşluk (iz). Sağda "önce → sonra
 * / limit · yüzde". Toplu onay penceresinde "Pazarlama $1.900 → $2.380 /
 * $6.000 · %40" satırı, taşıma planında "Depo 410 → 520 / 600 GB" gibi. Spendix
 * toplu onay penceresindeki "Onaydan sonra bütçe" bloğundan alındı (yapı; kod,
 * metin, görsel alınmadı).
 *
 * `meter.tsx` ve `tick-meter.tsx` ile farkı: onlar bir DURUMU gösterir
 * (kota doluluğu, işin gidişatı). Bu ise bir ÖNERİLEN DEĞİŞİKLİĞİN sonucunu
 * onaydan önce gösterir: çizgili dilim "eklenecek" demek, henüz yok. Birden
 * çok bütçeyi tek bakışta kıyaslamak için satır satır alt alta konur.
 *
 * LİMİT AŞILIRSA: çizgili dilim `danger` olur, çubuk limitin ötesine uzar ve
 * limit işaretçisi (dikey çizgi) görünür; sağdaki metin `danger` tonunda ve
 * "Limit aşılıyor" yazar (renk tek işaret değil). `warnAt` (varsayılan %90)
 * aşılırsa yalnız metin `warning` tonuna döner, "Limite yakın" yazılır.
 *
 * `format`: değer biçimi (sunucu bileşeni, fonksiyon prop'u serbest).
 * `role="meter"`; `aria-valuenow` ONAYDAN SONRAKİ değer, `aria-valuetext`
 * tam cümle ("Pazarlama: şu an 1.900, onayla 2.380, limit 6.000, yüzde 40").
 * Hareket yok.
 *
 *   <ImpactBar label="Pazarlama" current={1900} added={480} limit={6000} format={(n) => "$" + n.toLocaleString("tr-TR")} />
 */

export function ImpactBar({
  label,
  current,
  added,
  limit,
  format = (n) => n.toLocaleString("tr-TR"),
  warnAt = 0.9,
  className,
}: {
  label: string;
  /** O ana kadar harcanan/kullanılan. */
  current: number;
  /** Bu işlemin ekleyeceği. */
  added: number;
  /** Üst sınır (bütçe, kota). */
  limit: number;
  format?: (value: number) => string;
  /** Bu oranı (0-1) geçince metin uyarı tonuna döner. */
  warnAt?: number;
  className?: string;
}) {
  const num = (n: number) => (Number.isFinite(n) ? Math.max(n, 0) : 0);
  const cur = num(current);
  const add = num(added);
  const cap = Math.max(num(limit), 1);
  const after = cur + add;
  const over = after > cap;
  const pct = Math.round((after / cap) * 100);
  const scale = Math.max(cap, after);
  const w = (n: number) => `${(n / scale) * 100}%`;
  const near = !over && after / cap >= warnAt;
  const status = over ? "Limit aşılıyor" : near ? "Limite yakın" : "";
  const valueText = `${label}: şu an ${format(cur)}, onaylanırsa ${format(after)}, limit ${format(cap)}, yüzde ${pct}${status ? `, ${status.toLocaleLowerCase("tr-TR")}` : ""}`;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-base text-strong">{label}</span>
        <span aria-hidden className={cn("font-mono text-small tabular-nums", over ? "text-danger" : near ? "text-warning" : "text-muted")}>
          {format(cur)} → {format(after)} / {format(cap)} · %{pct}
          {status ? <span className="font-sans font-medium"> · {status}</span> : null}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={scale}
        aria-valuenow={after}
        aria-valuetext={valueText}
        className="relative mt-1.5 h-2.5 w-full overflow-visible rounded-full bg-chart-track"
      >
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          <span aria-hidden className="h-full bg-primary" style={{ width: w(cur) }} />
          <span aria-hidden className={cn("impact-bar-added h-full", over && "impact-bar-over")} style={{ width: w(add) }} />
        </div>
        {over ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-strong"
            style={{ left: w(cap) }}
          />
        ) : null}
      </div>
      <style href="ui-impact-bar" precedence="default">{`
        .impact-bar-added{background:repeating-linear-gradient(135deg,var(--primary) 0 2px,transparent 2px 5px);background-color:color-mix(in srgb,var(--primary) 28%,transparent)}
        .impact-bar-over{background:repeating-linear-gradient(135deg,var(--danger) 0 2px,transparent 2px 5px);background-color:color-mix(in srgb,var(--danger) 28%,transparent)}
      `}</style>
    </div>
  );
}
