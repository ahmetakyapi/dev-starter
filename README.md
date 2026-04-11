# dev-starter

> Ahmet Akyapı'nın kişisel AI destekli geliştirme ekosistemi.
> Proje şablonları · npm paketleri · Agent sistemi · Kalite enforsmanı · Claude Code skill'leri

[![npm](https://img.shields.io/npm/v/@ahmetakyapi/theme?label=%40ahmetakyapi%2Ftheme&color=6366f1)](https://www.npmjs.com/package/@ahmetakyapi/theme)
[![npm](https://img.shields.io/npm/v/@ahmetakyapi/ui?label=%40ahmetakyapi%2Fui&color=6366f1)](https://www.npmjs.com/package/@ahmetakyapi/ui)

---

## Yapı

```
dev-starter/
├── packages/@ahmet/
│   ├── theme/           Design token'lar, CSS değişkenleri, Tailwind preset
│   └── ui/              GlassCard · Button · Chip · Cursor · hooks · variants
│
├── agents/              7 agent dosyası + haberleşme protokolü
│   ├── AGENT_PROTOCOL.md    Akış, context curation, hook'lar, lifecycle
│   ├── business-analyst-agent.md   Planlama, onay, yönlendirme
│   ├── uiux-agent.md       Tasarım & animasyon kararları
│   ├── frontend-agent.md   Next.js & React implementasyon
│   ├── backend-agent.md    DB, API, auth
│   ├── gate-agent.md       6-pass kalite kontrolü, auto-fix
│   └── deploy-agent.md     Vercel deployment & release
│
├── rules/               7 kural dosyası
│   ├── immutable-architecture.md   10 kırılamaz mimari kural
│   ├── design-tokens.md            Hardcoded değer yasağı
│   ├── commit-conventions.md       Conventional commit standardı
│   ├── bugfix-protocol.md          TDD bugfix akışı
│   ├── dev-cycle.md                Plan → Dev → Gate → Commit → Review
│   ├── routemap-discipline.md      ROUTEMAP tek kaynak prensibi
│   └── context-curation.md         Agent bazlı context seviyeleri
│
├── phases/              Proje yaşam döngüsü
│   ├── planning.md          P1→P6: Discovery → Stories → Readiness
│   ├── e2e-polish.md        E0→E5: Seed → Smoke → Perf → Acceptance
│   └── release-maintenance.md   Release checklist, maintenance triage
│
├── hooks/               Enforcement hook'ları (Claude Code entegre)
│   ├── gate-guard.sh        Commit öncesi Gate PASSED kontrolü
│   ├── quality-scan.sh      Secret, debug kodu, design token taraması
│   └── routemap-sync.sh     ROUTEMAP güncelleme hatırlatıcısı
│
├── knowledge/
│   ├── themes/              Her projenin görsel hafızası (5 proje, DESIGN.md 9-section formatı)
│   ├── mistakes.md          41 belgelenmiş hata ve çözümü
│   ├── patterns.md          15+ kopyala-yapıştır kod deseni
│   └── decisions.md         Teknoloji seçimlerinin gerekçesi
│
├── snippets/            10 hazır bileşen
│   ├── animated-number.tsx  Sayı animasyonu
│   ├── infinite-scroll.tsx  Sonsuz kaydırma
│   ├── og-image.tsx         Open Graph görsel üretici
│   ├── search-bar.tsx       Debounced arama kutusu
│   ├── modal.tsx            Animasyonlu dialog
│   ├── drawer.tsx           Yandan açılan panel
│   ├── form.tsx             Server Action uyumlu form
│   ├── skeleton.tsx         Yükleme placeholder'ları
│   ├── toast.tsx            Bildirim sistemi
│   └── confirm.tsx          Onay dialog'u
│
├── templates/
│   ├── docs/                ROUTEMAP, PRODUCT, ARCHITECTURE, SCREENS, DESIGN.md şablonları
│   ├── nextjs-fullstack/    Next.js + Drizzle + auth tam uygulama
│   └── landing/             Three.js + glassmorphism tanıtım sayfası
│
├── scripts/
│   └── health-check.sh     Ekosistem bütünlük kontrolü (51 kontrol noktası)
│
├── .claude/
│   ├── settings.local.json  Hook entegrasyonu + izinler
│   ├── skills/              clone-website (pixel-perfect site klonlama)
│   └── commands/            7 skill komutu
│
├── .github/workflows/ci.yml   Build + typecheck + lint + security + ecosystem health
├── eslint.config.js         Root ESLint yapılandırması
├── .prettierrc              Prettier yapılandırması
├── .editorconfig            IDE tutarlılığı
├── CHANGELOG.md             Versiyon geçmişi
└── CONTRIBUTING.md          Katkı rehberi
```

---

## Proje Yaşam Döngüsü

```
PLANNING (P1→P6)  →  DEVELOPMENT  →  E2E & POLISH (E0→E5)  →  RELEASE  →  MAINTENANCE
```

| Faz                   | Protokol                         | Yöneten              |
|-----------------------|----------------------------------|----------------------|
| Planning (P1→P6)      | `phases/planning.md`             | BA Agent             |
| Development           | `rules/dev-cycle.md`             | BA → FE/BE/UI → GATE |
| E2E & Polish (E0→E5)  | `phases/e2e-polish.md`           | BA + GATE            |
| Release & Maintenance | `phases/release-maintenance.md`  | BA + DP              |

---

## Agent Sistemi

6 uzman agent + 1 protokol dosyası. BA Agent koordine eder, ilgili agent'lara iş geçirir.

```
Kullanıcı talebi → BA Agent → İlgili agent(lar) → Gate Agent (6-pass QA) → Commit → Deploy
```

### Agent Ekibi

| Agent                          | Alan                                | Context Seviyesi     |
|--------------------------------|-------------------------------------|----------------------|
| **BA** (Business Analyst)      | Planlama, onay, yönlendirme, ROUTEMAP | FULL (~50k token)  |
| **UI** (UI/UX)                 | Tasarım, animasyon, görsel sistem   | FOCUSED (~15k)       |
| **FE** (Frontend)              | Next.js, React, TypeScript          | TASK-SPECIFIC (~10k) |
| **BE** (Backend)               | DB, API, auth, Server Actions       | TASK-SPECIFIC (~10k) |
| **GATE** (Quality)             | 6-pass kalite kontrolü, auto-fix    | REVIEW (~20k)        |
| **DP** (Deploy)                | Vercel, CI/CD, production           | MINIMAL (~5k)        |

### Gate Agent — 6-Pass Kalite Kontrolü

Her teslimat Gate Agent'tan geçer:

1. **Requirements** — Acceptance criteria karşılanmış mı?
2. **Code Compliance** — Mimari kurallar, TypeScript, naming
3. **Security** — OWASP Top 10 temel kontroller
4. **Tests** — Yeni fonksiyonlar için test, regression kontrolü
5. **Performance** — N+1 query, bundle size, Server/Client Component
6. **UI Quality** — Design token, responsive, dark/light, a11y

Sorun bulursa **otomatik düzeltir** (max 2 döngü), mimari sorunları escalate eder.

### Kullanım

```
# Tek agent
@frontend-agent.md baz alarak bu sayfayı implement et.

# Ekip olarak (BA koordinasyonuyla)
@business-analyst-agent.md kullanarak bu özelliği analiz et, sonra uygun agent'lara yönlendir.
```

---

## Enforcement Hook'ları

Kurallar kağıt üstünde kalmaz — bash hook'ları ile fiziksel olarak uygulanır:

| Hook               | Tetik                          | Ne Yapar                                   |
|--------------------|--------------------------------|--------------------------------------------|
| `gate-guard.sh`    | PreToolUse:Bash (git commit)   | Gate PASSED yoksa commit bloklar           |
| `quality-scan.sh`  | PreToolUse:Bash (git commit)   | Hardcoded secret, debug kodu, .env tarar   |
| `routemap-sync.sh` | PostToolUse:Edit/Write         | ROUTEMAP güncelleme hatırlatıcısı          |

Hook'lar `.claude/settings.local.json` dosyasında Claude Code'a entegre.

---

## Skill Komutları

| Komut              | Ne Yapar                                               | Dosya                         |
|--------------------|---------------------------------------------------------|-------------------------------|
| `/check`           | Build, type, lint, security, design token kontrolü      | `.claude/commands/check.md`   |
| `/review-ui`       | UI/UX inceleme (token, responsive, a11y, dark mode)     | `.claude/commands/review-ui.md` |
| `/deploy`          | Vercel deployment checklist                             | `.claude/commands/deploy.md`  |
| `/snippet [tip]`   | Hazır bileşen üretimi (10 tip)                          | `.claude/commands/snippet.md` |
| `/theme [proje]`   | Görsel tema uygulama                                    | `.claude/commands/theme.md`   |
| `/new-project [ad]`| Yeni proje sihirbazı                                    | `.claude/commands/new-project.md` |
| `/release [seviye]`| Versiyon + changelog + git tag                          | `.claude/commands/release.md` |
| `/clone-website <url>` | Pixel-perfect site klonlama (Browser MCP gerekli)  | `.claude/skills/clone-website/SKILL.md` |

### `/clone-website <url>`

Herhangi bir websiteyi pixel-perfect Next.js + shadcn/ui + Tailwind v4 klonu olarak yeniden inşa eder. Browser MCP aracılığıyla siteyi tarar, CSS değerlerini `getComputedStyle()` ile çıkarır, asset'leri indirir ve paralel builder agent'larla her section'ı ayrı worktree'de inşa eder.

**5 fazlı pipeline:**
1. **Reconnaissance** — Screenshot, font, renk, animasyon ve interaction analizi
2. **Foundation** — Global token'lar, font, favicon, SVG icon, asset indirme
3. **Component Spec & Build** — Her section için `docs/research/components/` altında detaylı spec yazıp paralel agent dispatch
4. **Assembly** — Tüm component'leri `page.tsx`'te birleştirme
5. **Visual QA** — Orijinalle pixel-pixel karşılaştırma ve düzeltme

**Gereksinimler:** Browser MCP tool (Chrome MCP, Playwright MCP vb.) kurulu olmalı + Next.js projesi hazır olmalı. Browser MCP olmadan site taranamaz ve CSS/asset çıkarılamaz.

```bash
/clone-website https://example.com
/clone-website https://site1.com https://site2.com   # birden fazla site
```

---

## Kurallar

| Kural                         | Özet                                                        |
|-------------------------------|-------------------------------------------------------------|
| `immutable-architecture.md`   | Server-first, performance, DB migration, state, auth        |
| `design-tokens.md`            | Hardcoded renk/boyut YASAK, semantic token zorunlu          |
| `commit-conventions.md`       | `feat/fix/refactor(scope): description` formatı             |
| `bugfix-protocol.md`          | TDD: failing test → fix → green → regression → document    |
| `dev-cycle.md`                | Plan → Dev → Gate → Commit → Review pipeline               |
| `routemap-discipline.md`      | ROUTEMAP tek kaynak, session resume                         |
| `context-curation.md`         | Agent bazlı filtered context, token bütçesi                 |

---

## npm Paketleri

```bash
npm install @ahmetakyapi/theme @ahmetakyapi/ui
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

**CSS class'ları:** `.glass` · `.chip` · `.surface`

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

**`Button`** — Semantic token'lar ile (hardcoded renk yok)

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

| Varyant          | Başlangıç → Bitiş                          |
|------------------|---------------------------------------------|
| `fadeIn`         | opacity: 0 → 1                              |
| `fadeUp`         | opacity: 0, y: 24 → 0                       |
| `fadeUpLarge`    | opacity: 0, y: 40 → 0                       |
| `scaleIn`        | opacity: 0, scale: 0.95 → 1                 |
| `slideDown`      | opacity: 0, y: -8, scale: 0.98 → normal     |
| `modalBackdrop`  | opacity: 0 → 1                              |
| `modalPanel`     | opacity: 0, scale: 0.96, y: -16 → normal    |

```tsx
<motion.ul variants={staggerContainer(0.08)} initial="hidden" whileInView="visible">
  <motion.li variants={fadeUp} />
</motion.ul>
```

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
  layout/Header.tsx     Sticky glass + tema toggle + mobil menü
  layout/Footer.tsx
  ui/GlassCard.tsx      3D tilt + holografik shine
  ui/Button.tsx         primary · ghost · outline + magnetic
  ui/Chip.tsx           Pill badge + renkli nokta
  CustomCursor.tsx
hooks/useSpotlight.ts
hooks/useMagnetic.ts
lib/db.ts               neon() + drizzle(sql, { schema })
lib/schema.ts           users tablosu + tip çıkarımı
lib/api.ts              ok<T>() · err()
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
  Hero.tsx              Spotlight + magnetic CTA + dashboard mockup
  Features.tsx          6 kart 3D tilt + holografik shine
  HowItWorks.tsx        Adım adım görsel akış
  Metrics.tsx           Animasyonlu istatistik kartları
  Pricing.tsx           3 tier (Free · Pro · Enterprise)
  Testimonials.tsx      3 kart, yıldız, avatar
  CTA.tsx               Glass panel + gradient glow
components/
  SceneBackground.tsx   Three.js, 800 parçacık, indigo, SSR:false
  ui/GlassCard · Button · Chip
```

---

## Bilgi Tabanı

### `knowledge/mistakes.md` — 41 hata

| #  | Hata                                          | Çözüm                                             |
|----|-----------------------------------------------|----------------------------------------------------|
| 1  | next-themes hydration mismatch                | `<html suppressHydrationWarning>` + mounted guard  |
| 2  | Three.js SSR çakışması                        | `dynamic(..., { ssr: false })`                     |
| 5  | Vercel'de `pg` timeout                        | `@neondatabase/serverless`                         |
| 10 | Server Component'te Framer Motion             | `'use client'` direktifi                           |
| 17 | Tailwind v4'te `tailwind.config.ts`           | `globals.css` `@theme {}` bloğu                    |
| 25 | Migration dosyasını düzenleme                 | Immutable — her zaman yeni dosya                   |
| 26 | Hardcoded renk                                | CSS variable veya Tailwind token                   |
| 28 | `postcss.config.js` eksik                     | Tailwind utility'leri işlenmez                     |
| 33 | Nested Server Component async context         | Veriyi prop olarak geç veya ayrı fetch yap         |
| 34 | Drizzle migration rollback yokluğu            | Manuel rollback SQL'i hazırla                      |
| 35 | Vercel Edge Function limitleri                | 128KB bundle, 30s timeout, sınırlı API             |
| 36 | Framer Motion bundle size şişmesi             | LazyMotion + `m` component kullan                  |
| 37 | npm workspace dependency conflict             | `.npmrc` legacy-peer-deps + root dependencies      |

### `knowledge/patterns.md` — 15+ desen

Auth · Database (Drizzle+Neon) · API helpers · Error handling · Form submission (React 19) · Middleware auth · Pagination · File upload · Image optimization · next-themes · Three.js dynamic · Framer Motion · SEO · UI tasarım desenleri (bento grid, tilt card, marquee, spotlight, glow orbs)

### `knowledge/themes/` — 5 proje görsel hafızası (DESIGN.md 9-section formatı)

Tüm tema dosyaları [Google Stitch DESIGN.md](https://github.com/nicholasgriffintn/awesome-design-md) 9-section formatında yazılmıştır. AI agent'ları bu dosyaları okuyarak pixel-perfect UI üretebilir.

**9 Section:** Visual Theme & Atmosphere · Color Palette & Roles · Typography Rules · Component Stylings · Layout Principles · Depth & Elevation · Do's and Don'ts · Responsive Behavior · Agent Prompt Guide

| Proje             | Dark BG    | Font                 | Vurgu                       | Tema Sistemi          |
|-------------------|------------|----------------------|-----------------------------|-----------------------|
| ahmetakyapi.com   | `#04070d`  | Manrope + IBM Plex   | Indigo · Cyan · Emerald     | next-themes class     |
| Mimio             | `#04070d`  | Plus Jakarta Sans    | Indigo                      | custom data-theme     |
| DigyNotes         | `#0a0f1e`  | Avenir Next          | Emerald                     | html.light class      |
| Keskealsaydım     | HSL        | Space Grotesk        | Emerald · Cyan              | shadcn HSL vars       |
| Ramazan Vakitleri | `#1a1a2e`  | System               | Lavender · Pembe · Mavi     | Dark only, vanilla CSS |

Yeni tema oluşturmak için: `templates/docs/DESIGN.template.md`

---

## Snippets

`snippets/` dizininde her projede tekrarlanan 10 hazır bileşen:

| Dosya                  | Ne Yapar                                                             |
|------------------------|----------------------------------------------------------------------|
| `animated-number.tsx`  | `useSpring` ile sayı animasyonu                                      |
| `infinite-scroll.tsx`  | `IntersectionObserver` tabanlı sonsuz liste                          |
| `og-image.tsx`         | `@vercel/og` ile dinamik OpenGraph görseli                           |
| `search-bar.tsx`       | Debounced arama, URL search param senkronizasyonu                    |
| `modal.tsx`            | AnimatePresence + backdrop blur dialog                               |
| `drawer.tsx`           | Yandan açılan panel (sol/sağ)                                        |
| `form.tsx`             | React 19 useActionState + Zod validasyon                             |
| `skeleton.tsx`         | Shimmer animasyonlu loading state (card, list, avatar, table)        |
| `toast.tsx`            | Context + AnimatePresence bildirim sistemi (success/error/warning/info) |
| `confirm.tsx`          | Tehlikeli işlem onay dialog'u (danger/warning/default)               |

---

## Ecosystem Health Check

```bash
bash scripts/health-check.sh
```

11 kategori, 51 kontrol noktası:
Agent dosyaları · Kurallar · Fazlar · Hook'lar · Snippet'ler · Template'ler · Knowledge base · Paket tutarlılığı · Design token ihlalleri · CI/CD · Temel dosyalar

---

## Ekosistemi Güncelleme

```
Yeni hata          →  knowledge/mistakes.md
Yeni proje         →  knowledge/themes/[proje].md
Yeni desen         →  knowledge/patterns.md
Yeni mimari karar  →  knowledge/decisions.md
Yeni bileşen       →  packages/@ahmet/ui/src/components/ → /release
Yeni snippet       →  snippets/[isim].tsx
Yeni skill         →  .claude/commands/[skill-adı].md
Yeni kural         →  rules/[kural-adı].md + AGENT_PROTOCOL.md
Yeni hook          →  hooks/[hook].sh + .claude/settings.local.json
Yeni agent         →  agents/[agent]-agent.md + AGENT_PROTOCOL.md
```

Detaylı rehber: `CONTRIBUTING.md`

---

*Ahmet Akyapı · [ahmetakyapi.com](https://ahmetakyapi.com) · [@ahmetakyapi](https://github.com/ahmetakyapi)*
