# Görsel Hafıza: Keşke Alsaydım

> **Kaynak:** `~/Desktop/Projects/keskealsaydim/frontend/src/index.css`,
> `tailwind.config.js`, `components/ui/` — doğrulandı 2026-08-17 (uçtan uca revizyon sonrası)

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
- **Font**: Archivo — küçük punto okunabilirliği ve gerçek tablo rakamları için
  çizilmiş grotesk. Mono font IBM Plex Mono
- **Renk stratejisi**: Emerald birincil vurgu, Cyan ikincil vurgu. shadcn/ui benzeri
  HSL token sistemi; her token'ın açık ve koyu karşılığı var
- **Efekt sistemi**: Glass yüzeyler `--glass-fill` / `--hairline` kanalları üzerinden
  tanımlı — açık temada beyaz yerine mürekkeple tonlanır, aynı sınıf iki temada da çalışır
- **Animasyon felsefesi**: Yalnızca giriş animasyonu. `components/Motion.tsx` içindeki
  `FadeIn` / `PageTransition`, marka eğrisiyle (`--ease-brand`), tek seferlik.
  `prefers-reduced-motion` açıkken tamamen devre dışı. Sonsuz ambient animasyon yok
- **Tema**: Açık ve koyu tam destekli. `index.html`'deki satır içi script depolanan
  temayı ilk boyamadan önce uygular — tema geçişinde flash olmaz
- **Altyapı**: Neon PostgreSQL (serverless), Go backend Vercel fonksiyonları olarak,
  Upstash Redis önbellek. Docker kaldırıldı

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

### Yüzey ve Doku Token'ları

| Token | Koyu | Açık | Kullanım |
|-------|------|------|----------|
| `--surface` | 204 36% 9% | 0 0% 100% | Kenar çubuğu, başlık çubuğu |
| `--surface-raised` | 204 30% 13% | 210 30% 96% | Sekme şeridi, tablo başlığı |
| `--surface-overlay` | 204 34% 11% | 0 0% 100% | Popover, dialog |
| `--hairline` | 255 255 255 | 12 24 34 | Cam kenarlık **kanalı** (RGB) |
| `--glass-fill` | 255 255 255 | 12 24 34 | Cam dolgu **kanalı** (RGB) |
| `--ease-brand` | `cubic-bezier(0.22, 1, 0.36, 1)` | aynı | Tüm geçişlerin varsayılan eğrisi |

> `--hairline` ve `--glass-fill` HSL değil **RGB kanalı** tutar; `rgb(var(--hairline) / 0.08)`
> biçiminde kullanılır. Açık temada beyaza değil mürekkebe döner, cam efekti bu yüzden
> iki temada da doğru okunur.

### Durum Renkleri (Finance Bağlamı)

Sabit hex **kullanılmaz** — hepsi token, çünkü beyaz zeminde koyu tema yeşili kontrast
eşiğini geçmiyordu.

| Durum | Token | Koyu | Açık | Kullanım |
|-------|-------|------|------|----------|
| Pozitif/Kâr | `--success` | 162 88% 40% | 162 88% 27% | Fiyat artışı, kâr |
| Negatif/Zarar | `--danger` | 355 85% 62% | 355 78% 47% | Fiyat düşüşü, zarar |
| Uyarı | `--warning` | 38 92% 55% | 32 90% 38% | Bayat veri, kısmi sonuç |
| Nötr/Bilgi | `--secondary` | 199 89% 48% | 199 89% 38% | Bilgi rozeti, ikincil seri |
| Vurgu | `--primary` | 160 84% 39% | 160 84% 30% | CTA, aktif durum, ring |

> Grafikler bu token'ları `useChartPalette()` ile okur; Recharts Tailwind sınıfı
> alamadığı için renkler tema değişiminde yeniden hesaplanır.

### Sayfa Arka Plan Kodu

Gradient lekeleri token'lardan türer, sabit rgba'dan değil — böylece açık temada
kendiliğinden yumuşar.

```css
body {
  background-color: hsl(var(--background));
  background-image:
    radial-gradient(circle at 20% 10%, hsl(var(--primary)   / 0.12), transparent 38%),
    radial-gradient(circle at 80% 5%,  hsl(var(--secondary) / 0.14), transparent 42%),
    radial-gradient(circle at 50% 90%, hsl(var(--primary)   / 0.08), transparent 44%);
  background-attachment: fixed;
}

/* Açık temada aynı lekeler, düşük opaklıkta */
.light body {
  background-image:
    radial-gradient(circle at 20% 0%,  hsl(var(--primary)   / 0.07), transparent 38%),
    radial-gradient(circle at 80% 5%,  hsl(var(--secondary) / 0.08), transparent 42%),
    radial-gradient(circle at 50% 95%, hsl(var(--primary)   / 0.05), transparent 44%);
}

/* iOS'ta fixed her scroll karesinde tüm viewport'u yeniden boyar */
@media (max-width: 768px) {
  body { background-attachment: scroll; }
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

- **Sans**: Archivo — ağırlıklar: 400, 500, 600, 700. Küçük punto okunabilirliği ve
  gerçek tablo rakamları (`tnum`) için çizilmiş grotesk; veri yoğun finans ekranının
  ihtiyacı budur
- **Fallback**: system-ui, -apple-system, sans-serif
- **Mono**: IBM Plex Mono — ağırlıklar: 400, 500, 600
- `-webkit-font-smoothing: antialiased`

> **Neden Space Grotesk değil:** 2026-08 itibarıyla Space Grotesk (Inter, Roboto,
> Geist, Plus Jakarta Sans ile birlikte) AI üretimi arayüzlerde aşırı yaygınlaştı ve
> ayırt ediciliğini yitirdi. Archivo aynı teknik/sayısal karakteri korurken ürüne
> kendine ait bir duruş verir. Türkçe diakritikler (ı, İ, ş, ğ, ç, ü, ö) ve ₺ işareti
> latin/latin-ext alt kümelerinde tam kapsanır — doğrulandı.

### Finansal Veri Tipografisi

```css
/* Tüm sayısal değerler — tabular-nums ile hizalama */
.number, [data-number] {
  font-variant-numeric: tabular-nums;
  font-family: "Archivo", "IBM Plex Mono", monospace;
}

/* Pozitif sayı */
.number-positive {
  color: hsl(var(--success)); /* koyu 162 88% 40% · açık 162 88% 27% */
  font-weight: 600;
}

/* Negatif sayı */
.number-negative {
  color: hsl(var(--danger));  /* koyu 355 85% 62% · açık 355 78% 47% */
  font-weight: 600;
}
```

### Hiyerarşi

| Rol | Font | Boyut | Ağırlık | Satır Yüksekliği | Letter Spacing | Not |
|-----|------|-------|---------|-------------------|----------------|-----|
| Dashboard Başlık | Archivo | 1.875rem (30px) | 700 | 1.2 | -0.02em | Sayfa başlıkları |
| Section Heading | Archivo | 1.25rem (20px) | 600 | 1.3 | -0.01em | Kart grubu başlıkları |
| Card Title | Archivo | 1rem (16px) | 600 | 1.4 | -0.01em | Kart başlığı |
| Body | Archivo | 0.875rem (14px) | 400 | 1.5 | 0 | Genel metin |
| Caption | Archivo | 0.75rem (12px) | 500 | 1.4 | 0.01em | Alt yazı, etiket |
| Financial Value | Archivo | 1.5rem (24px) | 700 | 1.1 | -0.02em | Büyük fiyat gösterimi, tabular-nums |
| Ticker/Small Num | IBM Plex Mono | 0.8125rem (13px) | 500 | 1.3 | 0 | Küçük fiyat, yüzde, tabular-nums |
| Code/Data | IBM Plex Mono | 0.75rem (12px) | 400 | 1.5 | 0 | Teknik veri |

### Prensipler

- Tüm sayısal veriler `font-variant-numeric: tabular-nums` ile gösterilir — hizalama bozulmamalı
- Finance değerleri (fiyat, yüzde) her zaman `font-weight: 600` veya `700`
- Pozitif/negatif renk kodlaması tipografi ile entegre: `.number-positive`, `.number-negative`
- Archivo'nun `tnum` tablo rakamları sütun hizasını korur; `[data-numeric]`, `table`
  ve `.tabular` seçicileri bunu global olarak açar

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
- Background: `bg-surface` (koyu 204 36% 9% · açık beyaz), başlık çubuğunda `/85` + `backdrop-blur-xl`
- Active link: emerald sol border veya emerald tinted background
- İkon + metin kombine, kompakt spacing

### Finance Özel Bileşenler

**Piyasa Listesi Satırı**

Sonsuz kayan ticker bandı kaldırıldı: dikkat dağıtıyordu, `prefers-reduced-motion`
ile uyumsuzdu ve okunmak için beklemeyi gerektiriyordu. Yerine sıralanabilir,
aranabilir statik liste var.

```tsx
<li>
  <button className="flex w-full items-center justify-between gap-3 py-3
                     text-left transition-colors hover:bg-accent/50">
    <span className="text-sm font-medium">{symbol}</span>
    <span data-numeric className="text-sm font-semibold">{price}</span>
    <ChangeBadge value={changePercent} size="sm" />
  </button>
</li>
```

**Canlı Veri Göstergesi (Live Dot)**

```css
.live-dot {
  position: relative;
  width: 8px;
  height: 8px;
  background: hsl(var(--success));
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
- Pozitif/negatif değerlerde `text-success` / `text-danger` token'larını kullan, sabit hex yazma
- Kartlarda `glass-card` stili uygula (backdrop-blur + düşük opaklıklı beyaz bg + ince border)
- HSL token'larını `hsl(var(--token))` formatında kullan (shadcn/ui pattern)
- Canlı veri göstergelerinde `.live-dot` ping animasyonu ekle
- Yükleme durumlarında shimmer skeleton kullan (1.8s sweep)
- `background-attachment: fixed` mobilde `scroll`'a döndür
- Para ve yüzdeleri `<Money>` / `<Percent>` / `<ChangeBadge>` ile bas — işaret, renk ve
  para birimi mantığı tek yerde
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

### Hızlı Sınıf Referansı

Hex yazmayın. Aşağıdaki semantik sınıflar iki temada da doğru sonucu verir; sabit
renk yazmak açık temayı bozar.

| Amaç | Sınıf |
|------|-------|
| Sayfa zemini | `bg-background` |
| Kart | `bg-card border border-border` |
| Yükseltilmiş yüzey | `bg-surface-raised` |
| Cam yüzey | `glass-card` |
| Başlık metni | `text-foreground` |
| Sessiz metin | `text-muted-foreground` |
| Birincil vurgu | `bg-primary text-primary-foreground` |
| İkincil vurgu | `text-secondary` |
| Kâr | `text-success` |
| Zarar | `text-danger` |
| Uyarı | `text-warning` |
| Odak halkası | `ring-ring` |

### Örnek Component Prompt'ları

**Portföy Özeti Kartı:**
> "`<Card>` içinde başlık `<CardTitle>`, ana değer `text-2xl font-semibold tracking-tight`
> ve `data-numeric` (tablo rakamları için). Tutarı `<Money value={...} />`, kâr/zararı
> `<Money value={...} signed />` ile bas — işaret ve renk bileşenden gelir, elle
> `+`/`text-green` yazma. Değişim yüzdesi için `<ChangeBadge value={...} />`."

**İzleme Listesi Satırı:**
> "`<Card>` içinde sembol `text-sm font-semibold`, şirket adı `text-xs text-muted-foreground
> truncate`. Fiyat `<Money price currency={item.currency} />`. Fiyat gelmediyse `0` basma,
> `<UnavailableValue />` kullan. Sağda `<ChangeBadge>`, en sağda `<DropdownMenu>` ile
> karşılaştır / alarm kur / portföye ekle / sil."

**Hisse Detay Sayfası:**
> "Üstte `<PageHeader>` + eylem butonları. Altında istatistik kartı, sonra Recharts
> `<AreaChart>`; renkleri `useChartPalette()`'ten al, `isAnimationActive={false}`.
> Aralık seçimi `<Tabs>` ile. Yükleme `<ShimmerBlock>`, hata `<ErrorState onRetry>`."

**Yükleme / Boş / Hata Durumları:**
> "Üçü ayrı: yükleme `<ShimmerTable>` veya `<ShimmerStats>`, boş sonuç `<EmptyState>`,
> başarısız istek `<ErrorState onRetry>`. Hata durumunda boş durum gösterme — kullanıcıya
> 'veriniz yok' demek ile 'veriniz yüklenemedi' demek aynı şey değil."

**Onay / Yıkıcı Eylem:**
> "Silme, kapatma gibi geri alınamaz eylemlerde `<ConfirmDialog destructive>` kullan.
> Doğrudan tetikleme yok. Silme sonrası liste `useMutation`'ın `onMutate` iyimser
> güncellemesiyle anında tazelenir, hata olursa geri alınır."

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
| Stil | Tailwind CSS v3 | `darkMode: ["class"]` — açık/koyu tam destekli |
| Animasyon | Framer Motion | Yalnızca giriş; `components/Motion.tsx`, reduced-motion duyarlı |
| Tema Sistemi | CSS Variables (HSL, shadcn/ui stili) + Zustand | next-themes yok; flash önleyici satır içi script `index.html`'de |
| Primitifler | Radix UI | dialog, select, tabs, tooltip, dropdown, separator |
| State | Zustand (oturum, tema) + TanStack React Query (sunucu) | Sunucu durumunu Zustand'a kopyalama |
| HTTP | Axios | Interceptor'da token yenileme + sekmeler arası eşitleme |
| Grafik | Recharts | Renkler `useChartPalette()` ile token'lardan; Lightweight Charts kaldırıldı |
| Sayı Gösterimi | `components/ui/value.tsx` | `<Money>`, `<Percent>`, `<ChangeBadge>`; CountUp kaldırıldı |
| Toast | Sonner | Tema token'larıyla stillenmiş |
| DB | Neon PostgreSQL (serverless) | pgbouncer; prepared statement kapalı |
| Önbellek | Upstash Redis (REST) | Fiyat/arama önbelleği + auth hız sınırı |
| Auth | JWT (Go tarafı) | Access 30dk, refresh 7g ve her yenilemede döner |
| İkon | lucide-react | react-icons değil |
| Deployment | Vercel | 12 serverless fonksiyon tavanında; Docker kaldırıldı |

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
