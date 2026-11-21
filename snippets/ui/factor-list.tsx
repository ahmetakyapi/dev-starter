import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Etken listesi: bir kaydın NEDEN öne alındığını (ya da neden riskli, neden
 * pahalı olduğunu) ağırlıklı etkenlerle söyler. Başlıkta genel önem
 * (Düşük · Orta · Yüksek · Kritik, dört çubuklu sinyal), altında "etiket
 * solda, değer sağda" satırları. Clearbill istisna ekranındaki "Neden önce"
 * bloğundan alındı (yapı; kod, metin, görsel alınmadı).
 *
 * İKON KAROSU YOK: her satırın başında renkli yuvarlak karo + soluk açıklama
 * üçlüsü yorucu bir şablon; burada satır yalnız iki sütun, vurgu değerde. Bir
 * değer öne çıkacaksa `tone` ("danger", "warning") yalnız DEĞERİN rengini
 * değiştirir.
 *
 * ÖNEM RENK TEK İŞARET DEĞİL: sinyal çubukları süs (`aria-hidden`), önem
 * rozetinin metni görünür ("Kritik") ve ekran okuyucuya "Önem: Kritik" olarak
 * gider. Çubuk sayısı önem düzeyiyle aynı (1-4).
 *
 * SATIR UZUNLUĞU: bileşen en çok 28rem (`max-w-md`) genişler ve kapta SOLA
 * yaslanır. Geniş bir sütunda etiket solda, değer en sağda kalırsa göz satırı
 * izleyemez (aradaki boşluk 600px'i aşar); iki sütunlu ızgarada değer etikete
 * yakın durur. Daha geniş istersen `className="max-w-none"`.
 *
 * Yapı: `dl` > her etken `div` > `dt` (etiket, isteğe sönük ipucu dt içinde)
 * + `dd` (değer). `dd` dışında doğrudan `p` yok (axe `definition-list`).
 * `headingLevel`: başlık düzeyi (varsayılan 3). Sunucu bileşeni.
 *
 *   <FactorList
 *     title="Neden Önce" severity="critical"
 *     factors={[
 *       { label: "Fatura Değeri", value: "AED 48.500" },
 *       { label: "Ödeme Süresi", value: "2 gün içinde", tone: "danger" },
 *     ]}
 *   />
 */

export type Severity = "low" | "medium" | "high" | "critical";

const SEVERITY = {
  low: { label: "Düşük", bars: 1, bar: "bg-muted", text: "text-muted" },
  medium: { label: "Orta", bars: 2, bar: "bg-primary", text: "text-primary-ink" },
  high: { label: "Yüksek", bars: 3, bar: "bg-warning", text: "text-warning" },
  critical: { label: "Kritik", bars: 4, bar: "bg-danger", text: "text-danger" },
} as const;

const VALUE_TONE = { neutral: "text-strong", danger: "text-danger", warning: "text-warning" } as const;

export type Factor = {
  label: ReactNode;
  value: ReactNode;
  /** Etiketin altında sönük kısa açıklama. */
  hint?: ReactNode;
  tone?: keyof typeof VALUE_TONE;
};

export function FactorList({
  title,
  severity,
  factors,
  headingLevel = 3,
  className,
}: {
  title: ReactNode;
  severity: Severity;
  factors: readonly Factor[];
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const H = `h${headingLevel}` as ElementType;
  const sev = SEVERITY[severity];
  return (
    <section className={cn("min-w-0 max-w-md", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <H className="text-read font-semibold text-strong">{title}</H>
        <p className={cn("flex items-center gap-2 text-small font-semibold", sev.text)}>
          <span aria-hidden className="flex h-3.5 items-end gap-[2px]">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={cn("w-[3px] rounded-[1px]", n <= sev.bars ? sev.bar : "bg-chart-track")}
                style={{ height: `${n * 25}%` }}
              />
            ))}
          </span>
          <span>
            <span className="sr-only">Önem: </span>
            {sev.label}
          </span>
        </p>
      </div>
      <dl className="mt-2 divide-y divide-line-soft">
        {factors.map((f, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-5 py-2.5">
            <dt className="text-base text-body">
              {f.label}
              {f.hint ? <span className="block text-small text-muted">{f.hint}</span> : null}
            </dt>
            <dd className={cn("text-end text-base font-semibold tabular-nums", VALUE_TONE[f.tone ?? "neutral"])}>{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
