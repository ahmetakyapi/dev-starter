# dev-starter

> Ahmet Akyapı'nın kişisel AI destekli geliştirme ekosistemi.
> Proje şablonları · Paylaşımlı npm paketleri · Görsel hafıza · Claude Code skill'leri

[![npm](https://img.shields.io/npm/v/@ahmetakyapi/theme?label=%40ahmetakyapi%2Ftheme&color=6366f1)](https://www.npmjs.com/package/@ahmetakyapi/theme)
[![npm](https://img.shields.io/npm/v/@ahmetakyapi/ui?label=%40ahmetakyapi%2Fui&color=6366f1)](https://www.npmjs.com/package/@ahmetakyapi/ui)

---

## Yapı

```
dev-starter/
├── templates/
│   ├── nextjs-fullstack/    Next.js 14 + Drizzle ORM + next-auth v5
│   └── landing/             Three.js + glassmorphism tanıtım sayfası
│
├── packages/
│   └── @ahmet/
│       ├── theme/           Design token'lar, CSS değişkenleri, Tailwind preset
│       └── ui/              GlassCard · Button · Chip · Cursor · hooks · variants
│
├── knowledge/
│   ├── themes/              Her projenin görsel hafızası (5 proje)
│   ├── mistakes.md          27 belgelenmiş hata ve çözümü
│   └── patterns.md          Kopyala-yapıştır kod desenleri
│
└── agents/                  uiux · frontend · backend · deploy
```

**Claude Code Skills** (`~/.claude/commands/`):

| Komut | Ne yapar |
|---|---|
| `/new-project` | Şablon seç, kopyala, placeholder'ları doldur |
| `/theme` | Görsel temayı analiz et ve uygula |
| `/deploy` | Vercel pre/post deploy checklist |
| `/review-ui` | UI/UX kod incelemesi |
| `/snippet` | Modal · Drawer · Form · Skeleton · Toast · Confirm |

---

## npm Paketleri

```bash
npm install @ahmetakyapi/theme
```

```bash
npm install @ahmetakyapi/ui
```

### @ahmetakyapi/theme

Design token'lar, CSS class sistemi ve Tailwind preset.

```ts
// tailwind.config.ts
import preset from '@ahmetakyapi/theme/tailwind'
export default { presets: [preset], darkMode: 'class', content: [...] }
```

```css
/* globals.css */
@import '@ahmetakyapi/theme/css';   /* .glass .chip .surface + animasyonlar */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ts
// Token'lara doğrudan erişim
import theme from '@ahmetakyapi/theme'
theme.animation.ease        // [0.22, 1, 0.36, 1]
theme.colors.bg.dark        // '#04070d'
theme.animation.spring      // snappy · bouncy · smooth · magnetic
```

**CSS class'ları:** `.glass` · `.glass-lg` · `.chip` · `.surface`

---

### @ahmetakyapi/ui

```ts
// Hooks
import { useSpotlight, useMagnetic, useCardTilt } from '@ahmetakyapi/ui'

// Bileşenler
import { GlassCard, Button, Chip, CustomCursor } from '@ahmetakyapi/ui'

// Framer Motion varyantları
import { fadeUp, fadeIn, scaleIn, staggerContainer, EASE } from '@ahmetakyapi/ui'

// Utility
import { cn } from '@ahmetakyapi/ui'
```

#### Hooks

**`useSpotlight(radius?, color?)`** — Mouse pozisyonunu takip eden radial gradient.

```tsx
const spotlight = useSpotlight(620, 'rgba(96,165,250,0.07)')
<motion.section style={{ background: spotlight }} />
```

**`useMagnetic(strength?)`** — Spring tabanlı magnetic buton efekti.

```tsx
const { mx, my, onMove, onLeave } = useMagnetic(0.26)
<motion.button style={{ x: mx, y: my }} onMouseMove={onMove} onMouseLeave={onLeave} />
```

**`useCardTilt(intensity?)`** — 3D kart eğimi + holografik shine.

```tsx
const { ref, rx, ry, shine } = useCardTilt(8)
<motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} />
```

#### Bileşenler

**`GlassCard`**

```tsx
<GlassCard>Basit glass kart</GlassCard>
<GlassCard tilt>3D eğim + holografik shine</GlassCard>
<GlassCard glow>Sadece shine efekti</GlassCard>
```

**`Button`**

```tsx
<Button variant="primary" size="lg">Başla</Button>
<Button variant="ghost" magnetic>Daha Fazla</Button>
<Button variant="outline" size="sm">İptal</Button>
```

**`Chip`**

```tsx
<Chip dot="bg-emerald-400">Aktif</Chip>
<Chip dot="bg-amber-400">Beta</Chip>
```

**`CustomCursor`** — Desktop nokta + spring halka. Touch cihazlarda gizlenir.

```tsx
<CustomCursor />  {/* layout.tsx veya page.tsx'e bir kez */}
```

#### Animasyon Varyantları

```ts
// EASE = [0.22, 1, 0.36, 1]

<motion.ul variants={staggerContainer(0.08)} initial="hidden" whileInView="visible">
  <motion.li variants={fadeUp} />
</motion.ul>

// Modal
<AnimatePresence>
  {open && (
    <motion.div variants={modalBackdrop} initial="hidden" animate="visible" exit="exit">
      <motion.div variants={modalPanel}>{children}</motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

| Varyant | Başlangıç → Bitiş |
|---|---|
| `fadeIn` | opacity: 0 → 1 |
| `fadeUp` | opacity: 0, y: 24 → 0 |
| `fadeUpLarge` | opacity: 0, y: 40 → 0 |
| `scaleIn` | opacity: 0, scale: 0.95 → 1 |
| `slideDown` | opacity: 0, y: -8, scale: 0.98 → normal |
| `modalBackdrop` | opacity: 0 → 1 |
| `modalPanel` | opacity: 0, scale: 0.96, y: -16 → normal |

---

## Proje Şablonları

### `nextjs-fullstack`

Next.js 14 · Drizzle ORM · Neon Postgres · next-auth v5 · Tailwind · Framer Motion

```
app/layout.tsx          ThemeProvider + suppressHydrationWarning + Manrope/IBM Plex
app/page.tsx            Spotlight hero + feature kartları
app/globals.css         glass · chip · surface · radyal arka plan · scrollbar
app/api/health/         Edge runtime sağlık endpoint'i
components/
  layout/Header.tsx     Sticky glass + tema toggle + mobil menü (AnimatePresence)
  layout/Footer.tsx
  ui/GlassCard.tsx      3D tilt + holografik shine
  ui/Button.tsx         primary · ghost · outline + magnetic
  ui/Chip.tsx           Pill badge + renkli nokta
  CustomCursor.tsx
hooks/useSpotlight.ts
hooks/useMagnetic.ts
lib/db.ts               neon() + drizzle(sql, { schema })
lib/schema.ts           users tablosu + tip çıkarımı
lib/api.ts              ok<T>() · err() · serverErr()
lib/utils.ts            cn() · formatDate() · truncate()
lib/variants.ts         EASE + tüm varyantlar
```

### `landing`

Three.js particle background · Glassmorphism · Hero/Features/Pricing/Testimonials/CTA

```
app/page.tsx            SceneBackground (SSR:false) + tüm section'lar
app/sitemap.ts          Otomatik sitemap.xml
app/robots.ts           robots.txt
components/sections/
  Hero.tsx              Spotlight + magnetic CTA + grid overlay + scroll indicator
  Features.tsx          6 kart 3D tilt + holografik shine
  Pricing.tsx           3 tier (Free · Pro · Enterprise) — varsayılan kapalı
  Testimonials.tsx      3 kart, yıldız, avatar — varsayılan kapalı
  CTA.tsx               Glass panel + gradient glow
components/
  SceneBackground.tsx   Three.js, 800 parçacık, indigo, SSR:false
  ui/GlassCard · Button · Chip
```

**Yer tutucular:** `PROJECT_NAME` · `HERO_TITLE_LINE1/2` · `HERO_SUBTITLE` · `CTA_LINK/PRIMARY/TITLE/BUTTON` · `PLAN_FREE/PRO/ENT_*` · `TEST_*`

---

## Skills

### `/new-project [isim]`

1. Proje tipi (`fullstack` / `landing`), tema, auth, DB tercihlerini sorar
2. `knowledge/mistakes.md` + seçilen tema dosyasını okur
3. Şablonu kopyalar, `sed` ile tüm placeholder'ları değiştirir

### `/theme [tema]`

`globals.css` · `tailwind.config.ts` · `layout.tsx` · `components/` inceleyerek tema tutarsızlıklarını tespit eder ve düzeltir.

**Temalar:** `ahmetakyapi` · `digynotes` · `mimio` · `minimal`

### `/deploy`

Vercel deploy öncesi 9 maddelik kontrol: build · env vars · lint · kritik hatalar · `vercel.json` · DB migration · domain · deploy · post-deploy.

### `/review-ui [dosya/dizin]`

Tema tutarlılığı · animasyon kalitesi · erişilebilirlik · performans · responsive · kod kalitesi — sorunları doğrudan düzeltir.

### `/snippet [tip]`

Proje bağlamını okuyarak doğru import'larla hazır bileşen üretir.

`modal` · `drawer` · `form` · `skeleton` · `toast` · `confirm`

---

## Ajan Dosyaları

`agents/` dizinindeki tanım dosyaları, Claude'a belirli bir görev için kimliğini, bilgi tabanını ve karar çerçevesini verir. Doğrudan çağrılmazlar — "bu konuda uzman olarak hareket et, şu dosyaları oku" şeklinde kullanılır.

### `uiux-agent.md` — UI/UX Mühendisi

Görsel dil koruyucusu. Yeni bileşen tasarlarken, animasyon yazarken veya dark/light mode implementasyonunda kullanılır.

**Karar çerçevesi:** Hareket → Cam → Işık → Tipografi → Boşluk → Koyu/Açık

**Okur:** `knowledge/themes/ahmetakyapi.md` · `knowledge/mistakes.md`

**Kurallar:** GSAP değil Framer Motion · hardcoded renk yasak · EASE = `[0.22, 1, 0.36, 1]`

---

### `frontend-agent.md` — Next.js Developer

App Router uzmanı. Sayfa/layout yazarken, Server vs Client Component kararında, API entegrasyonunda kullanılır.

**Okur:** `knowledge/mistakes.md` · `knowledge/patterns.md` · projenin `CLAUDE.md`'si

**Server vs Client karar ağacı:**
```
Varsayılan: Server Component
useState / useEffect / event handler / browser API / Framer Motion gerekiyor mu?
→ Hayır → Server Component bırak
→ Evet  → 'use client' ekle, mümkün olan en alt seviyede tut
```

---

### `backend-agent.md` — API & Veritabanı

Drizzle schema, API route'ları, next-auth v5 ve Zod validasyonu konusunda uzmanlaşmış.

**Zorunlu kurallar:**
- `@neondatabase/serverless` — `pg` değil (Vercel serverless uyumluluğu)
- Her foreign key'de `ON DELETE` davranışı zorunlu
- Migration immutability — var olan dosya düzenlenmez, yeni dosya açılır

**Response pattern:** `ok<T>()` · `err()` · `serverErr()` — `NextResponse.json()` ile tutarlı API

---

### `deploy-agent.md` — Vercel & DevOps

Deployment hazırlığı, env var yönetimi, domain konfigürasyonu ve post-deploy kontrol.

**Checklist:** `npx tsc --noEmit` → `npm run lint` → `npm run build` → env vars → DB migration → `vercel --prod` → health endpoint

**Sık karşılaşılan sorunlar:** Build'de `module not found` · runtime'da `undefined` env var · production'da auth çalışmıyor · DB connection timeout

---

## Bilgi Tabanı

### `knowledge/mistakes.md` — 27 hata

| # | Hata | Çözüm |
|---|---|---|
| 1 | next-themes hydration mismatch | `<html suppressHydrationWarning>` + mounted guard |
| 2 | Three.js SSR çakışması | `dynamic(..., { ssr: false })` |
| 5 | Vercel'de `pg` timeout | `@neondatabase/serverless` |
| 10 | Server Component'te Framer Motion | `'use client'` direktifi |
| 17 | Tailwind v4'te `tailwind.config.ts` | `globals.css` `@theme {}` bloğu |
| 25 | Migration dosyasını düzenleme | Immutable — her zaman yeni dosya |
| 26 | Hardcoded renk | CSS variable veya Tailwind token |

### `knowledge/themes/` — 5 proje görsel hafızası

| Proje | Dark BG | Font | Vurgu | Tema Sistemi |
|---|---|---|---|---|
| ahmetakyapi.com | `#04070d` | Manrope + IBM Plex | Indigo · Cyan · Emerald | next-themes class |
| Mimio | `#04070d` | Plus Jakarta Sans | Indigo | custom data-theme |
| DigyNotes | `#0a0f1e` | Avenir Next | Emerald | html.light class |
| Keskealsaydım | HSL | Space Grotesk | Emerald · Cyan | shadcn HSL vars |
| Ramazan Vakitleri | `#1a1a2e` | System | Lavender · Pembe · Mavi | Dark only, vanilla CSS |

### `knowledge/patterns.md`

Auth (next-auth v5) · Database (Drizzle+Neon) · API helpers · next-themes kurulumu · Three.js dynamic import · Framer Motion (spotlight, stagger, modal) · SEO (sitemap, robots, OG) · Edge health route

---

## Ekosistemi Güncelleme

```
Yeni hata      →  knowledge/mistakes.md
Yeni proje     →  knowledge/themes/[proje].md
Yeni desen     →  knowledge/patterns.md
Yeni bileşen   →  packages/@ahmet/ui/src/components/ + index.ts + npm publish
Yeni skill     →  ~/.claude/commands/[skill-adi].md
```

---

*Ahmet Akyapı · [ahmetakyapi.com](https://ahmetakyapi.com) · [@ahmetakyapi](https://github.com/ahmetakyapi)*
