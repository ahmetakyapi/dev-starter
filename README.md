# dev-starter

> Ahmet Akyapi'nin kisisel AI destekli gelistirme ekosistemi.
> Proje sablonlari · npm paketleri · Agent sistemi · Kalite enforsmani · Claude Code skill'leri

[![npm](https://img.shields.io/npm/v/@ahmetakyapi/theme?label=%40ahmetakyapi%2Ftheme&color=6366f1)](https://www.npmjs.com/package/@ahmetakyapi/theme)
[![npm](https://img.shields.io/npm/v/@ahmetakyapi/ui?label=%40ahmetakyapi%2Fui&color=6366f1)](https://www.npmjs.com/package/@ahmetakyapi/ui)

---

## Yapi

```
dev-starter/
├── packages/@ahmet/
│   ├── theme/           Design token'lar, CSS degiskenleri, Tailwind preset
│   └── ui/              GlassCard · Button · Chip · Cursor · hooks · variants
│
├── agents/              7 agent dosyasi + haberlesme protokolu
│   ├── AGENT_PROTOCOL.md    Akis, context curation, hook'lar, lifecycle
│   ├── business-analyst-agent.md   Planlama, onay, yonlendirme
│   ├── uiux-agent.md       Tasarim & animasyon kararlari
│   ├── frontend-agent.md   Next.js & React implementasyon
│   ├── backend-agent.md    DB, API, auth
│   ├── gate-agent.md       6-pass kalite kontrolu, auto-fix
│   └── deploy-agent.md     Vercel deployment & release
│
├── rules/               7 kural dosyasi
│   ├── immutable-architecture.md   10 kirilamaz mimari kural
│   ├── design-tokens.md            Hardcoded deger yasagi
│   ├── commit-conventions.md       Conventional commit standardi
│   ├── bugfix-protocol.md          TDD bugfix akisi
│   ├── dev-cycle.md                Plan → Dev → Gate → Commit → Review
│   ├── routemap-discipline.md      ROUTEMAP tek kaynak prensibi
│   └── context-curation.md         Agent bazli context seviyeleri
│
├── phases/              Proje yasam dongusu
│   ├── planning.md          P1→P6: Discovery → Stories → Readiness
│   ├── e2e-polish.md        E0→E5: Seed → Smoke → Perf → Acceptance
│   └── release-maintenance.md   Release checklist, maintenance triage
│
├── hooks/               Enforcement hook'lari (Claude Code entegre)
│   ├── gate-guard.sh        Commit oncesi Gate PASSED kontrolu
│   ├── quality-scan.sh      Secret, debug kodu, design token taramasi
│   └── routemap-sync.sh     ROUTEMAP guncelleme hatirlaticisi
│
├── knowledge/
│   ├── themes/              Her projenin gorsel hafizasi (5 proje)
│   ├── mistakes.md          37 belgelenmis hata ve cozumu
│   ├── patterns.md          15+ kopyala-yapistir kod deseni
│   └── decisions.md         Teknoloji secimlerinin gerekcesi
│
├── snippets/            10 hazir bilesen
│   ├── animated-number.tsx  Sayi animasyonu
│   ├── infinite-scroll.tsx  Sonsuz kaydirma
│   ├── og-image.tsx         Open Graph gorsel uretici
│   ├── search-bar.tsx       Debounced arama kutusu
│   ├── modal.tsx            Animasyonlu dialog
│   ├── drawer.tsx           Yandan acilan panel
│   ├── form.tsx             Server Action uyumlu form
│   ├── skeleton.tsx         Yukleme placeholder'lari
│   ├── toast.tsx            Bildirim sistemi
│   └── confirm.tsx          Onay dialog'u
│
├── templates/
│   ├── docs/                ROUTEMAP, PRODUCT, ARCHITECTURE, SCREENS sablonlari
│   ├── nextjs-fullstack/    Next.js + Drizzle + auth tam uygulama
│   └── landing/             Three.js + glassmorphism tanitim sayfasi
│
├── scripts/
│   └── health-check.sh     Ekosistem butunluk kontrolu (51 kontrol noktasi)
│
├── .claude/
│   ├── settings.local.json  Hook entegrasyonu + izinler
│   └── commands/            7 skill komutu
│
├── .github/workflows/ci.yml   Build + typecheck + lint + security + ecosystem health
├── eslint.config.js         Root ESLint yapilandirmasi
├── .prettierrc              Prettier yapilandirmasi
├── .editorconfig            IDE tutarliligi
├── CHANGELOG.md             Versiyon gecmisi
└── CONTRIBUTING.md          Katki rehberi
```

---

## Proje Yasam Dongusu

```
PLANNING (P1→P6)  →  DEVELOPMENT  →  E2E & POLISH (E0→E5)  →  RELEASE  →  MAINTENANCE
```

| Faz | Protokol | Yoneten |
|-----|----------|---------|
| Planning (P1→P6) | `phases/planning.md` | BA Agent |
| Development | `rules/dev-cycle.md` | BA → FE/BE/UI → GATE |
| E2E & Polish (E0→E5) | `phases/e2e-polish.md` | BA + GATE |
| Release & Maintenance | `phases/release-maintenance.md` | BA + DP |

---

## Agent Sistemi

6 uzman agent + 1 protokol dosyasi. BA Agent koordine eder, ilgili agent'lara is gecerir.

```
Kullanici talebi → BA Agent → Ilgili agent(lar) → Gate Agent (6-pass QA) → Commit → Deploy
```

### Agent Ekibi

| Agent | Alan | Context Seviyesi |
|-------|------|-----------------|
| **BA** (Business Analyst) | Planlama, onay, yonlendirme, ROUTEMAP | FULL (~50k token) |
| **UI** (UI/UX) | Tasarim, animasyon, gorsel sistem | FOCUSED (~15k) |
| **FE** (Frontend) | Next.js, React, TypeScript | TASK-SPECIFIC (~10k) |
| **BE** (Backend) | DB, API, auth, Server Actions | TASK-SPECIFIC (~10k) |
| **GATE** (Quality) | 6-pass kalite kontrolu, auto-fix | REVIEW (~20k) |
| **DP** (Deploy) | Vercel, CI/CD, production | MINIMAL (~5k) |

### Gate Agent — 6-Pass Kalite Kontrolu

Her teslimat Gate Agent'tan gecer:

1. **Requirements** — Acceptance criteria karsilanmis mi?
2. **Code Compliance** — Mimari kurallar, TypeScript, naming
3. **Security** — OWASP Top 10 temel kontroller
4. **Tests** — Yeni fonksiyonlar icin test, regression kontrolu
5. **Performance** — N+1 query, bundle size, Server/Client Component
6. **UI Quality** — Design token, responsive, dark/light, a11y

Sorun bulursa **otomatik duzeltir** (max 2 dongu), mimari sorunlari escalate eder.

### Kullanim

```
# Tek agent
@frontend-agent.md baz alarak bu sayfayi implement et.

# Ekip olarak (BA koordinasyonuyla)
@business-analyst-agent.md kullanarak bu ozelligi analiz et, sonra uygun agent'lara yonlendir.
```

---

## Enforcement Hook'lari

Kurallar kagit ustunde kalmaz — bash hook'lari ile fiziksel olarak uygulanir:

| Hook | Tetik | Ne Yapar |
|------|-------|----------|
| `gate-guard.sh` | PreToolUse:Bash (git commit) | Gate PASSED yoksa commit bloklar |
| `quality-scan.sh` | PreToolUse:Bash (git commit) | Hardcoded secret, debug kodu, .env tarar |
| `routemap-sync.sh` | PostToolUse:Edit/Write | ROUTEMAP guncelleme hatirlaticisi |

Hook'lar `.claude/settings.local.json` dosyasinda Claude Code'a entegre.

---

## Skill Komutlari

| Komut | Ne Yapar | Dosya |
|-------|----------|-------|
| `/check` | Build, type, lint, security, design token kontrolu | `.claude/commands/check.md` |
| `/review-ui` | UI/UX inceleme (token, responsive, a11y, dark mode) | `.claude/commands/review-ui.md` |
| `/deploy` | Vercel deployment checklist | `.claude/commands/deploy.md` |
| `/snippet [tip]` | Hazir bilesen uretimi (10 tip) | `.claude/commands/snippet.md` |
| `/theme [proje]` | Gorsel tema uygulama | `.claude/commands/theme.md` |
| `/new-project [ad]` | Yeni proje sihirbazi | `.claude/commands/new-project.md` |
| `/release [seviye]` | Versiyon + changelog + git tag | `.claude/commands/release.md` |

---

## Kurallar

| Kural | Ozet |
|-------|------|
| `immutable-architecture.md` | Server-first, performance, DB migration, state, auth |
| `design-tokens.md` | Hardcoded renk/boyut YASAK, semantic token zorunlu |
| `commit-conventions.md` | `feat/fix/refactor(scope): description` formati |
| `bugfix-protocol.md` | TDD: failing test → fix → green → regression → document |
| `dev-cycle.md` | Plan → Dev → Gate → Commit → Review pipeline |
| `routemap-discipline.md` | ROUTEMAP tek kaynak, session resume |
| `context-curation.md` | Agent bazli filtered context, token butcesi |

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
// Token'lara dogrudan erisim
import theme from '@ahmetakyapi/theme'
theme.animation.ease        // [0.22, 1, 0.36, 1]
theme.colors.bg.dark        // '#04070d'
theme.animation.spring      // snappy · bouncy · smooth · magnetic
```

**CSS class'lari:** `.glass` · `.chip` · `.surface`

---

### @ahmetakyapi/ui

```ts
// Hooks
import { useSpotlight, useMagnetic, useCardTilt } from '@ahmetakyapi/ui'

// Bilesenler
import { GlassCard, Button, Chip, CustomCursor } from '@ahmetakyapi/ui'

// Framer Motion varyantlari
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

**`useMagnetic(strength?)`** — Spring tabanli magnetic buton efekti.

```tsx
const { mx, my, onMove, onLeave } = useMagnetic(0.26)
<motion.button style={{ x: mx, y: my }} onMouseMove={onMove} onMouseLeave={onLeave} />
```

**`useCardTilt(intensity?)`** — 3D kart egimi + holografik shine.

```tsx
const { ref, rx, ry, shine } = useCardTilt(8)
<motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} />
```

#### Bilesenler

**`GlassCard`**

```tsx
<GlassCard>Basit glass kart</GlassCard>
<GlassCard tilt>3D egim + holografik shine</GlassCard>
<GlassCard glow>Sadece shine efekti</GlassCard>
```

**`Button`** — Semantic token'lar ile (hardcoded renk yok)

```tsx
<Button variant="primary" size="lg">Basla</Button>
<Button variant="ghost" magnetic>Daha Fazla</Button>
<Button variant="outline" size="sm">Iptal</Button>
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

#### Animasyon Varyantlari

| Varyant | Baslangic → Bitis |
|---------|-------------------|
| `fadeIn` | opacity: 0 → 1 |
| `fadeUp` | opacity: 0, y: 24 → 0 |
| `fadeUpLarge` | opacity: 0, y: 40 → 0 |
| `scaleIn` | opacity: 0, scale: 0.95 → 1 |
| `slideDown` | opacity: 0, y: -8, scale: 0.98 → normal |
| `modalBackdrop` | opacity: 0 → 1 |
| `modalPanel` | opacity: 0, scale: 0.96, y: -16 → normal |

```tsx
<motion.ul variants={staggerContainer(0.08)} initial="hidden" whileInView="visible">
  <motion.li variants={fadeUp} />
</motion.ul>
```

---

## Proje Sablonlari

### `nextjs-fullstack`

Next.js 14 · Drizzle ORM · Neon Postgres · next-auth v5 · Tailwind · Framer Motion

```
app/layout.tsx          ThemeProvider + suppressHydrationWarning + Manrope/IBM Plex
app/page.tsx            Spotlight hero + feature kartlari
app/globals.css         glass · chip · surface · radyal arka plan · scrollbar
app/api/health/         Edge runtime saglik endpoint'i
components/
  layout/Header.tsx     Sticky glass + tema toggle + mobil menu
  layout/Footer.tsx
  ui/GlassCard.tsx      3D tilt + holografik shine
  ui/Button.tsx         primary · ghost · outline + magnetic
  ui/Chip.tsx           Pill badge + renkli nokta
  CustomCursor.tsx
hooks/useSpotlight.ts
hooks/useMagnetic.ts
lib/db.ts               neon() + drizzle(sql, { schema })
lib/schema.ts           users tablosu + tip cikarimi
lib/api.ts              ok<T>() · err()
lib/utils.ts            cn() · formatDate() · truncate()
lib/variants.ts         EASE + tum varyantlar
```

### `landing`

Three.js particle background · Glassmorphism · Hero/Features/Pricing/Testimonials/CTA

```
app/page.tsx            SceneBackground (SSR:false) + tum section'lar
app/sitemap.ts          Otomatik sitemap.xml
app/robots.ts           robots.txt
components/sections/
  Hero.tsx              Spotlight + magnetic CTA + dashboard mockup
  Features.tsx          6 kart 3D tilt + holografik shine
  HowItWorks.tsx        Adim adim gorsel akis
  Metrics.tsx           Animasyonlu istatistik kartlari
  Pricing.tsx           3 tier (Free · Pro · Enterprise)
  Testimonials.tsx      3 kart, yildiz, avatar
  CTA.tsx               Glass panel + gradient glow
components/
  SceneBackground.tsx   Three.js, 800 parcacik, indigo, SSR:false
  ui/GlassCard · Button · Chip
```

---

## Bilgi Tabani

### `knowledge/mistakes.md` — 37 hata

| # | Hata | Cozum |
|---|------|-------|
| 1 | next-themes hydration mismatch | `<html suppressHydrationWarning>` + mounted guard |
| 2 | Three.js SSR cakismasi | `dynamic(..., { ssr: false })` |
| 5 | Vercel'de `pg` timeout | `@neondatabase/serverless` |
| 10 | Server Component'te Framer Motion | `'use client'` direktifi |
| 17 | Tailwind v4'te `tailwind.config.ts` | `globals.css` `@theme {}` blogu |
| 25 | Migration dosyasini duzenleme | Immutable — her zaman yeni dosya |
| 26 | Hardcoded renk | CSS variable veya Tailwind token |
| 28 | `postcss.config.js` eksik | Tailwind utility'leri islenmez |
| 33 | Nested Server Component async context | Veriyi prop olarak gec veya ayri fetch yap |
| 34 | Drizzle migration rollback yoklugu | Manuel rollback SQL'i hazirla |
| 35 | Vercel Edge Function limitleri | 128KB bundle, 30s timeout, sinirli API |
| 36 | Framer Motion bundle size sismesi | LazyMotion + `m` component kullan |
| 37 | npm workspace dependency conflict | `.npmrc` legacy-peer-deps + root dependencies |

### `knowledge/patterns.md` — 15+ desen

Auth · Database (Drizzle+Neon) · API helpers · Error handling · Form submission (React 19) · Middleware auth · Pagination · File upload · Image optimization · next-themes · Three.js dynamic · Framer Motion · SEO · UI tasarim desenleri (bento grid, tilt card, marquee, spotlight, glow orbs)

### `knowledge/themes/` — 5 proje gorsel hafizasi

| Proje | Dark BG | Font | Vurgu | Tema Sistemi |
|-------|---------|------|-------|--------------|
| ahmetakyapi.com | `#04070d` | Manrope + IBM Plex | Indigo · Cyan · Emerald | next-themes class |
| Mimio | `#04070d` | Plus Jakarta Sans | Indigo | custom data-theme |
| DigyNotes | `#0a0f1e` | Avenir Next | Emerald | html.light class |
| Keskealsaydim | HSL | Space Grotesk | Emerald · Cyan | shadcn HSL vars |
| Ramazan Vakitleri | `#1a1a2e` | System | Lavender · Pembe · Mavi | Dark only, vanilla CSS |

---

## Snippets

`snippets/` dizininde her projede tekrarlanan 10 hazir bilesen:

| Dosya | Ne Yapar |
|-------|----------|
| `animated-number.tsx` | `useSpring` ile sayi animasyonu |
| `infinite-scroll.tsx` | `IntersectionObserver` tabanli sonsuz liste |
| `og-image.tsx` | `@vercel/og` ile dinamik OpenGraph gorseli |
| `search-bar.tsx` | Debounced arama, URL search param senkronizasyonu |
| `modal.tsx` | AnimatePresence + backdrop blur dialog |
| `drawer.tsx` | Yandan acilan panel (sol/sag) |
| `form.tsx` | React 19 useActionState + Zod validasyon |
| `skeleton.tsx` | Shimmer animasyonlu loading state (card, list, avatar, table) |
| `toast.tsx` | Context + AnimatePresence bildirim sistemi (success/error/warning/info) |
| `confirm.tsx` | Tehlikeli islem onay dialog'u (danger/warning/default) |

---

## Ecosystem Health Check

```bash
bash scripts/health-check.sh
```

11 kategori, 51 kontrol noktasi:
Agent dosyalari · Kurallar · Fazlar · Hook'lar · Snippet'ler · Template'ler · Knowledge base · Paket tutarliligi · Design token ihlalleri · CI/CD · Temel dosyalar

---

## Ekosistemi Guncelleme

```
Yeni hata          →  knowledge/mistakes.md
Yeni proje         →  knowledge/themes/[proje].md
Yeni desen         →  knowledge/patterns.md
Yeni mimari karar  →  knowledge/decisions.md
Yeni bilesen       →  packages/@ahmet/ui/src/components/ → /release
Yeni snippet       →  snippets/[isim].tsx
Yeni skill         →  .claude/commands/[skill-adi].md
Yeni kural         →  rules/[kural-adi].md + AGENT_PROTOCOL.md
Yeni hook          →  hooks/[hook].sh + .claude/settings.local.json
Yeni agent         →  agents/[agent]-agent.md + AGENT_PROTOCOL.md
```

Detayli rehber: `CONTRIBUTING.md`

---

*Ahmet Akyapi · [ahmetakyapi.com](https://ahmetakyapi.com) · [@ahmetakyapi](https://github.com/ahmetakyapi)*
