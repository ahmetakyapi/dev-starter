"use client";

import { Check } from "lucide-react";
import { useSyncExternalStore, type CSSProperties } from "react";
import { chart, palettes, roles, type PaletteName } from "../../../packages/@ahmet/theme/tokens";
import { cn } from "@/lib/utils";
import { REVENUE_CHANGE, REVENUE_TOTAL, fromK } from "./_data";

/**
 * Tema bölümü. Paletler `:root[data-palette]` seçicili: alt öğede çalışmaz.
 * Bu yüzden kartlar ve açık/koyu önizlemesi renklerini `tokens.ts`ten
 * (theme.css'in JS aynası) okur; tıklama sayfanın kendi `<html data-palette>`ını
 * değiştirir, alttaki yüzen palet hapı (palette-switcher) da aynı özniteliği dinler.
 */

export const PALETTE_LABELS: Record<PaletteName, string> = {
  signature: "Signature",
  cobalt: "Kobalt",
  violet: "Menekşe",
  rose: "Gül",
  ruby: "Yakut",
  tangerine: "Mandalina",
  jade: "Yeşim",
  verdant: "Zümrüt",
  ember: "Kehribar",
  iris: "İris",
};
const ORDER = Object.keys(PALETTE_LABELS) as PaletteName[];
export const PALETTE_COUNT = Object.keys(palettes).length;

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "data-theme"] });
  return () => observer.disconnect();
}
const readPalette = () => (document.documentElement.dataset.palette ?? "signature") as PaletteName;
const readTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function usePalette(): PaletteName {
  const p = useSyncExternalStore(subscribe, readPalette, () => "signature" as PaletteName);
  return p in palettes ? p : "signature";
}
export function useTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, readTheme, () => "light" as const);
}

function choose(id: PaletteName) {
  const swap = () => {
    document.documentElement.dataset.palette = id;
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) swap();
  else {
    // Ok tuşlarıyla hızlı geçişte önceki geçiş atlanır ve `ready` /
    // `updateCallbackDone` "Transition was skipped" ile reddedilir: beklenen
    // durum, yakalanmazsa konsola işlenmemiş hata düşer.
    const transition = document.startViewTransition(swap);
    transition.ready.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
  }
}

export function PaletteCards() {
  const current = usePalette();
  const theme = useTheme();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Paletler">
      {ORDER.map((id) => {
        const p = palettes[id][theme];
        const on = id === current;
        return (
          <li key={id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => choose(id)}
              className={cn(
                "group flex h-full w-full flex-col rounded-2xl bg-surface p-2 text-start transition-colors hover:bg-surface-raised",
                on && "bg-surface-raised",
              )}
            >
              <span aria-hidden className="relative block h-24 overflow-hidden rounded-xl shadow-raised" style={{ backgroundImage: p.brandGradient }}>
                {on ? (
                  <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-overlay text-strong shadow-raised">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                ) : null}
              </span>
              <span className="flex items-center justify-between gap-2 px-2 pt-3 pb-1.5">
                <span className="text-base font-semibold text-strong">{PALETTE_LABELS[id]}</span>
                <span className="font-mono text-micro text-muted">{id}</span>
              </span>
              <span aria-hidden className="flex gap-1 px-2 pb-1.5">
                {[p.primary, p.primarySoft, p.primaryWash].map((c, i) => (
                  <span key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Bir temanın küçük ekranı: renkler tokens.ts'ten, böylece iki tema yan yana durabilir. */
function MiniScreen({ mode, palette }: { mode: "light" | "dark"; palette: PaletteName }) {
  const r = roles[mode];
  const c = chart[mode];
  const p = palettes[palette][mode];
  const bars = [0.46, 0.62, 0.55, 0.78, 0.7, 0.92, 0.84];
  const v = (style: CSSProperties) => style;
  return (
    <figure className="row-span-2 grid grid-rows-subgrid gap-y-3">
      <div className="overflow-hidden rounded-2xl border border-line p-5 sm:p-7" style={v({ backgroundColor: r.pageBg, color: r.textBody })}>
        <p className="text-small font-medium" style={{ color: r.textMuted }}>
          Kıyı Kahve · Pano
        </p>
        <p className="mt-1 text-heading font-semibold tracking-[-0.03em]" style={{ color: r.textStrong }}>
          {fromK(REVENUE_TOTAL)} ciro
        </p>
        <div className="mt-5 rounded-xl p-2" style={{ backgroundColor: r.surface }}>
          <div className="flex h-28 items-end gap-1.5 rounded-xl px-3 pt-3" style={{ backgroundColor: r.overlay, boxShadow: `0 0 0 1px ${r.line}` }}>
            {bars.map((h, i) => (
              <span key={i} className="flex-1 rounded-t-md" style={{ height: `${h * 100}%`, backgroundColor: i === 5 ? c[2] : c.track }} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[c[1], c[3], c[4]].map((color, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ backgroundColor: r.overlay, boxShadow: `0 0 0 1px ${r.line}` }}>
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-small font-medium" style={{ color: r.textStrong }}>
                  {["Web", "Kafe", "Abone"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-9 items-center rounded-md px-4 text-small font-semibold text-on-brand" style={{ backgroundImage: p.ctaGradient }}>
            Sipariş Ver
          </span>
          <span className="inline-flex min-h-9 items-center rounded-md px-4 text-small font-semibold" style={{ backgroundColor: p.primaryWash, color: p.primaryInk }}>
            Taslak
          </span>
          <span className="ml-auto text-small font-medium" style={{ color: r.success }}>
            +%{REVENUE_CHANGE.toLocaleString("tr-TR")}
          </span>
        </div>
      </div>
      <figcaption className="flex items-baseline justify-between gap-3 px-1">
        <span className="text-base font-semibold text-strong">{mode === "light" ? "Açık Tema" : "Koyu Tema"}</span>
        <span className="font-mono text-micro text-muted">data-theme="{mode}"</span>
      </figcaption>
    </figure>
  );
}

export function ThemeCompare() {
  const palette = usePalette();
  return (
    <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
      <MiniScreen mode="light" palette={palette} />
      <MiniScreen mode="dark" palette={palette} />
    </div>
  );
}
