// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";
import { SERIES_BG, type Series } from "./chart-card";

/**
 * Sıradakiler listesi: yaklaşan işlerin (otomasyon çalışması, toplantı,
 * yayın) zaman sırasıyla dikey dökümü. Solda saat ve gün, ortada ince renkli
 * çubuk, sağda başlık ile tek satır açıklama, en sağda uygulama ikonları.
 * baobun.studio panosunun "Coming up" bloğu; kod alınmadı. Sunucu bileşeni.
 *
 * NE ZAMAN DEĞİL: geçmiş olay akışı `timeline`; saat ızgarasında çakışmalar
 * `week-calendar`. Bu bileşen yalnız "sırada ne var"ı söyler, düzenleme yok.
 *
 * Çubuk rengi bir gruplama ipucu (aynı otomasyon aynı renk, grafikteki
 * seriyle eşleşir); anlam başlıkta. `<time dateTime>` saati taşır; gün
 * etiketi ("Bugün", "Per 19") görünen metin, çağıran biçimler (göreli zaman
 * sunucuyla istemcide farklı çıkar). `href` verilirse satırın tamamı
 * bağlantıdır ve ikonlar `aria-hidden` kalır.
 *
 *   <ScheduleList items={[{ id: "a", at: "2026-11-19T08:00", time: "08:00",
 *     day: "Per 19", title: "Haftalık özet", detail: "#ürün kanalına yazar", color: 3 }]} />
 */

export type ScheduleItem = {
  id: string;
  /** ISO tarih-saat: `dateTime`. */
  at: string;
  /** Görünen saat: "08:00". */
  time: string;
  /** Görünen gün: "Bugün", "Per 19". */
  day: string;
  title: ReactNode;
  detail?: ReactNode;
  color?: Series;
  /** Sağda küçük uygulama ikonları (süs). */
  apps?: ReactNode;
  href?: string;
};

export function ScheduleList({ items, label, className }: { items: readonly ScheduleItem[]; label?: string; className?: string }) {
  return (
    // `role="list"`: Safari/VoiceOver `list-style: none` olan listeyi liste saymaz.
    <ul role="list" aria-label={label} className={cn("divide-y divide-line-soft", className)}>
      {items.map((item) => {
        const body = (
          <>
            <time dateTime={item.at} className="w-14 shrink-0">
              <span className="block font-mono text-small font-medium text-strong tabular-nums">{item.time}</span>
              <span className="block text-micro text-muted">{item.day}</span>
            </time>
            <span aria-hidden className={cn("w-0.5 self-stretch rounded-full", item.color ? SERIES_BG[item.color - 1] : "bg-line-strong")} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-medium text-strong">{item.title}</span>
              {item.detail ? <span className="block truncate text-small text-muted">{item.detail}</span> : null}
            </span>
            {item.apps ? (
              <span aria-hidden className="flex shrink-0 items-center gap-1 [&_svg]:size-5">
                {item.apps}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <a href={item.href} className="-mx-2 flex min-h-11 items-center gap-3 rounded-md px-2 py-3 hover:bg-surface">
                {body}
              </a>
            ) : (
              <div className="flex items-center gap-3 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
