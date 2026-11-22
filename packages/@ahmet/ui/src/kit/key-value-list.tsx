// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ElementType, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Anahtar–değer listesi: bir kaydın alanları ("Kaynak: Facebook Reklamı",
 * "Oluşturan: Evan Howard · 14 Mart"), bir raporun satırları ("Çeyrekte
 * Kapanan: 3"), bir dışa aktarım paketinin içeriği. Etiket solda, değer
 * sağda, saç çizgisiyle ayrılmış satırlar. Sunucu bileşeni.
 *
 * `factor-list.tsx` ile farkı: o bir kaydın NEDEN öne alındığını söyler
 * (önem sinyali başlıkta); bu NÖTR bir alan listesi. Ayrıca satırın
 * sonuna eylem yuvası (`action`: kopyala butonu, "Düzenle" bağlantısı) ve
 * değer tonları (başarı, uyarı, tehlike) var. Noticeline ve Brick
 * ekranlarından alındı (yapı).
 *
 * ETİKET UZUNSA değer alta iner (`stacked`): dar yan panelde ("Teslimat
 * Adresi" + üç satırlık adres) iki sütun değeri sıkıştırırdı. `layout`:
 * `split` (etiket solda, değer sağda; varsayılan) ya da `stacked` (etiket
 * üstte küçük, değer altta; telefon ve yan panel).
 *
 * `mono`: değer sabit genişlikli (sipariş no, IBAN, kimlik). `tone`
 * yalnız DEĞERİN rengini değiştirir; renk tek işaret değil, değer metni
 * durumu zaten söyler ("Gecikmiş", "3 gün kaldı").
 *
 * Yapı: `dl > div > dt + dd`; başlık verilirse `section` ve başlığıyla
 * adlanır (`headingLevel`). Satır sonu eylemi `dd` içinde, değerle
 * birlikte okunur. Boş liste hiçbir şey çizmez (boş `dl` ekran okuyucuya
 * anlamsız bir "liste" olurdu).
 *
 *   <KeyValueList
 *     title="Hesap"
 *     items={[
 *       { label: "Kaynak", value: "Facebook Reklamı" },
 *       { label: "Sipariş No", value: "INV-3105", mono: true, action: <CopyButton value="INV-3105" /> },
 *       { label: "Bakiye", value: "6.432,00 ₺", tone: "danger" },
 *     ]}
 *   />
 */

const TONE = { neutral: "text-strong", success: "text-success", warning: "text-warning", danger: "text-danger" } as const;

export type KeyValueItem = {
  label: ReactNode;
  value: ReactNode;
  /** Etiketin altında sönük kısa açıklama (split düzende). */
  hint?: ReactNode;
  tone?: keyof typeof TONE;
  mono?: boolean;
  /** Satır sonu eylemi: kopyala, düzenle. Değerle birlikte okunur. */
  action?: ReactNode;
};

export function KeyValueList({
  items,
  title,
  headingLevel = 3,
  titleAction,
  layout = "split",
  className,
}: {
  items: readonly KeyValueItem[];
  title?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  /** Başlığın sağında: "Not Ekle" bağlantısı gibi. */
  titleAction?: ReactNode;
  layout?: "split" | "stacked";
  className?: string;
}) {
  if (items.length === 0) return null;
  const H = `h${headingLevel}` as ElementType;
  const list = (
    <dl className="divide-y divide-line-soft">
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "py-2.5",
            layout === "split" ? "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-5" : "flex flex-col gap-0.5",
          )}
        >
          <dt className={cn(layout === "split" ? "text-base text-body" : "text-small font-medium text-muted")}>
            {item.label}
            {item.hint && layout === "split" ? <span className="block text-small text-muted">{item.hint}</span> : null}
          </dt>
          <dd
            className={cn(
              "flex min-w-0 items-center gap-2 text-base font-semibold tabular-nums",
              layout === "split" && "justify-end text-end",
              item.mono && "font-mono text-small font-medium",
              TONE[item.tone ?? "neutral"],
            )}
          >
            <span className="min-w-0 break-words">{item.value}</span>
            {item.action ? <span className="shrink-0 font-normal">{item.action}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );

  if (!title) return <div className={cn("min-w-0", className)}>{list}</div>;
  return (
    <section className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <H className="text-read font-semibold text-strong">{title}</H>
        {titleAction ? <div className="shrink-0 text-small">{titleAction}</div> : null}
      </div>
      <div className="mt-1">{list}</div>
    </section>
  );
}
