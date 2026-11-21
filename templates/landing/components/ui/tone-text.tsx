import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * İki tonlu başlık: cümlenin bir bölümü güçlü, öbür bölümü soluk. Okur önce
 * güçlü kısmı okur, soluk kısım bağlam olarak arkadan gelir (Synais'in
 * "Smarter *Financial* Management", Respan'ın "that **power modern products**"
 * başlıkları). Ağırlığı renk kontrastı taşır; font, boyut, satır aynı kalır.
 * Hero ve bölüm başlığı, "hakkımızda" cümlesi, manifesto.
 *
 * Kural: soluk bölüm yalnız BÜYÜK metinde (≥ 24 px) kullan; küçük gövde metninde %60 kontrast AA altına iner. Vurgulanan şey cümlenin ANLAMI olsun ("güvenle yönet"), süs olsun
 * diye iki yarıya bölme. Soluk bölüm yine okunur kalmalı: en az AA kontrast
 * (`text-muted` beyaz üstünde 5:1; `media` tonu görsel üstünde `on-brand/60`,
 * görselin kendisi karartılmadıysa ÖLÇ).
 *
 * Üç parça, hepsi isteğe bağlı:
 *   - `<ToneText.Soft>`: soluk bölüm. Dışında kalan metin güçlüdür.
 *   - `fade`: BÜTÜN başlık soldan sağa açılır (`"in"`: soluktan netliğe,
 *     Qbick kahramanı) ya da tersi (`"out"`). Degradenin rengi `currentColor`
 *     (token'dan gelen yazı rengi), sabit renk yok. Kırpma desteklenmezse düz
 *     renk kalır (`rules/design-tokens.md`: önce solid, kırpma `@supports`
 *     içinde). Kısa başlık için; uzun paragrafı solduran satır kırılması
 *     öngörülemez (mistakes #23).
 *   - `<em>`: editoryal vurgu. Serif display fontuyla tek sözcük italik
 *     ("Cut *Every Cost.*", "Begin To *Grow*"), `font-display` presetine bağlı
 *     (`editorial`). Bir başlıkta en çok bir tane.
 *
 * Sunucu bileşeni; metin bölünmez, parçalanmaz: ekran okuyucu başlığı tek
 * cümle olarak okur (soluk kısım yalnızca renk farkıdır).
 *
 *   <ToneText as="h1" className="text-display">
 *     Daha akıllı <ToneText.Soft>finans yönetimi</ToneText.Soft>
 *   </ToneText>
 *   <ToneText as="h1" fade="in" className="text-hero">Modern işletmeler için enerji zekâsı</ToneText>
 */

const CSS = `
.ui-tone-fade { color: var(--tone-strong); }
@supports (background-clip: text) or (-webkit-background-clip: text) {
  .ui-tone-fade {
    background-image: linear-gradient(var(--tone-angle), color-mix(in srgb, currentColor 30%, transparent) 0%, currentColor 62%);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    padding-bottom: 0.08em; /* g, y, ş kırpılmasın */
  }
}`;

type ToneTextProps = {
  children: ReactNode;
  as?: ElementType;
  /** `default`: yüzey üstü. `media`: koyu fotoğraf ya da degrade üstü (açık yazı). */
  tone?: "default" | "media";
  /** Başlığın tamamında soldan sağa solma. `in`: sol soluk, sağ net. `out`: tersi. */
  fade?: "in" | "out";
  className?: string;
};

function Soft({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("ui-tone-soft", className)}>{children}</span>;
}

export function ToneText({ children, as: Tag = "h2", tone = "default", fade, className }: ToneTextProps) {
  const media = tone === "media";
  return (
    <Tag
      className={cn(
        "text-balance",
        media ? "text-on-brand [--tone-strong:var(--on-brand)]" : "text-strong [--tone-strong:var(--text-strong)]",
        // Soluk bölüm: yazı renginin %60'i, token'ın kendisinden türer (iki temada da döner).
        "[&_.ui-tone-soft]:text-[color-mix(in_srgb,currentColor_60%,transparent)]",
        "[&_em]:font-display [&_em]:font-normal [&_em]:italic",
        fade ? "ui-tone-fade" : null,
        className,
      )}
      style={fade ? ({ "--tone-angle": fade === "in" ? "90deg" : "270deg" } as React.CSSProperties) : undefined}
    >
      {fade ? (
        <style href="ui-tone-text" precedence="default">
          {CSS}
        </style>
      ) : null}
      {children}
    </Tag>
  );
}

ToneText.Soft = Soft;
