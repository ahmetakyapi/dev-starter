// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

/**
 * Işık kenarı: kartın çerçevesinde dolaşan kısa bir ışık. "Bu kart şu an
 * ÇALIŞIYOR" demenin sessiz yolu: asistanın yanıt yazdığı mesaj, süren
 * içe aktarma, canlı yayındaki kayıt. Durağan karta süs olarak koyma; ışık
 * yalnız bir şey sürerken dolaşır (`active`), iş bitince söner.
 *
 * TEKNİK: kartın kendi `::after` katmanı. Zemin `conic-gradient` (açısı
 * `@property --beam-angle` ile döner), maske `content-box` dışlaması: yalnız
 * `--beam-width` kalınlığındaki çerçeve görünür. JavaScript yok, ölçüm yok,
 * köşe yarıçapı kartın kendisinden (`border-radius: inherit`).
 *
 * TEK RENK AİLESİ: ışık tonun kendi rengi, kuyruk aynı rengin saydamına
 * söner (degrade disiplini: tek aile). Geniş kartta ışık köşelerde hızlanır;
 * merkezden açı dönüyor, bilinçli (yol hesabı yerine sıfır JS).
 *
 * Hareketi azaltan kullanıcıda ışık dönmez: çerçeve tonun yarı saydamıyla
 * durağan çizilir, "etkin" bilgisi kaybolmaz. Ekran okuyucuya bir şey
 * söylemez; durum metni çağıranın (`aria-busy`, "Yazıyor…").
 *
 *   <BorderBeam className="rounded-xl bg-overlay p-5 shadow-raised" active={streaming}>…</BorderBeam>
 */

const CSS = `
@property --beam-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes ui-beam-spin { to { --beam-angle: 360deg; } }
/* Kabın konumu katmanda: \`className="absolute …"\` ezebilsin (katmansız CSS yardımcı sınıfı ezer). */
@layer components { .ui-beam { position: relative; isolation: isolate; } }
.ui-beam::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  padding: var(--beam-width);
  pointer-events: none;
  background: conic-gradient(
    from var(--beam-angle),
    transparent 0deg,
    transparent calc(360deg - var(--beam-arc)),
    color-mix(in oklab, var(--beam-color) 35%, transparent) calc(360deg - var(--beam-arc) * 0.55),
    var(--beam-color) 360deg
  );
  -webkit-mask: linear-gradient(black 0 0) content-box, linear-gradient(black 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(black 0 0) content-box exclude, linear-gradient(black 0 0);
  animation: ui-beam-spin var(--beam-duration) linear infinite;
  transition: opacity 0.4s var(--ease-brand);
}
.ui-beam[data-active="false"]::after { opacity: 0; animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .ui-beam::after { animation: none; background: color-mix(in oklab, var(--beam-color) 55%, transparent); }
}`;

const TONES = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
} as const;

type BorderBeamProps = Omit<HTMLAttributes<HTMLElement>, "children" | "style"> & {
  children?: ReactNode;
  /** Kabın öğesi; köşe yarıçapı, zemin ve iç boşluk `className`den. */
  as?: ElementType;
  /** Işık dolaşıyor mu. `false` olunca söner (yer değişmez). */
  active?: boolean;
  tone?: keyof typeof TONES;
  /** Bir turun saniyesi. 3-6 arası: kısası telaşlı, uzunu fark edilmez. */
  duration?: number;
  /** Işığın kuyruğuyla birlikte kapladığı açı (derece). */
  arc?: number;
  /** Çerçeve kalınlığı (piksel). */
  width?: number;
  className?: string;
};

export function BorderBeam({
  children,
  as: Tag = "div",
  active = true,
  tone = "primary",
  duration = 4,
  arc = 110,
  width = 1.5,
  className,
  ...props
}: BorderBeamProps) {
  return (
    <>
      <style href="ui-border-beam" precedence="default">
        {CSS}
      </style>
      <Tag
        {...props}
        data-active={active}
        className={cn("ui-beam", className)}
        style={
          {
            "--beam-color": TONES[tone],
            "--beam-duration": `${duration}s`,
            "--beam-arc": `${arc}deg`,
            "--beam-width": `${width}px`,
          } as CSSProperties
        }
      >
        {children}
      </Tag>
    </>
  );
}
