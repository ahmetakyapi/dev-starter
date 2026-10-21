@AGENTS.md

# PROJECT_NAME

PROJECT_DESCRIPTION

Kararların gerekçesi kod içi yorumlarda yaşar; onlar birer karar kaydıdır,
silme. Bu dosya yalnızca her oturumda bilinmesi gerekenleri taşır.

## Komutlar

```
npm run dev         # geliştirme (Turbopack)
npm run build       # üretim derlemesi; .next/types tiplerini de üretir
npm run typecheck   # tsc --noEmit (temiz kopyada ÖNCE build, aşağıya bak)
npm run lint        # eslint (Next 16'da `next lint` yok)
npm test            # node --test + tsx, tests/*.test.ts
npm run db:generate # şema değişti → YENİ migration dosyası
npm run db:migrate  # migration'ları uygula
npm run db:studio
```

İlk kurulum: `cp .env.example .env.local`, `npm install`, `npm run dev`.
Yerelde `npm run build` için `.env.local`e
`NEXT_PUBLIC_SITE_URL=http://localhost:3000` ve `AUTH_SECRET` (`npx auth secret`):
üretim derlemesi ikisi olmadan durur (aşağıda SEO, `lib/env.ts`).
`package-lock.json` projede commit'lenir (CI `npm ci` kullanır).

**Commit öncesi dördü de temiz olmalı:** `npm run typecheck`, `npm run lint`,
`npm test`, `npm run build`. Görsel değişiklik ayrıca tarayıcıda iki temada
gözle kontrol edilir.

Aktif story'si olan işte commit kapısını `/gate` açar: sonuç
`docs/ROUTEMAP.md`'nin Gate kolonuna işlenir ve `gate-guard` hook'u PASSED
olmayan aktif story varken commit'i bloklar (`.claude/settings.json` →
`~/dev-starter/hooks/`). Yukarıdaki komutlar Gate'in ön koşuludur, yerine
geçmez; yalnız doküman değiştiren commit muaftır.

## Tech Stack

Next 16 (App Router, Turbopack) · React 19.2 · TypeScript strict ·
Tailwind 4 · Motion 13 (`motion/react`) · Drizzle + Neon HTTP ·
Auth.js v5 (JWT) · zod 4 · lucide-react.

## Next 16 tuzakları

- **`proxy.ts`, `middleware.ts` değil.** Dışa aktarılan fonksiyonun adı
  `proxy`. Yalnızca çerezin varlığına bakar; asıl kapı sayfadaki `await auth()`.
- **`params`, `searchParams`, `cookies()`, `headers()` Promise'tir**, await edilir.
  Sayfa tipi global `PageProps<"/yol/[id]">`, rota ucu `RouteContext<"/api/...">`.
- **Bu global tipler `.next/types` altında build ile üretilir** ve gitignore'da.
  Temiz kopyada build almadan typecheck "Cannot find name 'PageProps'" verir;
  CI'da sıra bu yüzden build → typecheck → lint → test.
- **Hata sınırında `retry()`, `reset()` değil.** `retry` segmenti sunucudan
  yeniden ister; `reset` yalnızca durumu temizler ve sunucu hatası anında döner.
- **Segmentte `loading.tsx` yok.** Varken `notFound()` 200 durum koduyla döner
  (yumuşak 404). Yavaş parça kendi `<Suspense>` sınırına alınır.
- **`"use client"` modülden dışa aktarılan DEĞER sunucuya gerçek değer olarak
  gelmez**, istemci referansına dönüşür ve hata vermez. Paylaşılan sabitler
  `"use client"` taşımayan dosyalarda durur (`lib/motion.ts`, `lib/theme.ts`).
  O dosyalar `next/headers` da içe aktarmaz: istemci paketine girdikleri an
  derleme kırılır. Çerez okuyan yardımcı ayrı dosyada (`lib/theme.server.ts`).
- **İstemci ortam değişkeni adıyla okunur:** `process.env.NEXT_PUBLIC_X`.
  `process.env` nesnesini toptan geçirmek tarayıcıda boş nesne verir.

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
- Tema çerezden sunucuda basılır (`lib/theme.ts`, `lib/theme.server.ts`);
  varsayılan açık, next-themes yok, satır içi betik yok, FOUC yok. Çerezi
  ThemeToggle istemcide yazar: server action içinde `cookies().set()` bütün
  sayfayı sunucuda yeniden çizer ve ön yükleme önbelleğini boşaltır.
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

## Bileşenler (`components/ui`)

`Button` (brand · primary · secondary · ghost · danger; sm · md · lg · icon),
`ButtonLink`, `buttonClass()`, `Panel` + `PanelHeader`, `PageHeader`,
`EmptyState`, `Skeleton` + `SkeletonLines`, `Field`, `ThemeToggle`.
Odak halkası `--line-focus`, dokunma hedefi en az 44 piksel. Her panelin bir
`h2` başlığı olur.

## Yazım: Title Case

Başlık, düğme, sekme, rozet, etiket ve künyeler **Title Case**: "Yeni Kayıt",
"Tekrar Dene", "Ana Sayfaya Dön". Gövde metni, açıklama, yardım metni, hata
mesajı gövdesi, `placeholder` ve `aria-label` cümle düzeninde.

Türkçe Title Case: bağlaçlar (ve, ile, için, de/da, mi) küçük kalır, başta
gelirse büyür. `text-transform: capitalize` ve `title()` KULLANMA, `i → I`
üretir; küçültürken `toLocaleLowerCase("tr-TR")`.

Arayüz metninde uzun tire (em dash) yok; ayraç virgül, iki nokta ya da `·`.

## AI akışı (`/akis`)

Ajan hazırlar, kullanıcı karar verir: sohbet kutusu yerine karara hazır
kartlar (taslak e-posta, çakışma çözümü, rakam özeti). Desen:
`~/dev-starter/knowledge/patterns.md → AI Feed`.

- **Parçalar:** `components/feed/` (arayüz + sözleşme, `~/dev-starter/snippets/`
  ile bayt bayt aynı; orada düzelt, buraya kopyala), `lib/feed-rules.ts` (yetki,
  saf, `tests/feed.test.ts`), `lib/feed.ts` (okuma, `addFeedItem`),
  `lib/feed-handlers.ts` (aksiyonların gerçek işi), `app/akis/actions.ts`.
- **Demo:** geliştirmede veritabanı ya da oturum yokken sayfa örnek öğelerle
  açılır, aksiyonlar hiçbir şeye dokunmaz. Üretimde demo yok.
- **Üretici** öğeyi yalnızca `addFeedItem` ile yazar (yazmadan önce doğrular).
  Tespit kuraldır; model yalnızca metni yazar. Öncelik ve kulvar koddan.
- **Yetki:** istemci yalnız `{ itemId, actionId, draftText }` gönderir; alıcı,
  tutar, kimlik `feed_items.payload`tan okunur. Kartta olmayan ya da
  `FEED_HANDLERS`ta işleyicisi olmayan aksiyon çalışmaz.
- **Geri alınamaz iş** (gönderim, ödeme) işleyicide `undo` taşımaz, kartta
  `reversibility: "irreversible"`; ajan bunu `handled` kulvarına kendisi yazamaz.
- Ürün akış istemiyorsa sil: `app/akis/`, `components/feed/`, `lib/feed*.ts`,
  `tests/feed.test.ts`, `lib/schema.ts` → `feedItems`.

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

## SEO

`app/layout.tsx`: ortak metadata (OG, Twitter) ve JSON-LD (WebSite,
`lib/structured-data.ts` ile `<` kaçışlı). Kanonik adres SAYFADA
(`app/page.tsx`): layout'ta olsa her yeni sayfaya miras kalır ve sayfa kendini
ana sayfanın kopyası ilan eder; yeni sayfa kendi `alternates.canonical`ını
verir. `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` adresi
`lib/site.ts`ten okur; önizleme dağıtımları ve `SITE_INDEXABLE=false` kopyası
dizine girmez. `NEXT_PUBLIC_SITE_URL` (yalnızca http/https) Vercel dışında
tanımsızsa `next build` durur (`lib/env.ts` → `assertSiteUrlForBuild`); CI
`SKIP_ENV_VALIDATION=1` ile geçer.

## Güvenlik ve veri

- Sunucu eylemi girdisi `lib/validation.ts` → `validate()` ile doğrulanır;
  TypeScript imzası çalışma zamanında yoktur.
- Makine uçları `lib/api-auth.ts` → `rejectUnauthorized(req, env.CRON_SECRET)`.
- `lib/rate-limit.ts` örnek başına bellek içi bir fren, garanti değil.
- Her yabancı anahtar `onDelete` söyler. Uygulanmış migration düzenlenmez.
- Sunucu ortam değişkeni `lib/env.ts` → `env` üzerinden okunur.
- `next.config.ts` güvenlik başlıklarını basar; tam CSP bilinçli olarak yok
  (gerekçe dosyada).
