import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cam klasör: her proje, dosya ya da iş bir klasör. Arkada sekmeli kapak,
 * içinde birkaç beyaz kağıt, önde yarı saydam renkli cam kapak; kapağın
 * üstünde başlık, sol altta alt metin (kişi, ekip), sağ altta durum hapı.
 * Portfolyo ızgarası, "Projeler" bölümü, müşteri ya da dosya vitrini.
 * Manzara turu (28 Kasım 2026), yalnız davranış ve yapı.
 *
 * NE ZAMAN DEĞİL: veri tablosu, sık güncellenen liste, çok satırlı künye.
 * Klasör bir nesne; içinde okunacak metin yok, yalnız başlık ve iki künye.
 * Uzun liste için `record-list`, kapak görseli için `shot-card`.
 *
 * NASIL: arka kapak iki parça (gövde + `clip-path` ile eğik kesilmiş
 * sekme), kağıtlar `bg-overlay` dikdörtgen ve ince satır izleri, ön kapak
 * `backdrop-filter` camı (desteksiz tarayıcıda yarı saydam düz ton).
 * Üzerine gelince (yalnız ince işaretçi) ya da klavye odağında ön kapak
 * alt kenarından menteşe gibi açılır (`rotate: x`, `perspective`) ve
 * kağıtlar sırayla yükselip hafifçe döner. Kağıtlar klasörün üst kenarından
 * taşar; üstte yer bırakılmış (`pt`), kap kırpmasın. Yalnız transform,
 * yalnız CSS: sunucu bileşeni.
 *
 * TONLAR token'dan (`tone`): `primary`, `neutral`, `chart-1…6`. Açık
 * grafik tonlarında (`chart-1`, `chart-5`, `chart-6`) kapak metni koyu
 * mürekkep, ötekilerde beyaz (`--on-brand`); iki temada da okunur.
 *
 * ERİŞİLEBİLİRLİK: `href` verilirse klasörün tamamı tek bağlantı, adı
 * kapaktaki metinden (başlık, alt metin, durum). `href` yoksa süs:
 * `role="img"` + `aria-label` (başlık ve alt metinden) ya da `decorative`
 * ile `aria-hidden`. Kağıtlar ve kapak katmanları her durumda
 * `aria-hidden`. Hareketi azaltan kullanıcıda kapak açılmaz, kağıtlar hafif
 * yükselmiş durur, geçiş yok.
 *
 *   <FolderCard title="Marka Kitabı" subtitle="Deniz Aydın" status="Taslak" tone="chart-2" href="/projeler/marka-kitabi" />
 */

const TONES = {
  primary: { color: "var(--primary)", pale: false },
  neutral: { color: "var(--text-muted)", pale: false },
  "chart-1": { color: "var(--chart-1)", pale: true },
  "chart-2": { color: "var(--chart-2)", pale: false },
  "chart-3": { color: "var(--chart-3)", pale: false },
  "chart-4": { color: "var(--chart-4)", pale: false },
  "chart-5": { color: "var(--chart-5)", pale: true },
  "chart-6": { color: "var(--chart-6)", pale: true },
} as const;

export type FolderTone = keyof typeof TONES;

/** Açık kağıtların yükselişi ve dönüşü: arkadaki en çok yükselir. */
const PAPER_MOTION = [
  { open: "-30%", turn: "-5deg", calm: "-10%", rest: "-1deg", inset: "9%" },
  { open: "-21%", turn: "3deg", calm: "-7%", rest: "1.5deg", inset: "12%" },
  { open: "-13%", turn: "6deg", calm: "-4%", rest: "-0.5deg", inset: "15%" },
  { open: "-7%", turn: "-2deg", calm: "-2%", rest: "0.5deg", inset: "18%" },
] as const;

const OPEN = (inner: string) =>
  `.ui-folder:focus-visible ${inner}, .ui-folder:focus-within ${inner}`;
const HOVER = (inner: string) => `.ui-folder:hover ${inner}`;

const CSS = `
.ui-folder { --tone: var(--primary); --folder-back: color-mix(in oklab, var(--tone) 74%, black); position: relative; display: block; padding-top: 16%; }
.ui-folder-box { position: relative; display: block; aspect-ratio: 5 / 4; perspective: 900px; }
.ui-folder-tab { position: absolute; left: 0; top: -8%; width: 44%; height: 14%; border-radius: var(--radius-md) var(--radius-md) 0 0;
  background: var(--folder-back); clip-path: polygon(0 0, 78% 0, 100% 100%, 0 100%); }
.ui-folder-back { position: absolute; inset: 0; border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  background: var(--folder-back); background-image: linear-gradient(180deg, var(--folder-back), color-mix(in oklab, var(--tone) 58%, black)); }
.ui-folder-paper { position: absolute; left: var(--paper-x); right: var(--paper-x); top: 7%; height: 62%; border-radius: var(--radius-sm);
  background: var(--overlay); box-shadow: var(--shadow-sm); translate: 0 0; rotate: var(--paper-rest);
  transition: translate 0.5s var(--ease-brand) var(--paper-delay), rotate 0.5s var(--ease-brand) var(--paper-delay); }
.ui-folder-lines { position: absolute; inset: 14% 12% auto 12%; height: 46%;
  background: repeating-linear-gradient(180deg, var(--line) 0 1px, transparent 1px 9px); opacity: 0.9; }
.ui-folder-front { position: absolute; inset: 30% 0 0 0; border-radius: var(--radius-lg); transform-origin: 50% 100%; rotate: x 0deg;
  background: color-mix(in oklab, var(--tone) 82%, transparent);
  background-image: linear-gradient(180deg, color-mix(in oklab, var(--tone) 64%, transparent), color-mix(in oklab, var(--tone) 84%, transparent));
  -webkit-backdrop-filter: blur(10px) saturate(1.5); backdrop-filter: blur(10px) saturate(1.5);
  box-shadow: inset 0 1px 0 color-mix(in oklab, white 45%, transparent), inset 0 0 0 1px color-mix(in oklab, white 16%, transparent),
    0 12px 24px -14px color-mix(in oklab, var(--tone) 55%, black);
  transition: rotate 0.5s var(--ease-brand); }
.ui-folder-front[data-ink="dark"] { color: color-mix(in oklab, var(--tone) 22%, black); }
${OPEN(".ui-folder-paper")} { translate: 0 var(--paper-open); rotate: var(--paper-turn); }
${OPEN(".ui-folder-front")} { rotate: x -28deg; }
@media (hover: hover) and (pointer: fine) {
  ${HOVER(".ui-folder-paper")} { translate: 0 var(--paper-open); rotate: var(--paper-turn); }
  ${HOVER(".ui-folder-front")} { rotate: x -28deg; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-folder .ui-folder-paper, ${OPEN(".ui-folder-paper")}, ${HOVER(".ui-folder-paper")} { translate: 0 var(--paper-calm); rotate: var(--paper-rest); transition: none; }
  .ui-folder .ui-folder-front, ${OPEN(".ui-folder-front")}, ${HOVER(".ui-folder-front")} { rotate: x 0deg; transition: none; }
}`;

export type FolderCardProps = {
  /** Title Case başlık: "Marka Kitabı". */
  title: string;
  /** Sol alttaki künye: kişi, ekip, müşteri. */
  subtitle?: string;
  /** Sağ alttaki durum hapı: "Taslak", "3 Dosya". */
  status?: ReactNode;
  tone?: FolderTone;
  /** Kağıt sayısı (1-4) ya da kağıtların küçük içeriği (süs, okunmaz). */
  papers?: number | readonly ReactNode[];
  /** Verilirse klasörün tamamı tek bağlantı. */
  href?: string;
  /** `href` yokken klasörü tamamen süs say (`aria-hidden`); yoksa `role="img"`. */
  decorative?: boolean;
  className?: string;
};

export function FolderCard({ title, subtitle, status, tone = "primary", papers = 3, href, decorative, className }: FolderCardProps) {
  const t = TONES[tone];
  const list: readonly ReactNode[] = typeof papers === "number" ? Array.from({ length: Math.min(Math.max(papers, 1), 4) }, () => null) : papers.slice(0, 4);

  const body = (
    <span className="ui-folder-box">
      <span aria-hidden className="ui-folder-tab" />
      <span aria-hidden className="ui-folder-back" />
      {list.map((content, i) => {
        const p = PAPER_MOTION[i];
        return (
          <span
            key={i}
            aria-hidden
            className="ui-folder-paper overflow-hidden"
            style={
              {
                "--paper-x": p.inset,
                "--paper-open": p.open,
                "--paper-turn": p.turn,
                "--paper-calm": p.calm,
                "--paper-rest": p.rest,
                "--paper-delay": `${(list.length - 1 - i) * 60}ms`,
              } as CSSProperties
            }
          >
            {content ? <span className="absolute inset-[10%] text-micro text-muted">{content}</span> : <span className="ui-folder-lines" />}
          </span>
        );
      })}
      <span data-ink={t.pale ? "dark" : "light"} className={cn("ui-folder-front flex flex-col justify-between p-[7%]", !t.pale && "text-on-brand")}>
        <span className="line-clamp-2 text-base leading-snug font-semibold tracking-tight sm:text-lead">{title}</span>
        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <span className="truncate text-small opacity-85">{subtitle}</span>
          {status ? (
            <span
              className={cn(
                "inline-flex min-h-6 items-center rounded-full px-2.5 text-micro font-medium ring-1",
                t.pale ? "bg-[color-mix(in_oklab,white_45%,transparent)] ring-[color-mix(in_oklab,black_12%,transparent)]" : "bg-on-brand/20 ring-on-brand/35",
              )}
            >
              {status}
            </span>
          ) : null}
        </span>
      </span>
    </span>
  );

  const style = { "--tone": t.color } as CSSProperties;
  const label = subtitle ? `${title}, ${subtitle}` : title;

  return (
    <>
      <style href="ui-folder-card" precedence="default">
        {CSS}
      </style>
      {href ? (
        <a href={href} className={cn("ui-folder w-64 rounded-lg outline-offset-4", className)} style={style}>
          {body}
        </a>
      ) : (
        <span
          className={cn("ui-folder w-64", className)}
          style={style}
          {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
        >
          {body}
        </span>
      )}
    </>
  );
}
