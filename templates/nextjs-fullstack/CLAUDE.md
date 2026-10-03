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
`package-lock.json` projede commit'lenir (CI `npm ci` kullanır).

**Commit öncesi dördü de temiz olmalı:** `npm run typecheck`, `npm run lint`,
`npm test`, `npm run build`. Görsel değişiklik ayrıca tarayıcıda iki temada
gözle kontrol edilir.

## Yığın

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
- Tema çerezden sunucuda basılır (`lib/theme.ts`, `app/actions/theme.ts`);
  varsayılan açık, next-themes yok, satır içi betik yok, FOUC yok.
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

## Güvenlik ve veri

- Sunucu eylemi girdisi `lib/validation.ts` → `validate()` ile doğrulanır;
  TypeScript imzası çalışma zamanında yoktur.
- Makine uçları `lib/api-auth.ts` → `rejectUnauthorized(req, env.CRON_SECRET)`.
- `lib/rate-limit.ts` örnek başına bellek içi bir fren, garanti değil.
- Her yabancı anahtar `onDelete` söyler. Uygulanmış migration düzenlenmez.
- Sunucu ortam değişkeni `lib/env.ts` → `env` üzerinden okunur.
- `next.config.ts` güvenlik başlıklarını basar; tam CSP bilinçli olarak yok
  (gerekçe dosyada).
