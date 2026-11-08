---
paths:
  - "**/*.tsx"
  - "**/*.css"
  - "lib/utils.ts"
  - "lib/theme*.ts"
  - "tests/palette.test.ts"
---

# Kimlik, Palet ve Token Kuralları

> Şablon CLAUDE.md'sinden taşındı (dev-starter, 8 Kasım 2026): bileşen ya da
> stil dosyasına dokunulunca yüklenir. Temanın çerezden nasıl basıldığı
> şablona göre değiştiği için CLAUDE.md'de kaldı. İki Next şablonunda bu
> dosya bayt bayt aynıdır (dev-starter `health-check.sh` → `SHARED_TEMPLATE_FILES`).

## Kimlik Ortak, Palet Projeye Göre

Token adları, ton farkıyla derinlik, degrade disiplini, hareket eğrisi ve
ölçekler KİMLİKTİR, her projede aynı kalır. Renk ailesi PALETTİR:
`<html data-palette>` (`lib/theme.ts` → `PALETTE`, şablonda `signature`).
Palet değiştirmek `globals.css`teki iki `signature` bloğunu ezmek demek;
sistem katmanına dokunulmaz ve yeni palet `tests/palette.test.ts`ten geçer.
Hazır alternatifler (`verdant`, `ember`, `iris`) `@ahmetakyapi/theme`te.

## Token Kuralları

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
  `edge-lit` üstten ışıklı kenar (panel, vitrin kartı; tekrar eden satıra
  değil). Giriş alanı `shadow-well` ile içe oyulur, odakta `shadow-focus`
  halesi 2 px çizginin yanına gelir. Gölge taşıyan karo ayrıca `border` almaz.
- CSS değişkeni okuyamayan yerler (OG görseli, `global-error`, manifest,
  viewport rengi) değeri sabit yazar ve kaynağını yorumda söyler.
