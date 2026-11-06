// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Kitap kapağı: üç boyutlu duran, üzerine gelince okura dönen kitap. Rehber,
 * e-kitap, kaynak kütüphanesi, blog serisi, "indir" bölümü. Ekran görüntüsü
 * yerine içeriğin KENDİ nesnesi: kapakta yalnız başlık, alt başlık ve imza.
 *
 * YAPI: `perspective` taşıyan kap, `preserve-3d` kitap; ön kapak öne
 * (`translateZ`), sağda sayfa kenarı (90° dönük şerit, ince satır
 * çizgileri), solda cilt kırığı (iki yarı saydam şerit). Kitap 28°
 * yan durur, üzerine gelince ya da odakta 12°ye döner ve hafifçe büyür
 * (300 ms, `--ease-brand`).
 *
 * TONLAR token'dan: `primary` birincil eylem rengi (`bg-cta`, marka
 * yüzeyi; degrade kuralının "birincil eylem" yeri değil, kitap marka
 * karosu sayılır), `ink` koyu mürekkep (`bg-strong text-page`), `paper`
 * beyaz karo. Kapak metni tonun ön plan rengiyle, her temada AA.
 *
 * `href` verilirse bütün kitap tek bağlantı; adı başlıktan. Hareketi
 * azaltan kullanıcıda dönmez, yalnız ton bir kademe açılır. Sunucu
 * bileşeni: yalnız CSS.
 *
 *   <BookCover title="Tasarım Token'ları" subtitle="İki katmanlı mimari" author="dev-starter" href="/rehber/02" />
 */

const CSS = `
.ui-book-stage { perspective: 900px; display: inline-block; }
.ui-book { position: relative; transform-style: preserve-3d; aspect-ratio: 49 / 64; border-radius: 4px 6px 6px 4px;
  rotate: y 28deg; transition: rotate 0.3s var(--ease-brand), scale 0.3s var(--ease-brand), filter 0.3s var(--ease-brand); }
.ui-book-stage:hover .ui-book, .ui-book-stage:focus-visible .ui-book, .ui-book-stage:focus-within .ui-book { rotate: y 12deg; scale: 1.04; }
.ui-book-face { position: absolute; inset: 0; border-radius: inherit; transform: translateZ(calc(var(--book-depth) / 2)); overflow: hidden; }
.ui-book-face::before { content: ""; position: absolute; inset: 0 auto 0 5%; width: 3%;
  background: linear-gradient(to right, color-mix(in oklab, black 22%, transparent), color-mix(in oklab, white 18%, transparent)); }
.ui-book-face::after { content: ""; position: absolute; inset: 0;
  background: linear-gradient(105deg, color-mix(in oklab, white 14%, transparent), transparent 40%); pointer-events: none; }
.ui-book-pages { position: absolute; top: 2%; bottom: 2%; right: 0; width: var(--book-depth);
  transform: translateX(calc(var(--book-depth) / 2 - 3px)) rotateY(90deg);
  background: repeating-linear-gradient(to right, var(--surface) 0 2px, var(--line) 2px 3px); }
.ui-book-back { position: absolute; inset: 0; border-radius: inherit; transform: translateZ(calc(var(--book-depth) / -2)); }
@media (prefers-reduced-motion: reduce) {
  .ui-book { transition: filter 0.2s; }
  .ui-book-stage:hover .ui-book, .ui-book-stage:focus-visible .ui-book { rotate: y 28deg; scale: 1; filter: brightness(1.06); }
}`;

const TONES = {
  primary: { face: "bg-cta text-on-brand", back: "bg-primary-hover", meta: "text-on-brand/80" },
  ink: { face: "bg-strong text-page", back: "bg-strong", meta: "text-page/70" },
  paper: { face: "bg-overlay text-strong edge-lit", back: "bg-surface-sunken", meta: "text-muted" },
} as const;

type BookCoverProps = {
  title: string;
  subtitle?: string;
  author?: string;
  /** Kapağın üst köşesindeki küçük işaret (ikon, sayı: "02"). */
  mark?: ReactNode;
  tone?: keyof typeof TONES;
  /** Kapak genişliği, piksel. */
  width?: number;
  href?: string;
  className?: string;
};

export function BookCover({ title, subtitle, author, mark, tone = "primary", width = 180, href, className }: BookCoverProps) {
  const t = TONES[tone];
  const depth = Math.round(width * 0.16);
  const book = (
    <span className="ui-book block" style={{ width, "--book-depth": `${depth}px` } as CSSProperties}>
      <span aria-hidden className={cn("ui-book-back", t.back)} />
      <span aria-hidden className="ui-book-pages" />
      <span className={cn("ui-book-face flex flex-col justify-between p-[11%] pl-[14%]", t.face)}>
        <span className={cn("font-mono text-micro", t.meta)}>{mark}</span>
        <span className="grid gap-1.5">
          <span className="text-title leading-tight font-semibold tracking-tight text-balance">{title}</span>
          {subtitle ? <span className={cn("text-small leading-snug", t.meta)}>{subtitle}</span> : null}
        </span>
        <span className={cn("text-micro font-medium", t.meta)}>{author}</span>
      </span>
    </span>
  );

  return (
    <>
      <style href="ui-book-cover" precedence="default">
        {CSS}
      </style>
      {href ? (
        <a href={href} className={cn("ui-book-stage rounded-md", className)}>
          {book}
        </a>
      ) : (
        <span className={cn("ui-book-stage", className)}>{book}</span>
      )}
    </>
  );
}
