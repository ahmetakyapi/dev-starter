"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore, type MouseEvent } from "react";
import { DEFAULT_THEME, THEME_COLOR, THEME_COOKIE, THEME_COOKIE_MAX_AGE, isTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/*
 * Tema `<html data-theme>` özniteliğinde yaşar; bileşen onu DİNLER, kendi
 * durumunu tutmaz. Böylece aynı sayfada iki düğme olsa da ikisi aynı şeyi
 * gösterir ve sunucunun bastığı değerle hidrasyon uyuşmazlığı çıkmaz.
 */
function readTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : DEFAULT_THEME;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/*
 * Çerez İSTEMCİDE yazılır, server action ile değil: action içinde
 * `cookies().set()` Next'e "veri değişti" der; yanıt bütün sayfayı sunucuda
 * yeniden çizer (`x-action-revalidated`, sayfadaki sorgular dahil) ve
 * istemcinin ön yükleme önbelleğini boşaltır. Kozmetik bir tıklama için
 * fazla. Değer gizli değil, httpOnly gerekmez; bir sonraki yüklemede onu kimin
 * okuduğu `lib/theme.ts`in başında yazar. Sunucuya gidilmediği için tarayıcı
 * çubuğunun rengini (`theme-color`) de burası günceller.
 */
function setThemeCookie(theme: Theme) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax${secure}`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}

/* Üst üste iki tıklamada sınıfı yalnızca SON geçiş kaldırır; yoksa ilk
   geçişin bitişi ikincisi oynarken sınıfı siler ve tarayıcının varsayılan
   çapraz solması araya girer. */
let activeTransition: ViewTransition | null = null;

export function ThemeToggle({ initialTheme, className }: { initialTheme: Theme; className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => initialTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? "Açık temaya geç" : "Koyu temaya geç";

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const apply = () => {
      root.dataset.theme = next;
    };
    setThemeCookie(next);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      apply();
      return;
    }

    // Klavyeyle tetiklenen tıklamada koordinat yok (detail 0): düğmenin ortası.
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.detail > 0 ? event.clientX : box.left + box.width / 2;
    const y = event.detail > 0 ? event.clientY : box.top + box.height / 2;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.classList.add("theme-switching");

    const transition = document.startViewTransition(apply);
    activeTransition = transition;
    void transition.finished.finally(() => {
      if (activeTransition !== transition) return;
      activeTransition = null;
      root.classList.remove("theme-switching");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-11 place-items-center rounded-full border border-line bg-surface text-body transition-colors hover:border-line-strong hover:text-strong [&_svg]:size-[1.125rem]",
        className,
      )}
    >
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </button>
  );
}
