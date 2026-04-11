# Görsel Hafıza: Mimio

> Bu dosya DESIGN.md 9-section formatını takip eder.
> AI agent'ları bu dosyayı okuyarak pixel-perfect UI üretebilir.

Kaynak proje: `~/mimio` (GitHub: ahmetakyapi/Mimio)
Versiyon: Next.js 15, **Tailwind CSS v4** (`@theme` direktifi), Framer Motion 11, @neondatabase/serverless

---

## 1. Visual Theme & Atmosphere

Mimio, interaktif bir uygulama olup koyu-tonlu, derinlikli bir glassmorphism estetiği taşır. `#04070d` koyu uzay-siyahı arka plan üzerine indigo (`#6366f1`) vurgu rengi hakimdir. Light modda ise arka plan indigo-tinted `#eef2ff` ile sıcak ama yine marka rengiyle bağlantılı kalır. Her iki modda da köşelere yerleştirilmiş radial gradient'ler (indigo, cyan, emerald) dekoratif derinlik katar; `background-attachment: fixed` ile scroll sırasında gradient'ler sabit kalır.

Sidebar tabanlı uygulama layout'u kullanılır. Navigasyon ve sidebar yüzeyleri yarı-saydam cam efektiyle (backdrop-blur) arka plandan ayrılır. Game canvas gibi özel alanlar her zaman dark kalır, tema değişikliğinden etkilenmez. Bu "bölge bazlı tema bağımsızlığı" Mimio'ya özgü bir pattern'dir.

**Temel Karakteristikler:**
- **Font**: Plus Jakarta Sans — yumuşak, modern, geometrik sans-serif. Mono font yok.
- **Renk stratejisi**: Tek vurgu rengi (indigo #6366f1) + temadan bağımsız accent palette (green, amber, red, teal). Light modda border/shadow'lar indigo-tinted.
- **Efekt sistemi**: Glassmorphism — `backdrop-filter: blur(16px)` standart, `blur(22px)` güçlendirilmiş. İnce inset highlight + düşük opaklıklı border.
- **Animasyon felsefesi**: Framer Motion 11 ile fonksiyonel geçişler. Ease: `[0.22, 1, 0.36, 1]`. Tema geçişi: `transition: color 0.3s ease, background-color 0.3s ease`.
- **Dark/Light mod**: `data-theme="dark"` / `data-theme="light"` (HTML attribute). Custom ThemeProvider, `next-themes` kullanılmaz. Anti-FOUC inline script `<head>` içinde. localStorage key: `mimio-theme`. Varsayılan: dark.

### Kritik: Tailwind v4 Farkı

`tailwind.config.ts` **yok**. Tüm tokenlar `globals.css` içinde `@theme {}` bloğuyla tanımlanır:
```css
@import "tailwindcss";
@theme {
  --color-primary: #6366f1;
  /* tüm tokenlar burada */
}
```
Sınıf kullanımı: `bg-(--color-primary)` syntax'ı. `dark:` prefix **yok** — tema geçişi CSS variable override ile çalışır.

### Anti-FOUC Script (layout.tsx)
```html
<script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mimio-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){}` }} />
```

---

## 2. Color Palette & Roles

### Brand (Tema Bağımsız)
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-primary` | `#6366f1` | `#6366f1` | Birincil vurgu, CTA, aktif durum |
| `--color-primary-hover` | `#4f46e5` | `#4f46e5` | Hover durumu |
| `--color-primary-light` | `rgba(99,102,241,0.12)` | `rgba(99,102,241,0.08)` | Hafif arka plan vurgu, seçili öğe |

### Arka Plan / Yüzey
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-page-bg` | `#04070d` | `#eef2ff` | Ana sayfa arka planı |
| `--color-surface` | `rgba(255,255,255,0.035)` | `rgba(255,255,255,0.65)` | Standart kart/panel arka planı |
| `--color-surface-strong` | `rgba(10,16,28,0.88)` | `rgba(255,255,255,0.92)` | Güçlü yüzey — modal, dropdown |
| `--color-surface-elevated` | `rgba(255,255,255,0.055)` | `rgba(255,255,255,0.85)` | Yükseltilmiş yüzey — glass bileşenler |

### Metin Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-text-strong` | `#f1f5f9` | `#1e293b` | Başlık, önemli metin |
| `--color-text-body` | `#cbd5e1` | `#334155` | Gövde metni |
| `--color-text-soft` | `#94a3b8` | `#64748b` | İkincil metin, açıklama |
| `--color-text-muted` | `#64748b` | `#94a3b8` | Placeholder, devre dışı metin |

### Kenarlık & Çizgi
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-line` | `rgba(255,255,255,0.07)` | `rgba(99,102,241,0.10)` | Standart kenarlık |
| `--color-line-soft` | `rgba(255,255,255,0.04)` | `rgba(99,102,241,0.05)` | İnce ayırıcı |
| `--color-line-strong` | `rgba(255,255,255,0.12)` | `rgba(99,102,241,0.25)` | Belirgin kenarlık |
| `--color-line-focus` | `rgba(99,102,241,0.60)` | `rgba(99,102,241,0.50)` | Focus ring |

### Chrome Katmanları
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-sidebar` | `rgba(4,8,16,0.92)` | `rgba(237,241,255,0.94)` | Sidebar arka planı |
| `--color-chrome-nav` | `rgba(4,7,13,0.92)` | `rgba(238,242,255,0.93)` | Üst navigasyon arka planı |
| `--color-chrome-header` | `rgba(4,7,13,0.88)` | `rgba(238,242,255,0.88)` | Sayfa header arka planı |

### Durum / Accent Renkleri (Tema Bağımsız)
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--color-accent-green` | `#10b981` | Başarı, aktif, pozitif |
| `--color-accent-amber` | `#f59e0b` | Uyarı, dikkat |
| `--color-accent-red` | `#ef4444` | Hata, tehlike, silme |
| `--color-accent-teal` | `#06b6d4` | Bilgi, link vurgusu |

### Shadow Scale
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)` | `0 1px 3px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.9)` | Kart, panel |
| `--shadow-glow` | `0 8px 24px rgba(99,102,241,0.40), 0 0 0 1px rgba(99,102,241,0.15)` | `0 8px 24px rgba(99,102,241,0.30)` | CTA hover, aktif öğe |

### Sayfa Arka Plan Kodu
```css
/* Dark */
background:
  radial-gradient(circle at 18% 12%, rgba(79,70,229,0.12), transparent 32%),
  radial-gradient(circle at 82% 10%, rgba(34,211,238,0.07), transparent 26%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.05), transparent 30%),
  #04070d;
background-attachment: fixed;

/* Light */
background:
  radial-gradient(circle at 18% 12%, rgba(99,102,241,0.08), transparent 32%),
  radial-gradient(circle at 82% 10%, rgba(34,211,238,0.05), transparent 26%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.04), transparent 30%),
  #eef2ff;
background-attachment: fixed;
```

---

## 3. Typography Rules

### Font Ailesi
- **Sans (Primary)**: Plus Jakarta Sans — ağırlıklar: 400, 500, 600, 700, 800
- **Fallback**: Inter — ağırlıklar: 400, 500, 600
- **Mono**: Yok — mono font kullanılmaz
- **text-rendering**: optimizeLegibility
- **-webkit-font-smoothing**: antialiased

### Hiyerarşi

| Rol | Font | Boyut | Ağırlık | Satır Yüksekliği | Letter Spacing | Not |
|-----|------|-------|---------|-------------------|----------------|-----|
| Display Hero | Plus Jakarta Sans | 2.5rem (40px) | 800 | 1.1 | -0.025em | Büyük başlıklar |
| Section Heading | Plus Jakarta Sans | 1.75rem (28px) | 700 | 1.2 | -0.02em | Bölüm başlıkları |
| Card Title | Plus Jakarta Sans | 1.125rem (18px) | 600 | 1.3 | -0.01em | Kart başlıkları |
| Body Large | Plus Jakarta Sans | 1rem (16px) | 500 | 1.6 | 0 | Vurgulu gövde metni |
| Body | Plus Jakarta Sans | 0.875rem (14px) | 400 | 1.5 | 0 | Standart gövde metni |
| Caption | Plus Jakarta Sans | 0.75rem (12px) | 500 | 1.4 | 0.01em | Etiket, açıklama |
| Overline | Plus Jakarta Sans | 0.6875rem (11px) | 600 | 1.2 | 0.05em | Üst etiket, uppercase |

### Prensipler
- Başlıklarda negatif letter-spacing ile sıkı, yoğun hissiyat
- Gövde metni `--color-text-body`, başlıklar `--color-text-strong`
- Placeholder ve disabled metin `--color-text-muted`
- Tüm font referansları CSS variable üzerinden, hardcoded değer yok

---

## 4. Component Stylings

### Butonlar

**Primary**
- Background: `--color-primary` (`#6366f1`)
- Text: `#ffffff`
- Padding: `0.625rem 1.25rem` (10px 20px)
- Radius: `--radius-md` (0.75rem)
- Hover: `--color-primary-hover` (`#4f46e5`) + `--shadow-glow`
- Active/Press: `scale(0.97)` + `--color-primary-hover`
- Transition: `all 0.2s ease`

**Ghost / Secondary**
- Background: `transparent`
- Border: `1px solid var(--color-line)`
- Text: `--color-text-body`
- Hover: `--color-surface-elevated` arka plan + `--color-text-strong` metin
- Active: `--color-surface-strong` arka plan

**Pill / Badge**
- Background: `--color-primary-light`
- Text: `--color-primary`
- Padding: `0.25rem 0.75rem`
- Radius: `9999px`
- Font: 500, 12px

**Danger Button**
- Background: `--color-accent-red`
- Hover: darker red (`#dc2626`)
- Text: `#ffffff`

### Kartlar & Container'lar
- Background: `var(--color-surface)`
- Border: `1px solid var(--color-line)`
- Radius: `--radius-lg` (1rem)
- Shadow: `var(--shadow-card)`
- Hover (interaktif kartlar): border `--color-line-strong` + `scale(1.01)` + `--shadow-glow` (hafif)
- Backdrop-filter: `blur(16px)` (glass kart)

### Input & Form
- Background: `var(--color-surface)`
- Border: `1px solid var(--color-line)`
- Radius: `--radius-sm` (0.5rem)
- Focus: border `--color-line-focus` + `box-shadow: 0 0 0 3px rgba(99,102,241,0.15)`
- Placeholder: `--color-text-muted`
- Text: `--color-text-strong`
- Padding: `0.625rem 0.75rem`
- Transition: `border-color 0.2s ease, box-shadow 0.2s ease`

### Navigasyon
- Sidebar: `--color-sidebar` arka plan, `backdrop-filter: blur(16px)`, sticky, tam yükseklik
- Üst nav: `--color-chrome-nav` arka plan, `backdrop-filter: blur(16px)`, sticky `top: 0`
- Aktif nav öğesi: `--color-primary-light` arka plan + `--color-primary` metin
- Hover nav öğesi: `--color-surface-elevated` arka plan

### Proje Özel Bileşenler

**Game Canvas**
- Her zaman dark, tema bağımsız: `background: rgba(8,14,28,0.97)`
- Kendi border/shadow seti, `data-theme` değişiminden etkilenmez

**Skeleton Loader**
- `--color-skeleton-lo` → `--color-skeleton-hi` arası animasyonlu gradient
- `animation: skeleton-pulse 1.5s ease-in-out infinite`

**Glass Card (`.glass`)**
- Background: `var(--color-surface-elevated)`
- Border: `1px solid var(--color-line)`
- Backdrop-filter: `blur(16px)`
- Shadow: `var(--shadow-card)`

**Glass Strong (`.glass-strong`)**
- Background: `var(--color-surface-strong)`
- Backdrop-filter: `blur(22px)`
- Shadow: `var(--shadow-elevated)`

---

## 5. Layout Principles

### Spacing Sistemi
- Base unit: `0.25rem` (4px)
- Scale: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)
- Standart iç boşluk (kartlar): `1rem` veya `1.25rem`
- Bölümler arası: `2rem` — `3rem`

### Grid & Container
- Sidebar app layout: sidebar sabit genişlik (~240px-280px), ana içerik esnek
- Max content width: `1280px` (ana içerik alanı)
- Container padding: `1rem` (mobil), `1.5rem` (tablet), `2rem` (masaüstü)
- Section gap: `2rem`

### Whitespace Felsefesi
- Yoğun ama boğucu değil — uygulama hissi, landing page değil
- Sidebar ve nav bölgeleri sıkı, içerik alanı rahat
- Kart içleri tutarlı padding ile nefes alır

### Border Radius Scale
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--radius-sm` | `0.5rem` (8px) | Badge, input, küçük buton |
| `--radius-md` | `0.75rem` (12px) | Buton, küçük kart, dropdown |
| `--radius-lg` | `1rem` (16px) | Kart, panel |
| `--radius-xl` | `1.25rem` (20px) | Büyük panel, section |
| `--radius-2xl` | `1.5rem` (24px) | Modal, büyük kart |
| `full` | `9999px` | Pill buton, avatar, badge |

---

## 6. Depth & Elevation

| Seviye | Shadow | Kullanım |
|--------|--------|----------|
| Flat (0) | Yok | Sayfa arka planı, inline öğeler |
| Subtle (1) | `var(--shadow-card)` | Kartlar, paneller |
| Elevated (2) | `0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)` | Dropdown, tooltip, aktif kart |
| Overlay (3) | `var(--shadow-glow)` | Modal, dialog, CTA hover |

### Glassmorphism Sistemi
```css
/* .glass — Standart */
background: var(--color-surface-elevated);   /* dark: rgba(255,255,255,0.055), light: rgba(255,255,255,0.85) */
border: 1px solid var(--color-line);         /* dark: rgba(255,255,255,0.07), light: rgba(99,102,241,0.10) */
backdrop-filter: blur(16px);
box-shadow: var(--shadow-card);

/* .glass-strong — Güçlendirilmiş */
background: var(--color-surface-strong);     /* dark: rgba(10,16,28,0.88), light: rgba(255,255,255,0.92) */
backdrop-filter: blur(22px);
box-shadow: var(--shadow-elevated);
```

### Dekoratif Derinlik
- Radial gradient'ler sayfanın sol-üst (%18 %12), sağ-üst (%82 %10) ve alt-orta (%50 %100) köşelerinde
- Dark modda indigo, cyan, emerald üçlüsü: opaklıklar 0.12, 0.07, 0.05
- Light modda aynı konumlar, daha düşük opaklık: 0.08, 0.05, 0.04
- `background-attachment: fixed` ile scroll sırasında gradient'ler sabit
- Chrome katmanları (sidebar, nav) yarı-saydam; alttaki gradient'ler hafifçe görünür
- Dark modda inset highlight `rgba(255,255,255,0.04)`, light modda `rgba(255,255,255,0.9)` ile üst kenar vurgusu

---

## 7. Do's and Don'ts

### Do
- Her zaman CSS variable/token kullan: `bg-(--color-surface)`, `text-(--color-text-strong)`
- Tailwind v4 syntax kullan: `bg-(--color-primary)` (parantezli)
- Glass efektlerde `backdrop-filter: blur()` + yarı-saydam arka plan + ince border birlikte kullan
- Tema geçişini `data-theme` attribute ile yönet, inline script ile FOUC'u önle
- Game canvas gibi özel alanları tema bağımsız tut
- Tüm interaktif öğelere `transition` ekle (minimum 0.2s ease)
- Focus durumunda `--color-line-focus` + `box-shadow` ring kullan
- Shadow'larda dark modda `rgba(0,0,0,...)`, light modda `rgba(99,102,241,...)` kullan (indigo-tinted)
- `background-attachment: fixed` kullan; **mobilde** `scroll`'a düşür

### Don't
- `bg-white`, `text-gray-900`, `dark:bg-gray-900` gibi hardcoded Tailwind sınıfları kullanma
- `style={{ background: "rgba(...)" }}` ile inline renk verme — token kullan
- `dark:` prefix kullanma — Mimio'da Tailwind dark mode yok, `data-theme` var
- `next-themes` veya `class` tabanlı tema sistemi kullanma
- `tailwind.config.ts` oluşturma — tüm tokenlar `globals.css` `@theme {}` bloğunda
- `suppressHydrationWarning` ekleme — bu proede `next-themes` yok, gerek yok
- Mono font referans etme — projede mono font yok
- `console.log` commit'e bırakma
- Magic number kullanma — spacing ve radius için daima token

---

## 8. Responsive Behavior

### Breakpoints
| İsim | Genişlik | Değişiklikler |
|------|----------|---------------|
| Mobile | <640px | Sidebar gizlenir (hamburger menü), tek kolon layout, container padding 1rem |
| Tablet | 640-1024px | Sidebar daraltılmış (ikon-only) veya overlay, iki kolon grid mümkün |
| Desktop | 1024-1280px | Sidebar tam açık, ana içerik esnek genişlik |
| Large | >1280px | Max-width 1280px, ortalanmış içerik, ekstra boşluk |

### Dokunma Hedefleri
- Minimum dokunma alanı: 44x44px (mobilde)
- Buton minimum yükseklik: 40px (masaüstü), 44px (mobil)
- Nav öğeleri arası minimum boşluk: 8px

### Daraltma Stratejisi
- Sidebar: masaüstünde sabit → tablette collapse → mobilde hamburger overlay
- Kartlar: grid kolonları `auto-fit, minmax(280px, 1fr)` ile otomatik akış
- Tipografi: hero başlık `clamp(1.75rem, 4vw, 2.5rem)` ile ölçeklenir
- `background-attachment: fixed` mobilde `scroll`'a düşer (performans)
- Game canvas mobilde tam genişlik, padding sıfır

---

## 9. Agent Prompt Guide

### Hızlı Renk Referansı
- **Primary CTA**: `bg-(--color-primary)` → `#6366f1`
- **Background**: `bg-(--color-page-bg)` → dark `#04070d`, light `#eef2ff`
- **Heading text**: `text-(--color-text-strong)` → dark `#f1f5f9`, light `#1e293b`
- **Body text**: `text-(--color-text-body)` → dark `#cbd5e1`, light `#334155`
- **Border**: `border-(--color-line)` → dark `rgba(255,255,255,0.07)`, light `rgba(99,102,241,0.10)`
- **Surface**: `bg-(--color-surface)` → dark `rgba(255,255,255,0.035)`, light `rgba(255,255,255,0.65)`
- **Success**: `--color-accent-green` → `#10b981`
- **Error**: `--color-accent-red` → `#ef4444`

### Token Kullanım Syntax'ı (Tailwind v4)
```tsx
// DOGRU — Tailwind v4 parantezli syntax
<div className="bg-(--color-surface) text-(--color-text-strong) border border-(--color-line) rounded-(--radius-lg) shadow-(--shadow-card)">

// YANLIS — Tailwind v3 stili, hardcoded degerler
<div className="bg-white text-gray-900 dark:bg-gray-900 border-gray-200 rounded-lg shadow-md">
```

### Ornek Component Prompt'lari

**Glass kart olustur:**
> "bg-(--color-surface-elevated) border border-(--color-line) rounded-(--radius-lg) backdrop-blur-[16px] shadow-(--shadow-card) p-5 kullanarak bir glass kart olustur. Baslik text-(--color-text-strong) font-semibold, govde text-(--color-text-body)."

**Primary buton olustur:**
> "bg-(--color-primary) hover:bg-(--color-primary-hover) text-white rounded-(--radius-md) px-5 py-2.5 transition-all duration-200 hover:shadow-(--shadow-glow) active:scale-[0.97] ile bir buton olustur."

**Sidebar navigasyon olustur:**
> "bg-(--color-sidebar) backdrop-blur-[16px] w-60 h-screen sticky top-0 border-r border-(--color-line) ile sidebar olustur. Aktif oge bg-(--color-primary-light) text-(--color-primary), diger ogeler text-(--color-text-soft) hover:bg-(--color-surface-elevated)."

**Input alani olustur:**
> "bg-(--color-surface) border border-(--color-line) rounded-(--radius-sm) px-3 py-2.5 text-(--color-text-strong) placeholder:text-(--color-text-muted) focus:border-(--color-line-focus) focus:ring-2 focus:ring-(--color-primary)/15 transition-all duration-200."

### Iterasyon Rehberi
1. Her bilesenin once `data-theme="dark"` gorunumunu olustur, sonra light'i kontrol et — renk tokenlari otomatik gecis yapar
2. Hardcoded renk gorursen hemen tokena cevir — `rgba(...)` degil `var(--color-...)` kullan
3. Glass efekti: her zaman `backdrop-filter` + yarı-saydam bg + border + shadow uclusu birlikte
4. Sidebar ve nav gibi chrome ogeleri `--color-sidebar` / `--color-chrome-nav` kullanir, `--color-surface` degil
5. Game canvas veya tema-bagimsiz alan varsa `rgba(8,14,28,0.97)` sabit arka plan, CSS variable degil
6. Focus state'leri unutma — `--color-line-focus` + ring shadow ile erisilebilirlik sagla
7. Mobil test: sidebar davranisi, `background-attachment`, dokunma hedefleri kontrol et

---

## Teknoloji Notu

| Katman | Secim | Not |
|--------|-------|-----|
| Framework | Next.js 15 | App Router |
| Stil | Tailwind CSS v4 | `@theme {}` blogu, `tailwind.config.ts` yok |
| Animasyon | Framer Motion 11 | Ease: `[0.22, 1, 0.36, 1]` |
| Tema Sistemi | Custom `data-theme` attribute | `next-themes` yok, inline anti-FOUC script |
| Veritabani | @neondatabase/serverless | PostgreSQL, serverless uyumlu |
| Auth | — | Proje gereksinimlerine gore |
| Deployment | Vercel | Standart Next.js deploy |

---

## ahmetakyapi.com ile Karsilastirma

| Ozellik | ahmetakyapi.com | Mimio |
|---------|-----------------|-------|
| Dark bg | `#04070d` | `#04070d` (ayni) |
| Light bg | `#f5f7fb` (notr) | `#eef2ff` (indigo-tinted) |
| Tema sistemi | next-themes (`class`) | Custom (`data-theme`) |
| Font | Manrope + IBM Plex Mono | Plus Jakarta Sans (mono yok) |
| Tailwind | v3 | **v4** (`@theme`) |
| DB | Yok | Neon serverless |
| Three.js | Var | Yok |
| Custom cursor | Var | Yok |
| Layout tipi | Landing/portfolio | Sidebar app |
