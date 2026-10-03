---
description: Proje sağlık kontrolü: build, typecheck, lint, test, token, güvenlik ve yeni yığın (Next 16, Tailwind v4, motion) uyumu
argument-hint: "[dizin]"
---

Projenin saglik durumunu kontrol et (`$ARGUMENTS` verilmisse o dizinde). Her
adim bir KOMUT calistirir; "bakildi, iyi gorunuyor" sonuc degildir.
Kurallarin kaynagi: `~/dev-starter/guides/08-quality-and-ship.md`.

## 0. Yigini tespit et

```bash
grep -E '"(next|react|tailwindcss|motion|framer-motion|next-themes|eslint)"' package.json
ls proxy.ts middleware.ts eslint.config.* .eslintrc* tailwind.config.* postcss.config.* 2>/dev/null
```

Asagidaki "yeni yigin" maddeleri yalnizca Next 16 / Tailwind v4 projelerinde
bulgu sayilir; eski projede bilgi olarak raporlanir.

## 1. Komutlar (sirasi onemli)

1. `npm run build` — Next 16'da typecheck'ten ONCE (`PageProps` tipleri burada uretilir)
2. `npm run typecheck` (yoksa `npx tsc --noEmit`) — exit kodunu raporla
3. `npm run lint` — config dosyasinin VAR oldugunu da dogrula
4. `npm test` (varsa)

## 2. Yeni yigin uyumu

- **Next 16:** `middleware.ts` yerine `proxy.ts` (`export function proxy`) var mi?
  Senkron `params` / `cookies()` kullanimi var mi? Segmentte `loading.tsx` var mi
  (soft 404 riski)? `revalidateTag` tek argumanla mi cagriliyor?
- **ESLint:** `next lint` script'i ya da `.eslintrc*` varsa bulgu; dogrusu
  `"lint": "eslint"` + `eslint.config.mjs` (flat, `eslint-config-next/core-web-vitals` + `/typescript`).
- **Tailwind v4:** `tailwind.config.*` olmamali; `postcss.config.mjs` →
  `@tailwindcss/postcss`; `globals.css`te `@import "tailwindcss"` ve `@theme inline` koprusu.
  `@import "tailwindcss"` var ama PostCSS eklentisi yoksa CRITICAL (utility'ler hic uretilmez).
- **motion:** `framer-motion` import'u yeni projede bulgu; kokte
  `LazyMotion strict` varsa bilesende `motion.*` kullanimi HATA (`m.*` olmali).
- **Tema:** `next-themes` yeni projede bulgu (cerez + `data-theme` bekleniyor).
- **cn():** ozel punto adlari (`text-small`, `text-read`...) kullaniliyorsa
  `extendTailwindMerge` kaydi var mi (`mistakes.md` #75)?

## 3. Token taramasi

```bash
grep -rn --include='*.tsx' --include='*.ts' -E '#[0-9a-fA-F]{3,8}\b|bg-white|bg-black|text-(gray|slate)-[0-9]|dark:' app components lib
```

Kaynak: `~/dev-starter/rules/design-tokens.md`. Token tanim dosyalari (`globals.css`) istisna.

## 4. Guvenlik

```bash
git ls-files | grep -E '^\.env($|\.)' | grep -v example
grep -rnE "(password|secret|api_key|token)\s*[:=]\s*['\"][^'\"]{8,}" app lib components --include='*.ts' --include='*.tsx'
grep -rn "console.log" app lib components --include='*.ts' --include='*.tsx'
```

Korumali uclar `checkBearer` (uretimde sir yoksa 503) kullaniyor mu? Server
Action'lar `auth()` + zod + sahiplik kontrolu yapiyor mu?

## Rapor

```
CHECK REPORT
━━━━━━━━━━━━━━━━━━━━━━━
Build:        ✅ | ❌
TypeScript:   ✅ | ❌
Lint:         ✅ | ❌ | ⏭️ (yoksa)
Tests:        ✅ | ❌ | ⏭️ (yoksa)
Yigin uyumu:  ✅ | ⚠️ [N madde] | ⏭️ (eski yigin)
Design Token: ✅ | ⚠️ [N ihlal]
Security:     ✅ | ❌
━━━━━━━━━━━━━━━━━━━━━━━
Sonuc: PASSED | FAILED | PASSED_WITH_WARNINGS
```

Her basarisiz adimda hatayi, komut ciktisini ve duzeltme onerisini belirt.
