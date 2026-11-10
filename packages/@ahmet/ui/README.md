# @ahmetakyapi/ui

Türkçe, erişilebilir, token'lı React bileşen kiti: form, katman, veri,
grafik, yapay zekâ, hareket ve doku, tanıtım. 97 bileşen + `Surface`, `Button`,
`Chip`, `CustomCursor` ve motion yardımcıları.

Görsel katalog: <https://dev-starter-storybook.vercel.app>

## Kurulum

```bash
npm i @ahmetakyapi/ui @ahmetakyapi/theme motion lucide-react
```

```css
/* app/globals.css (Tailwind v4) */
@import "tailwindcss";
@import "@ahmetakyapi/theme/theme.css";
@import "@ahmetakyapi/ui/source.css"; /* paketin sınıflarını taratır */
```

```tsx
// app/layout.tsx
<html lang="tr" data-theme="light" data-palette="signature">
```

Kökte `<LazyMotion features={domAnimation} strict>` olmalı: bileşenler
`m.*` kullanır.

```tsx
import { BorderBeam, Terminal, Dial, ToolCall, AreaChart, LiquidGlassLink, BlurIn } from "@ahmetakyapi/ui";
import { cn, EASE, DUR } from "@ahmetakyapi/ui/core"; // sunucu bileşeninde de gerçek değer
```

## Pakette Olmayanlar

`next/link` ya da Base UI isteyen 32 bileşen (select, combobox, tooltip,
toast, data-table, app-shell…) pakette yok: paket Next'e ve headless
kütüphaneye bağlanmasın diye. Onları kaynak olarak al:

```bash
npx shadcn@latest add https://dev-starter-storybook.vercel.app/r/<ad>.json
```

## Kaynak

Bileşenlerin tek kaynağı `snippets/ui/` (dev-starter deposu); paketin
`src/kit/` klasörü oradan üretilir (`npm run kit:ui`). Lisans MIT.
