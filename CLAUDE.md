# dev-starter — Ekosistem CLAUDE.md

Bu, Ahmet'in kişisel geliştirme ekosistemi. Yeni proje başlatmak, tema uygulamak veya deploy etmek için buradan başla.

---

## Ekosistem Yapısı

```
dev-starter/
├── packages/@ahmet/
│   ├── theme/      → CSS tokenları, Tailwind preset, animasyon varyantları
│   └── ui/         → GlassCard, Button, Chip, CustomCursor + hooks + variants
│
├── knowledge/
│   ├── themes/
│   │   ├── ahmetakyapi.md     → Ana görsel dil referansı
│   │   ├── digynotes.md       → DigyNotes görsel hafıza
│   │   ├── mimio.md           → Mimio görsel hafıza
│   │   ├── keskealsaydim.md   → KeskealSaydım görsel hafıza
│   │   └── ramazan-vakitleri.md → Ramazan Vakitleri görsel hafıza
│   ├── mistakes.md            → Tekrar edilmeyecek hatalar
│   └── patterns.md            → Test edilmiş kod desenleri
│
├── agents/
│   ├── uiux-agent.md       → Tasarım & animasyon kararları
│   ├── frontend-agent.md   → Next.js & React implementasyon
│   ├── backend-agent.md    → DB, API, auth
│   └── deploy-agent.md     → Vercel deployment
│
└── templates/
    ├── nextjs-fullstack/   → Next.js + Drizzle + auth tam uygulama
    └── landing/            → Three.js + glassmorphism tanıtım sayfası
```

---

## Hızlı Başlangıç

### Yeni Proje
```
/new-project [proje-adı]
```

### Görsel Tema Uygula
```
/theme ahmetakyapi
/theme digynotes
/theme mimio
```

### Deploy
```
/deploy
```

### UI İnceleme
```
/review-ui [dosya veya dizin]
```

### Hızlı Bileşen Üret
```
/snippet modal
/snippet form
/snippet drawer
/snippet skeleton
/snippet toast
/snippet confirm
```

---

## Paket Kullanımı

Yeni bir Next.js projesinde:

```bash
# Lokal paketleri referans et (workspace veya dosya yolu)
npm install @ahmetakyapi/theme @ahmetakyapi/ui
```

```ts
// tailwind.config.ts
import preset from '@ahmetakyapi/theme/tailwind'
export default { presets: [preset], content: [...] }
```

```css
/* globals.css */
@import '@ahmetakyapi/theme/css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ts
// hooks, bileşenler ve varyantlar
import { useSpotlight, useMagnetic, useCardTilt } from '@ahmetakyapi/ui'
import { GlassCard, Button, Chip, CustomCursor } from '@ahmetakyapi/ui'
import { fadeUp, fadeIn, staggerContainer, EASE } from '@ahmetakyapi/ui'
import { cn } from '@ahmetakyapi/ui'
```

---

## Bu Dosyaları Güncelleme

- **Yeni hata keşfedilince**: `knowledge/mistakes.md` güncelle
- **Yeni proje tamamlanınca**: `knowledge/themes/[proje].md` doldur
- **Yeni desen bulununca**: `knowledge/patterns.md` güncelle
- **Paket versiyonu güncellenince**: `packages/@ahmet/*/package.json` güncelle

---

## Global Kurallar

Bakınız: `~/.claude/CLAUDE.md`
