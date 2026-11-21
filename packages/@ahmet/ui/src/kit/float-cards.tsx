// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Süzülen kart sahnesi: ortadaki başlığın çevresine dağılmış, hafif
 * döndürülmüş, kenarlara taşan ürün kartları (Socialscale kahramanı:
 * video, takvim, kampanya durumu, satış kartı). Metin yetmediğinde "bu ürün
 * çok şey yapıyor" duygusunu tek bakışta verir; kartlar süstür, başlık
 * ve eylemler asıl yükü taşır. Ürün ekranının yerine geçmez (onun için
 * `app-window`).
 *
 * Yapı: `FloatCards` sahne kabı (`relative`, taşanı keser); başlık ve
 * eylemler kabın çocuğu, `relative z-10`. `FloatCard`lar mutlak konumlu:
 * `at` kabın kenarından yüzde ya da piksel (negatif değer kartı kenardan
 * dışarı taşırır, kırpılır), `rotate` derece, `depth` 0-2 (gölge ve kenar
 * koyuluğu; ön kart daha yüksek). Kart içeriği çağıranda: gerçek bileşenler
 * (`Stat`, `Avatar`, `Sparkline`), sahte veri DEĞİL gerçek ürün verisi ya da
 * açıkça örnek.
 *
 * TELEFON: kartlar `md` altında gizlenir; dar ekranda kenara taşan kartlar ya
 * başlığı kapatır ya da yatay taşma yapar. Telefonda ürünü anlatmak için
 * tek bir `app-window` ya da görsel koy.
 *
 * HAREKET: her kart yavaş süzülür (6-9 sn, birkaç piksel, farklı gecikme);
 * dönüşü (`rotate`) bozmaz. Hareketi azaltanda durur.
 *
 * ERİŞİLEBİLİRLİK: her kart `aria-hidden` ve `pointer-events: none`. Kartın
 * içindeki bilgi sayfanın başka yerinde de olmalı; süs sahneye ulaşılamaz.
 *
 *   <FloatCards className="min-h-[34rem]">
 *     <FloatCard at={{ left: "-3%", top: "14%" }} rotate={-5} className="w-64">…</FloatCard>
 *     <div className="relative z-10 mx-auto max-w-2xl text-center">…başlık…</div>
 *   </FloatCards>
 */

const CSS = `
@keyframes ui-float { 0%, 100% { transform: rotate(var(--r)) translateY(0); } 50% { transform: rotate(var(--r)) translateY(calc(var(--lift) * -1)); } }
.ui-float-card { transform: rotate(var(--r)); animation: ui-float var(--dur) ease-in-out var(--delay) infinite; }
@media (prefers-reduced-motion: reduce) { .ui-float-card { animation: none; } }`;

export function FloatCards({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative isolate overflow-clip", className)}>
      <style href="ui-float-cards" precedence="default">
        {CSS}
      </style>
      {children}
    </div>
  );
}

type At = { left?: string | number; right?: string | number; top?: string | number; bottom?: string | number };

type FloatCardProps = {
  children: ReactNode;
  /** Konum: kabın kenarından uzaklık. Negatif = dışarı taşar. */
  at: At;
  /** Derece, -12 ile 12 arası okunur kalır. */
  rotate?: number;
  /** 0 arka, 1 orta, 2 ön: gölge ve kıl çizgi. */
  depth?: 0 | 1 | 2;
  /** Süzülme, piksel. */
  lift?: number;
  /** Süzülme süresi, saniye. */
  duration?: number;
  /** Süzülme gecikmesi, saniye (kartlar aynı anda yükselmesin). */
  delay?: number;
  className?: string;
};

const DEPTH = ["shadow-raised opacity-90", "shadow-floating", "shadow-modal"] as const;

export function FloatCard({ children, at, rotate = 0, depth = 1, lift = 8, duration = 7, delay = 0, className }: FloatCardProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "ui-float-card pointer-events-none absolute z-0 rounded-xl bg-overlay p-4 ring-1 ring-line max-md:hidden",
        DEPTH[depth],
        className,
      )}
      style={{ ...at, "--r": `${rotate}deg`, "--lift": `${lift}px`, "--dur": `${duration}s`, "--delay": `${-delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
