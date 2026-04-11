# Görsel Hafıza: ahmetakyapi.com

> Bu dosya DESIGN.md 9-section formatını takip eder.
> AI agent'ları bu dosyayı okuyarak pixel-perfect UI üretebilir.

Kaynak proje: `~/personal-website`
Versiyon: Next.js 14, Tailwind CSS 3, Framer Motion 11, React Three Fiber, next-themes

---

## 1. Visual Theme & Atmosphere

ahmetakyapi.com, koyu uzay tonlarında bir kişisel portfolyo/blog sitesidir. Tasarım felsefesi "karanlıkta ışık" prensibine dayanır: neredeyse siyah bir tuval üzerinde indigo, cyan ve emerald tonlarında radial gradient'ler yüzer — sanki kozmik bir bulutsuyu andıran atmosfer. Light mode'da bu ışıklar soğuk beyaz bir yüzey üzerinde daha pastel ve hafif biçimde yansıtılır. Her iki modda da sayfanın görsel ağırlığı minimum tutulur; içerik negatif boşlukla nefes alır.

Glassmorphism, sitenin birincil derinlik dili: nav bar, kartlar ve paneller yarı-saydam arka planlara, çok ince kenarlıklara ve backdrop blur'a sahiptir. Bu katmanlar arasında ışık, inset shadow ve border opacity ile kontrol edilir. Sayfada hiçbir yüzey tamamen opak değildir — her şey altındaki gradient katmanlardan parça parça geçirir.

Animasyon sistemi zengin ama kontrollü: mouse-takipli spotlight efekti, 3D kart tilt'i, magnetic butonlar ve custom cursor gibi mikro-etkileşimler kullanılır. Tüm geçişlerde `[0.22, 1, 0.36, 1]` ease eğrisi ile "hızlı başla, yumuşak bitir" hissi verilir. Spring fizikleri Framer Motion üzerinden yönetilir; GSAP kesinlikle kullanılmaz.

**Temel Karakteristikler:**
- **Font**: Manrope (sans) + IBM Plex Mono — modern, geometrik, hafif condensed tracking
- **Renk stratejisi**: Üç noktalı radial gradient sistemi (indigo/cyan/emerald) + koyu/açık base
- **Efekt sistemi**: Glassmorphism (3 katman: glass, chip, surface) + holografik kart parlaması
- **Animasyon felsefesi**: Zengin mikro-etkileşim — spotlight, magnetic, 3D tilt, custom cursor
- **Dark/Light mod**: next-themes ile `class` stratejisi, `darkMode: 'class'` — dark varsayılan

---

## 2. Color Palette & Roles

### Arka Plan
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--bg-base` | `#04070d` | `#f5f7fb` | Ana sayfa arka planı (radial gradient katmanlarıyla) |
| `--bg-card` | `rgba(8,12,22,0.72)` | `rgba(255,255,255,0.72)` | Glass kart arka planı |
| `--bg-raised` | `rgba(8,12,22,0.88)` | `rgba(255,255,255,0.88)` | Surface / modal panel |
| `--bg-chip` | `rgba(7,11,20,0.56)` | `rgba(240,243,248,0.72)` | Badge, pill arka planı |

### Vurgu Renkleri (Gradient Katmanları)
| Token | Değer | Konum | Opaklık (Dark) | Kullanım |
|-------|-------|-------|-----------------|----------|
| `--color-primary` | `rgb(79,70,229)` — İndigo | Sol üst (18% 12%) | 0.14 | Birincil vurgu, CTA, logo gradient başlangıcı |
| `--color-secondary` | `rgb(34,211,238)` — Cyan | Sağ üst (82% 10%) | 0.09 | İkincil vurgu, scrollbar, spotlight |
| `--color-tertiary` | `rgb(16,185,129)` — Emerald | Alt merkez (50% 100%) | 0.05 | Üçüncül vurgu, başarı durumu |

### Metin Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--text-primary` | `rgba(255,255,255,0.95)` | `rgba(15,23,42,0.95)` | Ana başlıklar, gövde metni |
| `--text-secondary` | `rgba(148,163,184,0.9)` | `rgba(100,116,139,0.9)` | İkincil metin, açıklamalar |
| `--text-muted` | `rgba(148,163,184,0.5)` | `rgba(100,116,139,0.5)` | Silik metin, placeholder |
| `--text-accent` | `rgb(56,189,248)` — Sky-400 | `rgb(37,99,235)` — Blue-600 | Link, vurgulu metin |

### Kenarlık & Çizgi
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--border` | `rgba(148,163,184,0.14)` | `rgba(148,163,184,0.2)` | Chip, kart kenarlığı |
| `--border-subtle` | `rgba(148,163,184,0.1)` | `rgba(148,163,184,0.14)` | Glass nav, ince ayraçlar |
| `--border-inset` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.1)` | İç üst kenar ışığı (inset) |

### Durum Renkleri
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--success` | `rgb(16,185,129)` — Emerald | Başarı bildirimi |
| `--warning` | `rgb(245,158,11)` — Amber | Uyarı bildirimi |
| `--danger` | `rgb(239,68,68)` — Red | Hata bildirimi |
| `--info` | `rgb(56,189,248)` — Sky | Bilgi bildirimi |

### Sayfa Arka Plan Kodu
```css
/* Dark mode — üç noktalı radial gradient sistemi */
background:
  radial-gradient(circle at 18% 12%, rgba(79,70,229,0.14), transparent 30%),
  radial-gradient(circle at 82% 10%, rgba(34,211,238,0.09), transparent 24%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.05), transparent 28%),
  #04070d;

/* Light mode — daha pastel, mavi ağırlıklı varyant */
background:
  radial-gradient(circle at 14% 12%, rgba(59,130,246,0.12), transparent 30%),
  radial-gradient(circle at 82% 8%, rgba(14,165,233,0.10), transparent 24%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.06), transparent 28%),
  #f5f7fb;
```

---

## 3. Typography Rules

### Font Ailesi
- **Sans**: Manrope (Google Fonts) — ağırlıklar: `400, 500, 600, 700, 800`
- **Mono**: IBM Plex Mono (Google Fonts) — ağırlıklar: `400, 500, 600`
- **letter-spacing**: `-0.01em` (hafif sıkıştırma, tüm Manrope kullanımlarında)
- **text-rendering**: `optimizeLegibility`
- **-webkit-font-smoothing**: `antialiased`
- **-moz-osx-font-smoothing**: `grayscale`

### Hiyerarşi

| Rol | Font | Boyut | Ağırlık | Satır Yüksekliği | Letter Spacing | Not |
|-----|------|-------|---------|-------------------|----------------|-----|
| Display Hero | Manrope | 3.5rem (56px) | 800 | 1.1 | -0.02em | Ana hero başlığı, mobilde 2.25rem |
| Section Heading | Manrope | 2rem (32px) | 700 | 1.25 | -0.01em | Bölüm başlıkları |
| Card Title | Manrope | 1.25rem (20px) | 600 | 1.4 | -0.01em | Kart üst başlığı |
| Body Large | Manrope | 1.125rem (18px) | 400 | 1.7 | -0.01em | Giriş paragrafları |
| Body | Manrope | 1rem (16px) | 400 | 1.7 | -0.01em | Standart gövde metni |
| Caption | Manrope | 0.875rem (14px) | 500 | 1.5 | 0 | Alt metin, tarih, meta |
| Code / Mono | IBM Plex Mono | 0.875rem (14px) | 400 | 1.6 | 0 | Kod blokları, teknik etiketler |
| Chip Label | Manrope | 0.78rem (12.5px) | 600 | 1.3 | 0.02em | Badge, pill içi metin |

### Prensipler
- Manrope varsayılan font; IBM Plex Mono sadece kod, teknik etiket ve mono gerektiren yerlerde kullanılır
- `-0.01em` letter-spacing tüm sans metninde uygulanır — Manrope'un doğal aralığını sıkıştırır
- Başlık hiyerarşisi ağırlık farkıyla da desteklenir: 800 → 700 → 600 → 400
- Hero başlıkta gradient text kullanılabilir: `bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400`
- Karanlık modda metin rengi `white/95` — tam beyaz değil, göz yormaz

---

## 4. Component Stylings

### Butonlar

**Primary (CTA)**
- Background: `linear-gradient(135deg, rgb(79,70,229), rgb(59,130,246))` — indigo→blue
- Text: `white`, font-weight: 600
- Padding: `0.75rem 1.5rem`
- Radius: `0.75rem` (12px)
- Hover: `brightness(1.12)` + `scale(1.02)` + magnetic pull efekti
- Active/Press: `scale(0.98)` + `brightness(0.95)`
- Transition: spring `snappy` (stiffness: 300, damping: 30)

**Ghost / Secondary**
- Background: transparent
- Border: `1px solid rgba(148,163,184,0.14)`
- Text: `--text-secondary`
- Hover: `background rgba(148,163,184,0.06)` + text açılması
- Radius: `0.75rem`

**Pill / Badge (Chip)**
```css
background: rgba(7,11,20,0.56);
border: 1px solid rgba(148,163,184,0.14);
border-radius: 999px;
padding: 0.75rem 1rem;
font-size: 0.78rem;
font-weight: 600;
backdrop-filter: blur(18px);
```

**Magnetic Button Efekti**
- strength: `0.26` — imleç yaklaştığında buton manyetik olarak çekilir
- Spring: `bouncy` (stiffness: 160, damping: 18)
- Sadece `@media (pointer: fine) and (hover: hover)` cihazlarda aktif

### Kartlar & Container'lar

**Glass Kart (.glass)**
```css
background: linear-gradient(180deg, rgba(8,12,22,0.72), rgba(6,10,18,0.46));
border: 1px solid rgba(148,163,184,0.1);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 34px rgba(2,6,23,0.14);
backdrop-filter: blur(16px);
border-radius: 1rem; /* 16px — rounded-2xl */
```
- Hover: 3D tilt efekti (`useCardTilt` hook, intensity: 8)
- Hover border: holografik parlaklık — `indigo→purple` gradient border shine
- rotateX ve rotateY mouse pozisyonuna göre hesaplanır
- `transform-style: preserve-3d` + `perspective: 1000px`

**Surface (Modal, Panel)**
```css
background: linear-gradient(180deg, rgba(8,12,22,0.88), rgba(4,7,13,0.96));
backdrop-filter: blur(20px);
border: 1px solid rgba(148,163,184,0.1);
border-radius: 1.5rem; /* 24px */
```

### Input & Form
- Background: `rgba(8,12,22,0.56)`
- Border: `1px solid rgba(148,163,184,0.14)`
- Border-radius: `0.75rem`
- Focus: `ring-2 ring-indigo-500/30 border-indigo-500/50`
- Placeholder: `--text-muted`
- Padding: `0.75rem 1rem`
- Font: Manrope, 1rem, weight 400

### Navigasyon (Header)
- Pozisyon: `fixed top-0 left-0 right-0`, `z-50`
- Yükseklik: `h-16` (64px)
- İç container: `max-w-7xl mx-auto px-6`
- İlk yükleme: şeffaf arka plan
- Scroll sonrası (>10px): `.glass` class aktif — `backdrop-filter: blur(16px)` devreye girer
- Logo: `w-10 h-10 rounded-2xl`, `bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400`
- Nav linkleri: `--text-secondary`, hover'da `--text-primary` + alt çizgi animasyonu
- Cmd+K: Command Palette açar

### Proje Özel Bileşenler

**Spotlight Efekti**
- Mouse-takipli 620px radial gradient
- Renk: `rgba(96,165,250,0.07)` — sky-400 çok düşük opaklıkta
- Sadece hero bölümünde aktif
- `pointer-events: none` — etkileşimi engellemez

**Custom Cursor**
- Nokta: 8px, `rgb(56,189,248)` — sky-400, direkt mouse pozisyonunu takip eder
- Ring: 32px, `rgb(56,189,248)`, 1px border, spring ile gecikir (spring: smooth)
- `mixBlendMode: difference` — arka plan rengine göre otomatik kontrast
- Sadece `@media (pointer: fine) and (hover: hover)` cihazlarda render edilir
- Linklerde/butonlarda ring büyür (`scale(1.5)`)

**3D Tilt Card**
- `useCardTilt` hook'u ile kontrol edilir
- intensity: 8 — rotateX ve rotateY maksimum ±8 derece
- Holografik border shine: mouse pozisyonuna bağlı `indigo→purple` gradient
- `will-change: transform` ile performans optimizasyonu

**Scrollbar**
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(56,189,248,0.28);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(56,189,248,0.5);
}
```

---

## 5. Layout Principles

### Spacing Sistemi
- Base unit: `4px` (Tailwind varsayılan)
- Yaygın spacing'ler: `px-6` (24px) sayfa kenarı, `gap-6` kart arası, `py-20` (80px) bölüm arası
- Section padding: `py-20 md:py-28` (80px / 112px)

### Grid & Container
- Max content width: `max-w-7xl` (1280px)
- Container padding: `px-6` (24px) her iki yanda
- Kart grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- İçerik alanı (blog, about): `max-w-3xl` (768px) — okuma rahatlığı

### Whitespace Felsefesi
- Yoğunluk düşük tutulur — yüzeyler arasında minimum `1.5rem` boşluk
- Hero bölümü: `min-h-[calc(100vh-64px)]` — tam ekran etkisi, header yüksekliği çıkarılır
- Kartlar arası `gap-6`, bölümler arası `py-20`
- İçeride (kart padding): `p-6` standart, `p-8` geniş kartlarda

### Border Radius Scale
| İsim | Değer | Kullanım |
|------|-------|----------|
| sm | `0.375rem` (6px) | Input, küçük badge |
| md | `0.75rem` (12px) | Buton, küçük kart |
| lg | `1rem` (16px) | Standart kart (rounded-2xl) |
| xl | `1.5rem` (24px) | Modal, panel, surface |
| 2xl | `2rem` (32px) | Hero kart, büyük panel |
| full | `999px` | Pill, avatar, chip, scrollbar |

---

## 6. Depth & Elevation

| Seviye | Shadow / Efekt | Kullanım |
|--------|----------------|----------|
| Flat (0) | Yok — sadece radial gradient BG | Sayfa arka planı |
| Subtle (1) | `inset 0 1px 0 rgba(255,255,255,0.04)` | Glass yüzeyler — iç üst kenar ışığı |
| Elevated (2) | `0 14px 34px rgba(2,6,23,0.14)` + inset | Glass kartlar, nav bar |
| Overlay (3) | `0 24px 48px rgba(2,6,23,0.25)` + `backdrop-filter: blur(20px)` | Modal, dialog, surface |

### Glassmorphism Sistemi (3 Katman)

**Katman 1 — `.glass` (nav, kartlar)**
```css
background: linear-gradient(180deg, rgba(8,12,22,0.72), rgba(6,10,18,0.46));
border: 1px solid rgba(148,163,184,0.1);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 34px rgba(2,6,23,0.14);
backdrop-filter: blur(16px);
```

**Katman 2 — `.chip` (badge, pill)**
```css
background: rgba(7,11,20,0.56);
border: 1px solid rgba(148,163,184,0.14);
backdrop-filter: blur(18px);
border-radius: 999px;
```

**Katman 3 — `.surface` (modal, panel)**
```css
background: linear-gradient(180deg, rgba(8,12,22,0.88), rgba(4,7,13,0.96));
backdrop-filter: blur(20px);
border: 1px solid rgba(148,163,184,0.1);
```

### Dekoratif Derinlik
- Sayfa arka planındaki 3 radial gradient katmanı tüm derinliğin temelini oluşturur
- Glass yüzeyler bu gradient'leri altlarından geçirir — `backdrop-filter` sayesinde bulanık ama görünür
- Holografik kart border shine: mouse pozisyonuna bağlı `conic-gradient` veya `linear-gradient` (indigo→purple) — kart kenarında ışık yürür
- `inset 0 1px 0 rgba(255,255,255,0.04)` — her glass yüzeyin üst kenarında çok ince beyaz çizgi, cam etkisi verir

---

## 7. Do's and Don'ts

### Do
- `suppressHydrationWarning` — `<html>` tag'ine next-themes için her zaman ekle
- Three.js bileşenlerini `dynamic(() => import(...), { ssr: false })` ile yükle
- `mounted` state guard kullan — `resolvedTheme`'e erişmeden önce bileşenin mount olduğunu kontrol et
- Tüm renkleri CSS variable/token olarak tanımla — hardcoded hex kullanma
- Animasyonlarda `EASE = [0.22, 1, 0.36, 1]` eğrisini kullan
- Custom cursor'ı `@media (pointer: fine) and (hover: hover)` ile koruma altına al
- `will-change: transform` — 3D tilt ve yoğun animasyonlu elementlerde performans için ekle
- Glass yüzeylerde her zaman `inset` shadow ile üst kenar ışığı ver
- Font yüklemesini Google Fonts `display=swap` ile yap
- Vurgu renklerini gradient katmanları olarak kullan — düz renk bloğu olarak değil

### Don't
- GSAP kullanma — tüm animasyonlar Framer Motion ile
- `background-attachment: fixed` kullanma — mobilde `scroll`'a düşür
- `pg` (node-postgres) kullanma — serverless ortamda `@neondatabase/serverless` kullan
- Tam opak arka plan verme glass yüzeylere — her zaman yarı-saydam olmalı
- `z-index` savaşına girme — nav: `z-50`, modal: `z-[9999]`, cursor: `z-[99999]` yeterli
- `console.log` commit'e gönderme
- `any` type kullanma — `unknown` tercih et
- `@ts-ignore` kullanma — gerçek tip sorununu çöz
- Magic number kullanma — named constant veya Tailwind class kullan
- Server Component'e `'use client'` veya Framer Motion koyma — gerçekten gerektiğinde ayır

---

## 8. Responsive Behavior

### Breakpoints
| İsim | Genişlik | Değişiklikler |
|------|----------|---------------|
| Mobile | <640px | Tek kolon grid, hero font 2.25rem, nav hamburger menü, px-4 kenar boşluğu |
| Tablet | 640-1024px | 2 kolon grid, hero font 2.75rem, nav yatay ama compact |
| Desktop | 1024-1280px | 3 kolon grid, tam nav, tüm efektler aktif |
| Large | >1280px | max-w-7xl merkezi container, ekstra boşluk kenarlarda |

### Dokunma Hedefleri
- Minimum dokunma alanı: 44x44px (iOS HIG uyumlu)
- Nav link'ler: `py-2 px-3` minimum
- Butonlar: `min-h-[44px]`
- Chip/pill: `padding 0.75rem 1rem` — parmak dostu

### Daraltma Stratejisi
- **Custom cursor**: Mobilde tamamen gizlenir — sadece `pointer: fine` cihazlarda
- **3D tilt**: Dokunmatik cihazlarda devre dışı — `@media (hover: hover)` kontrolü
- **Spotlight efekti**: Mobilde devre dışı — performans ve touch uyumsuzluğu
- **Magnetic button**: Mobilde devre dışı
- **Stagger animasyonları**: Mobilde azaltılmış (`staggerChildren: 0.06`)
- **`background-attachment: fixed`**: Mobilde `scroll`'a düşürülür (iOS uyumlu)
- **Grid**: `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3`
- **Section padding**: `py-16` (mobil) → `py-20` (tablet) → `py-28` (desktop)
- **Hero min-height**: Mobilde `min-h-[80vh]`, desktop'ta `min-h-[calc(100vh-64px)]`

---

## 9. Agent Prompt Guide

### Hızlı Renk Referansı
- Primary CTA: `indigo-500` → `blue-500` gradient (`rgb(79,70,229)` → `rgb(59,130,246)`)
- Dark background: `#04070d`
- Light background: `#f5f7fb`
- Heading text (dark): `white/95`
- Body text (dark): `slate-400/90` (`rgba(148,163,184,0.9)`)
- Border: `rgba(148,163,184,0.1)` — çok ince, fark edilmeyecek kadar hafif
- Accent glow: `sky-400` (`rgb(56,189,248)`) — scrollbar, cursor, spotlight

### Animasyon Varyantları (Copy-Paste)
```ts
const EASE = [0.22, 1, 0.36, 1];

const variants = {
  fadeIn:       { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, ease: EASE } } },
  fadeUp:       { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } },
  fadeUpLarge:  { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } },
  fadeLeft:     { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } },
  fadeRight:    { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } },
  scaleIn:      { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } } },
  slideDown:    { hidden: { opacity: 0, y: -8, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE } } },
  modalBackdrop: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } },
  modalPanel:   { hidden: { opacity: 0, scale: 0.96, y: -16 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: EASE } } },
};

const springs = {
  snappy: { stiffness: 300, damping: 30 },   // kartlar, UI feedback
  bouncy: { stiffness: 160, damping: 18 },   // magnetic buton
  smooth: { stiffness: 140, damping: 16 },   // cursor ring
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
```

### Örnek Component Prompt'ları

- **Hero section**: "min-h-[calc(100vh-64px)] flex items-center, arka planda spotlight efekti, Manrope 800 3.5rem başlık fadeUpLarge ile girer, alt metin fadeUp 0.2s delay ile, CTA buton indigo→blue gradient + magnetic efekt"
- **Glass card**: "rounded-2xl, glass arka plan (linear-gradient + blur(16px)), 1px subtle border, inset üst kenar ışığı, hover'da 3D tilt + holografik border shine, içerik p-6"
- **Chip/badge**: "rounded-full, bg rgba(7,11,20,0.56), border rgba(148,163,184,0.14), blur(18px), text 0.78rem weight 600, py-3 px-4"
- **Navigation**: "fixed top-0 z-50 w-full, başlangıçta şeffaf, scroll>10px'de glass aktif (blur + gradient bg + border), max-w-7xl mx-auto h-16 px-6, logo sol tarafta rounded-2xl indigo→cyan gradient"
- **Modal**: "surface arka plan (blur(20px) + koyu gradient), rounded-3xl, modalBackdrop + modalPanel animasyonları, p-8"

### İterasyon Rehberi
1. Her zaman dark mode'u önce uygula — light mode ikinci geçişte
2. Glass efektini test etmek için arka planda radial gradient olmalı — düz renk üzerinde glass görünmez
3. Animasyonları `whileInView` ile viewport'a girdiğinde tetikle — `viewport={{ once: true }}`
4. Custom cursor implementasyonunu en son ekle — core UI tamamlandıktan sonra
5. `mounted` guard pattern'ını tema bağımlı her bileşende uygula — hydration hatalarını önler
6. 3D tilt için `perspective` parent'ta olmalı, `transform-style: preserve-3d` child'da

---

## Teknoloji Notu

| Katman | Seçim | Not |
|--------|-------|-----|
| Framework | Next.js 14 (App Router) | Server Component varsayılan, `'use client'` sadece gerektiğinde |
| Stil | Tailwind CSS 3 | `darkMode: 'class'`, design token'lar CSS variable ile |
| Animasyon | Framer Motion 11 | GSAP kesinlikle kullanılmaz |
| 3D | React Three Fiber + Drei | `dynamic(() => import(...), { ssr: false })` ile yüklenir |
| Tema Sistemi | next-themes | `class` strategy, `suppressHydrationWarning` zorunlu |
| İkonlar | lucide-react | Tutarlı ikon seti |
| Yorumlar | Giscus | GitHub Discussions tabanlı blog yorum sistemi |
| Deployment | Vercel | Env değişkenleri deploy öncesi kontrol edilmeli |
