"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { CloseButton } from "@/components/ui/close-button";
import { cn } from "@/lib/utils";

/**
 * Duyuru hapı: kahraman başlığının üstünde ya da sayfanın en üstünde tek
 * satırlık haber ("Yeni · Grafikler geldi →"). Bir sürüme, yazıya ya da
 * sayfaya GÖTÜRÜR; bilgi vermek için değil tıklanmak için durur.
 *
 * NOKTASIZ VE YANIP SÖNMEZ. "Kahraman başlığının üstünde yanıp sönen noktalı
 * rozet" slop listesinde: her yapay zekâ açılışında aynı. Burada künye kısa
 * bir sözcük ("Yeni") ve hap zeminde ton farkı; hareket yalnızca üstüne
 * gelince okun 2 piksel ilerlemesi.
 *
 * TIKLAMA ALANI: hapın tamamı tek bağlantı (`next/link`). Kapatılabilir
 * varyantta × düğmesi bağlantının İÇİNDE DEĞİL, kardeşidir: iç içe
 * etkileşimli öğe geçersiz HTML'dir ve ekran okuyucuda ikisi birden okunur.
 *
 * KAPATMA HATIRLANIR, HİDRASYON GÜVENLİ:
 * - Sunucu kullanıcının kapattığını bilemez, hapı her zaman basar.
 * - Hapın hemen arkasındaki satır içi betik, ilk boyamadan ÖNCE
 *   localStorage'a bakar ve kapatılmışsa öğeye `hidden` verir: ekranda bir
 *   an görünüp kaybolma (flaş) yok.
 * - Hidrasyondan sonra `useSyncExternalStore` aynı anahtarı okur ve öğeyi
 *   React'ten de kaldırır. Sunucu anlık görüntüsü `false`, istemcininki
 *   gerçek değer: React ikisini hidrasyon sonrası uzlaştırır, uyumsuzluk
 *   hatası yok (betiğin eklediği `hidden` için `suppressHydrationWarning`).
 * - Başka sekmede kapatılırsa `storage` olayıyla burada da kapanır.
 * Anahtarı duyuruya özgü ver (`duyuru:grafikler-2026-11`): yeni duyuru yeni
 * anahtar, eski kapatma yenisini gizlemez.
 */

type AnnouncementProps = {
  href: string;
  /** Künye: "Yeni", "Güncelleme". Kısa tut. */
  tag?: ReactNode;
  children: ReactNode;
  className?: string;
};

const PILL =
  "group relative inline-flex w-fit max-w-full items-center rounded-full border border-line bg-overlay text-small shadow-raised transition-[border-color,box-shadow] duration-200 hover:border-line-strong";

function Inner({ tag, children }: { tag?: ReactNode; children: ReactNode }) {
  return (
    <>
      {tag ? (
        <span className="shrink-0 rounded-full bg-primary-wash px-2 py-0.5 text-micro font-semibold text-primary-ink">
          {tag}
        </span>
      ) : null}
      <span className="min-w-0 truncate font-medium text-strong">{children}</span>
      <ArrowRight
        aria-hidden
        className="size-3.5 shrink-0 text-muted transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-strong motion-reduce:transition-none"
        strokeWidth={2}
      />
    </>
  );
}

/** Kapatılamaz duyuru: hapın tamamı bağlantı. */
export function Announcement({ href, tag, children, className }: AnnouncementProps) {
  return (
    <Link
      href={href}
      className={cn(PILL, "min-h-11 gap-2 py-1 pr-3 pl-1 pointer-fine:min-h-8", !tag && "pl-3", className)}
    >
      <Inner tag={tag}>{children}</Inner>
    </Link>
  );
}

const EVENT = "announcement-dismiss";

function read(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

type DismissibleAnnouncementProps = AnnouncementProps & {
  /** localStorage anahtarı; duyuruya özgü. */
  storageKey: string;
  dismissLabel?: string;
};

/** Kapatılabilir duyuru: kapatma bu tarayıcıda hatırlanır. */
export function DismissibleAnnouncement({
  href,
  tag,
  children,
  storageKey,
  dismissLabel = "Duyuruyu Kapat",
  className,
}: DismissibleAnnouncementProps) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === storageKey) notify();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(EVENT, notify);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(EVENT, notify);
      };
    },
    [storageKey],
  );
  const dismissed = useSyncExternalStore(
    subscribe,
    () => read(storageKey),
    () => false,
  );

  if (dismissed) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* Gizli pencere ya da dolu depo: bu oturumda yine de kapansın. */
    }
    window.dispatchEvent(new Event(EVENT));
  }

  /* İlk boyamadan önce çalışır; yalnızca sunucu HTML'inde etkili (istemcide
     sonradan eklenen betik çalışmaz, orada useSyncExternalStore zaten doğru). */
  const guard = `try{if(localStorage.getItem(${JSON.stringify(storageKey)})==="1"){document.currentScript.previousElementSibling.hidden=true}}catch(e){}`;

  return (
    <>
      <div suppressHydrationWarning className={cn(PILL, "pr-1", className)}>
        <Link
          href={href}
          className={cn(
            "inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full py-1 pr-1 pl-1 pointer-fine:min-h-8",
            !tag && "pl-3",
          )}
        >
          <Inner tag={tag}>{children}</Inner>
        </Link>
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />
        <CloseButton aria-label={dismissLabel} size="sm" bleed={false} onClick={dismiss} className="pointer-fine:size-8" />
      </div>
      <script dangerouslySetInnerHTML={{ __html: guard }} />
    </>
  );
}
