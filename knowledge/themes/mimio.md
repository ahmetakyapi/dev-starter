# Görsel Hafıza: Mimio

> **Kaynak:** `/Users/ahmet/Desktop/Projects/Mimio/src/app/globals.css` — doğrulandı 2026-08-17

> Bu dosya DESIGN.md 9-section formatını takip eder.
> AI agent'ları bu dosyayı okuyarak pixel-perfect UI üretebilir.

Kaynak proje: `~/mimio` (GitHub: ahmetakyapi/Mimio)
Versiyon: Next.js 15, **Tailwind CSS v4** (`@theme` direktifi), Framer Motion 11, @neondatabase/serverless
Son revizyon: **Temmuz 2026 — "Mavi Baskı"** (indigo/mor → mavi + bej, degradeler kaldırıldı, varsayılan tema açık, M monogramı)

---

## 1. Visual Theme & Atmosphere

> **Temmuz 2026 — "Mavi Baskı" revizyonu.** Önceki indigo/mor
> glassmorphism yönü terk edildi. Gerekçe: o palet (indigo `#6366f1` +
> mor degrade + cam yüzey) her SaaS/AI arayüzünün varsayılanıydı; Mimio'yu
> bir CRM'den ayırt eden hiçbir şey taşımıyordu.

Mimio bir gösterge paneli değil, **seans sırasında elde tutulan bir klinik
araçtır**. Görsel dil bu yüzden soyut markalama yerine ürünün kendi
dünyasındaki iki gerçek nesneden türetilmiştir:

**1. Corsi blok aparatı** — masaya dizilmiş dokuz ahşap blok. Platformun en
çok oynanan görevi (Sıra Hafızası) tam olarak budur. Aynı nesne markanın
işareti, kahraman görseli ve oyun tahtası olur. İmza vurgu rengi **oker `#b8763a`** bu bloğun rengidir ve seyrek kullanılır.

**2. Değerlendirme kaydı** — kareli klinik kâğıt, persentil bantları, cetvel
çentikleri. Açık tema zemini (`#f4efe4`, soğuk yeşile çalan nötr gri) ve
başlık altı **cetvel çentiği motifi** buradan gelir.

Birincil renk **mürekkep mavisi `#1d5a8c`**: teknik çizimin, ölçmenin ve
klinik ciddiyetin rengi. İndigo/mor SaaS paletinden bilinçli uzaklık.
Varsayılan tema **açık** — terapist gündüz, aydınlık bir odada çalışır.

**Temel Karakteristikler:**
- **Font (tek grotesk + mono)**: Schibsted Grotesk her yerde — başlıktan
  düğme etiketine. Kontrast ikinci bir aileden değil, ağırlık (400-900) ve
  harf aralığından gelir. IBM Plex Mono yalnızca sayısal okumalarda (skor,
  süre, persentil, span).
- **Renk stratejisi**: Mavi birincil + oker imza + anlam renkleri
  (yosun/kiremit/arduvaz mavi). Birincil yeşil olduğu için "başarı" ayrı bir
  renge ayrıldı: orman yeşili `#3f7d4f`. Mavi yapı ve eylemi, bej zemini taşır.
- **Degrade YOK**: İki renkli degrade düğmeler, degrade başlıklar ve
  degrade yıkanmış kartlar kaldırıldı. Yerine düz dolgu + kılcal çerçeve.
- **Uydurma veri YOK**: Kartlardaki her grafik gerçek kayıttan türer. Veri
  yoksa grafik hiç çizilmez — dekoratif kıvılcım çizgisi yasak.
- **Zemin dokusu**: Bulanık "aurora" veya imleci takip eden spot yok; bej
  kâğıt üzerinde 112px'lik milimetrik ızgara (`.paper-grid`), yalnızca
  kahraman bölümünde.
- **Glassmorphism minimumda**: yalnızca sticky chrome katmanlarında
  (`backdrop-filter: blur(16-24px)`). Kartlar açık temada opak beyaz.
- **Animasyon felsefesi**: Framer Motion 11, fonksiyonel geçişler.
  Ease: `[0.22, 1, 0.36, 1]`. Tek orkestre anı: logodaki dokuz bloğun
  gerçek bir Corsi dizisi oynatması.
- **Dark/Light mod**: `data-theme="dark|light|high-contrast"` (HTML attribute).
  Custom ThemeProvider, `next-themes` kullanılmaz. Anti-FOUC inline script
  `<head>` içinde + `<html suppressHydrationWarning>`. localStorage key:
  `mimio-theme`. Varsayılan: sistem tercihi.
- **Bölge bazlı tema bağımsızlığı**: Oyun arenası (`.arena`) her temada koyu
  kalır — danışanın dikkati ekranın tek parlak yüzeyinde toplanmalı.

### Kritik: Tailwind v4 Farkı

`tailwind.config.ts` **yok**. Tüm tokenlar `globals.css` içinde `@theme {}`
bloğuyla tanımlanır:
```css
@import "tailwindcss";
@theme {
  --color-primary: #1d5a8c;
  --color-oak: #b8763a;
  /* tüm tokenlar burada */
}
```
Sınıf kullanımı: `bg-(--color-primary)` syntax'ı. `dark:` prefix **yok** —
tema geçişi CSS variable override ile çalışır.

### Anti-FOUC Script (layout.tsx)
```html
<script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mimio-theme');var v;if(t==='light'||t==='dark'||t==='high-contrast'){v=t}else{v=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme','dark');}` }} />
```
`<html>` üzerinde `suppressHydrationWarning` **şart** — script React'ten önce
`data-theme` yazar, bu kasıtlı bir sunucu/istemci farkıdır.

---

## 2. Color Palette & Roles

### Brand
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-primary` | `#1d5a8c` | `#1d5a8c` | Birincil vurgu, CTA, aktif durum |
| `--color-primary-hover` | `#17456e` | `#123252` | Hover durumu |
| `--color-primary-light` | `rgba(29,90,140,0.12)` | `rgba(29,90,140,0.09)` | Hafif arka plan vurgu |
| `--color-signal` | `#b8763a` | `#8f5626` | **İmza vurgusu** — blok rengi, cetvel çentiği. Seyrek! |
| `--color-signal-soft` | `#dda05e` | `#b8763a` | Meşe açık ton |

### Arka Plan / Yüzey
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-page-bg` | `#050b16` | `#f4efe4` | Ana sayfa arka planı |
| `--color-surface` | `rgba(255,255,255,0.035)` | `#fdfbf6` | Standart kart/panel |
| `--color-surface-strong` | `rgba(18,32,47,0.9)` | `#fdfbf6` | Modal, dropdown |
| `--color-surface-elevated` | `rgba(255,255,255,0.055)` | `#fdfbf6` | Yükseltilmiş yüzey |

> Açık temada yüzeyler **opak bej kâğıt** (`#fdfbf6`) — steril beyaz değil. Önceki sürümde yarı saydam lavanta
> kullanılıyordu; kartlar zeminden ayrışmıyor, kontrast AA'nın altına
> düşüyordu. Ayrım artık gölge + kılcal nötr çizgiyle kuruluyor.

### Metin Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-text-strong` | `#eef4fa` | `#0d2137` | Başlık, önemli metin |
| `--color-text-body` | `#c2ceda` | `#2b3f52` | Gövde metni |
| `--color-text-soft` | `#8fa1b2` | `#4a6072` | İkincil metin |
| `--color-text-muted` | `#69798a` | `#65788a` | Placeholder, devre dışı |

### Kenarlık & Çizgi
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-line` | `rgba(255,255,255,0.075)` | `rgba(13,33,55,0.10)` | Standart kenarlık |
| `--color-line-soft` | `rgba(255,255,255,0.04)` | `rgba(13,33,55,0.055)` | İnce ayırıcı |
| `--color-line-strong` | `rgba(255,255,255,0.13)` | `rgba(13,33,55,0.17)` | Belirgin kenarlık |
| `--color-line-focus` | `rgba(74,149,204,0.65)` | `rgba(29,90,140,0.70)` | Focus ring |

> Açık temada kenarlıklar **nötr**, marka renkli değil. Renkli kılcal çizgi
> her yüzeyi markaya boyayıp gürültü yaratıyordu.

### Chrome Katmanları
| Token | Dark | Light |
|-------|------|-------|
| `--color-sidebar` | `rgba(10,20,31,0.93)` | `#ffffff` |
| `--color-chrome-nav` | `rgba(12,22,32,0.92)` | `rgba(255,255,255,0.86)` |
| `--color-chrome-header` | `rgba(12,22,32,0.88)` | `rgba(255,255,255,0.82)` |

### Durum / Anlam Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--color-accent-green` | `#3f7d4f` | `#33663f` | Yosun — gelişme, başarı, pozitif |
| `--color-accent-amber` | `#b8763a` | `#8f5626` | Meşe — uyarı, dikkat gerektiren |
| `--color-accent-red` | `#a8392c` | `#8a2c21` | Kiremit — hata, kritik, silme |
| `--color-accent-teal` | `#5b7183` | `#465a6b` | Arduvaz mavi — nötr veri, bilgi |

### Beceri Alanı Renkleri
Bir oyun kartı, rapor çubuğu ve plan rozeti aynı beceri alanını gösteriyorsa
aynı rengi taşır.

| Token | Dark | Light | Alan |
|-------|------|-------|------|
| `--color-domain-memory` | `#dda05e` | `#8f5626` | Hafıza (oker) |
| `--color-domain-motor` | `#4a95cc` | `#1d5a8c` | Motor (mavi) |
| `--color-domain-visual` | `#8ba0b0` | `#465a6b` | Görsel algı (arduvaz) |
| `--color-domain-cognitive` | `#e2705f` | `#8a2c21` | Biliş (kızıl) |

### Shadow Scale
Gölgeler **nötr**; renkli halo yok (marka rengi gölgeye sızmaz).

| Token | Dark | Light |
|-------|------|-------|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)` | `0 1px 2px rgba(13,33,55,0.05), 0 1px 3px rgba(13,33,55,0.04)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.50)` | `0 4px 8px rgba(13,33,55,0.04), 0 16px 40px rgba(13,33,55,0.10)` |
| `--shadow-glow` | `0 8px 24px rgba(29,90,140,0.42), 0 0 0 1px rgba(74,149,204,0.18)` | `0 6px 20px rgba(29,90,140,0.28)` |

### Sayfa Arka Plan Kodu
```css
/* Dark */
background:
  radial-gradient(circle at 16% 8%, rgba(29,90,140,0.10), transparent 34%),
  radial-gradient(circle at 86% 6%, rgba(184,118,58,0.055), transparent 28%),
  #050b16;
background-attachment: fixed;

/* Light */
background:
  radial-gradient(circle at 16% 6%, rgba(29,90,140,0.05), transparent 34%),
  radial-gradient(circle at 88% 4%, rgba(143,86,38,0.035), transparent 28%),
  #f4efe4;
background-attachment: fixed;
```
> Mobilde `background-attachment: scroll`'a döner (iOS'ta `fixed` bozulur).

### İmza: Cetvel Çentiği
Degrade başlığın yerini alan motif. Ürünün ölçüm yapan bir araç olduğunu söyler.
```css
.text-gradient-shift {           /* isim eski, davranış yeni */
  color: var(--color-primary);
}
.text-gradient-shift::after {
  content: '';
  position: absolute; left: 0; right: 0; bottom: -0.12em; height: 0.14em;
  background: repeating-linear-gradient(90deg, var(--color-oak) 0 2px, transparent 2px 7px);
}
```

### İmza: M Monogramı
`src/components/brand/BlockMark.tsx` — tek dolu yol olarak çizilmiş M.
Sağ ayak sol ayaktan yukarıda biter: harf bir ilerleme eğrisi gibi yukarı
bırakır. `tile` prop'u koyu kutu içinde açık harf verir (küçük boyut / favicon).
Cetvel çentikleri işaretten çıkarıldı — 32 px'te gürültü yapıyordu; motif
yalnızca başlık altı çizgisinde yaşar.

---

## 3. Typography Rules

### Font Ailesi — iki aile, üç ses
| Rol | Aile | Ağırlıklar | CSS token | next/font değişkeni |
|-----|------|-----------|-----------|---------------------|
| Display | **Schibsted Grotesk** | 600-900 | `--font-display` | `--font-body-face` |
| Arayüz / gövde | **Schibsted Grotesk** | 400, 500, 600 | `--font-sans` | `--font-body-face` |
| Sayısal veri | **IBM Plex Mono** | 400, 500, 600, 700 | `--font-numeric` | `--font-mono-face` |

`--font-display` ile `--font-sans` aynı aileyi işaret eder; ayrım ağırlık ve
optik sıkılıktan gelir:

```css
h1 { letter-spacing: -0.04em; }   /* punto büyüdükçe daralır */
h2 { letter-spacing: -0.034em; }
h4 { letter-spacing: -0.018em; }
```

İkisinde de `subsets: ["latin", "latin-ext"]` — Türkçe aksanlar (ğ ı ş İ ö ü ç)
için `latin-ext` **şart**.

> **Tuzak:** next/font'un `variable` adı `@theme` token adıyla aynı olursa
> CSS'te dairesel referans oluşur (`--font-display: var(--font-display)`) ve
> sessizce çöker. Bu yüzden next/font tarafında `-face` soneki kullanılır.

**Neden bu ikili:** Önce üç aile denendi (Bricolage + Instrument Sans +
Plex Mono). Bricolage'ın hafif tuhaf harf biçimleri klinik bir ölçüm aracının
tonuyla çekişiyordu — sayfa oyuncu görünüyor ama ürün bir kayıt defteri.
Schibsted Grotesk haber-editoryal kökenli: dar apertürleri sıkı başlıkta
karakter veriyor, 400'de gövde metni olarak sessizleşiyor; tek aile hem daha
disiplinli hem bir font isteği daha az. Plex Mono yalnızca klinik veride:
skor, süre, persentil ve span değerleri gövde metninden ayrı ve hizalı
okunmalı.

```css
.numeral {                       /* her sayısal okuma bunu kullanır */
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
  letter-spacing: -0.02em;
}
```

### Ölçek — `clamp()` tabanlı
Breakpoint başına ayrı sınıf yok; ölçek `:root` içinde tek yerden gelir.

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--text-display` | `clamp(2.75rem, 6.5vw, 5rem)` | Kahraman başlık |
| `--text-h1` | `clamp(2.25rem, 4.6vw, 3.5rem)` | Sayfa başlığı |
| `--text-h2` | `clamp(1.75rem, 3.2vw, 2.5rem)` | Bölüm başlığı |
| `--text-h3` | `clamp(1.25rem, 1.9vw, 1.5rem)` | Kart başlığı |
| `--text-lead` | `clamp(1.0625rem, 1.35vw, 1.25rem)` | Giriş paragrafı |

### Prensipler
- `h1, h2, h3` otomatik olarak display yüzünü alır (`letter-spacing: -0.025em`)
- Başlıklarda `text-wrap: balance` — tek kelimelik yetim satır olmaz
- Gövde `--color-text-body`, başlık `--color-text-strong`, ipucu `--color-text-muted`
- **Her sayı `.numeral` sınıfını taşır** — skor, süre, yüzde, tarih, sayaç
- Tüm font referansları CSS variable üzerinden; hardcoded font-family yok

## 4. Component Stylings

### Butonlar

**Primary**
- Background: `--color-primary` (`#1d5a8c`) — **düz dolgu, degrade değil**
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
- Radial gradient'ler sayfanın sol-üst (%16 %8) ve sağ-üst (%86 %6) köşelerinde (üçüncü, alt-orta katman kaldırıldı)
- Dark modda mavi + oker ikilisi: opaklıklar 0.14 ve 0.06 (eskiden indigo/cyan/emerald üçlüsüydü — sakinleştirildi)
- Light modda aynı konumlar, daha düşük opaklık: 0.08, 0.05, 0.04
- `background-attachment: fixed` ile scroll sırasında gradient'ler sabit
- Chrome katmanları (sidebar, nav) yarı-saydam; alttaki gradient'ler hafifçe görünür
- Dark modda inset highlight `rgba(255,255,255,0.04)`, light modda `rgba(255,255,255,0.9)` ile üst kenar vurgusu

---

## 7. Do's and Don'ts

### Do
- Dokuz blok işaretini (`BlockMark`) marka temsili gereken her yerde kullan
- Her zaman CSS variable/token kullan: `bg-(--color-surface)`, `text-(--color-text-strong)`
- Tailwind v4 syntax kullan: `bg-(--color-primary)` (parantezli)
- Glass efektlerde `backdrop-filter: blur()` + yarı-saydam arka plan + ince border birlikte kullan
- Tema geçişini `data-theme` attribute ile yönet, inline script ile FOUC'u önle
- Game canvas gibi özel alanları tema bağımsız tut
- Tüm interaktif öğelere `transition` ekle (minimum 0.2s ease)
- Focus durumunda `--color-line-focus` + `box-shadow` ring kullan
- Shadow'lar her iki temada da **nötr**: `rgba(0,0,0,...)` / `rgba(13,33,55,...)`. Marka rengi gölgeye sızmaz.
- `background-attachment: fixed` kullan; **mobilde** `scroll`'a düşür

### Don't
- `bg-white`, `text-gray-900`, `dark:bg-gray-900` gibi hardcoded Tailwind sınıfları kullanma
- `style={{ background: "rgba(...)" }}` ile inline renk verme — token kullan
- `dark:` prefix kullanma — Mimio'da Tailwind dark mode yok, `data-theme` var
- `next-themes` veya `class` tabanlı tema sistemi kullanma
- `tailwind.config.ts` oluşturma — tüm tokenlar `globals.css` `@theme {}` bloğunda
- `console.log` commit'e bırakma
- Magic number kullanma — spacing ve radius için daima token
- **İki renkli degrade kullanma** — ne düğmede, ne başlıkta, ne kart zemininde.
  Degrade bu markanın terk ettiği şeyin ta kendisi. Düz dolgu + cetvel çentiği.
- **Okeri (`--color-signal`) birincil eylem rengi yapma** — imza vurgusudur,
  seyrek kullanılır. Birincil her zaman mavi.
- Açık temada yarı saydam kart zemini kullanma — opak beyaz + nötr gölge
- Renkli gölge (marka renkli halo) kullanma — gölgeler nötr
- Sayıyı `.numeral` sınıfı olmadan yazma — skor, süre, yüzde hepsi mono
- next/font `variable` adını `@theme` token adıyla aynı yapma — dairesel
  referans oluşur ve sessizce çöker (`-face` soneki kullan)

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
- **Primary CTA**: `bg-(--color-primary)` → `#1d5a8c` (düz, degrade yok)
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
| Light bg | `#f5f7fb` (notr) | `#f4efe4` (soğuk kâğıt grisi) |
| Tema sistemi | next-themes (`class`) | Custom (`data-theme`) |
| Font | Manrope + IBM Plex Mono | Schibsted Grotesk + IBM Plex Mono |
| Tailwind | v3 | **v4** (`@theme`) |
| DB | Yok | Neon serverless |
| Three.js | Var | Yok |
| Custom cursor | Var | Yok |
| Layout tipi | Landing/portfolio | Sidebar app |
