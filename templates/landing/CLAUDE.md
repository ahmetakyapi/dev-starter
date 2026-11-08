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

Aktif story'si olan işte commit iznini `/gate` açar: sonuç
`docs/ROUTEMAP.md`'nin Gate kolonuna işlenir ve `gate-guard` hook'u PASSED
olmayan aktif story varken commit'i bloklar (`.claude/settings.json` →
`~/dev-starter/hooks/`). Yukarıdaki komutlar Gate'in ön koşuludur, yerine
geçmez; yalnız doküman değiştiren commit muaftır.

## Yol kapsamlı kurallar (`.claude/rules/`)

Bu dosya her oturumda yüklenir ve ~200 satırın altında kalır. Belirli
dosyalara ait kurallar `.claude/rules/*.md` içinde, `paths:` frontmatter'ı
eşleşen dosya okununca yüklenir (Claude Code resmî önerisi):
- `tokens.md` (kimlik, palet, token: `*.tsx`, `*.css`)
- `motion.md` (hareket: `*.tsx`, `lib/motion.ts`, `hooks/`)
- `scene.md` (R3F sahnesi: `components/scene/`, `components/heroes/`)
- `figures.md` (anatomy figür kiti: `components/iso/`, `components/figures/`)
Yeni bir kural yalnız belirli dizinler içinse buraya değil oraya yazılır.

## Tech Stack

Next 16 (App Router, Turbopack) · React 19.2 · TypeScript strict ·
Tailwind 4 · Motion 13 (`motion/react`) · React Three Fiber 9 + three
(isteğe bağlı sahne) · zod 4 · lucide-react. Veritabanı, oturum ve proxy
YOK; gerekiyorsa `nextjs-fullstack` şablonundan alınır.

## Sayfayı kendine çevirmek

1. `lib/site.ts` (ad, açıklama) ve `lib/content.ts` (bütün metin). Bileşene
   dokunmak gerekmez; `tests/content.test.ts` yazım ve yapı kurallarını denetler.
2. Hero düzeni: `lib/content.ts` → `hero.variant` (sekiz düzen, varsayılan
   `showcase`: büyük sıkı başlık + altında canlı ürün panosu,
   `components/heroes/index.tsx` başında hangisinin ne zaman seçileceği).
   Geliştirmede `/?hero=statement` ile denenir; üretimde parametre okunmaz.
3. Palet: `app/globals.css`teki iki `signature` bloğu (aşağıda).
4. Görsel: `public/urun-ekrani.png` (editorial-split, product-frame). Dosya
   yoksa düzen düz bir yüzeye düşer, sayfa kırılmaz.
5. Sayılar ÖRNEKTİR. Gerçek kaynağı olmayan rakam yayına çıkmaz.

## Sayfa düzeni

Sıra: Hero (showcase: canlı pano) → Logo şeridi → Özellikler (vitrin
bentosu, her kartın üstünde o özelliği oynayan canlı demo) → Nasıl Çalışır
(gri bant, kaydırmaya bağlı yapışkan ürün sahnesi) → Görüşler (tek büyük
alıntı + kişi sekmeleri) → Fiyatlar (aylık/yıllık seçici, 2 plan + kurumsal
satır) → SSS (tek kuyuda `<details>`) → Kapanış → alt bilgi (sütunlar +
büyük kelime işareti). Her bölüm ayrı bir düzen ailesi; aynı aileyi ikinci
kez kullanma. Ritim yoğun / ferah sırayla, vurgu koyu zemin değil TON farkı.

- **Board dili:** kart gri kuyu (`bg-surface rounded-2xl`), içindeki parça
  beyaz karo (`bg-overlay shadow-raised rounded-lg`, `components/demos/styles.ts`
  → `TILE`). Kart içinde kart yok. Başlıkların üstünde ikon karesi YOK.
- **Demolar** (`components/demos/`): tek saat `hooks/useStory.ts`; `tick 0`
  tasarımın kendisi (sunucu çizimi ve hareketi azaltan okuyucu onu görür),
  kart görünmüyorken durur. Demo verisi `lib/content.ts`te, ÖRNEK.
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
- Rakamlar `RollingNumber` (JavaScript'siz, sunucuda). İlk ekranda (hero
  panosu) ya da etkileşimle yeniden bağlanınca (fiyat dönemi, `key`);
  aşağıdaki bir sayıya durağan konursa okuyucu gelmeden dönüş biter.
- Kaydırmaya bağlı tek sahne: Nasıl Çalışır (`useScroll`, durum yalnızca eşikte
  değişir). Hangi düzenin çizileceği CSS'te (geniş + hareket serbest:
  yapışkan; telefon ya da hareketi azaltan: düz liste).
- Başlık çubuğu masaüstünde kaydırınca cam hapa daralır: `transform` +
  `clip-path`, genişlik canlandırılmaz.
- Mıknatıs, eğim ve hero panosunun imleç paralaksı yalnızca `(hover: hover) and (pointer: fine)` ve hareket
  serbestken (`hooks/useFinePointer.ts`).
- Scroll dinleyicisi yok: `useScroll`, IntersectionObserver ya da CSS.
- `globals.css` sistem dosyasıdır (nextjs-fullstack ile birebir); landing'e
  özgü kurallar `app/landing.css`te, `@layer components` içinde.

## Tema ve token

Kimlik, palet ve token kuralları `.claude/rules/tokens.md`de (bileşen/stil dosyası okununca yüklenir); hareket kuralları `.claude/rules/motion.md`de. Özet: hardcoded renk ve `dark:` yok, degrade üç yerde, derinlik ton farkıyla, import `motion/react` + `m.*`.

- Tema çerezde, sayfa yine statik (`○`): layout varsayılanı basar,
  `<head>`deki küçük script (`lib/theme.ts` → `THEME_SCRIPT`) ilk boyamadan
  önce çerezdeki temayı ve `theme-color`ı yazar (guides/03 § 2b). Düğme
  çerezi istemcide yazar. Varsayılan açık, next-themes yok, FOUC yok.
  Layout ya da sayfa `cookies()`/`headers()` okursa her ziyaret sunucu
  çizimine döner (`ƒ`); build çıktısında `○ /` kalmalı.

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

Kit şablonda YOK: `node ~/dev-starter/scripts/add-figure-kit.mjs .` (`--example`, `--lathe`). Kurallar `.claude/rules/figures.md`.

Parçacık sahnesi (R3F, `components/scene/`) isteğe bağlı: istemiyorsan `hero.scene: false`; ayrıntı `.claude/rules/scene.md`.

## Next 16 tuzakları

- `searchParams`, `cookies()`, `headers()` Promise'tir, await edilir. Sayfa
  tipi global `PageProps<"/">`; `.next/types` altında build ile üretilir,
  temiz kopyada typecheck'ten ÖNCE build.
- `dynamic(..., { ssr: false })` yalnızca istemci bileşeninin içinde.
- `next/image`te `priority` kaldırıldı: `loading="eager"` + `fetchPriority="high"`.
- `"use client"` modülden dışa aktarılan DEĞER sunucuya gerçek değer olarak
  gelmez; paylaşılan sabitler `lib/` altında, "use client" taşımadan durur.
