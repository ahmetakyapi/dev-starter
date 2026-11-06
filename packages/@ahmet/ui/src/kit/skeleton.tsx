// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { cn } from "../utils";

/**
 * Yükleme iskeleti, gelecek içeriğin ŞEKLİNDE: satır satır metin, avatar +
 * iki satır + sağda değer, başlıklı kart. Yer tuttuğu için içerik geldiğinde
 * sayfa zıplamaz. Genel bir dönen halka yerine bunu kullan.
 *
 * Şablonun `components/ui/Skeleton.tsx`ünün genişletilmiş hâli; ikisi aynı
 * `.skeleton` yardımcısını (app/globals.css) kullanır. Hareketi azaltan
 * kullanıcıda nabız durur (globals.css'teki genel kural).
 *
 * PARILTI ("board" dili, 2026-11): nabız yerine soldan sağa geçen bir ışık
 * şeridi (`::after`, yalnızca `translate`: düzen hesaplatmaz). Şerit bir
 * RENK degradesi değil, zemin tonunun saydamdan saydama açılıp kapanan bir
 * parlaklığı; degrade disiplinine (globals.css başı) girmez. Bütün
 * bloklar AYNI ANDA parlar (süre ve gecikme ortak): satır satır dalga
 * ekranda kıpırtı yapar. Hareketi azaltan kullanıcıda şerit HİÇ çizilmez
 * (`no-preference` sorgusu), blok durağan kalır; globals.css'in nabzı da
 * zaten durur.
 *
 * Ekran okuyucuya gizli. "Yükleniyor" bilgisini KAP verir:
 *   <section aria-busy="true"> … <SkeletonCard /> … </section>
 */

const SHIMMER = `
@media (prefers-reduced-motion: no-preference) {
  .ui-shimmer { position: relative; overflow: hidden; animation: none; }
  .ui-shimmer::after {
    content: "";
    position: absolute;
    inset: 0;
    translate: -100% 0;
    background-image: linear-gradient(90deg, transparent, color-mix(in srgb, var(--page-bg) 60%, transparent), transparent);
    animation: ui-shimmer 1.6s var(--ease-brand) infinite;
  }
  /* Koyuda sayfa zemini bloktan KOYU: şerit sönük bir gölgeye dönerdi.
     Orada ışığı yükselmiş yüzey tonu taşır (beyazın %7'si). */
  :root[data-theme="dark"] .ui-shimmer::after {
    background-image: linear-gradient(90deg, transparent, var(--surface-raised), transparent);
  }
}
@keyframes ui-shimmer { to { translate: 100% 0; } }
`;

export function Skeleton({ className }: { className?: string }) {
  return (
    <>
      <style href="ui-skeleton" precedence="default">
        {SHIMMER}
      </style>
      <span aria-hidden className={cn("skeleton ui-shimmer block rounded-sm", className)} />
    </>
  );
}

/** Paragraf: son satır kısa, gerçek metin gibi biter. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("block space-y-2.5", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 && lines > 1 ? "w-3/5" : "w-full")} />
      ))}
    </span>
  );
}

/**
 * Liste satırı: avatar, iki satır, sağda sayı. `DataTable` ya da liste
 * yüklenirken satır sayısı kadar bas; satır yüksekliği gerçeğiyle aynı.
 */
export function SkeletonRow({ avatar = true, value = true, className }: { avatar?: boolean; value?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("flex min-h-14 items-center gap-3 py-2", className)}>
      {avatar ? <Skeleton className="size-9 shrink-0 rounded-full" /> : null}
      <span className="block min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </span>
      {value ? <Skeleton className="h-4 w-14 shrink-0" /> : null}
    </span>
  );
}

/** Panel kartı: başlık, künye, metin ve altta düğme yeri. Gri kuyu, kenarlıksız. */
export function SkeletonCard({ lines = 3, action = true, className }: { lines?: number; action?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("block rounded-xl bg-surface p-5 sm:p-6", className)}>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-2 h-3 w-1/4" />
      <SkeletonText lines={lines} className="mt-5" />
      {action ? <Skeleton className="mt-6 h-11 w-28 rounded-md" /> : null}
    </span>
  );
}
