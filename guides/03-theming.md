# 03 — Tema: `data-theme` + Çerez + Sunucuda Çizim

Ekosistemin varsayılanı next-themes değil. Tema bir çerezde durur, sunucu onu
okuyup `<html data-theme>` olarak basar; istemcide hiç script çalışmadan doğru
tema ilk karede gelir. next-themes yalnızca onu zaten kullanan eski projelerde
kalır (ahmetakyapi.com).

---

## 1. Neden next-themes Değil

| | next-themes | Çerez + sunucu |
|---|---|---|
| İlk kare | Satır içi script ile düzeltilir | HTML zaten doğru |
| `mounted` guard | Şart (`resolvedTheme` sunucuda `undefined`) | Gerekmez |
| Hidrasyon uyarısı | `suppressHydrationWarning` + dikkat | Yalnızca `suppressHydrationWarning` |
| `themeColor` | `prefers-color-scheme`e bağlı | Ürünün temasından |
| Bedel | Yok | Kök layout dinamik (çerez okur) |

**Bedel bilerek kabul edilir:** kök layout `cookies()` okuduğu için statik
önbelleğe giremez. Açılış Zili ve Mimio bu bedeli ödüyor; karşılığında
FOUC, `mounted` titremesi ve "koyu çubuk, açık sayfa" uyumsuzluğu yok.
İçeriği herkese aynı olan bir vitrin için bu bedel gereksiz: `landing`
şablonu § 2b'yi uygular (statik sayfa + `<head>`de çerez script'i), ilk kare
yine çerezin temasıyla gelir.

---

## 2. Kurulum

```ts
// lib/theme.ts — "use client" DEĞİL, iki taraftan da okunur; next/headers YOK
export const THEME_COOKIE = "theme";
export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "light"; // şablon varsayılanı; portfolyo/oyun → "dark"
export const THEME_COLOR = { dark: "#070d16", light: "#f7f9fb" } as const; // globals.css --page-bg ile eş
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const isTheme = (v: unknown): v is Theme =>
  typeof v === "string" && (THEMES as readonly string[]).includes(v);
```

```ts
// lib/theme.server.ts — yalnızca sunucuda
import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(v) ? v : DEFAULT_THEME;
}
```

**Neden iki dosya:** tema düğmesi sabitleri (`THEME_COOKIE`, `THEME_COLOR`,
`isTheme`) istemcide okur. `next/headers` içe aktaran bir modül istemci
paketine girdiği an derleme kırılır; sabitler o modülde kalırsa düğme onları
elle kopyalar ve üçüncü bir tema (§ 5) sessizce "light"a düşer.

```tsx
// app/layout.tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();
  return (
    <html lang="tr" data-theme={theme} suppressHydrationWarning>
      <body className="bg-page text-body">{children}</body>
    </html>
  );
}
```

```ts
// components/ui/ThemeToggle.tsx ("use client") — çerez İSTEMCİDE yazılır
function setThemeCookie(theme: Theme) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax${secure}`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}
```

❌ Çerezi server action ile yazmak (`cookies().set()`). Action içinde çerez
yazmak Next'e "veri değişti" der: yanıt bütün sayfayı sunucuda yeniden çizer
(`x-action-revalidated: 1`, sayfadaki veritabanı sorguları dahil; şablonda
ölçüldü, her tıklama ana sayfanın RSC'sini baştan indiriyordu) ve istemcinin
ön yükleme önbelleğini boşaltır, bir sonraki tıklama soğuk istek olur.
Kozmetik bir tıklama için fazla. Değer gizli değil, `httpOnly` gerekmez;
sunucu onu bir sonraki istekte okur. O yeniden çizimin getirdiği tek şey
tarayıcı çubuğunun rengiydi, onu düğme kendisi günceller.

`suppressHydrationWarning` neden hâlâ var: istemci temayı DOM'da anında
değiştirir, sunucu yeni değeri ancak bir sonraki istekte görür. O arada
React bir yeniden çizim yaparsa `data-theme` farkı uyarı üretmesin.

❌ `localStorage` + satır içi script (Mimio'nun eski yolu): çalışır ama sunucu
   temayı bilemez, `themeColor` ve OG görseli yanlış temada kalır.

### 2b. İçerik Sitesi: Statik Sayfa + Çerez Script'i

Yukarıdaki kurulumun bir bedeli var: kök layout `cookies()` okuduğu için
**bütün rotalar dinamik** olur (`next build` çıktısında her satır `ƒ`).
Kullanıcıya göre değişen bir ürün için (Açılış Zili, panolar) bu zaten
böyle; portfolyo, tanıtım sayfası ya da blog içinse yanlış takas: içerik
değişmiyor, her ziyaret bir fonksiyon çağrısına dönüyor ve Hobby planında
fonksiyon kotası sınırlı.

ahmetakyapi.com'da ölçüldü (3 Ekim 2026): `getTheme()` kaldırılıp yerine
aşağıdaki script konunca ana sayfa, `/projeler`, `/blog` statik (`○`), yazılar
SSG (`●`) oldu; açık tema çereziyle ilk boyama yine açık, konsol temiz.

```ts
// lib/theme.ts — ilk boyamadan ÖNCE çalışır, çerezden temayı ve çubuk rengini yazar
export const THEME_SCRIPT = `(function(){try{
  var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(${THEMES.join("|")})(?:;|$)/);
  var t=m?m[1]:${JSON.stringify(DEFAULT_THEME)};var c=${JSON.stringify(THEME_COLOR)}[t];
  document.documentElement.dataset.theme=t;
  var f=function(){var e=document.querySelector('meta[name="theme-color"]');if(e)e.setAttribute("content",c)};
  f();document.addEventListener("DOMContentLoaded",f);
}catch(e){}})()`;
```

```tsx
// app/layout.tsx — async DEĞİL, cookies() YOK; viewport da statik
export const viewport: Viewport = { themeColor: THEME_COLOR[DEFAULT_THEME] };

<html lang="tr" data-theme={DEFAULT_THEME} suppressHydrationWarning>
  <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
```

- Tema düğmesi `useSyncExternalStore(subscribe, readDomTheme, () => DEFAULT_THEME)`:
  hidrasyondan hemen sonra doğru ikona geçer, `mounted` bekçisi gerekmez.
- `themeColor` varsayılan temayla statik; script `meta[name=theme-color]`'ı da
  günceller (DOMContentLoaded'da tekrar, meta script'ten sonra basılabiliyor).
- CSP'de `script-src` satır içi script'e izin vermeli (`'unsafe-inline'` ya da
  script'in hash'i).
- Sunucu temayı bilmediği için LCP görselinde varsayılan temanınkini öne al
  (`ThemedImage theme={DEFAULT_THEME}`).
- Çerezi düğme yazar (§ 2'deki `setThemeCookie`); sunucu onu hiç okumaz,
  bir sonraki yüklemede script okur. Sayfa (`page.tsx`) da `cookies()`
  okumaz, düğmeye `initialTheme={DEFAULT_THEME}` verir.

**Karar kuralı:** sayfa kullanıcıya göre değişiyorsa (oturum, kişisel veri)
zaten dinamiktir → sunucuda çerez. Değişmiyorsa → statik + script.
Şablonlarda: `nextjs-fullstack` sunucuda çerez, `landing` statik + script
(ölçüldü, 20 Ekim 2026: `ƒ /` → `○ /`, `/` yanıtı `no-store`dan
`s-maxage=31536000`a geçti).

---

## 3. ThemeToggle ve View Transition

Şablondaki `components/ui/ThemeToggle.tsx` dört şey yapar:

1. `document.documentElement.dataset.theme`ı **anında** değiştirir.
2. Çerezi `document.cookie` ile yazar ve `meta[name=theme-color]`ı günceller
   (`setThemeCookie`, § 2; server action DEĞİL).
3. `document.startViewTransition` varsa yeni temayı **tıklanan noktadan
   büyüyen bir daire** olarak açar.
4. `prefers-reduced-motion: reduce` altında geçişi atlar.

```tsx
function apply(next: Theme, event?: React.MouseEvent<HTMLElement>) {
  const root = document.documentElement;
  const swap = () => { root.dataset.theme = next; };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setThemeCookie(next); // erken dönüşten ÖNCE: hareketi azaltan kullanıcıda da yazılsın

  if (!document.startViewTransition || reduce) { swap(); return; }
  if (event) {
    const box = event.currentTarget.getBoundingClientRect();
    root.style.setProperty("--vt-x", `${box.left + box.width / 2}px`);
    root.style.setProperty("--vt-y", `${box.top + box.height / 2}px`);
  }
  root.classList.add("theme-switching");
  const t = document.startViewTransition(swap);
  void t.finished.finally(() => root.classList.remove("theme-switching"));
}
```

```css
html.theme-switching::view-transition-old(root),
html.theme-switching::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
html.theme-switching::view-transition-new(root) {
  animation: theme-reveal 0.5s cubic-bezier(0.65, 0, 0.35, 1);
}
@keyframes theme-reveal {
  from { clip-path: circle(0 at var(--vt-x, 50%) var(--vt-y, 0)); }
  to   { clip-path: circle(150vmax at var(--vt-x, 50%) var(--vt-y, 0)); }
}
```

**Neden çapraz solma değil:** iki temanın karışımı hiçbir temaya ait olmayan
bir ara gri gösterir. Eski ekran yerinde durur, yenisi üstünde büyür.
**Neden 150vmax:** daire her tıklama noktasından ekranın en uzak köşesine
varmalı. **Üst üste iki tıklama:** Açılış Zili sınıfı yalnızca en son
başlayan geçişin kaldırmasına izin verir; yoksa ikinci geçiş sürerken sınıf
silinir ve tarayıcının varsayılan solması araya girer.

---

## 4. `themeColor` — Ürünün Temasından

```ts
// app/layout.tsx — THEME_COLOR lib/theme.ts'te (§ 2), globals.css --page-bg ile eş
export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return { themeColor: THEME_COLOR[theme] };
}
```

Tıklamada sunucuya gidilmediği için çubuğun rengini düğme günceller
(`setThemeCookie`, § 2); sonraki istekte sunucu aynı değeri basar.

❌ `themeColor: [{ media: "(prefers-color-scheme: dark)", color: ... }]`

**Neden:** işletim sistemi koyu ama ürün açık varsayılanlı ise, çerezi
olmayan her ilk ziyaretçi açık sayfanın üstünde koyu bir tarayıcı çubuğu
görür (Açılış Zili, mobil ilk açılışların çoğu). Renk iki yerde yaşar; yorumla
bağla.

---

## 5. Yüksek Kontrast ve Azaltılmış Saydamlık

**Yüksek kontrast** üçüncü bir tema değeridir, ayrı bir sistem değil:

```css
:root[data-theme="high-contrast"] {
  color-scheme: dark;
  --page-bg: #000;
  --text-body: #fff;
  --text-muted: #e5e5e5;
  --line: #fff;
  --line-focus: #ffd400;
}
```

Token mimarisi doğruysa bu blok yeter; `dark:` kullanan bir projede her
satıra üçüncü bir varyant gerekirdi (Mimio bu yüzden `dark:` yasaklar).

**Azaltılmış saydamlık** (`prefers-reduced-transparency`) bir tercih değil,
talep: bulanıklık tümüyle kalkar, kartlar ve paneller opak renge döner.

```css
@media (prefers-reduced-transparency: reduce) {
  *, *::before, *::after { backdrop-filter: none !important; }
  .glass { background: var(--surface); }
  body::before, body::after { display: none; }   /* aurora ve grain */
}
```

Mimio tuzağı: aynı kurala hem `backdrop-filter` hem `-webkit-backdrop-filter`
yazılınca minifier ikisini birleştirip yalnızca önekliyi bıraktı, Chrome
kuralı hiç uygulamadı. Burada yalnızca öneksiz yaz.

---

## 6. Zemin Katmanları

Ekosistem varsayılanı: düz `--page-bg`. İsteğe bağlı `.app-bg` sınıfı
köşelere `--primary`nin çok düşük opaklıklı radial'ını ekler (koyuda
%10–14, açıkta %5–7); ayrı bir renk ailesi getirmez:

```css
.app-bg {
  background:
    radial-gradient(60rem 30rem at 0% -10%, color-mix(in oklab, var(--primary) 6%, transparent), transparent 65%),
    radial-gradient(50rem 28rem at 100% 0%, color-mix(in oklab, var(--primary) 5%, transparent), transparent 65%),
    var(--page-bg);
}
:root[data-theme="dark"] .app-bg { /* aynı katmanlar, %12 civarı */ }
```

Daha fazlası gerekiyorsa Mimio'nun üç katmanı:

```text
html            → zemin rengi (body'de DEĞİL)
body::before    → aurora: 3 radial gradient, yavaş sürüklenme
body::after     → grain: SVG feTurbulence, düşük opaklık
bileşen         → yüzey (.surface ya da .glass)
```

```css
html { background: var(--page-bg); }
body::before,
body::after {
  content: "";
  position: fixed;      /* background-attachment: fixed DEĞİL */
  inset: 0;
  pointer-events: none;
  z-index: -1;
}
body::before { background: var(--aurora); animation: drift 24s ease-in-out infinite; }
body::after  { background-image: var(--grain); opacity: var(--grain-opacity); }
```

Her satırın gerekçesi yaşanmış bir hata:

- **Renk `html`de:** `z-index: -1` taşıyan pseudo-element kendi elemanının
  arka planının ARKASINA düşer; renk `body`de kalırsa aurora hiç görünmez.
- **`position: fixed`, `background-attachment: fixed` değil:** ikincisi
  iOS'ta kaydırırken titrer ve her tema için degradeyi yeniden yazdırır
  (`mistakes.md` #18).
- **Grain'de `mix-blend-mode` yok:** tam ekran, sabit ve harmanlanan bir
  katman compositor'ı her karede tüm görünümü geri okumaya zorlar; altında
  animasyonlu aurora olunca bu hiçbir karede atlanamaz ve zayıf makinede
  kaydırma kasar. Yerine tema başına tek renk gürültü (koyuda beyaz, açıkta
  siyah tane), alfa gürültünün kendisinden.
- **Aurora yalnızca kahraman ekrandayken sürüklenir** (`data-aurora="paused"`).
  Sabit katmandaki sonsuz animasyon sayfa boştayken de kare üretir.

---

## 7. Glass Ne Zaman

**Glass varsayılan değil.** Varsayılan yüzey `.surface`: ton farkı + hairline.

```css
@layer components {
  .surface {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
  }
  .glass {
    background: var(--surface);                 /* desteklenmezse opak */
    border: 1px solid var(--line-soft);
  }
  @supports (backdrop-filter: blur(1px)) {
    .glass {
      background: color-mix(in oklab, var(--surface) 72%, transparent);
      backdrop-filter: blur(14px) saturate(1.2);
    }
  }
}
```

Glass yalnızca **altında gerçekten bir şey olduğunda** anlamlıdır:

✅ Yapışkan üst çubuk (altından içerik kayar), aurora üstündeki kahraman
   kartı, görsel üstündeki künye.
❌ Düz zemindeki her kart. Altında yalnızca düz renk varsa bulanıklık
   görünmez, yalnızca GPU'ya maliyet ve kontrast belirsizliği ekler.

Blur 12–16 px. Daha fazlası içeriği "buzlu cam" değil "sis" yapar.
Açılış Zili hiç glass kullanmaz ve ekosistemin en okunaklı projesidir; bu bir
tesadüf değil.

---

## Kontrol Listesi

- [ ] Dinamik üründe tema çerezden sunucuda basılıyor (satır içi script yok); statik vitrinde § 2b: `<head>`de `THEME_SCRIPT`, viewport statik
- [ ] Çerezi düğme istemcide yazıyor; tema için server action yok
- [ ] `lib/theme.ts` `next/headers` içe aktarmıyor (`getTheme` → `lib/theme.server.ts`)
- [ ] `DEFAULT_THEME` ürün sorusuna göre seçildi (01 § 0)
- [ ] `themeColor` ürünün temasından
- [ ] ThemeToggle reduced-motion altında anlık
- [ ] `prefers-reduced-transparency` bloğu var (glass ya da aurora varsa)
- [ ] Zemin katmanları `position: fixed`, `mix-blend-mode` yok
- [ ] Glass yalnızca altından içerik geçen öğelerde
