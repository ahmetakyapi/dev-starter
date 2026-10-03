import { cn } from "@/lib/utils";

/**
 * Yükleme iskeleti. Şekli gelecek içeriğin şekli olur (satır, kutu, avatar);
 * genel bir dönen simge yerine. Yer tuttuğu için içerik geldiğinde sayfa
 * zıplamaz. Ekran okuyucuya gizli: yükleniyor bilgisini kap (`aria-busy`) verir.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-sm", className)} />;
}

/** Paragraf iskeleti: son satır kısa, gerçek metin gibi. */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}
