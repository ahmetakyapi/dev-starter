// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { ReactNode } from "react";
import { cn } from "../utils";

/**
 * Köşe ayraçlı etiket: mono, büyük harfli kısa metin; dört köşesinde "vizör"
 * ayraçları (Sightline kahramanı: "UNIFIED INTELLIGENCE LAYER"). Başlığın
 * hemen üstünde eyebrow olarak: ürün kategorisi, sürüm, bölüm adı.
 * Hap şeklindeki rozetin teknik, ölçü aleti gibi karşılığı; yoğun uygulama
 * ekranında değil, görsel zeminli tanıtım sayfasında kullan.
 *
 * Kural: tek satır, en çok 4-5 sözcük, bir sayfada bir ya da iki tane
 * (her bölüme koyarsan etiket gürültü olur).
 *
 * BÜYÜK HARF: `uppercase` CSS'i `lang` özniteliğine bakar; `<html lang="tr">`
 * ise "ışık" doğru olarak "IŞIK", "iş" "İŞ" olur. Sayfada dil doğru değilse
 * metni zaten büyük harfle yaz (i/İ hatası bu yüzden oluşur).
 *
 * Ayraçlar süstür (`aria-hidden`), yazı bölünmez; `tone="media"` görsel
 * üstünde açık yazı ve yarı saydam zemin.
 *
 *   <CornerLabel>Birleşik Zekâ Katmanı</CornerLabel>
 */

type CornerLabelProps = {
  children: ReactNode;
  /** `default`: yüzey üstü. `media`: fotoğraf üstü, açık yazı. */
  tone?: "default" | "media";
  className?: string;
};

const CORNERS = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-r border-b",
] as const;

export function CornerLabel({ children, tone = "default", className }: CornerLabelProps) {
  const media = tone === "media";
  return (
    <span
      className={cn(
        "relative inline-flex items-center px-5 py-3 font-mono text-small font-medium tracking-[0.12em] uppercase",
        media ? "bg-scrim text-on-brand" : "bg-surface text-body",
        className,
      )}
    >
      {CORNERS.map((c) => (
        <span key={c} aria-hidden className={cn("absolute size-2", c, media ? "border-on-brand" : "border-strong")} />
      ))}
      {children}
    </span>
  );
}
