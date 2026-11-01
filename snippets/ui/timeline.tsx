import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Zaman çizelgesi: tarihli olayların dikey listesi (sipariş geçmişi, sürüm
 * notları, etkinlik akışı). Sunucu bileşeni.
 *
 * Sıralı liste ve her olayın zamanı `<time dateTime>`: makine okur, ekran
 * okuyucu görünen metni okur. Görünen biçimi çağıran verir ("3 Ekim",
 * "2 Saat Önce"); burada biçimleme yok, çünkü göreli zaman sunucuda ve
 * istemcide farklı çıkar (hidrasyon uyuşmazlığı).
 *
 * İŞARET ("board" dili, 2026-11): nokta, kendi tonunun yıkamasından bir
 * halkanın içinde; zemin rengine bağlı `ring-page` hilesi yok, çizelge
 * kuyuda da karoda da aynı görünür. Olayın `icon`u varsa nokta yerine
 * beyaz küçük bir karo (ikon süs, `aria-hidden`). Çizgi işaretlere
 * değmez, aralarında boşluk bırakır. Zaman sağda değil başlığın üstünde:
 * dar ekranda satır kırılmaz.
 *
 * Nokta rengi bir ton ipucu; olayın ne olduğunu başlık söyler.
 */

export type TimelineEvent = {
  id: string;
  /** ISO tarih: `dateTime` özniteliği. */
  at: string;
  /** Görünen zaman metni. */
  when: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  /** Nokta yerine küçük ikon karosu. */
  icon?: ReactNode;
};

const TONE = {
  neutral: { halo: "bg-surface-raised", dot: "bg-muted", ink: "text-muted" },
  primary: { halo: "bg-primary-wash", dot: "bg-primary", ink: "text-primary-ink" },
  success: { halo: "bg-success-wash", dot: "bg-success", ink: "text-success" },
  warning: { halo: "bg-warning-wash", dot: "bg-warning", ink: "text-warning" },
  danger: { halo: "bg-danger-wash", dot: "bg-danger", ink: "text-danger" },
} as const;

export function Timeline({ events, className }: { events: readonly TimelineEvent[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {events.map((event, index) => {
        const tone = TONE[event.tone ?? "neutral"];
        return (
          <li key={event.id} className="relative flex gap-3.5 pb-6 last:pb-0">
            {index < events.length - 1 ? (
              <span aria-hidden className="absolute top-8 bottom-1.5 left-3 w-px -translate-x-1/2 bg-line" />
            ) : null}
            {event.icon ? (
              <span
                aria-hidden
                className={cn("relative grid size-6 shrink-0 place-items-center rounded-sm border border-line bg-overlay shadow-raised [&_svg]:size-3.5", tone.ink)}
              >
                {event.icon}
              </span>
            ) : (
              <span aria-hidden className={cn("relative grid size-6 shrink-0 place-items-center rounded-full", tone.halo)}>
                <span className={cn("size-2 rounded-full", tone.dot)} />
              </span>
            )}
            <div className="min-w-0 pt-0.5">
              <time dateTime={event.at} className="block text-small font-medium text-muted tabular-nums">
                {event.when}
              </time>
              <p className="mt-0.5 text-base font-semibold text-strong">{event.title}</p>
              {event.description ? <p className="mt-1 text-base text-body">{event.description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
