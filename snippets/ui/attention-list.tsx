import { AlertTriangle, Clock, OctagonAlert } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Dikkat listesi: "Şimdi bakman gerekenler" ve "Bugün başlayanlar" gibi
 * kısa, işlem odaklı satırlar. Her satırda KİM/NE (başlık + konu), NE
 * SORUN (ikonlu durum metni: "Gecikti · vade 27 Eki · %75 tamam") ve
 * mümkünse TEK TIKLA ÇÖZÜM ("Tarihleri düzelt"). Proje panosu, onay
 * kuyruğu, saha takvimi, sipariş panosunun üst şeridi. Brick zaman
 * çizelgesinin "Needs attention / Starts today" bloklarından alındı
 * (yapı; kod, ad, veri alınmadı).
 *
 * `status-list.tsx` ile farkı: o ürünün sistem bileşenlerini listeler
 * (çalışıyor/kesinti). Bu ise iş KAYITLARI için ve her satır bir eylem
 * önerir; durum cümlesi satır başına serbest metin.
 *
 * RENK TEK İŞARET DEĞİL: durum metni ve ikon aynı şeyi söyler
 * (`tone`: danger → ikon + "Gecikti", warning → "Geçersiz tarih",
 * neutral → saat). İkon süs (`aria-hidden`), durum cümlesi görünür metin.
 * Başlıkta SAYAÇ ("Dikkat Gerekenler 4") listedeki satır sayısından
 * TÜRER, elle yazılmaz: başlıkla liste çelişemez.
 *
 * EYLEM yuvası (`action`): bağlantı ya da buton ver (`<a href>`,
 * `<button>`); bileşen yalnız görünümünü (altı çizili, vurgu rengi)
 * verir, davranış çağıranın. Sunucu bileşeni; olay işleyicisi almaz.
 *
 * BOŞ LİSTE: `emptyText` ("Şu an dikkat gerektiren bir şey yok.") yazılır;
 * bu tek yer "her şey yolunda" demenin güvenli olduğu yer DEĞİL: yalnız
 * VERİ GELDİ ve boşsa ver. Yükleniyorsa `skeleton.tsx`, hata varsa
 * `banner-alert.tsx`. `emptyText` verilmezse boş liste hiçbir şey çizmez.
 *
 *   <AttentionList
 *     title="Dikkat Gerekenler"
 *     items={[
 *       { id: "1", title: "Boya", subject: "Ada Yılmaz", tone: "danger", detail: "Gecikti · vade 27 Eki · %75 tamam" },
 *       { id: "2", title: "Kapı Montajı", tone: "warning", detail: "Geçersiz tarih · 5 Kas – 12 Eki",
 *         action: <a href="/projeler/2/tarih">Tarihleri düzelt</a> },
 *     ]}
 *   />
 */

const TONE = {
  danger: { ink: "text-danger", icon: OctagonAlert },
  warning: { ink: "text-warning", icon: AlertTriangle },
  neutral: { ink: "text-body", icon: Clock },
} as const;

export type AttentionItem = {
  id: string;
  title: ReactNode;
  /** Başlığın yanında sönük: müşteri, proje, atanan kişi. */
  subject?: ReactNode;
  /** Satırın başında: avatar ya da küçük görsel. */
  leading?: ReactNode;
  tone?: keyof typeof TONE;
  /** Özel ikon; verilmezse tona göre. nedene özel ikon için (takvim, kilit). */
  icon?: ReactNode;
  /** Durum cümlesi: görünür metin, renk tek işaret değil. */
  detail: ReactNode;
  action?: ReactNode;
};

export function AttentionList({
  title,
  items,
  emptyText,
  headingLevel = 3,
  className,
}: {
  title: ReactNode;
  items: readonly AttentionItem[];
  emptyText?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  if (items.length === 0 && !emptyText) return null;
  const H = `h${headingLevel}` as ElementType;
  return (
    <section className={cn("min-w-0", className)}>
      <H className="flex items-center gap-2 text-read font-semibold text-strong">
        {title}
        {items.length > 0 ? (
          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-small font-semibold text-body tabular-nums">
            {items.length}
            <span className="sr-only"> kayıt</span>
          </span>
        ) : null}
      </H>
      {items.length === 0 ? (
        <p className="mt-2 text-base text-body">{emptyText}</p>
      ) : (
        <ul className="mt-1 divide-y divide-line-soft">
          {items.map((item) => {
            const tone = TONE[item.tone ?? "neutral"];
            const Glyph = tone.icon;
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                {item.leading}
                <p className="min-w-0 flex-1 basis-40 text-base text-strong">
                  <span className="font-medium">{item.title}</span>
                  {item.subject ? <span className="ms-2 text-body">{item.subject}</span> : null}
                </p>
                <p className={cn("flex min-w-0 items-center gap-1.5 text-small", tone.ink)}>
                  {item.icon ?? <Glyph aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />}
                  <span className="min-w-0">{item.detail}</span>
                </p>
                {item.action ? (
                  <span className="shrink-0 text-small font-medium text-primary-ink [&_a]:underline [&_a]:underline-offset-4 [&_button]:underline [&_button]:underline-offset-4">
                    {item.action}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
