import { createElement } from "react";
import { addons, type API } from "storybook/manager-api";
import { GLOBALS_UPDATED, SET_GLOBALS, STORY_PREPARED } from "storybook/internal/core-events";
import { THEMES, lightTheme, paletteCss } from "./manager-theme";

/* Storybook'un kendi arayüzü de board dilinde ve ARAÇ ÇUBUĞUNU İZLER:
   Tema (Açık/Koyu) ve Palet seçilince yalnız tuval değil, sidebar, araç
   çubuğu ve belge de döner. Eklenti yok: kanal olayları (`SET_GLOBALS`,
   `GLOBALS_UPDATED`) + `api.setOptions({ theme })`. Seçili satırın rengi
   paletten (manager-head.html, değişkenler `paletteCss()`ten). */

type Item = { name: string; tags?: string[]; type?: string; depth?: number; children?: string[] };

/**
 * Etiket: belge sayfaları "Docs" yerine "Belge" (yalnız görünen ad; adres
 * `…--docs` kalır, README bağlantıları ve İngilizce adres denetimi bozulmaz).
 * "yeni" etiketli hikaye grubunun adının yanında küçük "Yeni" hapı.
 */
function renderLabel(item: Item) {
  if (item.type === "docs" && item.name === "Docs") return "Belge";
  // Alt grup (Bileşenler/Temel, Ekranlar/Uygulama…): yanında kaç sayfa olduğu,
  // soluk ve sağa yaslı. Grubu açmadan "burada ne kadar şey var" okunur.
  const count = item.type === "group" && (item.depth ?? 0) > 0 && item.children?.length ? item.children.length : 0;
  const isNew = item.tags?.includes("yeni") && item.type !== "story" && item.type !== "docs";
  if (!count && !isNew) return undefined;
  return createElement(
    "span",
    { className: "ds-label" },
    item.name,
    isNew ? createElement("span", { className: "ds-new", "aria-label": "yeni bileşen" }, "Yeni") : null,
    count ? createElement("span", { className: "ds-count", "aria-label": `${count} sayfa` }, String(count)) : null,
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

/* Sayfa niteliğindeki hikayelerde (kapak, vitrin, örnek uygulama) eklenti
   paneli kapanır: kapak ilk ekranın üçte birini "This story has no controls"
   kutusuna veriyordu. Panel yalnız BİZ kapattıysak geri açılır; kullanıcı
   kendi kapattıysa bileşen sayfasına geçince kapalı kalır. */
const PAGE_STORIES = /^(cover|showcase|demo-app|edas-portal|start|pattern-library|references|landing|gallery)--/;

addons.register("dev-starter/page-stories", (api: API) => {
  let hiddenByUs = false;
  api.on(STORY_PREPARED, ({ id }: { id: string }) => {
    const page = PAGE_STORIES.test(id);
    if (page && api.getIsPanelShown()) {
      api.togglePanel(false);
      hiddenByUs = true;
    } else if (!page && hiddenByUs) {
      api.togglePanel(true);
      hiddenByUs = false;
    }
  });
});

/* Arama kutusunun yer tutucusu Storybook'ta İngilizce ve ayarı yok: kabuk
   Türkçe, kutu da Türkçe konuşsun. Kutu yeniden çizilince (tema değişimi)
   gözlemci tekrar yazar. */
addons.register("dev-starter/search-placeholder", () => {
  const PLACEHOLDER = "Ara";
  const apply = () => {
    const input = document.getElementById("storybook-explorer-searchfield") as HTMLInputElement | null;
    if (input && input.placeholder !== PLACEHOLDER) input.placeholder = PLACEHOLDER;
  };
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
  apply();
});
