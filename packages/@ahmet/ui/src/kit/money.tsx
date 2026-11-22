// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { cn } from "../utils";

/**
 * Parasal değer: tam kısım güçlü, ondalık kısım SÖNÜK ("₺54.590,00" → ",00"
 * gri). Fatura, bakiye, tahmin kartı gibi büyük ve çok sayıda tutarın yan
 * yana durduğu ekranlarda göz önce kuruşa değil liraya takılır; ondalık
 * sessiz kalınca sütun hızlı taranır. Brick ve Paymie müşteri/analiz
 * ekranlarından alındı (yapı; kod, ad, tutar alınmadı).
 *
 * Biçimleme `Intl.NumberFormat.formatToParts` ile: ondalık ayracı ve
 * kesir hanesi dilin kendisinden gelir (tr-TR "54.590,00", en-US "54,590.00"),
 * elle bölünmez. Para simgesi ve binlik ayraç güçlü kalır; yalnız
 * ondalık ayracı + kesir sönük.
 *
 * ERİŞİLEBİLİRLİK: sönüklük süs. Görünen parçalar `aria-hidden`, ekran
 * okuyucuya tam biçimli tutar tek metin gider ("54.590,00 ₺"); parçalar
 * ayrı okunmaz. Kesir sönüğü `text-muted` değil `text-body` tonunda
 * (küçük puntoda muted AA altı kalıyor): fark kalınlıkla (`font-normal`)
 * ve tonla verilir.
 *
 * `tone`: tutarın RENGİ ("danger" gecikmiş bakiye). Renk tek işaret değil:
 * yanına "Gecikmiş" gibi bir etiket koymak çağıranın işi. Sayı yoksa ya da
 * sonsuzsa "—" (uydurma "0,00" yazılmaz). `fractionless`: tam sayıya
 * yuvarlanmış kartlarda kesri hiç yazma.
 *
 *   <Money value={54590} currency="TRY" className="text-heading" />
 *   <Money value={8352} currency="USD" tone="danger" locale="en-US" />
 */

const TONE = { neutral: "text-strong", danger: "text-danger", success: "text-success" } as const;

export function Money({
  value,
  currency = "TRY",
  locale = "tr-TR",
  fractionless = false,
  tone = "neutral",
  className,
}: {
  value: number | null | undefined;
  /** ISO 4217 kodu: "TRY", "USD", "EUR". */
  currency?: string;
  locale?: string;
  fractionless?: boolean;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return (
      <span className={cn("tabular-nums text-body", className)}>
        <span aria-hidden>—</span>
        <span className="sr-only">Tutar yok</span>
      </span>
    );
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionless ? 0 : 2,
    maximumFractionDigits: fractionless ? 0 : 2,
  });
  const parts = formatter.formatToParts(value);
  // Ondalık ayracı + kesir tek sönük öbek; aralarına başka parça girmez.
  const muted = new Set(["decimal", "fraction"]);

  return (
    <span className={cn("font-semibold tracking-tight tabular-nums", TONE[tone], className)}>
      <span className="sr-only">{formatter.format(value)}</span>
      <span aria-hidden>
        {parts.map((part, i) =>
          muted.has(part.type) ? (
            <span key={i} className="font-normal text-body">
              {part.value}
            </span>
          ) : (
            part.value
          ),
        )}
      </span>
    </span>
  );
}
