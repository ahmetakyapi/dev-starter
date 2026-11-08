---
paths:
  - "packages/**"
  - "snippets/**"
  - "storybook/**"
  - "templates/**"
  - "guides/02-design-tokens.md"
  - "guides/10-component-library.md"
---

# Paket Kullanımı (`@ahmetakyapi/theme`, `@ahmetakyapi/ui`)

> 8 Kasım 2026'ya dek kök `CLAUDE.md`nin "Paket Kullanımı" bölümüydü; paket,
> snippet, şablon ya da Storybook dosyasına dokunulunca yüklensin diye buraya
> taşındı (`knowledge/decisions.md` → "Bağlam Dosyaları"). Ayrıntı:
> `guides/02-design-tokens.md`, `guides/00-brand-identity.md`.

Yeni bir Next.js projesinde (Tailwind v4):

```bash
npm install @ahmetakyapi/theme @ahmetakyapi/ui motion
```

```css
/* app/globals.css — tailwind.config.ts YOK */
@import "tailwindcss";
@import "@ahmetakyapi/theme/theme.css";   /* sistem + palet + @theme inline */
@import "@ahmetakyapi/theme/css";         /* isteğe bağlı: .surface, .glass, .display-ink, .app-bg */
@import "@ahmetakyapi/ui/source.css";     /* ui sınıflarını taratır — Tailwind node_modules'u taramaz */
```

```tsx
// app/layout.tsx — palet ve tema html'de
<html lang="tr" data-theme={theme} data-palette="signature" suppressHydrationWarning>
```

```ts
// Kökte <LazyMotion features={domAnimation} strict> ŞART — bileşenler m.* kullanır
import { Surface, Button, Chip, CustomCursor } from '@ahmetakyapi/ui'
import { useSpotlight, useMagnetic, useCardTilt, useFinePointer } from '@ahmetakyapi/ui'
// Sabitler ve cn() /core'dan: 'use client' taşımaz, sunucu bileşeninde de gerçek değer
import { EASE, DUR, SPRING, STAGGER, fadeUp, fadeIn, cn } from '@ahmetakyapi/ui/core'
```

Birincil eylem `bg-cta text-on-brand` (her durak AA); `bg-brand` yalnızca
marka karosu, üstüne metin yazılmaz. Gölge sınıfları şablonlarla ortak:
`shadow-raised` · `shadow-floating` · `shadow-modal`.

v3 preset'i (`@ahmetakyapi/theme/tailwind`) 3.0.0'da kaldırıldı.

## Değişiklik Yaparken

- Paket versiyonu güncellenince: `packages/@ahmet/*/package.json` + `CHANGELOG.md`
- Yeni snippet: `snippets/` altında, `guides/05-components.md` ya da
  `10-component-library.md` kataloğuna
- İki Next şablonuna ortak dosya eklenince: `scripts/health-check.sh` →
  `SHARED_TEMPLATE_FILES` (bayt bayt aynılık `cmp` ile denetlenir; biri
  düzelip öteki bayatlamasın)
