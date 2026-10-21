@AGENTS.md

# PROJECT_NAME

PROJECT_DESCRIPTION

Tek sayfalık tanıtım sitesi (landing). Kararların gerekçesi kod içi
yorumlarda yaşar; onlar birer karar kaydıdır, silme. Bu dosya yalnızca her
oturumda bilinmesi gerekenleri taşır.

## Komutlar

```
npm run dev         # geliştirme (Turbopack)
npm run build       # üretim derlemesi; .next/types tiplerini de üretir
npm run typecheck   # tsc --noEmit (temiz kopyada ÖNCE build)
npm run lint        # eslint (Next 16'da `next lint` yok)
npm test            # node --test + tsx, tests/*.test.ts
```

İlk kurulum: `cp .env.example .env.local`, `npm install`, `npm run dev`.
Yerelde `npm run build` için `.env.local`e
`NEXT_PUBLIC_SITE_URL=http://localhost:3000`: üretim derlemesi site adresi
olmadan durur (aşağıda SEO).
`package-lock.json` projede commit'lenir (CI `npm ci` kullanır).

**Commit öncesi dördü de temiz olmalı:** `npm run typecheck`, `npm run lint`,
`npm test`, `npm run build`. Görsel değişiklik ayrıca tarayıcıda 390 ve 1280
genişlikte, iki temada ve "hareketi azalt" açıkken gözle kontrol edilir.

Aktif story'si olan işte commit kapısını `/gate` açar: sonuç
`docs/ROUTEMAP.md`'nin Gate kolonuna işlenir ve `gate-guard` hook'u PASSED
olmayan aktif story varken commit'i bloklar (`.claude/settings.json` →
`~/dev-starter/hooks/`). Yukarıdaki komutlar Gate'in ön koşuludur, yerine
geçmez; yalnız doküman değiştiren commit muaftır.

## Tech Stack

Next 16 (App Router, Turbopack) · React 19.2 · TypeScript strict ·
Tailwind 4 · Motion 13 (`motion/react`) · React Three Fiber 9 + three
(isteğe bağlı sahne) · zod 4 · lucide-react. Veritabanı, oturum ve proxy
YOK; gerekiyorsa `nextjs-fullstack` şablonundan alınır.

## Sayfayı kendine çevirmek

1. `lib/site.ts` (ad, açıklama) ve `lib/content.ts` (bütün metin). Bileşene
   dokunmak gerekmez; `tests/content.test.ts` yazım ve yapı kurallarını denetler.
2. Hero düzeni: `lib/content.ts` → `hero.variant` (yedi düzen,
   `components/heroes/index.tsx` başında hangisinin ne zaman seçileceği).
   Geliştirmede `/?hero=statement` ile denenir; üretimde parametre okunmaz.
3. Palet: `app/globals.css`teki iki `signature` bloğu (aşağıda).
4. Görsel: `public/urun-ekrani.png` (editorial-split, product-frame). Dosya
   yoksa düzen düz bir yüzeye düşer, sayfa kırılmaz.
5. Sayılar ÖRNEKTİR. Gerçek kaynağı olmayan rakam yayına çıkmaz.

## Sayfa düzeni

Sıra: Hero → Logo şeridi → Özellikler (bento) → Nasıl Çalışır (yapışkan
başlık + kaydırmaya bağlı çizgi) → Görüşler (bir büyük + iki küçük alıntı) →
Fiyatlar (2 plan + kurumsal satır) → SSS (`<details>`) → Kapanış.
Her bölüm ayrı bir düzen ailesi; aynı aileyi ikinci kez kullanma.

- **Üst künye (eyebrow) yalnızca hero'da.** Bölüm başlıkları künyesiz.
- **Tek niyet, tek etiket.** Kayıt eylemi her yerde "Ücretsiz Başla" ve aynı
  adrese gider; test bunu denetler.
- **`brand` (degradeli) düğme ekranda bir kez:** hero ve kapanış. İkisi aynı
  ekrana hiç düşmez. Başlıktaki ve fiyattaki düğmeler `primary`.
- **Tek kayan şerit** (logo). Üzerine gelince ve altındaki "Şeridi Durdur"
  kutusuyla durur (WCAG 2.2.2; klavye ve dokunmatiğin tek yolu), hareketi
  azaltanda durağan ve denetim gizli.

## Landing hareketi

- Hero başlığı satır satır maskeli açılır, CSS'te (`.line-mask`, `app/landing.css`).
  **Opaklık 0'dan başlamaz**: LCP öğesi ilk karede boyanır.
- Rakamlar `RollingNumber` (JavaScript'siz, sunucuda). Yalnızca ilk ekranda;
  aşağıdaki bir sayıya konursa okuyucu gelmeden dönüş biter.
- Kaydırmaya bağlı tek CSS öğesi: adım çizgisi (`animation-timeline: view()`,
  `@supports` korumalı; desteklemeyen tarayıcıda dolu durur).
- Mıknatıs ve eğim yalnızca `(hover: hover) and (pointer: fine)` ve hareket
  serbestken (`hooks/useFinePointer.ts`).
- Scroll dinleyicisi yok: `useScroll`, IntersectionObserver ya da CSS.
- `globals.css` sistem dosyasıdır (nextjs-fullstack ile birebir); landing'e
  özgü kurallar `app/landing.css`te, `@layer components` içinde.

## Parçacık sahnesi (R3F)

`components/scene/`. `SceneLayer` kapı: sahne yalnızca hassas işaretçi, en az
768 piksel ve hareket serbestken, tarayıcı boşa çıkınca İNDİRİLİR
(`dynamic(..., { ssr: false })`; ilk tıklamanın önüne uzun görev düşmesin).
Telefonda ve hareketi azaltanda yalnızca `.hero-glow` CSS ışıması kalır.
WebGL açılamazsa ya da parça inmezse `SceneBoundary` yalnızca sahneyi
düşürür; sayfa hata ekranına gitmez, ışıma kalır.
Renk `--primary`den okunur, tema değişince yenilenir. Hero ekrandan çıkınca
ya da sekme arka plandayken çizim durur. İstemiyorsan `hero.scene: false`;
tamamen çıkarmak için klasörü, iki paketi ve `HeroShell`deki satırı sil.

## Kimlik ortak, palet projeye göre

Token adları, ton farkıyla derinlik, degrade disiplini, hareket eğrisi ve
ölçekler KİMLİKTİR, her projede aynı kalır. Renk ailesi PALETTİR:
`<html data-palette>` (`lib/theme.ts` → `PALETTE`, şablonda `signature`).
Palet değiştirmek `globals.css`teki iki `signature` bloğunu ezmek demek;
sistem katmanına dokunulmaz ve yeni palet `tests/palette.test.ts`ten geçer.
Hazır alternatifler (`verdant`, `ember`, `iris`) `@ahmetakyapi/theme`te.

## Token kuralları

Tokenlar `app/globals.css` içinde, iki katman:

1. Ham rol değişkenleri: sistem blokları (tema başına; gölge, durum
   renkleri, odak halkası ve paletten türeyenler) ve palet blokları
   (`--page-bg`, `--text-strong`, `--line`, `--primary*`, degradeler).
   Renk değeri YALNIZCA burada yazılır.
2. `@theme inline` onları sınıflara bağlar: `bg-page`, `bg-surface`,
   `text-strong`, `text-body`, `text-muted`, `border-line`, `bg-primary`,
   `text-on-primary`, `bg-primary-wash`, `text-primary-ink`, `text-danger`.

- **Hardcoded renk yok, `dark:` varyantı yok.** Tema `data-theme` ile döner;
  aynı sınıf iki temada doğru rengi alır. Tailwind'in hazır paleti, punto,
  radius ve gölge ölçekleri temizlendi: `bg-red-500` ya da `text-sm` derlenmez.
- **Punto adları rol taşır:** `text-micro small base read lead title heading
  display hero`. Gövde `text-read` (renk `--text-body` ile çakışmasın diye).
  Yeni basamak eklersen `lib/utils.ts` → `TEXT_SIZES`e de ekle, yoksa
  `cn("text-small", "text-strong")` puntoyu siler.
- **Degrade yalnızca üç yerde:** kısa display başlık (`.display-ink`,
  `PageHeader ink`), ekranın TEK birincil eylemi (`Button variant="brand"`)
  ve marka karosu (`bg-brand`). Veri yüzeyi ve gövde metni degrade taşımaz.
  `.display-ink` içindeki çocuğa opacity/transform verme: metni kaybolur.
- **Derinlik ton farkıyla**, gölgeyle değil. Gölge (`shadow-raised`,
  `shadow-floating`, `shadow-modal`) yalnızca gerçekten yüzen katmanda.
  **Radius:** `rounded-sm md lg xl` (+ `rounded-full`).
- **Yüzey:** `surface` varsayılan (ton farkı + hairline). `glass` isteğe bağlı,
  yalnızca arkasında hareket eden içerik varsa. `app-bg` köşe ışımaları.
- Tema çerezde, sayfa yine statik (`○`): layout varsayılanı basar,
  `<head>`deki küçük betik (`lib/theme.ts` → `THEME_SCRIPT`) ilk boyamadan
  önce çerezdeki temayı ve `theme-color`ı yazar (guides/03 § 2b). Düğme
  çerezi istemcide yazar. Varsayılan açık, next-themes yok, FOUC yok.
  Layout ya da sayfa `cookies()`/`headers()` okursa her ziyaret sunucu
  çizimine döner (`ƒ`); build çıktısında `○ /` kalmalı.
- CSS değişkeni okuyamayan yerler (OG görseli, `global-error`, manifest,
  viewport rengi) değeri sabit yazar ve kaynağını yorumda söyler.

## Hareket kuralları

- Import `motion/react`; `framer-motion` YOK. Kök `MotionProvider` →
  `LazyMotion strict` + `MotionConfig reducedMotion="user"`. Bileşende
  `m.div` yazılır, `motion.div` strict modda hata verir.
- Eğri ve süreler `lib/motion.ts` (`EASE`, `DUR`, `SPRING`, `STAGGER`,
  `fadeUp`...). CSS karşılığı `--ease-brand`; her `transition-*` onu
  kendiliğinden alır.
- **`Reveal`de hareketi azaltan kullanıcı için `initial={false}` YAZMA**:
  sunucu HTML'i `opacity: 0` gelir ve içerik görünmez kalır. `initial`
  hedefini değiştir. Kahraman başlığı ve LCP öğesi Reveal'e sarılmaz.
- Sonradan değişen "hareketi azalt" tercihi için `useMotionPreference`.
- Yalnızca `transform` ve `opacity` animasyonu. Nedeni tek cümleyle
  yazılamayan hareket eklenmez.

## Yazım: Title Case

Başlık, düğme, sekme, rozet, etiket ve künyeler **Title Case**: "Yeni Kayıt",
"Tekrar Dene", "Ana Sayfaya Dön". Gövde metni, açıklama, yardım metni, hata
mesajı gövdesi, `placeholder` ve `aria-label` cümle düzeninde.

Türkçe Title Case: bağlaçlar (ve, ile, için, de/da, mi) küçük kalır, başta
gelirse büyür. `text-transform: capitalize` ve `title()` KULLANMA, `i → I`
üretir; küçültürken `toLocaleLowerCase("tr-TR")`.

Arayüz metninde uzun tire (em dash) yok; ayraç virgül, iki nokta ya da `·`.

## SEO

`app/layout.tsx`: ortak metadata (OG, Twitter) ve JSON-LD
(Organization + WebSite, `lib/structured-data.ts` ile `<` kaçışlı).
Kanonik adres SAYFADA (`app/page.tsx`): layout'ta olsa her yeni sayfaya miras
kalır ve sayfa kendini ana sayfanın kopyası ilan eder; yeni sayfa kendi
`alternates.canonical`ını verir. `app/sitemap.ts`, `app/robots.ts`,
`app/opengraph-image.tsx` adresi `lib/site.ts`ten okur; önizleme dağıtımları
ve `SITE_INDEXABLE=false` kopyası dizine girmez. `NEXT_PUBLIC_SITE_URL`
(yalnızca http/https) Vercel dışında tanımsızsa `next build` durur
(`lib/env.ts` → `assertSiteUrlForBuild`); CI `SKIP_ENV_VALIDATION=1` ile geçer.

## Açıklayıcı figür (anatomy, isteğe bağlı)

Ürünün nasıl çalıştığını kutu ve okla değil, çalışan bir makineyle anlatan
izometrik SVG figür. Kit şablonda YOK, tek komutla gelir:

```
node ~/dev-starter/scripts/add-figure-kit.mjs .            # components/iso + CSS importları
node ~/dev-starter/scripts/add-figure-kit.mjs . --example  # + çalışan örnek (test-rig)
node ~/dev-starter/scripts/add-figure-kit.mjs . --lathe    # + döner parçalar (çan, kubbe, küre)
```

- Şablon hazır: `<html class="iso">` (kit `.iso[data-theme="light"]` ile
  açık temaya geçer, ThemeToggle figürü de çevirir) ve `components/iso/**`,
  `components/figures/**` için ESLint ayarı. Figür kare başına ref'e yazar;
  react-hooks 7 bunu hata sayardı (`~/dev-starter/knowledge/mistakes.md #98`).
- Figürü anatomy skill'i yazar: `components/figures/<ad>/` (geometri saf `.ts`,
  statik çizim sunucu bileşeni, tek `"use client"` canlı bileşen).
- `components/iso/` elle düzenlenmez; projeye özgü stil `bridge.css`e.
- React Compiler açılırsa figürün canlı bileşenine `"use no memo"`.

## Next 16 tuzakları

- `searchParams`, `cookies()`, `headers()` Promise'tir, await edilir. Sayfa
  tipi global `PageProps<"/">`; `.next/types` altında build ile üretilir,
  temiz kopyada typecheck'ten ÖNCE build.
- `dynamic(..., { ssr: false })` yalnızca istemci bileşeninin içinde.
- `next/image`te `priority` kaldırıldı: `loading="eager"` + `fetchPriority="high"`.
- `"use client"` modülden dışa aktarılan DEĞER sunucuya gerçek değer olarak
  gelmez; paylaşılan sabitler `lib/` altında, "use client" taşımadan durur.
