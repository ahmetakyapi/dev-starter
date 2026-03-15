# dev-starter

Ahmet Akyapı'nın kişisel AI destekli geliştirme ekosistemi.

Yeni bir proje başlatmak için gereken her şey: proje şablonları, paylaşımlı npm paketleri, görsel hafıza, tekrar etmemek için hata günlüğü, ve Claude Code'u kendi bilgi tabanıyla yönlendiren kural seti + skill'ler.

---

## İçindekiler

1. [Neden Var?](#neden-var)
2. [Ekosistem Haritası](#ekosistem-haritası)
3. [Hızlı Başlangıç](#hızlı-başlangıç)
4. [Claude Code Skills](#claude-code-skills)
5. [Proje Şablonları](#proje-şablonları)
6. [npm Paketleri](#npm-paketleri)
7. [Ajan Dosyaları](#ajan-dosyaları)
8. [Bilgi Tabanı](#bilgi-tabanı)
9. [Yeni Proje Oluşturma — Adım Adım](#yeni-proje-oluşturma--adım-adım)
10. [Tasarım Dili](#tasarım-dili)
11. [Şablon Yer Tutucular](#şablon-yer-tutucular)
12. [Ekosistemi Güncelleme](#ekosistemi-güncelleme)

---

## Neden Var?

Her yeni projede aynı sorunlarla karşılaşıyordum:

- **Görsel tutarsızlık** — Her projede renk sistemini, glass efektlerini ve animasyon eğrilerini sıfırdan yeniden yazıyordum.
- **Tekrarlayan hatalar** — `suppressHydrationWarning`, `@neondatabase/serverless`, Three.js SSR gibi sorunları defalarca yaşıyordum.
- **Bağlam kaybı** — Claude Code her oturumda projenin görsel dilini, mimari kararlarını ve öğrenilen dersleri bilmeden başlıyordu.
- **Yavaş başlangıç** — Her projede aynı boilerplate'i, aynı layout'u, aynı bileşen sistemini kuruyordum.

Bu repo, tüm bu sorunları çözmek için var. Tek bir `/new-project` komutuyla — bilgi tabanını, görsel dili ve mimari kararları içeren — üretim kalitesinde bir proje iskeleti oluşturuluyor.

---

## Ekosistem Haritası

```
dev-starter/
│
├── templates/                   # Kopyalanmaya hazır proje şablonları
│   ├── nextjs-fullstack/        # Next.js + Drizzle ORM + auth tam uygulama
│   └── landing/                 # Three.js + glassmorphism tanıtım sayfası
│
├── packages/
│   └── @ahmet/
│       ├── theme/               # CSS değişkenleri, Tailwind preset, design tokenlar
│       └── ui/                  # GlassCard, Button, Chip, Cursor + hooks + variants
│
├── knowledge/
│   ├── themes/                  # Her projenin görsel hafızası
│   │   ├── ahmetakyapi.md       # Ana referans: glassmorphism, koyu tema, spotlight
│   │   ├── mimio.md             # Tailwind v4, custom ThemeProvider, data-theme
│   │   ├── digynotes.md         # Emerald vurgu, Aurora animasyonları, Quill editor
│   │   ├── keskealsaydim.md     # Go backend, shadcn HSL, finance UI, Recharts
│   │   └── ramazan-vakitleri.md # Midnight navy, lavender+pembe gradyan, vanilla CSS
│   ├── mistakes.md              # 27 hata ve çözümü — "bir daha yaşama" günlüğü
│   └── patterns.md              # Kopyala-yapıştır kod desenleri (auth, DB, SEO, UI)
│
├── agents/
│   ├── uiux-agent.md            # Tasarım & animasyon kararları için agent tanımı
│   ├── frontend-agent.md        # Next.js & React implementasyonu için agent tanımı
│   ├── backend-agent.md         # DB, API, auth için agent tanımı
│   └── deploy-agent.md          # Vercel deployment için agent tanımı
│
├── CLAUDE.md                    # Bu repo için Claude Code kuralları
└── package.json                 # npm workspace root
```

**Claude Code Skills** (ayrı repo: `~/.claude/commands/`):
```
new-project.md    /new-project   → Şablon seç, kopyala, placeholder'ları doldur
theme.md          /theme         → Görsel tema analiz et ve uygula
deploy.md         /deploy        → Vercel pre/post deploy checklist
review-ui.md      /review-ui     → UI/UX kod incelemesi
snippet.md        /snippet       → Modal, form, drawer gibi bileşen üret
```

---

## Hızlı Başlangıç

### Yeni Proje

```bash
# Claude Code'da herhangi bir projeden
/new-project benim-yeni-uygulamam
```

Claude sizi yönlendirir:
1. **Proje tipi** — `fullstack` (Next.js + DB + auth) veya `landing` (Three.js tanıtım sayfası)
2. **Görsel tema** — `ahmetakyapi`, `digynotes`, `mimio`, veya `minimal`
3. **Auth gerekli mi?**
4. **Veritabanı gerekli mi?**

Seçimlere göre ilgili şablon kopyalanır ve tüm placeholder'lar gerçek değerlerle değiştirilir.

### Mevcut Projede Tema Uygula

```bash
/theme ahmetakyapi    # glassmorphism, koyu tema, spotlight efekti
/theme digynotes      # emerald vurgu, aurora animasyonları
/theme mimio          # Tailwind v4, indigo odaklı, açık/koyu sistem
/theme                # mevcut projeyi analiz edip uygun temayı öner
```

### Deploy

```bash
/deploy    # Vercel pre-deploy 9 maddelik checklist + post-deploy kontrol
```

### UI İnceleme

```bash
/review-ui components/layout/Header.tsx    # tek dosya
/review-ui components/                      # dizin
```

### Hızlı Bileşen Üret

```bash
/snippet modal      # AnimatePresence modal
/snippet drawer     # Yan panel / drawer
/snippet form       # Zod validasyonlu form
/snippet skeleton   # Loading skeleton
/snippet toast      # Sonner bildirim kurulumu
/snippet confirm    # Onay dialog kutusu
```

---

## Claude Code Skills

Skills, `~/.claude/commands/` dizininde tutulan Markdown dosyalarıdır. Claude Code'da `/` prefix'iyle çağrılır. Her skill, Claude'un ne yapması gerektiğini adım adım tanımlar ve bu ekosisteme özgü bilgi tabanını okuyarak çalışır.

### `/new-project [proje-adı]`

**Dosya**: `~/.claude/commands/new-project.md`

Yeni proje başlatma sihirbazı. Yapılanlar:

1. Kullanıcıya proje tipi, tema, auth ve DB tercihlerini sorar
2. `~/dev-starter/knowledge/mistakes.md` okur — bilinen hatalar zihinleştirilir
3. Seçilen temaya göre `~/dev-starter/knowledge/themes/[tema].md` okur
4. Uygun şablonu (`nextjs-fullstack` veya `landing`) hedef dizine kopyalar
5. `find ... -exec sed -i ''` ile tüm placeholder'ları değiştirir
6. Proje `CLAUDE.md`'sini proje bilgileriyle doldurur
7. Sıradaki adımı önerir: `/theme [tema]`

**Desteklenen placeholder'lar (landing şablonu için)**:
```
PROJECT_NAME          → Proje adı
PROJECT_DESCRIPTION   → Proje açıklaması
HERO_TITLE_LINE1      → Hero başlık (1. satır)
HERO_TITLE_LINE2      → Hero başlık (2. satır, gradient)
HERO_SUBTITLE         → Hero alt başlık
CTA_LINK              → Ana CTA butonu linki
CTA_PRIMARY           → Header CTA butonu metni
CTA_TITLE             → CTA section başlığı
CTA_SUBTITLE          → CTA section alt başlığı
CTA_BUTTON            → CTA section buton metni
PRICING_BADGE         → Pricing section rozeti
PRICING_TITLE         → Pricing başlığı
PRICING_SUBTITLE      → Pricing alt başlığı
PLAN_FREE_*           → Ücretsiz plan bilgileri
PLAN_PRO_*            → Pro plan bilgileri
PLAN_ENT_*            → Enterprise plan bilgileri
```

---

### `/theme [tema-adı]`

**Dosya**: `~/.claude/commands/theme.md`

Mevcut projenin görsel temasını analiz eder ve belirtilen tema standartlarına getirir.

**Kontrol ettiği dosyalar**:
- `app/globals.css` — CSS değişkenleri, glass/chip/surface class'ları
- `tailwind.config.ts` — `darkMode: 'class'`, font değişkenleri, preset
- `app/layout.tsx` — `suppressHydrationWarning`, ThemeProvider, font import'ları
- `components/` — hardcoded renk, eksik dark mode class'ları, glass tutarsızlıkları

**Çıktı formatı**:
```
✓ globals.css — @ahmet/theme import eklendi
✓ tailwind.config.ts — preset güncellendi
✓ layout.tsx — suppressHydrationWarning eklendi
⚠ Header.tsx — glass class eksik
```

---

### `/deploy`

**Dosya**: `~/.claude/commands/deploy.md`

Vercel'e deploy öncesi 9 maddelik kontrol listesi:

1. `npm run build` — build hatası yoksa devam et
2. `.env.example` okuyarak tüm env var'ları Vercel dashboard'da kontrol et
3. `npm run lint` — lint hataları çözülmeli
4. `~/dev-starter/knowledge/mistakes.md`'den kritik kontroller
   - `<html suppressHydrationWarning>` var mı?
   - Three.js bileşenleri `dynamic(..., { ssr: false })` ile mi?
   - `console.log` kaldırıldı mı?
   - `@neondatabase/serverless` kullanıldı mı?
5. `vercel.json` kontrolü / standart konfigürasyon önerisi
6. DB migration — `npx drizzle-kit push` production DB'ye uygulandı mı?
7. Custom domain ve SSL kontrolü
8. `vercel --prod` ile deploy
9. Post-deploy: ana sayfa, dark/light mode, auth akışı, DB bağlantısı

---

### `/review-ui [dosya-veya-dizin]`

**Dosya**: `~/.claude/commands/review-ui.md`

6 kritere göre UI/UX incelemesi:

1. **Tema tutarlılığı** — hardcoded renk var mı, glass efektleri tutarlı mı
2. **Animasyon kalitesi** — ease eğrisi `[0.22, 1, 0.36, 1]` mü, AnimatePresence doğru mu
3. **Erişilebilirlik** — aria-label, semantic HTML, renk kontrastı
4. **Performans** — gereksiz re-render, lazy load, next/image
5. **Responsive** — mobile breakpoint'ler, touch device cursor, flex/grid bozulmaları
6. **Kod kalitesi** — gereksiz `'use client'`, prop tiplemeleri, magic number

Sorunları doğrudan düzeltir, raporu gösterir.

---

### `/snippet [tip]`

**Dosya**: `~/.claude/commands/snippet.md`

Proje bağlamını okuyarak (mevcut `variants.ts`, `components/ui/`, `globals.css`) doğru import'larla hazır bileşen üretir.

| Komut | Üretilen Bileşen |
|---|---|
| `/snippet modal` | AnimatePresence modal, backdrop tıklamayla kapatma, X butonu |
| `/snippet drawer` | Sol/sağ yan panel, spring animasyonu, backdrop |
| `/snippet form` | Zod şeması, client-side validasyon, hata gösterimi |
| `/snippet skeleton` | `animate-pulse` yükleme iskeleti |
| `/snippet toast` | Sonner kurulumu + `toast.success/error/promise` kullanımı |
| `/snippet confirm` | Onay diyalog, `danger` prop'u (kırmızı/indigo varyant) |

---

## Proje Şablonları

### `templates/nextjs-fullstack/`

Next.js 14 App Router + Drizzle ORM + Neon Postgres + next-auth v5 tam uygulama şablonu.

**Bağımlılıklar**:
```json
{
  "next": "14",
  "framer-motion": "^11",
  "@neondatabase/serverless": "^0.9",
  "drizzle-orm": "^0.30",
  "next-auth": "^5",
  "next-themes": "^0.3",
  "lucide-react": "^0.400",
  "clsx": "^2",
  "tailwind-merge": "^2"
}
```

**Dizin yapısı**:
```
nextjs-fullstack/
├── app/
│   ├── layout.tsx           Manrope+IBM Plex Mono, ThemeProvider, suppressHydrationWarning
│   ├── page.tsx             Spotlight hero + stagger badge/başlık/CTA + feature kartları
│   ├── globals.css          Tam tema CSS — glass, chip, surface, radyal arka plan,
│   │                        animasyonlar, scrollbar, cursor media query, mobile fix
│   └── api/
│       └── health/route.ts  { status: 'ok', timestamp } — deploy sağlık kontrolü
├── components/
│   ├── layout/
│   │   ├── Header.tsx       Sticky glass scroll'da, tema toggle, mounted guard,
│   │   │                    mobil menü AnimatePresence ile
│   │   └── Footer.tsx       Minimal
│   ├── ui/
│   │   ├── GlassCard.tsx    glass class + opsiyonel 3D tilt + holografik shine
│   │   ├── Chip.tsx         Pill badge, opsiyonel renkli nokta
│   │   └── Button.tsx       primary/ghost/outline variant + opsiyonel magnetic efekt
│   └── CustomCursor.tsx     Nokta (direkt) + halka (spring), pointer:coarse gizli
├── hooks/
│   ├── useSpotlight.ts      window mousemove → radial gradient spotlight
│   └── useMagnetic.ts       useSpring ile magnetic buton, strength parametresi
├── lib/
│   ├── db.ts                neon() + drizzle(sql, { schema })
│   ├── schema.ts            users tablosu (uuid PK, email unique, role, timestamps)
│   ├── api.ts               ok<T>(), err(), serverErr() response helper'ları
│   ├── utils.ts             cn() (clsx+twMerge), formatDate(), truncate()
│   └── variants.ts          EASE + fadeIn/Up/Left, scaleIn, staggerContainer,
│                             slideDown, modalBackdrop, modalPanel
├── tailwind.config.ts       grid-dark/light, font değişkenleri, animasyonlar
├── drizzle.config.ts        DATABASE_URL, schema path, migrations dizini
├── .env.example             DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_*
├── .gitignore
└── CLAUDE.md                Proje kuralları şablonu
```

---

### `templates/landing/`

Next.js 14 + Three.js particle background + glassmorphism tanıtım sayfası şablonu. DB veya auth gerektirmez.

**Ek bağımlılıklar** (fullstack'e ek olarak):
```json
{
  "@react-three/fiber": "^8",
  "@react-three/drei": "^9",
  "three": "^0.165"
}
```

**Dizin yapısı**:
```
landing/
├── app/
│   ├── layout.tsx           OpenGraph + Twitter metadata dahil
│   ├── page.tsx             SceneBackground (dynamic SSR:false) + tüm section'lar
│   │                        Pricing ve Testimonials varsayılan kapalı, yorum satırı
│   ├── globals.css          Aynı + .text-gradient, .text-gradient-warm, shimmer
│   ├── sitemap.ts           NEXT_PUBLIC_APP_URL otomatik sitemap.xml
│   ├── robots.ts            robots.txt + sitemap yönlendirme
│   └── api/health/route.ts  Edge runtime sağlık endpoint'i
├── components/
│   ├── sections/
│   │   ├── Hero.tsx         Spotlight + magnetic CTA + grid overlay + scroll indicator
│   │   ├── Features.tsx     6 kart, her biri 3D tilt + holografik shine inline
│   │   ├── Pricing.tsx      3 tier (Free/Pro/Enterprise), highlight kart ring efekti
│   │   │                    Tüm veriler PLAN_* placeholder ile dolu
│   │   ├── Testimonials.tsx 3 kart, yıldız, isim/rol, avatar initials
│   │   └── CTA.tsx          Glass panel, gradient glow, CTA_* placeholder'lı
│   ├── ui/                  GlassCard, Button, Chip (fullstack ile aynı)
│   ├── SceneBackground.tsx  Three.js Canvas, 800 parçacık, y+x ekseninde dönüş
│   ├── layout/
│   │   ├── Header.tsx       Fullstack ile aynı + nav CTA butonu
│   │   └── Footer.tsx       GitHub/social icon linkleri
│   └── CustomCursor.tsx     Fullstack ile aynı
├── hooks/                   useSpotlight, useMagnetic (aynı)
├── lib/                     variants.ts, utils.ts (db yok — sadece utils)
├── tailwind.config.ts       shimmer keyframe ek
├── .env.example             Sadece NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_APP_NAME
└── CLAUDE.md                Three.js SSR kuralı ve landing karar notları
```

**Sayfa akışı**:
```
Header (sticky glass)
└── Hero           → Spotlight arka plan, gradient başlık, magnetic CTA, grid overlay
└── Features       → 6 kart 3D tilt, ikon + başlık + açıklama
└── [Pricing]      → Yorumdan çıkarılabilir, 3 tier
└── [Testimonials] → Yorumdan çıkarılabilir, 3 kart
└── CTA            → Glass panel, son eylem daveti
Footer
CustomCursor (desktop only)
SceneBackground (Three.js, SSR:false, z-0)
```

---

## npm Paketleri

### `packages/@ahmet/theme`

Tüm projeler için ortak design token'ları, CSS değişkenleri ve Tailwind preset'i.

**Kullanım**:
```ts
// tailwind.config.ts
import preset from '@ahmet/theme/tailwind'
export default { presets: [preset], content: [...], darkMode: 'class' }
```

```css
/* globals.css */
@import '@ahmet/theme/css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ts
// TypeScript'te token'lara doğrudan erişim
import theme from '@ahmet/theme/tokens'
console.log(theme.animation.ease)  // [0.22, 1, 0.36, 1]
```

**`tokens.ts` içeriği**:

| Kategori | Değerler |
|---|---|
| `colors.bg` | `dark: '#04070d'`, `light: '#f5f7fb'` |
| `colors.accent` | indigo, cyan, emerald, blue, sky (DEFAULT + soft + glow) |
| `colors.glass` | dark/light overlay, chip, inset highlight |
| `fonts` | Manrope (sans), IBM Plex Mono (mono), Google Fonts URL |
| `spacing` | container maxWidth/px, section py |
| `radii` | card (1rem), pill (999px), logo (1rem) |
| `shadows` | card, cardLight, logo, logoHover, glow.indigo, glow.cyan |
| `animation.ease` | `[0.22, 1, 0.36, 1]` |
| `animation.spring` | snappy, bouncy, smooth, magnetic |
| `animation.stagger` | fast (0.07), normal (0.12), slow (0.2) |
| `gradients` | pageDark, pageLight, logo, gridDark, gridLight |

**`index.css` class'ları**:

```css
.glass        /* backdrop-blur-xl + rgba overlay + inset highlight */
.glass-lg     /* daha güçlü blur */
.chip         /* pill badge — glass arka plan, küçük padding */
.surface      /* input/textarea arka planı */
```

**`tailwind-preset.ts`** — Tailwind konfigürasyonuna şunları ekler:
- `fontFamily.sans`, `fontFamily.mono` — CSS değişken tabanlı
- `colors.brand.*` — indigo, cyan, emerald
- `backgroundImage.grid-dark`, `grid-light`
- `animation.float`, `pulse-slow`, `spin-slow`, `blink`

---

### `packages/@ahmet/ui`

Hooks, animasyon varyantları ve glassmorphism bileşen kütüphanesi.

**Kurulum**:
```bash
npm install @ahmet/ui
```

**Tüm export'lar**:
```ts
// Hooks
import { useSpotlight, useMagnetic, useCardTilt } from '@ahmet/ui'

// Bileşenler
import { GlassCard, Button, Chip, CustomCursor } from '@ahmet/ui'

// Framer Motion varyantları
import { fadeIn, fadeUp, fadeUpLarge, fadeLeft, scaleIn,
         staggerContainer, slideDown, modalBackdrop, modalPanel,
         EASE } from '@ahmet/ui'

// Utility
import { cn } from '@ahmet/ui'
```

---

#### `useSpotlight(radius?, color?)`

Mouse pozisyonunu takip eden radial gradient spotlight. Hero veya sayfa arka planına uygulanır.

```tsx
import { useSpotlight } from '@ahmet/ui'
import { motion } from 'framer-motion'

function HeroSection() {
  const spotlight = useSpotlight(620, 'rgba(96,165,250,0.07)')
  return (
    <motion.section style={{ background: spotlight }}>
      {/* içerik */}
    </motion.section>
  )
}
```

| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `radius` | `620` | Gradient yarıçapı (px) |
| `color` | `rgba(96,165,250,0.07)` | Spotlight rengi |

---

#### `useMagnetic(strength?)`

İmleç yaklaştığında elementi çeken spring animasyonu.

```tsx
import { useMagnetic } from '@ahmet/ui'
import { motion } from 'framer-motion'

function MagneticButton() {
  const { mx, my, onMove, onLeave } = useMagnetic(0.26)
  return (
    <motion.button
      style={{ x: mx, y: my }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      Tıkla
    </motion.button>
  )
}
```

| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `strength` | `0.26` | Çekim kuvveti (0–1 arası) |

Spring sabitleri: `stiffness: 160, damping: 18`

---

#### `useCardTilt(intensity?, springConfig?)`

3D kart eğimi + holografik shine efekti.

```tsx
import { useCardTilt } from '@ahmet/ui'
import { motion } from 'framer-motion'

function ProjectCard() {
  const { ref, rx, ry, shine } = useCardTilt(8)
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
    >
      <motion.div style={{ background: shine }} className="absolute inset-0 z-10" />
      {/* kart içeriği */}
    </motion.div>
  )
}
```

| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `intensity` | `8` | Eğim açısı (derece) |
| `springConfig` | `{ stiffness: 300, damping: 30 }` | Spring konfigürasyonu |

---

#### `GlassCard`

Glassmorphism kart bileşeni. `tilt` veya `glow` prop'larıyla 3D efekt eklenebilir.

```tsx
import { GlassCard } from '@ahmet/ui'

// Basit glass kart
<GlassCard className="p-6">
  İçerik
</GlassCard>

// 3D tilt + holografik shine
<GlassCard tilt className="p-6">
  Proje kartı
</GlassCard>

// Sadece holografik shine (tilt yok)
<GlassCard glow className="p-6">
  Highlight kart
</GlassCard>
```

| Prop | Tip | Varsayılan | Açıklama |
|---|---|---|---|
| `tilt` | `boolean` | `false` | 3D eğim + shine efekti |
| `glow` | `boolean` | `false` | Sadece holografik shine |
| `className` | `string` | — | Ek Tailwind class'ları |

---

#### `Button`

Primary, ghost ve outline varyantları. `magnetic` prop'u ile magnetic efekt.

```tsx
import { Button } from '@ahmet/ui'

<Button variant="primary" size="lg">Başla</Button>
<Button variant="ghost" magnetic>Daha Fazla</Button>
<Button variant="outline" size="sm">İptal</Button>
```

| Prop | Değerler | Varsayılan |
|---|---|---|
| `variant` | `'primary' \| 'ghost' \| 'outline'` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `magnetic` | `boolean` | `false` |

---

#### `Chip`

Pill/badge bileşeni. `dot` prop'u ile renkli durum noktası eklenebilir.

```tsx
import { Chip } from '@ahmet/ui'

<Chip>Yeni</Chip>
<Chip dot="bg-emerald-400">Aktif</Chip>
<Chip dot="bg-amber-400">Beta</Chip>
<Chip dot="bg-red-400">Kapalı</Chip>
```

---

#### `CustomCursor`

Desktop'a özel özel imleç — küçük nokta + yaylı halka. Touch cihazlarda otomatik gizlenir.

```tsx
import { CustomCursor } from '@ahmet/ui'

// app/layout.tsx veya page.tsx'e bir kez ekle
<CustomCursor />
```

**Davranış**:
- `pointer: coarse` (touch) → hiç render edilmez
- Hover (`a`, `button`, `[role="button"]`) → halka genişler (32 → 40px)
- Mouse down → hem nokta hem halka küçülür
- Sayfa dışına çıkınca → gizlenir

---

#### Framer Motion Varyantları

```ts
import { fadeIn, fadeUp, fadeUpLarge, fadeLeft, scaleIn,
         staggerContainer, slideDown, modalBackdrop, modalPanel,
         EASE } from '@ahmet/ui'

// EASE = [0.22, 1, 0.36, 1]

// Stagger liste örneği
<motion.ul
  variants={staggerContainer(0.08)}  // 0.08s gecikme arası
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
>
  {items.map(item => (
    <motion.li key={item.id} variants={fadeUp}>{item.name}</motion.li>
  ))}
</motion.ul>

// Modal örneği
<AnimatePresence>
  {open && (
    <motion.div variants={modalBackdrop} initial="hidden" animate="visible" exit="exit">
      <motion.div variants={modalPanel}>...</motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

| Varyant | Başlangıç | Bitiş |
|---|---|---|
| `fadeIn` | opacity: 0 | opacity: 1 |
| `fadeUp` | opacity: 0, y: 24 | opacity: 1, y: 0 |
| `fadeUpLarge` | opacity: 0, y: 40 | opacity: 1, y: 0 |
| `fadeLeft` | opacity: 0, x: -20 | opacity: 1, x: 0 |
| `scaleIn` | opacity: 0, scale: 0.95 | opacity: 1, scale: 1 |
| `slideDown` | opacity: 0, y: -8, scale: 0.98 | opacity: 1, y: 0, scale: 1 |
| `modalBackdrop` | opacity: 0 | opacity: 1 |
| `modalPanel` | opacity: 0, scale: 0.96, y: -16 | opacity: 1, scale: 1, y: 0 |

---

## Ajan Dosyaları

`agents/` dizinindeki `.md` dosyaları, belirli görevler için Claude Code'a sistem bağlamı sağlar. Doğrudan çağrılmazlar — Claude Code'a bu dosyaları okuyarak ilgili alanda çalışması söylenir.

### `uiux-agent.md`

**Ne zaman kullanılır**: Yeni UI bileşeni tasarlarken, animasyon yazarken, dark/light mode implementasyonunda.

**Çalışmadan önce okur**: `knowledge/themes/ahmetakyapi.md`, `knowledge/mistakes.md`

**Karar çerçevesi**:
1. Hareket (ease `[0.22, 1, 0.36, 1]`)
2. Cam (glass efekti şeffaflığı)
3. Işık (spotlight/glow konumu)
4. Tipografi (Manrope/IBM Plex Mono hiyerarşi)
5. Boşluk (nefes alanı)
6. Koyu/Açık (her iki modda)

---

### `frontend-agent.md`

**Ne zaman kullanılır**: Next.js sayfa/layout yazarken, Server/Client Component kararında, API entegrasyonunda.

**Çalışmadan önce okur**: `knowledge/mistakes.md`, `knowledge/patterns.md`, projenin `CLAUDE.md`'si

**Temel kural — Server vs Client**:
```
Varsayılan: Server Component
Client gerekiyor mu? → useState / useEffect / event handler / browser API / Framer Motion
→ Hayır → Server Component bırak
→ Evet  → 'use client' ekle, mümkün olan en alt seviyede tut
```

---

### `backend-agent.md`

**Ne zaman kullanılır**: Drizzle schema yazarken, API route'u oluştururken, auth konfigürasyonunda, Zod validasyonunda.

**Zorunlu kurallar**:
- `@neondatabase/serverless` — Vercel serverless ortamı için (`pg` değil)
- Her foreign key'de `ON DELETE` davranışı zorunlu
- Migration immutability — var olan migration dosyası değiştirilmez, yeni dosya oluşturulur

---

### `deploy-agent.md`

**Ne zaman kullanılır**: Vercel deployment, env var konfigürasyonu, domain setup, post-deploy kontrol.

**Ele aldığı konular**: `vercel.json` rewrite kuralları, Go backend + frontend monorepo deploy, Prisma generate build script'ine ekleme, production DB migration workflow.

---

## Bilgi Tabanı

### `knowledge/mistakes.md`

27 belgelenmiş hata ve çözümü. Her yeni proje başlamadan önce okunmalı. Her yeni hata keşfedildiğinde güncellenmeli.

**Kritik hatalar (en sık yapılanlar)**:

| # | Hata | Çözüm |
|---|---|---|
| 1 | next-themes hydration mismatch | `<html suppressHydrationWarning>` + mounted guard |
| 2 | Three.js SSR çakışması | `dynamic(() => import(...), { ssr: false })` |
| 5 | Vercel'de `pg` timeout | `@neondatabase/serverless` kullan |
| 10 | Server Component'te Framer Motion | `'use client'` direktifi ekle |
| 15 | Tailwind dark mode çalışmıyor | `darkMode: 'class'` + `<html>` üzerinde `.dark` |
| 17 | Tailwind v4'te `tailwind.config.ts` | v4'te konfigürasyon `globals.css` `@theme {}` bloğunda |
| 25 | Migration dosyasını düzenleme | İmmutable — her zaman yeni dosya oluştur |
| 26 | Hardcoded renk | CSS variable veya Tailwind token kullan |

---

### `knowledge/patterns.md`

Kopyala-yapıştır hazır kod desenleri:

- **Auth** — next-auth v5 App Router kurulumu, korumalı API route
- **Database** — Drizzle + Neon bağlantısı, schema örneği, migration workflow
- **API** — standart response helper'ları (`ok()`, `err()`)
- **UI** — next-themes kurulumu, mounted guard, Three.js dynamic import
- **Framer Motion** — spotlight hero, stagger liste, AnimatePresence modal
- **SEO** — metadata, sitemap.ts, robots.ts, edge health route
- **Performance** — image optimization, font preload

---

### `knowledge/themes/`

Her projenin CSS'i, renk sistemi, font seçimi ve animasyon desenleri belgelenmiştir. `/theme` skill'i ve ajan dosyaları bu bilgileri referans alır.

**`ahmetakyapi.md`** — Ana referans görsel dil:
- `#04070d` dark bg, `#f5f7fb` light bg
- Manrope (body) + IBM Plex Mono (kod)
- 3 vurgu rengi: indigo/cyan/emerald radial gradient köşelerde
- Glass sistemi: `backdrop-filter: blur(16-24px)` + `rgba` overlay
- Animasyon: ease `[0.22, 1, 0.36, 1]`, spotlight, magnetic buton, 3D tilt
- next-themes `class` stratejisi

**`mimio.md`** — Farklılaşan noktalar:
- Tailwind v4 (`@theme {}` bloğu, `tailwind.config.ts` yok)
- Custom ThemeProvider (`data-theme` attribute, `next-themes` değil)
- Plus Jakarta Sans font
- FOUC önleme inline script

**`digynotes.md`** — Farklılaşan noktalar:
- `#0a0f1e` dark bg
- Avenir Next (system font)
- Emerald `#10b981` primary (kodda `--gold` olarak geçiyor)
- `dn-` namespace CSS değişkenleri
- Aurora animasyonları (15s/17s/18s)
- React Quill + Prisma + pg (serverless değil)
- `localStorage: dn_theme`

**`keskealsaydim.md`** — Farklılaşan noktalar:
- Go backend + Vite React frontend
- shadcn HSL CSS değişken sistemi
- Space Grotesk + IBM Plex Mono
- `#00C896` success green
- Finance UI: stat kartları, live dot, ticker, positive/negative sayılar
- Zustand + React Query + Recharts

**`ramazan-vakitleri.md`** — Farklılaşan noktalar:
- `#1a1a2e` / `#16213e` midnight navy
- Lavender + pembe + mavi 3'lü vurgu
- Vanilla CSS (Tailwind yok)
- Mobile-first, 430px max
- Kadir Gecesi özel animasyonlar

---

## Yeni Proje Oluşturma — Adım Adım

### 1. Claude Code'da skill'i çalıştır

```bash
/new-project [proje-adı]
```

### 2. Soruları yanıtla

```
Proje tipi: landing
Görsel tema: ahmetakyapi
Auth: hayır
DB: hayır
```

### 3. Şablon kopyalanır

```bash
cp -r ~/dev-starter/templates/landing ~/projects/yeni-proje
```

### 4. Placeholder'lar değiştirilir

```bash
find . -not -path './node_modules/*' -type f \
  -exec sed -i '' 's/PROJECT_NAME/YeniProje/g; s/HERO_TITLE_LINE1/Başlık/g; ...' {} +
```

### 5. Bağımlılıklar kurulur

```bash
cd ~/projects/yeni-proje
npm install
npm run dev
```

### 6. Tema ince ayarı

```bash
/theme ahmetakyapi
```

### 7. Deploy

```bash
/deploy
```

---

## Tasarım Dili

Tüm projeler aynı görsel DNA'dan türer, her biri kendi renk/font sistemiyle farklılaşır.

### Ortak Prensipler

**Glass Efekti**:
```css
.glass {
  background: rgba(8, 12, 22, 0.72);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}
```

**Animasyon Ease** — yumuşak, hızlı başlayıp yavaşlayan:
```ts
const EASE = [0.22, 1, 0.36, 1] as const
// Framer Motion'ın tüm transition'larında kullanılır
```

**Spring Presets**:
```ts
snappy:   { stiffness: 300, damping: 30 }  // Kart tilt
bouncy:   { stiffness: 160, damping: 18 }  // Magnetic buton
smooth:   { stiffness: 140, damping: 16 }  // Cursor halka
```

**Renk Sistemi** — hardcoded renk yasak, her zaman token:
```css
/* ❌ Yanlış */
.card { background: rgba(255,255,255,0.04); color: #e2e8f0; }

/* ✅ Doğru */
.card { @apply glass text-slate-200; }
/* veya */
.card { background: var(--glass-dark); color: var(--text-primary); }
```

### Proje Tema Karşılaştırması

| | ahmetakyapi | Mimio | DigyNotes | Keskealsaydım |
|---|---|---|---|---|
| **Dark bg** | `#04070d` | `#04070d` | `#0a0f1e` | HSL değişken |
| **Font** | Manrope | Plus Jakarta | Avenir Next | Space Grotesk |
| **Vurgu** | Indigo+Cyan+Emerald | Indigo | Emerald | Emerald+Cyan |
| **Tema sistemi** | next-themes class | custom data-theme | html.light class | shadcn HSL |
| **CSS framework** | Tailwind v3 | Tailwind v4 | Tailwind v3 | Tailwind v3 |
| **DB** | Drizzle+Neon | Drizzle+Neon | Prisma+pg | GORM+Postgres |

---

## Şablon Yer Tutucular

Landing şablonundaki tüm özelleştirilebilir alanlar `BÜYÜK_HARF_SNAKE_CASE` formatında.

### `page.tsx` ve genel

| Yer Tutucu | Nerede Kullanıldığı |
|---|---|
| `PROJECT_NAME` | Header logo, Footer copyright, meta title |
| `PROJECT_DESCRIPTION` | meta description, CLAUDE.md |

### Hero Section

| Yer Tutucu | Açıklama | Örnek |
|---|---|---|
| `HERO_TITLE_LINE1` | Başlık 1. satır (düz metin) | `"Daha Akıllı"` |
| `HERO_TITLE_LINE2` | Başlık 2. satır (gradient) | `"Not Alma"` |
| `HERO_SUBTITLE` | Alt başlık | `"Notlarınızı AI ile organize edin"` |
| `CTA_LINK` | Ana CTA butonu hedefi | `"/signup"` veya `"#pricing"` |
| `CTA_PRIMARY` | CTA buton metni | `"Ücretsiz Başla"` |
| `HERO_BADGE` | Üstteki rozet metni | `"v2.0 yayında"` |

### CTA Section

| Yer Tutucu | Açıklama |
|---|---|
| `CTA_TITLE` | Büyük başlık |
| `CTA_SUBTITLE` | Alt paragraf |
| `CTA_BUTTON` | Buton metni |

### Pricing Section (opsiyonel)

| Yer Tutucu Grubu | Alanlar |
|---|---|
| `PLAN_FREE_*` | `NAME`, `PRICE`, `PERIOD`, `DESC`, `F1`–`F3`, `CTA` |
| `PLAN_PRO_*` | `NAME`, `PRICE`, `PERIOD`, `DESC`, `F1`–`F5`, `CTA` |
| `PLAN_ENT_*` | `NAME`, `PRICE`, `PERIOD`, `DESC`, `F1`–`F4`, `CTA` |

### Testimonials Section (opsiyonel)

| Yer Tutucu | Açıklama |
|---|---|
| `TEST_TITLE` | Section başlığı |
| `TEST_SUBTITLE` | Section alt başlığı |
| `TEST_1_NAME` | 1. kişi adı |
| `TEST_1_ROLE` | 1. kişi unvan/şirket |
| `TEST_1_AVATAR` | Avatar baş harfleri (2 karakter, örn. `"AK"`) |
| `TEST_1_TEXT` | Referans metni |

---

## Ekosistemi Güncelleme

### Yeni Hata Keşfettim

`knowledge/mistakes.md` dosyasına ekle:
```markdown
### [N+1]. [Hata Başlığı]
**Hata**: [ne oldu]
**Sebep**: [neden oldu]
**Çözüm**: [nasıl düzeltildi]
```

---

### Yeni Proje Tamamladım

`knowledge/themes/[proje-adı].md` dosyası oluştur veya güncelle:
- Arka plan renkleri (dark/light)
- Font seçimi
- Vurgu renkleri ve nasıl kullanıldıkları
- Tema sistemi (next-themes / custom / vanilla)
- Özel animasyonlar veya CSS class'lar
- Dikkat edilmesi gereken proje-özgü kararlar

---

### Yeni Desen Keşfettim

`knowledge/patterns.md` dosyasına ilgili başlık altına ekle — tam kod bloğuyla.

---

### @ahmet/ui'ya Bileşen Ekleyeceğim

1. `packages/@ahmet/ui/src/components/[ComponentName].tsx` oluştur
2. `packages/@ahmet/ui/src/index.ts`'e export ekle
3. `packages/@ahmet/ui/package.json`'da gerekiyorsa dependency ekle

---

### Yeni Skill Ekleyeceğim

`~/.claude/commands/[skill-adi].md` dosyası oluştur. Format:

```markdown
[Kısa açıklama]. Argüman (`$ARGUMENTS`): [ne alır].

## Adımlar

### 1. [Bağlam Yükleme]
[Hangi dosyaları okusun]

### 2. [Asıl İş]
[Ne yapsın]

### 3. [Çıktı]
[Nasıl raporlasın]
```

---

*Son güncelleme: Mart 2026*
