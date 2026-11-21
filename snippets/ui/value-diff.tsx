import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Değer karşılaştırması: aynı kimliğin iki kaynaktaki yazılışı alt alta, FARKLI
 * grup vurgulu. Fatura üzerindeki vergi numarası ile doğrulanmış tedarikçi
 * kaydı, sözleşme no ile sistem kaydı, IBAN ile bankadaki hali: "bu iki değer
 * neden tutmuyor?" sorusunun cevabı göz hizasında çıkar. Clearbill istisna
 * ekranının kanıt bloğundan alındı (yapı; kod, metin, görsel alınmadı).
 *
 * NE ZAMAN: değer uzun ve parçalara bölünebiliyorsa (numara, kod, IBAN, seri
 * no). Düz metin farkı (cümle, adres) için bu değil; orada satır satır fark
 * aracı gerekir.
 *
 * Değer `groups` olarak GELİR (ör. ["100", "3847", "2560", "0003"]); bölmeyi
 * çağıran yapar, çünkü grup sınırı alana göre değişir. Farklı gruplar
 * `diffGroups` ile açıkça verilir ya da verilmezse satırlar karşılaştırılıp
 * kendiliğinden bulunur (ilk satırdan farklı olan her indeks). Satır `tone`u
 * vurguyu boyar: `bad` (kırmızı yıkama, yanlış yazılan), `good` (yeşil yıkama,
 * doğru kayıt), `neutral`.
 *
 * RENK TEK İŞARET DEĞİL: farklı grup kalın altı çizgi taşır ve ekran
 * okuyucuya "farklı" diye okunur; ayrıca blok başında tek cümlelik özet
 * (`sr-only`): "Farklı grup 3: Faturada Yazan 2560, Doğrulanmış Kayıt 2650."
 *
 * Yapı: `dl` > her satır `div` > `dt` (etiket) + `dd` (gruplar) + isteğe `dd`
 * (not). Mono yazı, sunucu bileşeni, JavaScript yok.
 *
 *   <ValueDiff
 *     rows={[
 *       { label: "Faturada Yazan", groups: ["100", "3847", "2560", "0003"], tone: "bad", note: "Tedarikçi faturaya elle yazmış" },
 *       { label: "Doğrulanmış Kayıt", groups: ["100", "3847", "2650", "0003"], tone: "good", note: "Vergi sicilinden 3 Mart'ta doğrulandı" },
 *     ]}
 *   />
 */

export type DiffRow = {
  label: ReactNode;
  /** Değerin parçaları: bölme çağıranda. */
  groups: readonly string[];
  /** Satırın altında sönük kaynak notu ("Tedarikçi faturaya yazmış"). */
  note?: ReactNode;
  tone?: "bad" | "good" | "neutral";
};

const TONE = {
  bad: "bg-danger-wash text-danger underline decoration-danger decoration-2 underline-offset-4",
  good: "bg-success-wash text-success underline decoration-success decoration-2 underline-offset-4",
  neutral: "bg-surface-raised text-strong underline decoration-strong decoration-2 underline-offset-4",
} as const;

export function ValueDiff({
  rows,
  diffGroups,
  className,
}: {
  rows: readonly DiffRow[];
  /** Farklı grupların indeksleri (sıfırdan). Verilmezse satırlardan türetilir. */
  diffGroups?: readonly number[];
  className?: string;
}) {
  const width = rows.reduce((n, r) => Math.max(n, r.groups.length), 0);
  const diff =
    diffGroups ??
    Array.from({ length: width }, (_, i) => i).filter((i) => new Set(rows.map((r) => r.groups[i])).size > 1);
  const isDiff = new Set(diff);

  const summary =
    diff.length === 0
      ? "Değerler aynı."
      : diff
          .map(
            (i) =>
              `Farklı grup ${i + 1}: ${rows.map((r) => `${typeof r.label === "string" ? r.label : "Satır"} ${r.groups[i] ?? "yok"}`).join(", ")}.`,
          )
          .join(" ");

  return (
    <div className={cn("min-w-0", className)}>
      <p className="sr-only">{summary}</p>
      <dl className="grid gap-4">
        {rows.map((row, ri) => {
          const tone = row.tone ?? "neutral";
          return (
            <div key={ri} className="min-w-0">
              <dt className="text-small font-medium text-muted">{row.label}</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-base tabular-nums text-strong">
                {row.groups.map((g, gi) => {
                  const different = isDiff.has(gi);
                  return (
                    <span
                      key={gi}
                      className={cn(
                        "rounded-md border border-line px-2.5 py-1 bg-overlay",
                        different && cn("border-transparent", TONE[tone]),
                      )}
                    >
                      {g}
                      {different ? <span className="sr-only"> (farklı)</span> : null}
                    </span>
                  );
                })}
              </dd>
              {row.note ? <dd className="mt-1.5 text-small text-muted">{row.note}</dd> : null}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
