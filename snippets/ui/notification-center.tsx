"use client";

import { Popover as Base } from "@base-ui/react/popover";
import { Bell, BellOff, CheckCheck, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Bildirim merkezi: üst çubuktaki zil + açılır liste. Kullanıcının
 * yokluğunda olanlar (yorum, atama, ödeme) burada birikir; anlık sonuç
 * bildirimi `toast`, sayfanın kendi durumu `banner-alert`.
 *
 * ZİL: `aria-label` sayıyı da söyler ("Bildirimler, 3 okunmamış"); görünen
 * rozet `aria-hidden`. Rozet 9'dan sonra "9+": büyük sayı bilgi değil
 * gürültü. Rozet yanıp sönmez, büyüyüp küçülmez.
 *
 * LİSTE: güne göre gruplu (Bugün / Dün / Bu Hafta / Daha Önce), her grup
 * kendi başlığıyla `ul` (ekran okuyucu başlıklar arasında atlar). Satır
 * bir düğme: tıklamak okundu işaretler ve `onOpen` ile hedefe götürür.
 * Okunmamış satırda başlık kalın + sağda nokta + gizli "Okunmadı" metni:
 * renk tek işaret değil.
 *
 * GÖRELİ ZAMAN `tr-TR`: "Az önce", "3 dk önce", "2 sa önce", "Dün 14:20",
 * "4 gün önce", sonra "12 Eki". Zaman AÇILIŞ ANINDA hesaplanır (render'da
 * `Date.now()` hem saf değil hem hidrasyonda sunucuyla çelişir); liste
 * yalnızca açıkken çizildiği için uyumsuzluk riski yok. `<time dateTime>`
 * makine-okunur tarihi taşır.
 *
 * Durum çağıranda: `items` + `onMarkRead(ids)`. Gerçek uygulamada
 * okundu bilgisi sunucuya yazılır, bileşen yalnızca söyler.
 *
 * Boş durum: ikon + tek cümle, düğme yok (yapılacak bir şey yok).
 */

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  /** ISO tarih ya da Date. */
  at: string | Date;
  read: boolean;
  /** Kişiden geliyorsa ad (baş harf avatarı), sistemse ikon. */
  actor?: string;
  icon?: LucideIcon;
};

type NotificationCenterProps = {
  items: readonly NotificationItem[];
  onMarkRead: (ids: string[]) => void;
  onOpen?: (item: NotificationItem) => void;
  className?: string;
};

const DAY = 86_400_000;
const num = new Intl.NumberFormat("tr-TR");
const clock = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });
const short = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function relative(at: Date, now: number) {
  const diff = Math.max(0, now - at.getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Az önce";
  if (min < 60) return `${num.format(min)} dk önce`;
  const today = startOfDay(now);
  if (at.getTime() >= today) return `${num.format(Math.floor(min / 60))} sa önce`;
  if (at.getTime() >= today - DAY) return `Dün ${clock.format(at)}`;
  const days = Math.round((today - startOfDay(at.getTime())) / DAY);
  if (days < 7) return `${num.format(days)} gün önce`;
  return short.format(at);
}

function groupOf(at: Date, now: number) {
  const today = startOfDay(now);
  const t = at.getTime();
  if (t >= today) return "Bugün";
  if (t >= today - DAY) return "Dün";
  if (t >= today - 6 * DAY) return "Bu Hafta";
  return "Daha Önce";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts.at(-1)![0]] : [parts[0]?.[0] ?? "?"];
  return letters.join("").toLocaleUpperCase("tr-TR");
}

const ORDER = ["Bugün", "Dün", "Bu Hafta", "Daha Önce"] as const;

export function NotificationCenter({ items, onMarkRead, onOpen, className }: NotificationCenterProps) {
  const [now, setNow] = useState(0);
  const uid = useId();
  const unread = items.filter((item) => !item.read);
  const badge = unread.length > 9 ? "9+" : num.format(unread.length);
  // Ad görünen rozeti İÇERİR ("9+" ise "9+"): sesle komut veren kullanıcı ekranda
  // gördüğünü söyler (WCAG 2.5.3, axe label-content-name-mismatch).
  const triggerLabel = unread.length ? `Bildirimler, ${badge} okunmamış` : "Bildirimler";

  const groups = ORDER.map((name) => ({
    name,
    list: [...items]
      .map((item) => ({ ...item, date: new Date(item.at) }))
      .filter((item) => groupOf(item.date, now) === name)
      .sort((a, b) => b.date.getTime() - a.date.getTime()),
  })).filter((group) => group.list.length > 0);

  return (
    <Base.Root onOpenChange={(open) => open && setNow(Date.now())}>
      <Base.Trigger
        aria-label={triggerLabel}
        className={cn(
          "relative inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-body transition-[background-color,color] hover:bg-surface-raised hover:text-strong data-popup-open:bg-surface-raised data-popup-open:text-strong pointer-fine:size-10",
          className,
        )}
      >
        <Bell aria-hidden className="size-[1.125rem]" strokeWidth={1.75} />
        {unread.length ? (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-micro leading-none font-bold text-on-primary tabular-nums ring-2 ring-page"
          >
            {badge}
          </span>
        ) : null}
      </Base.Trigger>

      <Base.Portal>
        <Base.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="z-50">
          <Base.Popup className="flex max-h-[min(32rem,var(--available-height))] w-[min(24rem,calc(100vw-1.5rem))] origin-(--transform-origin) flex-col overflow-hidden rounded-xl border border-line-strong bg-overlay text-body shadow-modal outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0">
            <div className="flex items-center justify-between gap-3 border-b border-line-soft py-2 pr-2 pl-4">
              <Base.Title className="text-base font-semibold text-strong">
                Bildirimler
                {unread.length ? (
                  <span className="ml-2 rounded-full bg-primary-wash px-1.5 py-0.5 text-micro font-semibold text-primary-ink tabular-nums">
                    {num.format(unread.length)} yeni
                  </span>
                ) : null}
              </Base.Title>
              <button
                type="button"
                disabled={!unread.length}
                onClick={() => onMarkRead(unread.map((item) => item.id))}
                className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-small font-medium text-primary-ink transition-[background-color,opacity] hover:bg-primary-wash disabled:pointer-events-none disabled:opacity-40 pointer-fine:min-h-8"
              >
                <CheckCheck aria-hidden className="size-3.5" strokeWidth={2} />
                Tümünü Okundu İşaretle
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="grid place-items-center gap-2 px-6 py-12 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-surface text-muted">
                  <BellOff aria-hidden className="size-[1.125rem]" strokeWidth={1.75} />
                </span>
                <p className="text-base font-medium text-strong">Bildirim Yok</p>
                <p className="text-small text-muted">Biri sizi andığında ya da bir iş bittiğinde burada görünür.</p>
              </div>
            ) : (
              <div className="overflow-y-auto overscroll-contain p-1.5">
                {groups.map((group) => {
                  const headingId = `${uid}-${ORDER.indexOf(group.name)}`;
                  return (
                    <section key={group.name} aria-labelledby={headingId} className="pb-1">
                      <h3 id={headingId} className="px-2.5 pt-2 pb-1 text-micro font-semibold text-muted">
                        {group.name}
                      </h3>
                      <ul className="grid gap-0.5">
                        {group.list.map((item) => (
                          <li key={item.id}>
                            <Row
                              item={item}
                              date={item.date}
                              now={now}
                              onClick={() => {
                                if (!item.read) onMarkRead([item.id]);
                                onOpen?.(item);
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

function Row({ item, date, now, onClick }: { item: NotificationItem; date: Date; now: number; onClick: () => void }) {
  const Glyph = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-surface [&:focus-visible]:outline-offset-[-2px]"
    >
      {item.actor ? (
        <span
          aria-hidden
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary-wash text-micro font-semibold text-primary-ink"
        >
          {initials(item.actor)}
        </span>
      ) : (
        <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-surface-raised text-body">
          {Glyph ? <Glyph className="size-4" strokeWidth={1.75} /> : <Bell className="size-4" strokeWidth={1.75} />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block text-base", item.read ? "text-body" : "font-semibold text-strong")}>
          {!item.read ? <span className="sr-only">Okunmadı: </span> : null}
          {item.title}
        </span>
        {item.body ? <span className="mt-0.5 line-clamp-2 block text-small text-muted">{item.body}</span> : null}
        <time dateTime={date.toISOString()} className="mt-1 block text-micro text-muted tabular-nums">
          {relative(date, now)}
        </time>
      </span>
      <span
        aria-hidden
        className={cn("mt-2 size-2 shrink-0 rounded-full transition-opacity", item.read ? "opacity-0" : "bg-primary")}
      />
    </button>
  );
}
