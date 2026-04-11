# Görsel Hafıza: Keşke Alsaydım

> Bu dosya DESIGN.md 9-section formatını takip eder.
> AI agent'ları bu dosyayı okuyarak pixel-perfect UI üretebilir.

Kaynak proje: `~/keskealsaydim`
Kaynak repo: https://github.com/ahmetakyapi/keskealsaydim
Versiyon: React + Vite, Go (backend), Tailwind CSS 3, shadcn/ui HSL tokens

---

## 1. Visual Theme & Atmosphere

Keşke Alsaydım, yatırım portföy takip uygulamasıdır. "Keşke alsaydım" senaryolarını simüle eder — kullanıcı geçmişte almadığı hisselerin bugünkü değerini görür. Watchlist, market data ve portföy takibi sunar. Finance dashboard estetiği hakimdir: kompakt, veri yoğun, sayısal odaklı. Bloomberg/TradingView benzeri profesyonel bir his verir ama daha yumuşak ve modern.

Arka plan derin lacivert-siyah tonlarında, üzerinde emerald (yeşil) ve cyan (mavi) radial gradient lekeleri yüzer. Bu iki renk finans dünyasındaki "yükseliş/pozitif" ve "veri/bilgi" anlamlarını taşır. Kartlar glass efektli, hafif transparan, border'ları çok düşük opaklıklı beyaz. Genel atmosfer: karanlık oda, parlayan yeşil ekranlar.

**Temel Karakteristikler:**
- **Font**: Space Grotesk — teknik, sayısal, monospace-vari ama proportional. Finansal verilere bilinçli seçim. Mono font olarak IBM Plex Mono / JetBrains Mono
- **Renk stratejisi**: Emerald birincil vurgu (#10b981), Cyan ikincil vurgu (#0ea5e9). shadcn/ui benzeri HSL token sistemi
- **Efekt sistemi**: Glassmorphism (backdrop-blur + düşük opaklıklı beyaz bg), gradient border trick, card hover glow
- **Animasyon felsefesi**: CSS-only (Framer Motion yok). Shimmer skeleton, float, glow salınımı, ticker scroll, live-dot ping — hepsi Tailwind keyframes veya index.css'te tanımlı
- **Tema**: Dark-only tasarım (light mode minimal düzeyde desteklenir, ana deneyim dark)
- **Altyapı**: Docker + PostgreSQL (local), Go backend (JWT auth, REST API)

---

## 2. Color Palette & Roles

### HSL Token Sistemi (shadcn/ui stili — `:root` scope)

| Token | HSL | HEX | Kullanım |
|-------|-----|-----|----------|
| `--background` | 204 42% 7% | `#0b1420` | Ana sayfa arka planı — derin lacivert |
| `--foreground` | 210 40% 96% | `#ecf0f6` | Varsayılan metin rengi |
| `--card` | 204 34% 10% | `#111e2e` | Kart arka planı |
| `--popover` | 204 34% 10% | `#111e2e` | Popover arka planı (card ile aynı) |
| `--primary` | 160 84% 39% | `#10b981` | Birincil vurgu — Emerald yeşil |
| `--primary-foreground` | 205 47% 8% | `#0b1420` | Primary üzerindeki metin |
| `--secondary` | 199 89% 48% | `#0ea5e9` | İkincil vurgu — Cyan mavi |
| `--secondary-foreground` | 204 42% 7% | `#0b1420` | Secondary üzerindeki metin |
| `--muted` | 205 23% 16% | `#1e2d3e` | Sessiz arka plan (disabled, vb.) |
| `--muted-foreground` | 214 18% 67% | `#94a8bc` | Silik metin, placeholder |
| `--border` | 205 22% 18% | `#213043` | Standart kenarlık |
| `--ring` | 160 84% 39% | `#10b981` | Focus ring — emerald |
| `--radius` | — | `1rem` | Varsayılan border-radius |

### index.css Ek CSS Variables

| Token | HEX | Kullanım |
|-------|-----|----------|
| `--bg-base` | `#0a0f1e` | En derin arka plan katmanı |
| `--bg-card` | `#101828` | Kart yüzeyi |
| `--bg-raised` | `#182036` | Yükseltilmiş yüzey (hover, active) |
| `--border` | `#1e3044` | Kenarlık (hex override) |
| `--gold` | `#10b981` | Vurgu rengi alias (emerald) |
| `--text-primary` | `#ecf2ff` | Birincil metin |

### Tailwind Custom Renkler

```ts
// tailwind.config.js → theme.extend.colors
success: { DEFAULT: "#00C896", light: "#00E6AC", dark: "#00A67A" },
danger:  { DEFAULT: "#FF4757", light: "#FF6B7A", dark: "#E63946" },
surface: { DEFAULT: "#12121A", light: "#1A1A26", dark: "#0A0A0F" },
```

### Durum Renkleri (Finance Bağlamı)

| Durum | Renk | HEX | Kullanım |
|-------|------|-----|----------|
| Pozitif/Kâr | Success Green | `#00C896` | Fiyat artışı, kâr yüzdesi |
| Negatif/Zarar | Danger Red | `#FF4757` | Fiyat düşüşü, zarar yüzdesi |
| Nötr/Bilgi | Cyan | `#0ea5e9` | Bilgi badge, ikincil veri |
| Emerald Vurgu | Primary | `#10b981` | CTA, aktif durum, ring |

### Sayfa Arka Plan Kodu

```css
/* Dark (ana) */
body {
  background-color: var(--bg-base); /* #0a0f1e */
  background-image:
    radial-gradient(circle at 20% 10%, rgba(16,185,129,0.12), transparent 38%),
    radial-gradient(circle at 80% 5%,  rgba(14,165,233,0.14), transparent 42%),
    radial-gradient(circle at 50% 90%, rgba(16,185,129,0.08), transparent 44%);
  background-attachment: fixed;
  /* Mobilde scroll'a döndür: background-attachment: scroll */
}

/* Light (düşük opaklık) */
body {
  background-image:
    radial-gradient(circle at 20% 0%,  rgba(16,185,129,0.07), transparent 38%),
    radial-gradient(circle at 80% 5%,  rgba(14,165,233,0.08), transparent 42%),
    radial-gradient(circle at 50% 90%, rgba(16,185,129,0.04), transparent 44%);
}
```

---

## 3. Typography Rules

### Font Ailesi

- **Sans**: Space Grotesk — ağırlıklar: 400, 500, 600, 700. Teknik, geometrik, sayılara uygun
- **Fallback**: Manrope, system-ui, sans-serif
- **Mono**: IBM Plex Mono — ağırlıklar: 400, 500, 600. Alternatif: JetBrains Mono
- **text-rendering**: optimizeLegibility
- `-webkit-font-smoothing: antialiased`

### Finansal Veri Tipografisi

```css
/* Tüm sayısal değerler — tabular-nums ile hizalama */
.number, [data-number] {
  font-variant-numeric: tabular-nums;
  font-family: "Space Grotesk", "IBM Plex Mono", monospace;
}

/* Pozitif sayı */
.number-positive {
  color: var(--success); /* #00C896 */
  font-weight: 600;
}

/* Negatif sayı */
.number-negative {
  color: var(--danger); /* #FF4757 */
  font-weight: 600;
}
```

### Hiyerarşi

| Rol | Font | Boyut | Ağırlık | Satır Yüksekliği | Letter Spacing | Not |
|-----|------|-------|---------|-------------------|----------------|-----|
| Dashboard Başlık | Space Grotesk | 1.875rem (30px) | 700 | 1.2 | -0.02em | Sayfa başlıkları |
| Section Heading | Space Grotesk | 1.25rem (20px) | 600 | 1.3 | -0.01em | Kart grubu başlıkları |
| Card Title | Space Grotesk | 1rem (16px) | 600 | 1.4 | -0.01em | Kart başlığı |
| Body | Space Grotesk | 0.875rem (14px) | 400 | 1.5 | 0 | Genel metin |
| Caption | Space Grotesk | 0.75rem (12px) | 500 | 1.4 | 0.01em | Alt yazı, etiket |
| Financial Value | Space Grotesk | 1.5rem (24px) | 700 | 1.1 | -0.02em | Büyük fiyat gösterimi, tabular-nums |
| Ticker/Small Num | IBM Plex Mono | 0.8125rem (13px) | 500 | 1.3 | 0 | Küçük fiyat, yüzde, tabular-nums |
| Code/Data | IBM Plex Mono | 0.75rem (12px) | 400 | 1.5 | 0 | Teknik veri |

### Prensipler

- Tüm sayısal veriler `font-variant-numeric: tabular-nums` ile gösterilir — hizalama bozulmamalı
- Finance değerleri (fiyat, yüzde) her zaman `font-weight: 600` veya `700`
- Pozitif/negatif renk kodlaması tipografi ile entegre: `.number-positive`, `.number-negative`
- Space Grotesk'in geometrik karakteri sayıları doğal olarak okunabilir kılar

---

## 4. Component Stylings

### Butonlar

**Primary (Emerald CTA)**
- Background: `hsl(var(--primary))` — `#10b981`
- Text: `hsl(var(--primary-foreground))` — koyu lacivert
- Padding: `0.625rem 1.25rem` (10px 20px)
- Radius: `var(--radius)` — 1rem
- Hover: `brightness(1.1)`, hafif scale `1.02`
- Active: `brightness(0.95)`, scale `0.98`
- Transition: `all 150ms ease`

**Ghost / Secondary**
- Background: transparent
- Text: `hsl(var(--muted-foreground))` — `#94a8bc`
- Border: `1px solid hsl(var(--border))` — `#213043`
- Hover: `background: hsl(var(--muted))` — `#1e2d3e`
- Radius: `var(--radius)`

**Pill / Badge**
- Background: `rgba(16,185,129,0.12)` (emerald tinted) veya `rgba(14,165,233,0.12)` (cyan tinted)
- Text: ilgili vurgu rengi
- Padding: `0.25rem 0.75rem`
- Radius: `9999px`
- Font-size: `0.75rem`, weight: `600`

### Kartlar & Container'lar

**Glass Card (Ana kart stili)**

```css
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: var(--radius); /* 1rem */
  transition: box-shadow 300ms ease, border-color 300ms ease;
}
```

**Tailwind backgroundImage — glass preset:**

```ts
backgroundImage: {
  glass: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
}
```

**Card Hover Glow Varyantları**

```css
.card-glow-green:hover {
  box-shadow: 0 0 0 1px rgba(16,185,129,0.15), 0 8px 40px -12px rgba(16,185,129,0.25);
}
.card-glow-blue:hover {
  box-shadow: 0 0 0 1px rgba(14,165,233,0.15), 0 8px 40px -12px rgba(14,165,233,0.25);
}
.card-glow-red:hover {
  box-shadow: 0 0 0 1px rgba(255,71,87,0.15), 0 8px 40px -12px rgba(255,71,87,0.25);
}
.card-glow-gold:hover {
  box-shadow: 0 0 0 1px rgba(245,158,11,0.15), 0 8px 40px -12px rgba(245,158,11,0.25);
}
```

**Gradient Border (İki katmanlı trick)**

```css
.gradient-border {
  background: linear-gradient(var(--background), var(--background)) padding-box,
              linear-gradient(135deg, #10b981, #38bdf8) border-box;
  border: 2px solid transparent;
  border-radius: var(--radius);
}
```

### Input & Form

- Background: `hsl(var(--muted))` — `#1e2d3e`
- Border: `1px solid hsl(var(--border))` — `#213043`
- Focus ring: `ring-2 ring-[hsl(var(--ring))]` — emerald
- Placeholder: `hsl(var(--muted-foreground))` — `#94a8bc`
- Radius: `var(--radius)` — 1rem
- Transition: `border-color 150ms, box-shadow 150ms`

### Navigasyon

- Finance dashboard stili sidebar/topbar
- Background: `var(--bg-card)` — `#101828`
- Active link: emerald sol border veya emerald tinted background
- İkon + metin kombine, kompakt spacing

### Finance Özel Bileşenler

**Ticker Scroll Bandı**

```css
.ticker-scroll {
  animation: ticker 30s linear infinite;
  white-space: nowrap;
}
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

**Canlı Veri Göstergesi (Live Dot)**

```css
.live-dot {
  position: relative;
  width: 8px;
  height: 8px;
  background: var(--success); /* #00C896 */
  border-radius: 50%;
}
.live-dot::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--success);
  animation: live-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes live-ping {
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
```

**Skeleton Shimmer**

```css
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background: hsl(var(--muted));
}
.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 25%,
    rgba(255,255,255,0.08) 37%,
    transparent 63%
  );
  animation: skeleton-wave 1.8s ease-in-out infinite;
}
@keyframes skeleton-wave {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## 5. Layout Principles

### Spacing Sistemi

- Base unit: `4px` (Tailwind varsayılanı)
- Kart içi padding: `1rem` (16px) — `1.5rem` (24px)
- Kart arası gap: `1rem` — `1.5rem`
- Section arası boşluk: `2rem` — `3rem`

### Grid & Container

- Max content width: `1280px` (xl breakpoint)
- Container padding: `1rem` mobil, `1.5rem` tablet, `2rem` desktop
- Dashboard grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Sidebar genişliği: `240px` (daraltılmış: `64px`)

### Whitespace Felsefesi

- Finance dashboard: kompakt ama nefes alabilir. Her piksel bilgi taşımalı
- Kartlar arası 16px gap yeterli — daha fazla boşluk gereksiz
- Veri tabloları sıkı, grafikler geniş alan kaplar
- Mobilde tek kolon, her kart tam genişlik

### Border Radius Scale

| İsim | Değer | Kullanım |
|------|-------|----------|
| sm | 0.5rem | Badge, küçük input, pill |
| md | 0.75rem | Button, dropdown |
| DEFAULT | 1rem (`var(--radius)`) | Kart, dialog, ana container |
| lg | 1.25rem | Büyük panel, modal |
| full | 9999px | Avatar, status dot, pill badge |

---

## 6. Depth & Elevation

| Seviye | Shadow | Kullanım |
|--------|--------|----------|
| Flat (0) | Yok | Sayfa arka planı, inline metin |
| Surface (1) | `0 1px 3px rgba(0,0,0,0.3)` | Standart kartlar |
| Elevated (2) | `0 4px 16px rgba(0,0,0,0.4)` | Hover kartlar, dropdown |
| Glow (2+) | Renk bazlı glow (bkz. Card Hover Glow) | Aktif/hover kartlar |
| Overlay (3) | `0 16px 48px rgba(0,0,0,0.5)` | Modal, dialog, popover |

### Glassmorphism Sistemi

```css
/* Ana glass efekt */
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: var(--radius);
}

/* Tailwind backgroundImage preset */
backgroundImage: {
  glass: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
}
```

### Dekoratif Derinlik

- Sayfa arka planında 3 katmanlı radial gradient (emerald + cyan)
- Card hover'da renk bazlı glow (yeşil/mavi/kırmızı/altın varyantları)
- Gradient border: emerald -> cyan 135deg açıyla, iki katmanlı background trick
- `background-attachment: fixed` ile gradient'lar scroll'a bağlı değil (mobil hariç)

---

## 7. Do's and Don'ts

### Do

- Tüm sayısal verilerde `font-variant-numeric: tabular-nums` kullan
- Pozitif değerlerde success rengi (#00C896), negatif değerlerde danger rengi (#FF4757) kullan — her zaman `font-weight: 600`
- Kartlarda `glass-card` stili uygula (backdrop-blur + düşük opaklıklı beyaz bg + ince border)
- HSL token'larını `hsl(var(--token))` formatında kullan (shadcn/ui pattern)
- Canlı veri göstergelerinde `.live-dot` ping animasyonu ekle
- Yükleme durumlarında shimmer skeleton kullan (1.8s sweep)
- `background-attachment: fixed` mobilde `scroll`'a döndür
- Her financial değeri React CountUp ile animate et (1.5s duration)
- Sonner toast kullan bildirimler için
- Zustand store'larını küçük ve odaklı tut
- TanStack React Query ile server state'i yönet, Zustand'a kopyalama
- Gradient border'ı önemli kartlarda (portfolio summary, watchlist header) kullan
- DB schema değişiklikleri yeni migration dosyası ile yapılmalı — eski migration'ları değiştirme
- Her frontend değişikliğinde `npm run lint + build` çalıştır
- Büyük statik veri bloklarını `lib/constants`'a taşı

### Don't

- Hardcoded renk değeri kullanma — her zaman CSS variable/token
- `console.log` commit'e gitmemeli
- Framer Motion kullanma — bu projede CSS animasyonları + Tailwind keyframes
- next-themes kullanma — bu proje Next.js değil, React + Vite
- `any` tipi kullanma — `unknown` tercih et
- Kart arka planını opak yapma — her zaman glass efekt (düşük opaklıklı)
- Sayısal verilerde proportional font kullanma — tabular-nums zorunlu
- `background-attachment: fixed` mobilde bırakma — scroll'a çevir
- Büyük statik veri bloklarını component içinde tutma — `lib/constants`'a taşı
- Runtime'da dış hotlink görsel kullanma — local assets
- Eski migration dosyalarını değiştirme — her zaman yeni dosya oluştur

---

## 8. Responsive Behavior

### Breakpoints (Tailwind v3 varsayılan)

| İsim | Genişlik | Değişiklikler |
|------|----------|---------------|
| Mobile | <640px | Tek kolon grid, sidebar gizli, ticker küçülür, `background-attachment: scroll` |
| sm | 640px | İki kolon grid başlar, spacing artar |
| md | 768px | Dashboard grid 2 kolon, sidebar daraltılmış (64px) |
| lg | 1024px | 3 kolon grid, sidebar açık (240px), grafik kartları genişler |
| xl | 1280px | 4 kolon grid, max-width container, tam deneyim |

### Dokunma Hedefleri

- Minimum dokunma alanı: `44px x 44px` (WCAG 2.5.5)
- Buton minimum yükseklik: `40px`
- Tablo satırları mobilde: minimum `48px` yükseklik
- İkonlu butonlarda padding: en az `0.75rem`

### Daraltma Stratejisi

- Dashboard kartları: `grid-cols-1 -> 2 -> 3 -> 4` breakpoint'lere göre
- Sidebar: mobilde hamburger menü, tablette daraltılmış ikon-only (64px), desktop'ta tam genişlik (240px)
- Grafik kartları: mobilde tam genişlik, yükseklik `200px -> 300px`
- Ticker bandı: mobilde `font-size` küçülür, hız aynı kalır
- Tablo: mobilde yatay scroll veya kart görünümüne geçiş
- `background-attachment: fixed` -> mobilde `scroll` (iOS performans sorunu)

---

## 9. Agent Prompt Guide

### Hızlı Renk Referansı

- **Primary CTA**: `#10b981` (emerald) — butonlar, aktif durum, ring
- **Secondary accent**: `#0ea5e9` (cyan) — bilgi badge, ikincil vurgu
- **Background**: `#0b1420` (koyu lacivert) — sayfa arka plan
- **Card bg**: `rgba(255,255,255,0.05)` glass efekt — `#111e2e` fallback
- **Heading text**: `#ecf2ff` — parlak beyaz, hafif mavi tint
- **Body text**: `#94a8bc` — sessiz mavi-gri
- **Border**: `#213043` — koyu lacivert-gri
- **Success (kar)**: `#00C896` — yeşil, pozitif sayılar
- **Danger (zarar)**: `#FF4757` — kırmızı, negatif sayılar

### Örnek Component Prompt'ları

**Portfolio Summary Card:**
> "Glass card (`rgba(255,255,255,0.05)`, `backdrop-blur`, `1px solid rgba(255,255,255,0.10)`, `border-radius: 1rem`). Üstte başlık 'Portföy Özeti' Space Grotesk 600, `#ecf2ff`. Ana değer büyük `1.5rem 700 tabular-nums`. Değişim yüzdesi `#00C896` pozitif veya `#FF4757` negatif, `font-weight: 600`. Gradient border: `linear-gradient(135deg, #10b981, #38bdf8)`. Hover'da `card-glow-green`."

**Watchlist Ticker Bandı:**
> "Tam genişlik, `overflow: hidden`. İçeride `ticker-scroll` animasyonu `30s linear infinite`. Her ticker item: sembol IBM Plex Mono 500, fiyat Space Grotesk tabular-nums 600, yüzde değişim renk kodlu (yeşil/kırmızı). Aralarında `rgba(255,255,255,0.10)` dikey çizgi ayracı."

**Hisse Detay Sayfası:**
> "Sol tarafta Lightweight Charts mum grafiği (TradingView benzeri), sağ tarafta glass card'lar içinde finansal metrikler. Canlı fiyat üzerinde `.live-dot` ping animasyonu. Büyük fiyat değeri React CountUp ile animasyonlu (1.5s). Tüm sayılar tabular-nums."

**Skeleton Loading State:**
> "Kart yapısını koruyarak `.skeleton-shimmer` uygula. Arka plan `hsl(var(--muted))` `#1e2d3e`. Shimmer sweep `1.8s ease-in-out infinite`, gradient `linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.08) 37%, transparent 63%)`. Başlık için `h-4 w-32`, değer için `h-8 w-24`, grafik alanı için `h-48 w-full` placeholder."

**Empty State / Kutlama:**
> "Hedef tamamlandığında React Confetti efekti. Success state: emerald tonlu glass card, ortada büyük check ikonu, React CountUp ile kar animasyonu."

### İterasyon Rehberi

1. Önce renk token'larını CSS variable olarak tanımla (HSL formatı, shadcn/ui stili)
2. Glass card stilini base component olarak oluştur — tüm kartlar bundan türesin
3. Sayısal veri bileşenlerini `tabular-nums` + renk kodlamalı (pozitif/negatif) yap
4. Animasyonları CSS keyframes ile tanımla — Framer Motion kullanma
5. Skeleton shimmer'ı her asenkron veri yükleme noktasına ekle
6. Hover glow varyantlarını kart tipine göre seç (yeşil: kar, mavi: bilgi, kırmızı: uyarı)
7. Mobil önce test et — `background-attachment` ve sidebar davranışını kontrol et
8. Recharts grafikleri tema renkleriyle uyumlu olmalı — emerald/cyan stroke, `rgba` fill

---

## Teknoloji Notu

| Katman | Seçim | Not |
|--------|-------|-----|
| Frontend Framework | React + Vite | Next.js DEĞİL — SPA mimarisi |
| Backend | Go | JWT auth, REST API |
| Stil | Tailwind CSS v3 | `tailwind.config.js` mevcut, `darkMode` yok (dark-only) |
| Animasyon | CSS Animations + Tailwind keyframes | Framer Motion yok |
| Tema Sistemi | CSS Variables (HSL, shadcn/ui stili) | next-themes yok |
| State | Zustand (client) + TanStack React Query (server) | Axios ile Go backend'e istek |
| HTTP | Axios | Go backend'e istekler |
| Grafik | Recharts (genel) + Lightweight Charts (mum) | TradingView benzeri |
| Sayı Animasyonu | React CountUp | 1.5s duration |
| Toast | Sonner | react-hot-toast değil |
| Kutlama | React Confetti | Hedef tamamlandığında |
| DB | PostgreSQL (Docker) | Neon serverless değil — local Docker |
| Auth | JWT (Go tarafı) | next-auth değil |
| İkon | react-icons | lucide-react değil |
| Deployment | Docker Compose | Vercel değil |

### Scrollbar

```css
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(16,185,129,0.3);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(16,185,129,0.5);
}
```

### Tailwind Animasyon Config

```ts
// tailwind.config.js → theme.extend
animation: {
  shimmer: "shimmer 2s infinite",
  float:   "float 3s ease-in-out infinite",
  glow:    "glow 2s ease-in-out infinite",
},
keyframes: {
  shimmer: {
    "0%":   { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
  float: {
    "0%, 100%": { transform: "translateY(0)" },
    "50%":      { transform: "translateY(-10px)" },
  },
  glow: {
    "0%, 100%": { boxShadow: "0 0 8px rgba(16,185,129,0.45)" },
    "50%":      { boxShadow: "0 0 22px rgba(14,165,233,0.65)" },
  },
},
```
