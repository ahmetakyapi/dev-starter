// ÜRETİLDİ: scripts/build-ui-package.mjs — elle düzenleme, kaynak snippets/ui/
import { Children, type ReactNode } from "react";
import { BatteryFull, Signal, Wifi } from "lucide-react";
import { cn } from "../utils";

/**
 * Telefon çerçevesi: mobil uygulamayı ekran görüntüsü yerine CANLI
 * bileşenlerle anlatan maket. Yuvarlak köşeli gövde (ince çerçeve halkası,
 * kenar parlaması), üstte durum çubuğu (saat, sinyal, kablosuz, pil),
 * dinamik ada, içerik yuvası ve altta ev çubuğu. Tanıtım sayfasının
 * "uygulamada" bölümü, özellik karosu sahnesi, indirme çağrısı. Manzara
 * turu (28 Kasım 2026), yalnız davranış ve yapı.
 *
 * NE ZAMAN DEĞİL: gerçek mobil önizleme (`live-preview` kiti cihaz
 * genişliğinde gerçek sayfayı gösterir), uzun içerik (yuva kaydırılmaz,
 * taşan kırpılır), masaüstü ürünü (onun için `app-window`).
 *
 * NASIL: gövde `size` genişliğinde, oran 9 / 19.5 sabit. Kök bir
 * kap-sorgusu kabı (`container-type: inline-size`): çerçeve kalınlığı,
 * köşe, ada ve durum çubuğu `cqw` ile ölçeklenir, `max-w-full` ile
 * daraldığında da oran bozulmaz. `tone`: `light` ekran `bg-page`, `dark`
 * ekran `bg-strong` + `text-page`. `tilt`: hafif 3B eğim; ince işaretçide
 * üzerine gelince düzleşir (yalnız `rotate`), hareketi azaltanda eğim
 * durağan. Sunucu bileşeni.
 *
 * `DeviceRow`: 2-3 telefonu yan yana dizer; ortadaki (ikide ilki) önde ve
 * tam boy, yandakiler küçük ve hafif içe dönük. Telefonda yalnız öndeki
 * görünür (yandakiler `max-sm:hidden`).
 *
 * ERİŞİLEBİLİRLİK: çerçeve katmanları (gövde, ada, durum çubuğu, ev
 * çubuğu) `aria-hidden`; içerik normal erişilebilir. `label` verilirse
 * * `figure` + görünmez `figcaption` + `aria-label` (Chromium figcaption adını
 * güvenilir hesaplamıyor). İçeriğe gerçek bağlantı koyarsan
 * odaklanabilir kalır; süs sahnesinde çağıran `inert` versin.
 *
 *   <DeviceFrame label="Kişisel finans uygulaması, ana ekran" tilt>
 *     <div className="p-4">…</div>
 *   </DeviceFrame>
 */

const CSS = `
.ui-device { container-type: inline-size; position: relative; display: block; flex: none; aspect-ratio: 9 / 19.5; }
.ui-device-stage { position: absolute; inset: 0; perspective: 1400px; }
.ui-device-body { position: absolute; inset: 0; border-radius: 15cqw; transition: rotate 0.5s var(--ease-brand);
  background: color-mix(in oklab, black 84%, var(--text-muted));
  box-shadow: 0 0 0 1px var(--line), inset 0 0 0 1px color-mix(in oklab, white 22%, transparent),
    inset 0 0.6cqw 0.8cqw color-mix(in oklab, white 14%, transparent), var(--shadow-md); }
.ui-device[data-tilt] .ui-device-body { rotate: 0.4 1 0 -14deg; }
@media (hover: hover) and (pointer: fine) { .ui-device[data-tilt]:hover .ui-device-body { rotate: 0.4 1 0 0deg; } }
@media (prefers-reduced-motion: reduce) { .ui-device-body { transition: none; } .ui-device[data-tilt]:hover .ui-device-body { rotate: 0.4 1 0 -14deg; } }
.ui-device-screen { position: absolute; inset: 3.4cqw; border-radius: 11.6cqw; overflow: hidden; display: flex; flex-direction: column; }
.ui-device-status { position: relative; display: flex; flex: none; align-items: center; justify-content: space-between; height: 12cqw;
  padding: 1.2cqw 7cqw 0; font-size: 4.2cqw; font-weight: 600; font-variant-numeric: tabular-nums; }
.ui-device-status svg { width: 4.6cqw; height: 4.6cqw; }
.ui-device-island { position: absolute; left: 50%; top: 2.6cqw; width: 29cqw; height: 8cqw; translate: -50% 0; border-radius: 999px;
  background: color-mix(in oklab, black 94%, var(--text-muted)); }
.ui-device-home { position: absolute; left: 50%; bottom: 2.2cqw; width: 34cqw; height: 1.3cqw; translate: -50% 0; border-radius: 999px;
  background: currentColor; opacity: 0.72; pointer-events: none; }`;

export type DeviceFrameProps = {
  children?: ReactNode;
  /** Durum çubuğundaki saat. */
  time?: string;
  /** Ekran zemini: `light` sayfa, `dark` ters (bg-strong + text-page). */
  tone?: "light" | "dark";
  /** Gövde genişliği, piksel (oran 9 / 19.5). */
  size?: number;
  /** Hafif 3B eğim; ince işaretçide üzerine gelince düzleşir. */
  tilt?: boolean;
  /** Verilirse `figure` + görünmez `figcaption`. */
  label?: string;
  className?: string;
};

export function DeviceFrame({ children, time = "9:41", tone = "light", size = 280, tilt, label, className }: DeviceFrameProps) {
  const Root = label ? "figure" : "div";
  return (
    <Root data-tilt={tilt || undefined} aria-label={label} className={cn("ui-device m-0 max-w-full", className)} style={{ width: size }}>
      <style href="ui-device-frame" precedence="default">
        {CSS}
      </style>
      <div className="ui-device-stage">
        <div className="ui-device-body">
          <div className={cn("ui-device-screen", tone === "dark" ? "bg-strong text-page" : "bg-page text-strong")}>
            <div aria-hidden className="ui-device-status">
              <span>{time}</span>
              <span className="flex items-center gap-[1.4cqw]">
                <Signal strokeWidth={2.5} />
                <Wifi strokeWidth={2.5} />
                <BatteryFull strokeWidth={2} />
              </span>
              <span className="ui-device-island" />
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
            <span aria-hidden className="ui-device-home" />
          </div>
        </div>
      </div>
      {label ? <figcaption className="sr-only">{label}</figcaption> : null}
    </Root>
  );
}

export type DeviceRowProps = {
  /** 2-3 `DeviceFrame`; fazlası kesilir. */
  children: ReactNode;
  /** Verilirse `figure` + görünmez `figcaption`. */
  label?: string;
  className?: string;
};

export function DeviceRow({ children, label, className }: DeviceRowProps) {
  const items = Children.toArray(children).slice(0, 3);
  const front = items.length === 3 ? 1 : 0;
  const Root = label ? "figure" : "div";
  return (
    <Root aria-label={label} className={cn("m-0 flex items-center justify-center [perspective:1600px]", className)}>
      {items.map((child, i) => {
        const side = i === front ? 0 : i < front ? -1 : 1;
        return (
          <div
            key={i}
            className={cn(
              "relative min-w-0",
              side === 0 ? "z-10" : "z-0 max-sm:hidden",
              side === -1 && "-mr-[1%] origin-right scale-[0.86] rotate-y-[16deg]",
              side === 1 && "-ml-[1%] origin-left scale-[0.86] -rotate-y-[16deg]",
            )}
          >
            {child}
          </div>
        );
      })}
      {label ? <figcaption className="sr-only">{label}</figcaption> : null}
    </Root>
  );
}
