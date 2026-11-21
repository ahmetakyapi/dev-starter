import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * İstatistik şeridi: tanıtım sayfasında 3-4 büyük sayı, altında birer etiket,
 * aralarında ince dikey ayraç (Synais "500+ · 80% · $20B+"). Sunucu bileşeni,
 * sayı düz metin (yuvarlanan sayı için `digit-roll`/`animated-number`).
 *
 * KURAL (guides/08 veri dürüstlüğü): doğrulanamayan sayı yazma. "Mutlu
 * müşteri 50K+" gerçek bir kaynaktan çıkmıyorsa şeride girmez; örnek veri
 * gösteriyorsan çevresine "ÖRNEK VERİ" künyesi koy. En çok dört öğe; beşi
 * telefonda ve masaüstünde okunmaz.
 *
 * Yapı: `dl`; her öğe `dt` etiket + `dd` değer. Görsel sıra ters (değer
 * üstte), DOM sırası etiket-değer: ekran okuyucu "Aktif Kullanıcı, 50K+" der.
 *
 * Düzen: telefonda 2×2 (ayraçsız), `sm` üstünde tek satır ve `divided` ise
 * kıl çizgili ayraç. `tone="dark"` ters yüzey (`bg-strong`) üstü; renk `text-page`.
 * `numberClassName`: sayının fontu (varsayılan display; serif vurgu için
 * projenin vurgu font sınıfını ver).
 *
 *   <StatStrip items={[{ value: "99%", label: "İşlem başarı oranı" }, …]} divided />
 */

export type StripItem = { value: ReactNode; label: ReactNode };

export function StatStrip({
  items,
  tone = "light",
  divided = true,
  numberClassName = "font-display",
  className,
}: {
  items: readonly StripItem[];
  tone?: "light" | "dark";
  divided?: boolean;
  numberClassName?: string;
  className?: string;
}) {
  const dark = tone === "dark";
  const cols = items.length >= 4 ? "sm:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <dl className={cn("grid grid-cols-2 gap-y-10", cols, className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col-reverse items-center gap-2 px-4 text-center",
            divided && index > 0 && (dark ? "sm:border-l sm:border-page/25" : "sm:border-l sm:border-line"),
          )}
        >
          <dt className={cn("text-base", dark ? "text-page/70" : "text-soft")}>{item.label}</dt>
          <dd className={cn("text-display tracking-tight tabular-nums", numberClassName, dark ? "text-page" : "text-strong")}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
