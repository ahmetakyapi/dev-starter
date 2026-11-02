"use client";

import { PreviewCard as Base } from "@base-ui/react/preview-card";
import { useId, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Önizleme kartı: bir BAĞLANTININ ardındakini, oraya gitmeden göstermek
 * (yorumdaki @ad, atanan kişi, ekip üyesi, proje bağlantısı). Kart EK
 * bilgidir: aynı bilgi bağlantının gittiği sayfada da olmalı. Açıklama ya
 * da etiket için `tooltip.tsx`; içinde form/seçim olan kutu için
 * `popover.tsx`.
 *
 * HEADLESS KATMAN Base UI Preview Card: fareyle 500 ms bekleyince açılır,
 * imleç karta geçince açık kalır, çıkınca 250 ms sonra kapanır; klavye
 * odağı da açar, Escape kapatır. Konumlama ve çarpışma Floating UI'dan.
 *
 * DOKUNMATİK: Base UI kartı yalnız fareyle açar (dokunuş bağlantıyı
 * izlerdi, kart hiç görünmezdi). Burada İLK DOKUNUŞ kartı açar, ikinci
 * dokunuş bağlantıya gider; dışarı dokunmak kapatır. Fare ve klavye
 * davranışı değişmez.
 *
 * İÇİNDE ETKİLEŞİM YOK sayılır: kart odak tuzağı kurmaz, Tab ile içine
 * girilmez. Kartın içine "Takip Et" gibi tek yolu olan bir eylem koyma;
 * eylem bağlantının gittiği sayfada.
 *
 * GÖRÜNÜŞ ("board" dili): beyaz karo `bg-overlay` + kıl çizgisi +
 * `shadow-modal`, `rounded-xl`; istatistikler gri kuyu içinde (`bg-surface`
 * şeridi, kart içinde kart değil: tek seviye). Giriş 0,96'dan ölçek +
 * opaklık, kaynağı tetikleyici; hareket azaltmada yalnız opaklık.
 *
 *   <HoverCard href="/ekip/ayse-kaya" trigger="Ayşe Kaya">
 *     <ProfilePreview name="Ayşe Kaya" role="Ürün Tasarımcısı" handle="@aysekaya"
 *       stats={[{ label: "Proje", value: 12 }, { label: "İnceleme", value: 248 }]} />
 *   </HoverCard>
 */

type HoverCardProps = {
  /** Bağlantının görünen metni. */
  trigger: ReactNode;
  href: string;
  /** Kartın içeriği (çoğu zaman `ProfilePreview`). */
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Fareyle açılma gecikmesi (ms). */
  delay?: number;
  closeDelay?: number;
  /** Bağlantının sınıfı; varsayılan altı çizili satır içi bağlantı. */
  triggerClassName?: string;
  /** Kartın genişliği vb. */
  className?: string;
  defaultOpen?: boolean;
};

export function HoverCard({
  trigger,
  href,
  children,
  side = "bottom",
  align = "start",
  delay = 500,
  closeDelay = 250,
  triggerClassName,
  className,
  defaultOpen = false,
}: HoverCardProps) {
  const triggerId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const pointer = useRef<string>("mouse");

  return (
    <Base.Root open={open} onOpenChange={setOpen} triggerId={triggerId}>
      <Base.Trigger
        id={triggerId}
        href={href}
        delay={delay}
        closeDelay={closeDelay}
        onPointerDown={(event) => {
          pointer.current = event.pointerType;
        }}
        onClick={(event) => {
          // Dokunmatikte ilk dokunuş kartı açar; açıkken dokunuş bağlantıya gider.
          if (pointer.current === "touch" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "rounded-[0.25rem] font-semibold text-strong underline decoration-line-strong decoration-1 underline-offset-[0.2em] transition-colors hover:decoration-primary data-popup-open:decoration-primary",
          triggerClassName,
        )}
      >
        {trigger}
      </Base.Trigger>
      <Base.Portal>
        <Base.Positioner side={side} align={align} sideOffset={8} collisionPadding={12} className="z-50">
          <Base.Popup
            className={cn(
              "w-[min(20rem,var(--available-width))] rounded-xl border border-line bg-overlay p-4 text-body shadow-modal outline-none",
              "origin-(--transform-origin) transition-[opacity,scale] duration-200 ease-[var(--ease-brand)] data-ending-style:duration-150",
              "data-starting-style:opacity-0 data-ending-style:opacity-0 motion-safe:data-starting-style:scale-[0.96] motion-safe:data-ending-style:scale-[0.96]",
              className,
            )}
          >
            {children}
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

type Stat = { label: string; value: number | string };

type ProfilePreviewProps = {
  name: string;
  role?: ReactNode;
  /** "@kullanici" ya da e-posta. */
  handle?: string;
  avatarSrc?: string | null;
  /** Bir iki cümlelik tanım. */
  bio?: ReactNode;
  /** En çok 3; sayılar `tr-TR` biçimlenir. */
  stats?: readonly Stat[];
  /** Alt satır: "Ankara · Katılım Mart 2024" gibi. */
  meta?: ReactNode;
  /** Sağ üstte durum: `<Badge>Çevrimiçi</Badge>` gibi. */
  badge?: ReactNode;
};

/** Kişi önizlemesi: avatar, ad, rol, kısa tanım, istatistik şeridi. */
export function ProfilePreview({ name, role, handle, avatarSrc, bio, stats, meta, badge }: ProfilePreviewProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-3">
        <Avatar name={name} src={avatarSrc} size="lg" />
        <div className="grid min-w-0 flex-1 gap-0.5 pt-1">
          <p className="truncate text-base font-semibold text-strong">{name}</p>
          {role || handle ? (
            <p className="truncate text-small text-muted">
              {role}
              {role && handle ? <span aria-hidden> · </span> : null}
              {handle}
            </p>
          ) : null}
        </div>
        {badge ? <div className="shrink-0 pt-1">{badge}</div> : null}
      </div>
      {bio ? <p className="text-small text-pretty text-body">{bio}</p> : null}
      {stats?.length ? (
        <dl className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-surface p-1">
          {stats.slice(0, 3).map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse items-start rounded-md px-2.5 py-1.5">
              <dt className="text-micro font-medium text-muted">{stat.label}</dt>
              <dd className="text-base font-semibold text-strong tabular-nums">
                {typeof stat.value === "number" ? stat.value.toLocaleString("tr-TR") : stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {meta ? <p className="text-micro text-muted">{meta}</p> : null}
    </div>
  );
}
