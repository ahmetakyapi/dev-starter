"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Palet değiştirici: ekranın altında yüzen hap; solda palet noktaları,
 * sağda açık/koyu anahtarı (şablonun `ThemeToggle`ı). Vitrin, tema
 * denemesi, "kendi renginle gör" ekranları için. Ürün ayarında kalıcı
 * bir tercih olacaksa aynı bileşen `floating={false}` ile ayar satırına girer.
 *
 * KURULUM (üç adım):
 *   1. Paletler isteğe bağlı `app/palettes.css`te. Bütün sitede gerekiyorsa
 *      `app/globals.css`te `@import "tailwindcss";` satırının altına
 *      `@import "./palettes.css";`; yalnız bir rotada gerekiyorsa o rotanın
 *      sayfasında `import "../palettes.css";` (vitrin böyle).
 *   2. Seçim `<html data-palette>`a ve `palette` çerezine yazılır. Sonraki
 *      yüklemede ilk boyamadan ÖNCE geri gelsin diye kök layout'taki tema
 *      script'inin yanına (lib/theme.ts → THEME_SCRIPT) şu satırı ekle:
 *        var p=document.cookie.match(/(?:^|; )palette=([a-z]+)/);
 *        if(p)document.documentElement.dataset.palette=p[1];
 *      Script yoksa sayfa önce varsayılan paletle boyanır, sonra döner.
 *   3. `<PaletteSwitcher initialPalette={PALETTE} initialTheme={DEFAULT_THEME} />`.
 *
 * NOKTA RENKLERİ NEREDEN: paletler `:root[data-palette="x"]` seçicisiyle
 * tanımlı ve `:root` yalnızca `<html>`e eşleşir; noktayı `data-palette`
 * taşıyan bir `<span>`e sarmak `--primary`ı DEĞİŞTİRMEZ (Playwright ile
 * ölçüldü). Bu yüzden `palettes.css` her paletin rengini ayrıca
 * `--swatch-<palet>` olarak `:root`a basar (açık ve koyu temada ayrı), nokta
 * `var(--swatch-…)` okur. Değer tek kaynaktan (tokens.ts → üretici betik);
 * sabit hex yok. palettes.css yüklü değilse nokta nötr kalır: palet zaten
 * çalışmıyordur, dürüst bir işaret.
 *
 * Erişilebilirlik: `role="radiogroup"`, gezici tabindex, ok tuşları/Home/End
 * seçimi taşır ve hemen uygular (paletin etkisi anında, Kaydet yok). Her
 * noktanın adı `aria-label`da; seçili halka renk değil KALINLIK farkıyla
 * okunur. Palet geçişi tarayıcı destekliyorsa kısa çapraz solmayla
 * (View Transition), hareketi azaltan kullanıcıda anında.
 */

export type PaletteOption = { id: string; label: string };

const DEFAULT_PALETTES: readonly PaletteOption[] = [
  { id: "signature", label: "Signature" },
  { id: "cobalt", label: "Kobalt" },
  { id: "violet", label: "Menekşe" },
  { id: "rose", label: "Gül" },
  { id: "ruby", label: "Yakut" },
  { id: "tangerine", label: "Mandalina" },
  { id: "jade", label: "Yeşim" },
  { id: "verdant", label: "Zümrüt" },
  { id: "ember", label: "Kehribar" },
  { id: "iris", label: "İris" },
];

const COOKIE = "palette";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/* --- <html data-palette> ve data-theme: bileşen DİNLER, kopya tutmaz ----- */

function subscribeRoot(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "data-theme"] });
  return () => observer.disconnect();
}

const readPalette = () => document.documentElement.dataset.palette ?? "";

/* --- Uygulama ----------------------------------------------------------- */

function applyPalette(id: string) {
  const root = document.documentElement;
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE}=${id}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
  const swap = () => {
    root.dataset.palette = id;
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // `theme-switching` sınıfı YOK: o sınıf ThemeToggle'ın dairesel açılışını
  // çağırır; palet için tarayıcının kısa çapraz solması yeter.
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

type PaletteSwitcherProps = {
  /** Sunucunun bastığı palet (`<html data-palette>` ile aynı). */
  initialPalette: string;
  /** ThemeToggle'ın hidrasyon değeri. `null`: tema anahtarı gösterilmez. */
  initialTheme: Theme | null;
  palettes?: readonly PaletteOption[];
  /** `true`: ekranın altında ortada yüzer. `false`: bulunduğu yerde durur. */
  floating?: boolean;
  label?: string;
  className?: string;
};

export function PaletteSwitcher({
  initialPalette,
  initialTheme,
  palettes = DEFAULT_PALETTES,
  floating = true,
  label = "Renk Paleti",
  className,
}: PaletteSwitcherProps) {
  const current = useSyncExternalStore(subscribeRoot, readPalette, () => initialPalette) || initialPalette;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    palettes.findIndex((p) => p.id === current),
  );

  function onKeyDown(event: KeyboardEvent) {
    const last = palettes.length - 1;
    const map: Record<string, number> = {
      ArrowRight: (selectedIndex + 1) % palettes.length,
      ArrowDown: (selectedIndex + 1) % palettes.length,
      ArrowLeft: (selectedIndex - 1 + palettes.length) % palettes.length,
      ArrowUp: (selectedIndex - 1 + palettes.length) % palettes.length,
      Home: 0,
      End: last,
    };
    const next = map[event.key];
    if (next === undefined) return;
    event.preventDefault();
    applyPalette(palettes[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      className={cn(
        "flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-line bg-overlay p-1 shadow-floating",
        floating && "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2",
        className,
      )}
    >
      <div
        role="radiogroup"
        aria-label={label}
        className="flex min-w-0 items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
      >
        {palettes.map((palette, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={palette.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={palette.label}
              title={palette.label}
              tabIndex={selected ? 0 : -1}
              onClick={() => applyPalette(palette.id)}
              onKeyDown={onKeyDown}
              className="group relative inline-grid size-11 shrink-0 place-items-center rounded-full pointer-fine:size-8"
            >
              {/* Seçili halka: kalınlık farkı, renk değil. 0.85'ten gelir. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-1.5 rounded-full border-2 border-strong transition-[opacity,scale] duration-200 pointer-fine:inset-0.5",
                  selected ? "scale-100 opacity-100" : "scale-[0.85] opacity-0",
                )}
              />
              <span
                aria-hidden
                // palettes.css'in bastığı `--swatch-*`; yoksa nötr iz rengi.
                style={{ backgroundColor: `var(--swatch-${palette.id}, var(--chart-track))` }}
                className="size-5 rounded-full shadow-raised transition-[scale] duration-150 group-hover:scale-110 group-active:scale-95 pointer-fine:size-4"
              />
            </button>
          );
        })}
      </div>
      {initialTheme ? (
        <>
          <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-line" />
          <ThemeToggle
            initialTheme={initialTheme}
            className="shrink-0 border-transparent bg-transparent hover:border-transparent hover:bg-surface-raised pointer-fine:size-8"
          />
        </>
      ) : null}
    </div>
  );
}
