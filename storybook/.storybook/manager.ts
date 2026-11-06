import { createElement } from "react";
import { addons, type API } from "storybook/manager-api";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { THEMES, lightTheme, paletteCss } from "./manager-theme";

/* Storybook'un kendi arayüzü de board dilinde ve ARAÇ ÇUBUĞUNU İZLER:
   Tema (Açık/Koyu) ve Palet seçilince yalnız tuval değil, sidebar, araç
   çubuğu ve belge de döner. Eklenti yok: kanal olayları (`SET_GLOBALS`,
   `GLOBALS_UPDATED`) + `api.setOptions({ theme })`. Seçili satırın rengi
   paletten (manager-head.html, değişkenler `paletteCss()`ten). */

type Item = { name: string; tags?: string[]; type?: string };

/** "yeni" etiketli hikâye grubunun adının yanında küçük "Yeni" hapı. */
function renderLabel(item: Item) {
  if (!item.tags?.includes("yeni") || item.type === "story" || item.type === "docs") return undefined;
  return createElement(
    "span",
    { className: "ds-label" },
    item.name,
    createElement("span", { className: "ds-new", "aria-label": "yeni bileşen" }, "Yeni"),
  );
}

addons.setConfig({
  theme: lightTheme,
  // showRoots kapalı: açıkken tek düzeyli başlıklar (Vitrin, Başlangıç) her
  // zaman bölüm başlıklarının ÜSTÜNE çıkıyor ve storySort sırası bozuluyordu.
  sidebar: { showRoots: false, renderLabel },
});

addons.register("dev-starter/theme-sync", (api: API) => {
  const style = document.createElement("style");
  style.dataset.devStarter = "palettes";
  style.textContent = paletteCss();
  document.head.appendChild(style);

  let current = "";
  const apply = (globals: Record<string, unknown> | undefined) => {
    const mode = globals?.theme === "dark" || globals?.theme === "Koyu" ? "dark" : "light";
    const palette = String(globals?.palette ?? "signature");
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.dataset.palette = palette;
    if (current !== mode) {
      current = mode;
      api.setOptions({ theme: THEMES[mode] });
    }
  };
  apply(undefined);
  api.on(SET_GLOBALS, ({ globals }: { globals: Record<string, unknown> }) => apply(globals));
  api.on(GLOBALS_UPDATED, ({ globals }: { globals: Record<string, unknown> }) => apply(globals));
});
