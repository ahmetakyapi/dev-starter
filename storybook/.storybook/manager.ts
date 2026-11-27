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
  // Tek harf düzen kısayolları KAPALI (27 Kasım 2026, sahibinin geri bildirimi: "değişik bir
  // edit moduna giriyoruz, çıkmak zor"): odak kenar çubuğundayken F/S/A/T/D'ye yanlışlıkla
  // basmak tam ekranı, kenar çubuğunu, paneli ve araç çubuğunu değiştiriyordu.
  enableShortcuts: false,
});

/* Düzen koruması: Storybook düzeni (tam ekran, gizli kenar çubuğu, gizli araç çubuğu)
   tarayıcıda saklar; "garip mod" yenileyince de sürüyordu. Her açılışta varsayılan düzene
   dönülür. Düzen yine de değişirse (ayarlar menüsü, "Kapat" butonu) sol altta tek buton
   "Düzeni Sıfırla" çıkar; Esc de aynı işi görür (yazı alanında ve açık diyalogda değil).
   Telefonda kenar çubuğu zaten çekmece: orada yalnız tam ekran ve araç çubuğu denetlenir. */
addons.register("dev-starter/layout-guard", (api: API) => {
  const desktop = () => window.matchMedia("(min-width: 600px)").matches;
  // SB 10 araç çubuğu durumunu okuyan bir API vermiyor (getState yok): çubuk DOM'da `section.sb-bar`.
  const toolbarShown = () => !!document.querySelector("section.sb-bar");
  const odd = () => api.getIsFullscreen() || !toolbarShown() || (desktop() && !api.getIsNavShown());
  const reset = () => {
    // Panel düzene dahil değil: sayfa hikayelerinde page-stories eklentisi onu kapalı tutar.
    const panel = api.getIsPanelShown();
    if (api.getIsFullscreen()) api.toggleFullscreen(false);
    if (!toolbarShown()) api.toggleToolbar(true);
    if (desktop() && !api.getIsNavShown()) api.toggleNav(true);
    // Storybook kenar çubuğunu açarken paneli de gecikmeli geri getiriyor: bir süre sonra eski haline.
    if (!panel) for (const ms of [60, 250]) setTimeout(() => api.getIsPanelShown() && api.togglePanel(false), ms);
  };

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ds-layout-reset";
  button.hidden = true;
  button.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg><span>Düzeni Sıfırla</span><kbd>Esc</kbd>';
  button.addEventListener("click", () => {
    reset();
    sync();
  });
  const sync = () => {
    if (!button.isConnected) document.body.append(button);
    button.hidden = !odd();
  };

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !odd()) return;
    const t = event.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.querySelector("dialog[open], [role='dialog']")) return;
    reset();
    sync();
  });

  // Açılışta saklanmış "garip" düzeni temizle (Storybook durumu kurduktan sonra).
  setTimeout(() => {
    reset();
    sync();
  }, 300);
  window.setInterval(sync, 700);
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
const PAGE_STORIES = /^(cover|showcase|demo-app|portal|start|pattern-library|references|landing|gallery)--/;

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

/* Telefondaki alt çubuk etiketi: Storybook bütün ata yolunu "/" ile birleştiriyor
   ("Tanıtım/Tanıtım", "Bileşenler/Tanıtım/Bölüm Başlığı/Varsayılan"). Kural:
   tek hikayeli sayfada (bileşenin tek ekranı) yalnız sayfa adı; birden çok
   hikayeli sayfada "Sayfa/Hikaye", tek eğik çizgi. Adres ve ekran okuyucu metni
   aynı kalır; yalnız görünen ad ve `aria-current` metni yazılır. */
type IndexEntry = { name: string; type?: string; parent?: string; children?: string[] };
addons.register("dev-starter/mobile-crumb", (api: API) => {
  const label = () => {
    const story = api.getCurrentStoryData() as unknown as IndexEntry | undefined;
    if (!story) return null;
    // `getData` yalnız hikaye/belge döndürür; bileşen kaydı `resolveStory` ile gelir.
    const parent = story.parent ? (api.resolveStory(story.parent) as unknown as IndexEntry | undefined) : undefined;
    if (!parent || parent.type !== "component") return story.name;
    const docs = (parent.children ?? []).filter((id) => id.endsWith("--docs")).length;
    const pages = (parent.children?.length ?? 0) - docs;
    return pages <= 1 ? parent.name : `${parent.name}/${story.name}`;
  };
  const apply = () => {
    const bar = document.querySelector(".sb-bar");
    if (!bar) return;
    const text = label();
    if (!text) return;
    const btn = bar.querySelector<HTMLElement>('button[aria-label="Open navigation menu"]');
    const shown = btn?.querySelector("p, span:last-child");
    if (shown && shown.textContent !== text) shown.textContent = text;
    const current = bar.querySelector('[aria-current="page"]');
    if (current && current.textContent !== text) current.textContent = text;
  };
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true, characterData: true });
  api.on(STORY_PREPARED, () => requestAnimationFrame(apply));
});

/* Kenar çubuğu araç şeridi (26 Kasım 2026, sahibinin isteği: "daralt ve direkt kapat gibi
   seçenekler ekleyelim, basınca kapansın"). Listenin üstünde yapışık iki buton:
   "Tümünü Daralt" açık grupları kapatır (uzun Portal/Bileşenler listesinden tek dokunuşla
   çıkış); "Kapat" telefonda alt çekmeceyi kapatır (Storybook'un kendi "Close menu" butonu
   liste aşağı kaydırılınca görünmüyor), masaüstünde kenar çubuğunu gizler (araç çubuğundaki
   gezinme butonu geri açar). Storybook kenar çubuğuna buton ekleme API'si vermiyor: şerit
   `#storybook-explorer-menu`nün başına yerleştirilir, yeniden çizimde MutationObserver geri koyar. */
addons.register("dev-starter/nav-tools", (api: API) => {
  const make = (label: string, icon: string, onClick: () => void) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ds-navtool";
    b.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg><span></span>`;
    (b.lastChild as HTMLElement).textContent = label;
    b.addEventListener("click", onClick);
    return b;
  };
  const close = () => {
    const mobile = document.getElementById("storybook-mobile-menu");
    const closeBtn = mobile?.querySelector<HTMLButtonElement>('button[aria-label="Close menu"]');
    if (closeBtn) closeBtn.click();
    else api.toggleNav(false);
  };
  // `collapseAll` seçili hikayenin grubunu açık bırakıyor; "Tümünü Daralt" onu da kapatsın.
  const collapse = () => {
    // Sürüme göre yok olabilir (SB 10.6'da atıyor): asıl iş açık grupların butonuna basmak.
    try {
      (api as unknown as { collapseAll?: () => void }).collapseAll?.();
    } catch {
      /* yok say */
    }
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>('#storybook-explorer-tree [aria-expanded="true"]')
        .forEach((toggle) => toggle.click());
    });
  };
  const place = () => {
    const menu = document.getElementById("storybook-explorer-menu");
    if (!menu || menu.querySelector(".ds-navtools")) return;
    const bar = document.createElement("div");
    bar.className = "ds-navtools";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Kenar Çubuğu");
    bar.append(
      make("Tümünü Daralt", '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>', collapse),
      make("Kapat", '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', close),
    );
    menu.prepend(bar);
    paint();
  };
  // Yapışık şeridin zemini: kenar çubuğunun gerçek rengi (tema/palet değişince yeniden okunur).
  const paint = () => {
    const bar = document.querySelector<HTMLElement>(".ds-navtools");
    let n: HTMLElement | null = bar?.parentElement ?? null;
    while (n) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && bg !== "transparent" && !bg.endsWith(", 0)")) { bar!.style.setProperty("--ds-nav-bg", bg); return; }
      n = n.parentElement;
    }
  };
  api.on(GLOBALS_UPDATED, () => requestAnimationFrame(paint));
  new MutationObserver(place).observe(document.body, { childList: true, subtree: true });
  place();
});

/* Sekme başlığı (27 Kasım 2026, sahibinin isteği: "Tanıtım - Tanıtım · Storybook" yerine
   "Dev Starter - Tanıtım"). Storybook başlığı her gezinmede kendisi yazar ("<hikaye> - <bileşen>
   ⋅ Storybook"); <title> değişince bizimki yeniden basılır. Biçim: bileşenin son adı; hikaye adı
   ondan farklı ve "Varsayılan"/"Belge" değilse "· <hikaye>" eklenir. */
addons.register("dev-starter/tab-title", (api: API) => {
  const compose = () => {
    const data = api.getCurrentStoryData() as { title?: string; name?: string; type?: string } | undefined;
    if (!data?.title) return "Dev Starter - Görsel Katalog";
    const page = data.title.split("/").pop() ?? data.title;
    const name = data.type === "docs" || data.name === "Docs" ? "" : (data.name ?? "");
    const extra = name && name !== page && name !== "Varsayılan" ? ` · ${name}` : "";
    return `Dev Starter - ${page}${extra}`;
  };
  const apply = () => {
    const next = compose();
    if (document.title !== next) document.title = next;
  };
  const head = document.querySelector("head");
  if (head) new MutationObserver(apply).observe(head, { childList: true, subtree: true, characterData: true });
  api.on(STORY_PREPARED, () => requestAnimationFrame(apply));
  window.setTimeout(apply, 500);
});
