// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { isValidElement, type CSSProperties, type ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../utils";

/**
 * Parlak ikon karosu: yumuşak köşeli (squircle), hafif 3B duran renkli karo;
 * ortada beyaz lucide ikonu. Özellik kartının başında ikon, entegrasyon ya
 * da uygulama işareti, kahramanın yanında süs şeridi (`GlossArc`). Manzara
 * turu (28 Kasım 2026), yalnız davranış ve yapı.
 *
 * NE ZAMAN DEĞİL: her başlığın üstünde (slop: "her başlıkta ikon karesi"),
 * buton yerine (karo tıklanmaz), anlamı yalnız renkle taşıyan durum
 * göstergesi (onun için `status-icon`). Bir bölümde seçici kullan.
 *
 * NASIL: dolgu tonun `color-mix` türevi, üstte beyaza alta siyaha karışır;
 * üst yarıda beyazımsı parlama elipsi, iç gölge (üstte ışık, altta koyu
 * kenar) ve tonun renginde yumuşak dış hale. Köşe `border-radius` yüzde
 * ile, destekleyen tarayıcıda `corner-shape: squircle`. Boyut `sm|md|lg|xl`
 * (32/44/56/72 piksel). Sunucu bileşeni, JavaScript yok. `icon` lucide
 * bileşeni (`Wallet`) ya da öğesi (`<Wallet />`); istemci sınırından
 * geçirilecekse öğe ver (bileşen fonksiyonu sunucudan istemciye geçmez).
 *
 * `GlossArc`: karoları bir yay boyunca dizer; her karo yaydaki açısına göre
 * döner, `count` yuva yay üzerinde eşit aralıklı (`tiles` sırayla tekrar
 * eder), `radius` yayın yarıçapı, `arc` görünen açı. `drift`: tam çember
 * dizilir ve yavaşça döner, kap yalnız üst dilimi gösterir (kenarlar
 * maskeyle solar). Kap `content-visibility: auto` taşır: görünüm dışında
 * tarayıcı çizmez. Hareketi azaltan kullanıcıda dönmez.
 *
 * ERİŞİLEBİLİRLİK: ikisi de varsayılan süs (`aria-hidden`); `label`
 * verilirse `role="img"` + `aria-label`. İkonun beyazı açık tonlarda
 * (`chart-1`, `chart-5`) düşük kontrastlıdır: süs için kabul, anlam
 * taşıyorsa koyu bir ton seç.
 *
 *   <GlossTile icon={Wallet} tone="chart-2" size="lg" />
 *   <GlossArc tiles={[{ icon: Wallet, tone: "primary" }, { icon: PiggyBank, tone: "chart-6" }]} count={7} radius={320} drift />
 */

const TONES = {
  primary: "var(--primary)",
  neutral: "var(--text-muted)",
  "chart-1": "var(--chart-1)",
  "chart-2": "var(--chart-2)",
  "chart-3": "var(--chart-3)",
  "chart-4": "var(--chart-4)",
  "chart-5": "var(--chart-5)",
  "chart-6": "var(--chart-6)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
} as const;

export type GlossTone = keyof typeof TONES;

const SIZES = {
  sm: { box: "size-8", icon: "size-4", px: 32 },
  md: { box: "size-11", icon: "size-5.5", px: 44 },
  lg: { box: "size-14", icon: "size-7", px: 56 },
  xl: { box: "size-18", icon: "size-9", px: 72 },
} as const;

export type GlossSize = keyof typeof SIZES;

const CSS = `
.ui-gloss { position: relative; display: inline-grid; place-items: center; flex: none; border-radius: 30%; corner-shape: squircle; isolation: isolate;
  background: var(--tone);
  background-image: linear-gradient(180deg, color-mix(in oklab, var(--tone) 72%, white) 0%, var(--tone) 52%, color-mix(in oklab, var(--tone) 78%, black) 100%);
  box-shadow: inset 0 1px 0 color-mix(in oklab, white 55%, transparent), inset 0 -2px 4px color-mix(in oklab, black 22%, transparent),
    inset 0 0 0 1px color-mix(in oklab, black 8%, transparent), 0 6px 16px -6px color-mix(in oklab, var(--tone) 70%, transparent),
    0 2px 4px -2px color-mix(in oklab, var(--tone) 45%, black); }
.ui-gloss::before { content: ""; position: absolute; left: 12%; right: 12%; top: 5%; height: 46%; border-radius: 50%; z-index: -1;
  background: linear-gradient(180deg, color-mix(in oklab, white 62%, transparent), color-mix(in oklab, white 6%, transparent)); }
.ui-gloss-icon > svg { width: 100%; height: 100%; }
.ui-gloss > svg, .ui-gloss > .ui-gloss-icon { color: var(--on-brand); filter: drop-shadow(0 1px 1px color-mix(in oklab, black 28%, transparent)); }
@keyframes ui-gloss-wheel { to { rotate: -1turn; } }
.ui-gloss-arc { position: relative; overflow: hidden; content-visibility: auto;
  -webkit-mask-image: linear-gradient(to right, transparent, black 14%, black 86%, transparent); mask-image: linear-gradient(to right, transparent, black 14%, black 86%, transparent); }
.ui-gloss-wheel { position: absolute; left: 50%; width: 0; height: 0; }
.ui-gloss-wheel[data-drift] { animation: ui-gloss-wheel var(--arc-dur) linear infinite; }
.ui-gloss-slot { position: absolute; left: 0; top: 0; translate: -50% -50%; transform: rotate(var(--a)) translateY(calc(var(--r) * -1)); }
@media (prefers-reduced-motion: reduce) { .ui-gloss-wheel[data-drift] { animation: none; } }`;

function Style() {
  return (
    <style href="ui-gloss-tile" precedence="default">
      {CSS}
    </style>
  );
}

/** lucide bileşeni (`Wallet`) ya da öğesi (`<Wallet aria-hidden />`); öğe sunucu sınırından geçer. */
export type GlossIcon = LucideIcon | ReactElement;

function IconOf({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return <Icon aria-hidden className={className} strokeWidth={2.25} />;
}

export type GlossTileProps = {
  icon: GlossIcon;
  tone?: GlossTone;
  size?: GlossSize;
  /** Anlam taşıyorsa erişilebilir ad; yoksa süs. */
  label?: string;
  className?: string;
};

export function GlossTile({ icon, tone = "primary", size = "md", label, className }: GlossTileProps) {
  const s = SIZES[size];
  return (
    <>
      <Style />
      <span
        className={cn("ui-gloss", s.box, className)}
        style={{ "--tone": TONES[tone] } as CSSProperties}
        {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      >
        {isValidElement(icon) ? (
          <span aria-hidden className={cn("ui-gloss-icon grid", s.icon)}>
            {icon}
          </span>
        ) : (
          <IconOf icon={icon} className={s.icon} />
        )}
      </span>
    </>
  );
}

export type GlossArcProps = {
  /** Yaydaki karolar; `count`tan azsa sırayla tekrar eder. */
  tiles: readonly { icon: GlossIcon; tone?: GlossTone }[];
  /** Görünen yaydaki yuva sayısı (eşit aralık). Varsayılan `tiles.length`. */
  count?: number;
  /** Yay yarıçapı, piksel. */
  radius?: number;
  /** Görünen yayın açısı, derece (40-160). */
  arc?: number;
  size?: GlossSize;
  /** Tam çember dizilir ve yay boyunca yavaşça döner. */
  drift?: boolean;
  /** Bir tam turun süresi, saniye. */
  duration?: number;
  label?: string;
  className?: string;
};

export function GlossArc({ tiles, count, radius = 300, arc = 100, size = "md", drift, duration = 120, label, className }: GlossArcProps) {
  const slots = Math.max(count ?? tiles.length, 2);
  const step = arc / (slots - 1);
  const tile = SIZES[size].px;
  // Kayarken çember dolu olmalı: yuvalar 360 dereceye aynı aralıkla yayılır.
  const total = drift ? Math.max(Math.round(360 / step), slots) : slots;
  const angleStep = drift ? 360 / total : step;
  const start = drift ? 0 : -arc / 2;
  const half = (arc / 2) * (Math.PI / 180);
  const height = Math.ceil(tile * 1.4 + radius * (1 - Math.cos(half)));
  const width = Math.ceil(2 * radius * Math.sin(half) + tile * 2);

  return (
    <>
      <Style />
      <div
        className={cn("ui-gloss-arc max-w-full", className)}
        style={{ width, height, containIntrinsicSize: `${width}px ${height}px` }}
        {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      >
        <div
          className="ui-gloss-wheel"
          data-drift={drift || undefined}
          style={{ top: radius + tile * 0.7, "--arc-dur": `${duration}s` } as CSSProperties}
        >
          {Array.from({ length: total }, (_, i) => {
            const item = tiles[i % tiles.length];
            if (!item) return null;
            return (
              <span key={i} className="ui-gloss-slot" style={{ "--a": `${start + i * angleStep}deg`, "--r": `${radius}px` } as CSSProperties}>
                <GlossTile icon={item.icon} tone={item.tone} size={size} />
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
