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

Aktif story'si olan işte commit iznini `/gate` açar: sonuç
`docs/ROUTEMAP.md`'nin Gate kolonuna işlenir ve `gate-guard` hook'u PASSED
olmayan aktif story varken commit'i bloklar (`.claude/settings.json` →
`~/dev-starter/hooks/`). Yukarıdaki komutlar Gate'in ön koşuludur, yerine
geçmez; yalnız doküman değiştiren commit muaftır. `~/dev-starter` yoksa (bulut
oturumu, kurulmamış makine) hook'lar koşmaz ve oturum başında "KAPALI" uyarısı
basılır: kontrolleri elle çalıştır. Terminalden atılan commit'ler için klon
başına bir kez `bash ~/dev-starter/hooks/git-pre-commit.sh --install`.

## Yol kapsamlı kurallar (`.claude/rules/`)

Bu dosya her oturumda yüklenir ve ~200 satırın altında kalır. Belirli
dosyalara ait kurallar `.claude/rules/*.md` içinde, `paths:` frontmatter'ı
eşleşen dosya okununca yüklenir (Claude Code resmî önerisi):
- `tokens.md` (kimlik, palet, token: `*.tsx`, `*.css`)
- `motion.md` (hareket: `*.tsx`, `lib/motion.ts`, `hooks/`)
- `feed.md` (AI akışı: `app/akis/`, `components/feed/`, `lib/feed*.ts`)
- `figures.md` (anatomy figür kiti: `components/iso/`, `components/figures/`)
Yeni bir kural yalnız belirli dizinler içinse buraya değil oraya yazılır.

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

## Tema ve token

Kimlik, palet ve token kuralları `.claude/rules/tokens.md`de (bileşen/stil dosyası okununca yüklenir); hareket kuralları `.claude/rules/motion.md`de. Özet: hardcoded renk ve `dark:` yok, degrade üç yerde, derinlik ton farkıyla, import `motion/react` + `m.*`.

- Tema çerezden sunucuda basılır (`lib/theme.ts`, `lib/theme.server.ts`);
  varsayılan açık, next-themes yok, satır içi script yok, FOUC yok. Çerezi
  ThemeToggle istemcide yazar: server action içinde `cookies().set()` bütün
  sayfayı sunucuda yeniden çizer ve ön yükleme önbelleğini boşaltır.

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

## AI akışı ve figür

`/akis`: agent hazırlar, kullanıcı karar verir (karara hazır kartlar). Ürün istemiyorsa silinir; parçalar, yetki ve demo kuralları `.claude/rules/feed.md`.

Açıklayıcı figür (anatomy) kiti şablonda YOK: `node ~/dev-starter/scripts/add-figure-kit.mjs .` (`--example`, `--lathe`). Kurallar `.claude/rules/figures.md`.

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
  (gerekçe dosyada). Site çerçeveye alınamaz (`DENY`); tek istisna yönetim
  panelinin canlı önizlemesi `/admin/onizleme` (`SAMEORIGIN`,
  `~/dev-starter/rules/live-preview.md`, kit `~/dev-starter/snippets/live-preview/`).
