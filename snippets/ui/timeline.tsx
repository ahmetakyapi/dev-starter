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
};

const DOT = {
  neutral: "bg-line-strong",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

export function Timeline({ events, className }: { events: readonly TimelineEvent[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < events.length - 1 ? (
            <span aria-hidden className="absolute top-4 bottom-0 left-[0.3125rem] w-px bg-line" />
          ) : null}
          <span aria-hidden className={cn("relative mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-page", DOT[event.tone ?? "neutral"])} />
          <div className="min-w-0">
            <time dateTime={event.at} className="block text-small font-medium text-muted tabular-nums">
              {event.when}
            </time>
            <p className="mt-0.5 text-base font-semibold text-strong">{event.title}</p>
            {event.description ? <p className="mt-1 text-base text-body">{event.description}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
