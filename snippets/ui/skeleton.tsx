import { cn } from "@/lib/utils";

/**
 * Yükleme iskeleti, gelecek içeriğin ŞEKLİNDE: satır satır metin, avatar +
 * iki satır + sağda değer, başlıklı kart. Yer tuttuğu için içerik geldiğinde
 * sayfa zıplamaz. Genel bir dönen halka yerine bunu kullan.
 *
 * Şablonun `components/ui/Skeleton.tsx`ünün genişletilmiş hâli; ikisi aynı
 * `.skeleton` yardımcısını (app/globals.css) kullanır. Hareketi azaltan
 * kullanıcıda nabız durur (globals.css'teki genel kural).
 *
 * Ekran okuyucuya gizli. "Yükleniyor" bilgisini KAP verir:
 *   <section aria-busy="true"> … <SkeletonCard /> … </section>
 */

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton block rounded-sm", className)} />;
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

/** Panel kartı: başlık, künye, metin ve altta düğme yeri. */
export function SkeletonCard({ lines = 3, action = true, className }: { lines?: number; action?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("surface block rounded-lg p-5 sm:p-6", className)}>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-2 h-3 w-1/4" />
      <SkeletonText lines={lines} className="mt-5" />
      {action ? <Skeleton className="mt-6 h-11 w-28 rounded-md" /> : null}
    </span>
  );
}
