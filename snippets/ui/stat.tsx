import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ölçü: etiket + değer + değişim. Sunucu bileşeni.
 *
 * RENK TEK AYIRT EDİCİ DEĞİL. Değişim üç kanaldan söylenir: işaret (+ / −),
 * ok ve renk. Renk körlüğü olan okuyucu ya da gri tonlu bir çıktı yönü yine
 * okur; ekran okuyucu "artış" / "düşüş" kelimesini duyar.
 *
 * Eksi işareti kısa çizgi değil gerçek eksi (U+2212): rakam genişliğinde,
 * `tabular-nums` sütununda hizayı bozmaz.
 *
 * `positiveIsGood={false}`: artışın kötü haber olduğu ölçülerde (gider,
 * hata oranı, gecikme) renk ters döner; işaret ve ok aynı kalır, çünkü onlar
 * yönü söyler, yargıyı değil.
 *
 * Her `Stat` bir `dt` + `dd` çifti: `StatGrid` (bir `dl`) içinde kullan;
 * ekran okuyucu etiketle değeri eşleşmiş okur.
 *
 * Değer ve birim ayrı (`unit`): birim küçük puntoda, sayıdan kopmasın diye
 * aralarında bölünmez boşluk.
 */

type StatProps = {
  /** Title Case etiket: "Aylık Gelir". */
  label: ReactNode;
  /** Biçimlenmiş değer: "1.240.000". Biçimleme çağıranın işi (tr-TR). */
  value: ReactNode;
  unit?: ReactNode;
  /** Yüzde değişim, ham sayı: 2.4 → "+%2,4". `null`: değişim yok. */
  change?: number | null;
  /** Değişimin neye göre olduğu: "Geçen Aya Göre". */
  changeLabel?: ReactNode;
  positiveIsGood?: boolean;
  /** Ondalık basamak sayısı. */
  digits?: number;
  size?: "md" | "lg";
  className?: string;
};

const percent = (value: number, digits: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(value));

export function Stat({
  label,
  value,
  unit,
  change,
  changeLabel,
  positiveIsGood = true,
  digits = 1,
  size = "md",
  className,
}: StatProps) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const rounded = hasChange ? Number(change.toFixed(digits)) : 0;
  const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const good = direction === "flat" ? null : (direction === "up") === positiveIsGood;
  const Glyph = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const sign = direction === "up" ? "+" : direction === "down" ? "−" : "";
  const spoken = direction === "up" ? "artış" : direction === "down" ? "düşüş" : "değişim yok";

  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-small font-medium text-muted">{label}</dt>
      <dd className="mt-1.5">
        <span className={cn("font-semibold tracking-tight text-strong tabular-nums", size === "lg" ? "text-display" : "text-heading")}>
          {value}
          {unit ? <span className="text-base font-medium text-muted">{" "}{unit}</span> : null}
        </span>
        {hasChange ? (
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-small">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-semibold tabular-nums",
                good === true && "bg-success-wash text-success",
                good === false && "bg-danger-wash text-danger",
                good === null && "bg-surface-raised text-muted",
              )}
            >
              <Glyph aria-hidden className="size-3.5" strokeWidth={2} />
              <span className="sr-only">{spoken}: </span>
              {sign}%{percent(rounded, digits)}
            </span>
            {changeLabel ? <span className="text-muted">{changeLabel}</span> : null}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/**
 * Ölçü ızgarası: `dl`. Yan yana duran ölçüler AYNI HATTA biter (ızgara
 * satırı), sütun sayısı genişliğe göre.
 */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]", className)}>{children}</dl>;
}
