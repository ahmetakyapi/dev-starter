// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Süpürülen bağlantı: metin içi bağlantı (bio paragrafı, müşteri listesi,
 * "şu yazıda anlattım"). Dinlenmede altında ince, sönük bir kıl çizgi durur;
 * üzerine gelince ya da klavye odağında metin rengindeki güçlü çizgi soldan
 * sağa süpürülerek o kılın üstüne çekilir, ayrılınca aynı yoldan geri çekilir.
 *
 * NE ZAMAN: okunan düz metnin içindeki bağlantılar; logo duvarı yerine altı
 * çizili düz müşteri listesi ("Seçili işler: A, B, C"). Kişisel site, hakkında
 * sayfası, makale.
 * NE ZAMAN DEĞİL: gezinme menüsü (orada `aria-current` ve hap var), buton gibi
 * davranan eylem ("Kaydet" bağlantı değildir), kart başlığı (bütün kart
 * tıklanıyorsa çizgi gürültüdür).
 *
 * NASIL: çizgi `text-decoration` değil, iki katmanlı `background-image`:
 * altta `--color-line-strong` kılı, üstte yarısı `currentColor` yarısı saydam
 * 200% genişliğinde şerit. `background-position` 100% → 0 geçişiyle (450 ms,
 * `--ease-brand`) renkli yarı soldan içeri kayar. Satır kırılınca çizgi her
 * satırda ayrı çizilir (`box-decoration-break: clone`). Sunucu bileşeni,
 * yalnız CSS; hareket azaltmada çizgi anında değişir.
 *
 * ERİŞİLEBİLİRLİK: rengi tek işaret değil (dinlenmede de çizgi var, WCAG
 * 1.4.1). Dış bağlantı (`http…`) kendiliğinden yeni sekmede açılır, `rel`
 * eklenir ve gizli "(yeni sekmede açılır)" okunur; `external={false}` ile kapat.
 * Odak halkası globals.css'teki `focus-visible`.
 *
 * Kaynak: Sakin Akış turu (kişisel portfolyo dili, Kasım 2026); yalnız davranış, kod alınmadı.
 *
 *   <p>Şu an <GlideLink href="https://ornek.dev">Örnek Stüdyo</GlideLink>'da tasarım lideriyim.</p>
 *
 * next/link ile: sınıfı ve stili kendin ver (kit `next/*` taşımaz):
 *   <GlideLinkStyle /> <Link href="/yazilar" className={glideLinkClass}>Yazılar</Link>
 */

const CSS = `
.ui-gl {
  color: inherit;
  text-decoration: none;
  padding-bottom: 1px;
  background-image:
    linear-gradient(to right, currentColor 50%, transparent 50%),
    linear-gradient(var(--color-line-strong), var(--color-line-strong));
  background-size: 200% 1px, 100% 1px;
  background-position: 100% 100%, 0 100%;
  background-repeat: no-repeat;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background-position 450ms var(--ease-brand), color 200ms ease;
}
.ui-gl:focus-visible { background-position: 0 100%, 0 100%; color: var(--color-strong); }
@media (hover: hover) {
  .ui-gl:hover { background-position: 0 100%, 0 100%; color: var(--color-strong); }
}
@media (prefers-reduced-motion: reduce) { .ui-gl { transition: none; } }`;

/** Kendi bağlantı bileşenine (ör. next/link) verilecek sınıf; yanına bir kez `<GlideLinkStyle />`. */
export const glideLinkClass = "ui-gl";

/** Stili sayfaya bir kez ekler (React aynı `href`li stili tekilleştirir). */
export function GlideLinkStyle() {
  return (
    <style href="ui-glide-link" precedence="default">
      {CSS}
    </style>
  );
}

type GlideLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  href: string;
  children: ReactNode;
  /** Yeni sekmede aç. Varsayılan: adres `http(s)://` ile başlıyorsa evet. */
  external?: boolean;
  /** Dış bağlantıda ekran okuyucunun duyduğu ek. */
  newTabLabel?: string;
};

export function GlideLink({ href, children, external, newTabLabel = "(yeni sekmede açılır)", className, ...rest }: GlideLinkProps) {
  const isExternal = external ?? /^https?:\/\//.test(href);
  return (
    <>
      <GlideLinkStyle />
      <a
        href={href}
        className={cn(glideLinkClass, className)}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : null)}
        {...rest}
      >
        {children}
        {isExternal ? <span className="sr-only"> {newTabLabel}</span> : null}
      </a>
    </>
  );
}
