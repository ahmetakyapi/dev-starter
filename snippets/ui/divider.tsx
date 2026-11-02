import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ayırıcı: içeriği iki parçaya bölen kıl çizgi. Kart içinde ikinci bir kart
 * açmak yerine (slop) bölümler bununla ayrılır.
 *
 * ANLAM ÜÇ DURUMDA FARKLI:
 * - Yatay, etiketsiz: `<hr>`. Rolü kendiliğinden `separator`; ekran okuyucu
 *   "ayırıcı" der. Yalnızca konu değişiyorsa anlamlı; süs ise `decorative`.
 * - Dikey: `<div role="separator" aria-orientation="vertical">`. `<hr>`
 *   yatay varsayılır, dikeyliği ARIA söyler. Araç çubuğunda düğme grubunu
 *   ayırırken en sık bu gerekir.
 * - Etiketli ("ya da"): kapsayıcı `separator` DEĞİL. `separator` rolünün
 *   çocukları sunumsaldır (ARIA): etiket ekran okuyucudan silinirdi ve
 *   "Google ile Gir / ya da / E-postayla Gir" akışındaki "ya da" kaybolurdu.
 *   İki çizgi `aria-hidden`, etiket düz metin olarak okunur.
 *
 * `decorative`: bölücü yalnızca görsel ritimse (liste öğeleri arası)
 * ekran okuyucuya her satırda "ayırıcı" dedirtme.
 *
 * Renk `border-line` (kıl), `strong` yalnızca yoğun tablolarda. Sunucu bileşeni.
 */

type DividerProps = {
  orientation?: "horizontal" | "vertical";
  /** Ortadaki kısa etiket: "ya da", "Dün". Yalnızca yatayda. */
  label?: ReactNode;
  /** Etiketin hizası. */
  align?: "start" | "center";
  tone?: "soft" | "default" | "strong";
  decorative?: boolean;
  className?: string;
};

const TONE = { soft: "border-line-soft", default: "border-line", strong: "border-line-strong" } as const;
const TONE_BG = { soft: "bg-line-soft", default: "bg-line", strong: "bg-line-strong" } as const;

export function Divider({
  orientation = "horizontal",
  label,
  align = "center",
  tone = "default",
  decorative = false,
  className,
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role={decorative ? "presentation" : "separator"}
        aria-orientation={decorative ? undefined : "vertical"}
        className={cn("w-px shrink-0 self-stretch", TONE_BG[tone], className)}
      />
    );
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3 text-small font-medium text-muted", className)}>
        {align === "center" ? <span aria-hidden className={cn("h-px flex-1", TONE_BG[tone])} /> : null}
        <span className="shrink-0">{label}</span>
        <span aria-hidden className={cn("h-px flex-1", TONE_BG[tone])} />
      </div>
    );
  }

  return (
    <hr
      aria-hidden={decorative || undefined}
      className={cn("h-0 w-full shrink-0 border-0 border-t", TONE[tone], className)}
    />
  );
}
