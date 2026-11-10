---
description: Proje sağlık kontrolü: build, typecheck, lint, test, token, güvenlik ve yeni tech stack (Next 16, Tailwind v4, motion) uyumu
argument-hint: "[dizin]"
---

Projenin sağlık durumunu kontrol et (`$ARGUMENTS` verilmişse o dizinde). Her
adım bir KOMUT çalıştırır; "bakıldı, iyi görünüyor" sonuç değildir.
Kuralların kaynağı: `~/dev-starter/guides/08-quality-and-ship.md`.

> **Sınır**: /check teknik sağlıktır, ROUTEMAP'in Gate kolonuna YAZILMAZ.
> Commit kapısını açan denetim `/gate`tir; /check onun hazırlık turudur.

## 0. Tech Stack'i Tespit Et

```bash
grep -E '"(next|react|tailwindcss|motion|framer-motion|next-themes|eslint)"' package.json
ls proxy.ts middleware.ts eslint.config.* .eslintrc* tailwind.config.* postcss.config.* 2>/dev/null
```

Aşağıdaki "yeni tech stack" maddeleri yalnızca Next 16 / Tailwind v4 projelerinde
bulgu sayılır; eski projede bilgi olarak raporlanır.

## 1. Komutlar (sırası önemli)

1. `npm run build` — Next 16'da typecheck'ten ÖNCE (`PageProps` tipleri burada üretilir)
2. `npm run typecheck` (yoksa `npx tsc --noEmit`) — exit kodunu raporla
3. `npm run lint` — config dosyasının VAR olduğunu da doğrula
4. `npm test` (varsa)

## 2. Yeni Tech Stack Uyumu

- **Next 16:** `middleware.ts` yerine `proxy.ts` (`export function proxy`) var mı?
  Senkron `params` / `cookies()` kullanımı var mı? Segmentte `loading.tsx` var mı
  (soft 404 riski)? `revalidateTag` tek argümanla mı çağrılıyor?
- **ESLint:** `next lint` script'i ya da `.eslintrc*` varsa bulgu; doğrusu
  `"lint": "eslint --max-warnings 0"` + `eslint.config.mjs` (flat, `eslint-config-next/core-web-vitals` + `/typescript`).
- **Tailwind v4:** `tailwind.config.*` olmamalı; `postcss.config.mjs` →
  `@tailwindcss/postcss`; `globals.css`te `@import "tailwindcss"` ve `@theme inline` köprüsü.
  `@import "tailwindcss"` var ama PostCSS eklentisi yoksa CRITICAL (utility'ler hiç üretilmez).
- **motion:** `framer-motion` import'u yeni projede bulgu; kökte
  `LazyMotion strict` varsa bileşende `motion.*` kullanımı HATA (`m.*` olmalı).
- **Tema:** `next-themes` yeni projede bulgu (çerez + `data-theme` bekleniyor).
- **cn():** özel punto adları (`text-small`, `text-read`...) kullanılıyorsa
  `extendTailwindMerge` kaydı var mı (`mistakes.md` #75)?

## 3. Token taraması

```bash
grep -rn --include='*.tsx' --include='*.ts' -E '#[0-9a-fA-F]{3,8}\b|bg-white|bg-black|text-(gray|slate)-[0-9]|dark:' app components lib
```

Kaynak: `~/dev-starter/rules/design-tokens.md`. Token tanım dosyaları (`globals.css`) istisna.

## 4. Güvenlik

```bash
git ls-files | grep -E '(^|/)\.env($|\.)' | grep -vE '\.(example|template)$'
# Desen hooks/quality-scan.sh § 3 ile aynı (tek tırnak, büyük/küçük harf, kebab token ayıklaması)
SECRET_RE="(password|secret|api_key|apikey|token)[[:space:]]*[:=][[:space:]]*[\"'][^\"'[:space:]]{8,}[\"']"
grep -rnoiE "$SECRET_RE" app lib components --include='*.ts' --include='*.tsx' \
  | grep -vE ":[Tt]oken[[:space:]]*[:=][[:space:]]*[\"'][a-z]+(-[a-z0-9]+)+[\"']\$"
grep -rn "console.log" app lib components --include='*.ts' --include='*.tsx'
```

Korumalı uçlar `checkBearer` (üretimde sır yoksa 503) kullanıyor mu? Server
Action'lar `auth()` + zod + sahiplik kontrolü yapıyor mu?

## Rapor

```
CHECK REPORT
━━━━━━━━━━━━━━━━━━━━━━━
Build:        ✅ | ❌
TypeScript:   ✅ | ❌
Lint:         ✅ | ❌ | ⏭️ (yoksa)
Tests:        ✅ | ❌ | ⏭️ (yoksa)
Tech stack:   ✅ | ⚠️ [N madde] | ⏭️ (eski tech stack)
Design Token: ✅ | ⚠️ [N ihlal]
Security:     ✅ | ❌
━━━━━━━━━━━━━━━━━━━━━━━
Sonuç: PASSED | FAILED | PASSED_WITH_WARNINGS
```

Her başarısız adımda hatayı, komut çıktısını ve düzeltme önerisini belirt.
