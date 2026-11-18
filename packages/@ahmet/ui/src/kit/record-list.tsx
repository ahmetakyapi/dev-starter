// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Kayıt listesi: tablonun TELEFONDAKİ hali. Her satır bir kart: solda
 * görsel ya da avatar, başlık + alt satır, sağda tutar ya da tarih; altında
 * durum ve kişiler. Sunucu bileşeni (durum yok; `onSelect` çağıran istemci
 * bileşeninden gelebilir).
 *
 * NE ZAMAN: `data-table.tsx` geniş ekranda kalır, bu liste dar ekranda onun
 * yerine geçer (`<DataTable className="max-md:hidden" />` +
 * `<RecordList className="md:hidden" />`). Altı sütunlu bir tabloyu
 * telefonda yana kaydırmak okuru her satırda iki kez kaydırtır ve
 * başlığı sütundan koparır; kart aynı veriyi bir bakışta okutur.
 * NE ZAMAN DEĞİL: sütunlar arası karşılaştırmanın asıl iş olduğu tablo
 * (fiyat listesi, rapor) telefonda da tablo kalır; orada `data-table`ın
 * yapışkan ilk sütunu doğru çözüm.
 *
 * Yöntem Assetora turundan (2026-11; davranış, kod değil): üç kat bilgi
 * (ne · ne zaman ve hangi durumda · kim), saç çizgisiyle ayrılmış satırlar,
 * tutar sağda `tabular-nums`.
 *
 * Erişilebilirlik: `ul` + adı (`label`); satırın ana eylemi BAŞLIK
 * (buton ya da bağlantı), kartın tamamı ona genişletilmiş tıklama alanı
 * (`after:inset-0`), yani ekran okuyucu satır başına tek eylem duyar ve
 * içteki başka butonlar (`actions`) tıklanabilir kalır. Kişiler satırı
 * "Atanan: Ahmet" diye okunur; avatar süstür.
 *
 * Örnek:
 *   <RecordList label="Talepler" items={rows.map((t) => ({
 *     id: t.id, title: t.subject, subtitle: `${t.id} · ${t.customer}`,
 *     value: dateTime(t.date), status: <Badge dot>{t.status}</Badge>,
 *     people: [{ role: "Atanan", name: t.owner }], onSelect: () => open(t.id),
 *   }))} />
 */

export type RecordPerson = { role: string; name: string; avatar?: ReactNode };

export type RecordItem = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Solda: görsel, avatar ya da ikon karosu (≈ 40-48 px). */
  leading?: ReactNode;
  /** Sağ üst: tutar, tarih. `tabular-nums` ile basılır. */
  value?: ReactNode;
  /** İkinci satırın solu: "Geldi 2 Kas, 10:12". */
  meta?: ReactNode;
  /** İkinci satırın sağı: durum rozetleri. */
  status?: ReactNode;
  /** Üçüncü satır: "Atanan ● Ahmet · Müşteri ● Deniz". */
  people?: readonly RecordPerson[];
  /** Kartın sağında başlıktan bağımsız ikincil eylem (seçim kutusu, menü). */
  actions?: ReactNode;
  /** Ana eylem: başlık buton olur. `href` verilirse bağlantı. */
  onSelect?: () => void;
  href?: string;
};

type RecordListProps = {
  items: readonly RecordItem[];
  /** Listenin adı: "Talepler". */
  label: string;
  className?: string;
};

export function RecordList({ items, label, className }: RecordListProps) {
  return (
    <ul aria-label={label} className={cn("divide-y divide-line-soft", className)}>
      {items.map((item) => {
        const stretch = "text-start after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-line-focus";
        const title = (
          <span className="block truncate text-base font-semibold text-strong">{item.title}</span>
        );
        return (
          <li key={item.id} className="relative flex gap-3 px-4 py-4 transition-colors duration-150 hover:bg-surface">
            {item.leading ? <div className="shrink-0">{item.leading}</div> : null}
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {item.href ? (
                    <a href={item.href} className={cn("block min-w-0", stretch)}>
                      {title}
                    </a>
                  ) : item.onSelect ? (
                    <button type="button" onClick={item.onSelect} className={cn("block w-full min-w-0", stretch)}>
                      {title}
                    </button>
                  ) : (
                    title
                  )}
                  {item.subtitle ? <p className="mt-0.5 truncate text-small text-muted">{item.subtitle}</p> : null}
                </div>
                {item.value ? <div className="shrink-0 text-base font-semibold text-strong tabular-nums">{item.value}</div> : null}
              </div>
              {item.meta || item.status ? (
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  {item.meta ? <p className="text-small text-muted tabular-nums">{item.meta}</p> : <span />}
                  {item.status ? <div className="flex flex-wrap items-center gap-1.5">{item.status}</div> : null}
                </div>
              ) : null}
              {item.people?.length ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
                  {item.people.map((person) => (
                    <span key={person.role} className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="text-muted">{person.role}<span className="sr-only">:</span></span>
                      {person.avatar ? <span aria-hidden className="inline-flex">{person.avatar}</span> : null}
                      <span className="truncate font-medium text-body">{person.name}</span>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
            {/* İkincil eylem genişletilmiş tıklama alanının ÜSTÜNDE kalsın. */}
            {item.actions ? <div className="relative z-10 shrink-0 self-center">{item.actions}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
