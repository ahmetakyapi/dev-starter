---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "app/**"
  - "components/**"
  - "hooks/**"
  - "proxy.ts"
  - "next.config.*"
---

# React / Next.js Kuralları (global, yol kapsamlı)

> Kaynak: `~/dev-starter/machine/rules/nextjs-react.md` → `~/.claude/rules/dev-starter/`
> (bootstrap). 8 Kasım 2026'ya dek global `CLAUDE.md`nin "Kod Standartları →
> React / Next.js", "Dosya Yapısı Tercihleri" ve "Öğrenilen Hatalar" (1, 2, 4,
> 6, 7, 8) bölümlerindeydi; yalnız bu dosyalara dokunulunca yüklensin diye
> taşındı (`knowledge/decisions.md` → "Bağlam Dosyaları").

## React / Next.js

- `'use client'` — sadece gerçekten gerektiğinde; default Server Component
- Server Component'lere motion/useState koyma; `"use client"` modülden sabit export etme (sunucuda referansa döner)
- `params`, `searchParams`, `cookies()`, `headers()` her zaman `await`
- Temiz kopyada önce `npm run build` (ya da `npx next typegen`), sonra typecheck — `PageProps` tipleri oradan
- Segmentte `loading.tsx` yok (soft 404); yavaş parça kendi `<Suspense>`inde
- `suppressHydrationWarning` — `<html>`de; `mounted` guard yalnız next-themes kullanan eski projelerde
- Three.js ve canvas bileşenleri: `dynamic(() => import(...), { ssr: false })`
- Server Action herkese açık POST ucudur: her birinde `auth()` + zod + sahiplik

## Dosya Yapısı Tercihleri

```
app/
  (auth)/           # auth route grubu
  api/              # API routes
  [feature]/        # feature route'ları
components/
  ui/               # genel UI bileşenleri
  [feature]/        # feature'a özgü bileşenler
lib/
  db.ts             # tembel Neon bağlantısı
  schema.ts         # Drizzle schema
  env.ts            # zod ile env doğrulama
  theme.ts          # THEME_COOKIE, DEFAULT_THEME, PALETTE ("use client" değil)
  motion.ts         # EASE, DUR, SPRING ("use client" değil)
  utils.ts          # cn() (extendTailwindMerge) + yardımcılar
proxy.ts            # Next 16 — çerez varlığına bakan ön eleme
hooks/              # custom hooks (use*.ts)
types/              # global TypeScript tipleri
```

## Öğrenilen Hatalar (arayüz katmanı)

Ayrıntı: `~/dev-starter/knowledge/mistakes.md`.

1. Tema çerezden sunucuda → script yok, `mounted` guard yok (next-themes yalnız eski projelerde)
2. Three.js / React Quill → `dynamic(..., { ssr: false })`
4. motion → `motion/react` + `m.*`, `layoutId` unique, `'use client'` şart; reduced-motion'da `initial={false}` yok
6. Tailwind v4 → `@theme inline`; katmansız CSS utility'yi ezer; özel punto adları `extendTailwindMerge`e kayıtlı
7. Zemin katmanı `position: fixed` pseudo-element (`background-attachment: fixed` değil), grain'de `mix-blend-mode` yok
8. Next 16 → `proxy.ts`, `next lint` yok, typecheck'ten önce build

(3, 5, 9 → `data-env.md`; 10 → `visual-language.md`. Numaralar eski listeyle aynı.)
