# Görsel Hafıza: DigyNotes

> Bu dosya DESIGN.md 9-section formatını takip eder.
> AI agent'ları bu dosyayı okuyarak pixel-perfect UI üretebilir.

Kaynak proje: https://github.com/ahmetakyapi/DigyNotes
Versiyon: Next.js 14, Tailwind CSS 3, Framer Motion 12, Prisma + PostgreSQL (pg), next-auth v4, React Quill

---

## 1. Visual Theme & Atmosphere

DigyNotes kişisel bir not ve içerik takip uygulaması. Kullanıcının izlediği filmlerden okuduğu kitaplara, oynadığı oyunlardan seyahatlerine kadar her şeyi kayıt altına almasını sağlıyor. Tasarım dili, ahmetakyapi.com ve Mimio'dan belirgin şekilde ayrılır: derin lacivert zemin (`#0a0f1e`) üzerine emerald yeşil vurgu rengi hakimdir. Gece hissi veren, soğuk ve huzurlu bir atmosfer yaratılmış.

Sayfada aurora benzeri yüzen ışık efektleri (3 orb + 1 core) sürekli hareket halindedir. Reveal animasyonları blur'dan netlemeye geçiş yaparak organik bir "belirme" hissi verir. Glass efekt kullanılmaz -- yüzeyler solid arka planlara sahiptir. Rich text editörü (React Quill), yarım yıldız derecelendirme sistemi ve kategori bazlı durum badge'leri gibi domain-spesifik bileşenler projeyi diğerlerinden ayırır.

Light mode sıcak gri-beyaz tonlarında (`#f5f7fa`) tasarlanmış; tema geçişi `0.3s ease` ile yumuşak bir şekilde gerçekleşir. Dark mode varsayılan olarak gelir.

**Temel Karakteristikler:**
- **Font ailesi**: Avenir Next (system font) -- Google Fonts kullanılmaz, hız öncelikli
- **Renk stratejisi**: Monokromatik lacivert zemin + tek emerald vurgu (`--gold` token adıyla)
- **Efekt sistemi**: Aurora float orbs, badge sheen sweep, reveal blur-to-clear, glow box-shadow
- **Animasyon felsefesi**: CSS keyframes ağırlıklı (Framer Motion destekli), `prefers-reduced-motion` saygılı
- **Dark/Light mod**: Class tabanlı (`html.light` veya `html[data-theme="light"]`), dark varsayılan
- **CSS namespace**: Tüm custom class'lar `dn-` prefix'i ile korunur -- global çakışma engellenir

---

## 2. Color Palette & Roles

### Arka Plan
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--bg-base` | `#0a0f1e` | `#f5f7fa` | Ana sayfa arka planı -- derin lacivert |
| `--bg-card` | `#101828` | `#ffffff` | Kart arka planı |
| `--bg-raised` | `#182036` | `#eef2f7` | Yükseltilmiş yüzey (toolbar, dropdown) |
| `--bg-header` | `#080d1a` | -- | Header arka planı (dark'ta daha koyu) |
| `--bg-soft` | `#0e1626` | -- | Soft yüzey, section arka planı |
| `--bg-overlay` | `rgba(8,12,22,0.76)` | -- | Modal overlay |

### Vurgu Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--gold` | `#10b981` | `#059669` | Birincil vurgu, CTA, aktif durum, yıldız rengi |
| `--gold-light` | `#34d399` | `#10b981` | Gradient'in açık ucu, hover state |

> **Not**: Token adı `--gold` ama renk **emerald** yeşildir. Tarihsel isimlendirme korunmuş.

### Metin Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--text-primary` | `#ecf2ff` | `#0f172a` | Ana metin, başlıklar |
| `--text-secondary` | `#94a8c8` | -- | Açıklama metinleri, tarihler |
| `--text-muted` | `#6b7f9e` | -- | Placeholder, hint metin, devre dışı |

### Kenarlık & Çizgi
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--border` | `#1e3044` | `#d4dde8` | Standart kenarlık (kart, input, divider) |
| `--border-subtle` | `#182840` | -- | Daha ince, neredeyse görünmez kenarlık |

### Durum Renkleri
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--gold` / emerald | `#10b981` | Başarı, aktif, tamamlandı |
| danger / delete | `#e53e3e` | Silme butonu, hata durumu |

### Sayfa Arka Plan Kodu
```css
/* Dark */
background-image:
  radial-gradient(circle at 8% -12%, rgba(16,185,129,0.1), transparent 42%),
  radial-gradient(circle at 88% 4%,  rgba(6,182,212,0.08), transparent 44%),
  linear-gradient(180deg, rgba(10,15,30,0.7) 0%, rgba(10,15,30,0) 48%);
background-color: #0a0f1e;
background-attachment: fixed;

/* Light */
background-image:
  radial-gradient(circle at 12% -8%,  rgba(16,185,129,0.06), transparent 36%),
  radial-gradient(circle at 86% 6%,   rgba(6,182,212,0.05), transparent 40%),
  radial-gradient(circle at 50% 108%, rgba(16,185,129,0.04), transparent 46%),
  linear-gradient(180deg, #f8fafc 0%, #f5f7fa 60%, #f0f4f8 100%);
background-color: #f5f7fa;
```

> **Mobil not**: `background-attachment: fixed` mobil Safari'de sorun yaratır. Mobilde `scroll` kullan.

### Gölge Tokenları
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--shadow-card` | `0 18px 40px rgba(2,8,18,0.55)` | Kart gölgeleri |
| `--shadow-soft` | `0 8px 20px rgba(2,8,18,0.35)` | Hafif yüzey gölgeleri |
| `--new-note-glow` | `0 0 0 1px rgba(16,185,129,0.2), 0 2px 8px rgba(16,185,129,0.1)` | Yeni not kartı glow |

---

## 3. Typography Rules

### Font Ailesi
- **Sans (UI)**: Avenir Next -- system font, yükleme gerektirmez
  - Fallback: `Segoe UI Variable`, `Segoe UI`, `system-ui`, `sans-serif`
- **Display**: Avenir Next Condensed -- başlıklar için daha dar kesim
  - Fallback: `Trebuchet MS`, `sans-serif`
- **Mono**: Yok -- projede code bloğu/mono font kullanılmıyor
- **letter-spacing**: `-0.012em` (display fontlar için)
- **text-rendering**: `optimizeLegibility`
- **-webkit-font-smoothing**: `antialiased`

> **Önemli**: Google Fonts import'u yok. Tamamen system font stack. Performans avantajlı.

### Hiyerarşi

| Rol | Font | Boyut | Ağırlık | Satır Yüksekliği | Letter Spacing | Not |
|-----|------|-------|---------|-------------------|----------------|-----|
| Display Hero | Avenir Next Condensed | 2.5-3rem | 700 | 1.1 | -0.012em | Landing sayfa başlığı |
| Section Heading | Avenir Next | 1.5-2rem | 700 | 1.2 | -0.012em | Bölüm başlıkları |
| Card Title | Avenir Next | 1.125rem | 600 | 1.3 | normal | İçerik kart başlığı |
| Body Large | Avenir Next | 1rem | 500 | 1.6 | normal | Açıklama metni |
| Body | Avenir Next | 0.875rem | 400 | 1.5 | normal | Genel içerik |
| Caption | Avenir Next | 0.75rem | 400 | 1.4 | 0.01em | Tarih, metadata |

### Prensipler
- Projede mono font **kullanılmaz** -- not uygulaması, kod editörü değil
- Display Condensed sadece hero/landing alanlarında -- iç sayfalarda normal Avenir Next
- Light mode'da font ağırlıklarında değişiklik yok, sadece renk değişir
- `text-shadow` sadece CTA butonlarında kullanılır

---

## 4. Component Stylings

### Butonlar

**Primary CTA (`.dn-cta-primary` / `.dn-nav-cta-btn`)**
- Background: `linear-gradient(160deg, #34d399 0%, #10b981 28%, #059669 64%, #047857 100%)`
- Text: `#ffffff`
- Text-shadow: `0 1px 2px rgba(4,120,87,0.3)`
- Padding: `0.5rem 1.25rem`
- Radius: `0.5rem`
- Hover: Gradient kayma + hafif box-shadow (`0 4px 12px rgba(16,185,129,0.3)`)
- Active: Scale `0.97` + daha koyu gradient

**Ghost (`.dn-cta-ghost`)**
- Background: `transparent`
- Border: `1px solid var(--border)`
- Text: `var(--text-secondary)`
- Hover: `background: var(--bg-raised)`, border `var(--gold)` tonuna geçiş
- Özel efekt: Nefes alan (breathing) opacity animasyonu

### Kartlar & Container'lar (`.dn-landing-card`)
- Background: `var(--bg-card)` (`#101828` dark)
- Border: `1px solid var(--border)` (`#1e3044`)
- Radius: `1rem` (16px)
- Shadow: `var(--shadow-card)` -- `0 18px 40px rgba(2,8,18,0.55)`
- Hover: Border rengi `var(--gold)` tonuna hafifçe kayar, shadow genişler

### Input & Form
- Background: `var(--bg-card)` veya `var(--bg-raised)`
- Border: `1px solid var(--border)` (`#1e3044`)
- Focus border: `#10b981` (emerald) -- ring değil, border renk değişimi
- Placeholder: `var(--text-muted)` (`#6b7f9e`)
- Radius: `0.5rem`
- Padding: `0.625rem 0.875rem`

### Navigasyon / Header
- Background: `var(--bg-header)` (`#080d1a`)
- Genişlik: `fixed top-0 w-full`
- Yükseklik: `h-14` veya `h-16`
- CTA butonu: `.dn-nav-cta-btn` (emerald gradient, sağ tarafta)

### Proje Özel Bileşenler

**Yarım Yıldız Derecelendirme (0-5, 0.5 hassasiyet)**
- Her yıldız yatay iki yarıya bölünmüş -- sol tıklama 0.5, sağ tıklama tam
- İkonlar: `FaStar`, `FaStarHalfAlt`, `FaRegStar` (react-icons)
- Renk: `#10b981` (emerald), boş yıldız: `var(--text-muted)`
- Boyut: 20-24px

**Durum Badge Sistemi (Kategori Bağımlı)**
```ts
const STATUS_MAP = {
  movie:  ['Izlendi', 'Izleniyor', 'Izlenecek'],
  series: ['Izlendi', 'Izleniyor', 'Izlenecek'],
  book:   ['Okundu', 'Okunuyor', 'Okunacak'],
  game:   ['Tamamlandi', 'Oynaniyor', 'Oynanacak'],
  travel: ['Gidildi', 'Planlandi'],
}
```
- Badge stili: `dn-badge-sheen` class'ı ile parlama efekti
- Radius: `9999px` (pill)
- Font-size: `0.75rem`, font-weight: `600`

**Tag Sistemi**
- Global `#hashtag` yaklaşımı
- Otomatik tamamlama (debounce ile -- performans için)
- Tıklanabilir etiketler + hover: renk `var(--gold)`
- Input focus state: border `#10b981`

**Rich Text Editor (React Quill)**
```css
.ql-toolbar.ql-snow {
  background: var(--bg-raised);
  border: 1px solid var(--border);
}
.ql-container.ql-snow {
  background: var(--bg-card);
  border: 1px solid var(--border);
  min-height: 280px;
}
/* Aktif toolbar butonu + hover: var(--gold) rengi */
```
> **Uyarı**: React Quill SSR desteklemez -- `dynamic(() => import('react-quill'), { ssr: false })` kullan.

**Confirmation Modal**
- Overlay: `var(--bg-overlay)` -- `rgba(8,12,22,0.76)`
- Container: `max-w-sm`, `shadow-2xl`, radius `1rem`
- Escape/dışarı tıklama ile kapanır
- Delete butonu: `#e53e3e` kırmızı, hover'da daha koyu

**Scrollbar**
```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: var(--gold); }
```

---

## 5. Layout Principles

### Spacing Sistemi
- Base unit: `4px` (Tailwind varsayılan)
- Yaygın kullanım: `p-4` (16px), `p-6` (24px), `gap-4`, `gap-6`
- Section arası boşluk: `py-16` veya `py-20`

### Grid & Container
- Max content width: `max-w-6xl` (1152px) veya `max-w-7xl` (1280px)
- Container padding: `px-4` (mobil), `px-6` (tablet+)
- Kart grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, gap `1rem` veya `1.5rem`
- Dashboard: Sidebar + main content layout, sidebar `w-64`

### Whitespace Felsefesi
- Kartlar arası boşluk tutarlı: her zaman `gap-4` veya `gap-6`
- İçerik yoğunluğu orta seviye -- finance dashboard kadar sıkışık değil, blog kadar da gevşek değil
- Kart içi padding: `p-4` veya `p-5` -- kompakt ama nefes alan

### Border Radius Scale
| İsim | Değer | Kullanım |
|------|-------|----------|
| sm | `0.375rem` (6px) | Badge, küçük input |
| md | `0.5rem` (8px) | Buton, input |
| lg | `1rem` (16px) | Kart, panel |
| xl | `1.5rem` (24px) | Modal, büyük panel |
| full | `9999px` | Pill badge, avatar, tag |

---

## 6. Depth & Elevation

| Seviye | Değer | Kullanım |
|--------|-------|----------|
| Flat (0) | Yok | Sayfa arka planı, iç içerik |
| Subtle (1) | `var(--shadow-soft)` = `0 8px 20px rgba(2,8,18,0.35)` | Küçük kartlar, inputlar |
| Elevated (2) | `var(--shadow-card)` = `0 18px 40px rgba(2,8,18,0.55)` | Ana kartlar, dropdown |
| Glow (3) | `var(--new-note-glow)` = `0 0 0 1px rgba(16,185,129,0.2), 0 2px 8px rgba(16,185,129,0.1)` | Yeni not kartı, aktif alan |
| Overlay (4) | `0 25px 50px rgba(0,0,0,0.5)` | Modal, confirmation dialog |

### Aurora Dekoratif Derinlik
Sayfada 3 yüzen ışık orb'u + 1 core efekti sürekli hareket eder:
```css
.dn-aurora-float-1 { animation: dn-aurora-float-1 15s ease-in-out infinite; }
.dn-aurora-float-2 { animation: dn-aurora-float-2 17s ease-in-out infinite; }
.dn-aurora-float-3 { animation: dn-aurora-float-3 18s ease-in-out infinite; }
.dn-aurora-core    { animation: dn-aurora-core    9s  ease-in-out infinite; }
```
- Orb'lar emerald/cyan tonlarında, çok düşük opacity (0.06-0.12)
- Arka planda z-index: 0, içerik üzerinde değil

### Glow Efektleri
```css
/* Yeni not kartı etrafında nefes alan glow */
.dn-new-note-soft-glow {
  box-shadow: var(--new-note-glow);
  /* 0 0 0 1px rgba(16,185,129,0.2), 0 2px 8px rgba(16,185,129,0.1) */
}
```

> **Not**: DigyNotes glassmorphism/backdrop-filter kullanmaz -- tüm yüzeyler solid arka plana sahiptir. Derinlik sadece gölge ve glow ile sağlanır.

---

## 7. Do's and Don'ts

### Do
- Her zaman `dn-` prefix'i kullan custom CSS class'larında -- namespace koruması
- `prefers-reduced-motion: reduce` için tüm `dn-*` animasyonlarını devre dışı bırak
- Dark mode varsayılan, light mode ikincil olarak düşün
- Emerald yeşilini SADECE vurgu/aksiyon için kullan -- arka plan rengi olarak değil
- System font stack (Avenir Next) kullan -- Google Fonts import etme
- React Quill'i `dynamic(() => import(...), { ssr: false })` ile yükle
- `background-attachment: fixed` kullanıyorsan mobil için `scroll` fallback'i ekle
- Scrollbar genişliği `4px` tut -- projede ince scrollbar standardı var
- Kategori bazlı status metinleri kullan (`Izlendi`/`Okundu`/`Tamamlandi`)
- Tüm renkleri CSS variable/token olarak tanımla -- hardcoded hex kullanma
- Tema geçişinde `transition: background-color 0.3s ease, color 0.3s ease` uygula
- `localStorage` key olarak `dn_theme` kullan

### Don't
- `#04070d` kullanma -- bu ahmetakyapi.com'un rengi. DigyNotes'ta `#0a0f1e` kullan
- Glassmorphism/backdrop-filter kullanma -- DigyNotes'ta bu efekt yok, solid bg kullanılır
- Mono font ekleme -- projede code bloğu yok
- `lucide-react` kullanma -- DigyNotes `@phosphor-icons/react` kullanır
- `next-auth v5` API'si kullanma -- proje v4'te
- Drizzle ORM syntax kullanma -- Prisma kullanılıyor
- `@neondatabase/serverless` kullanma -- proje `pg` driver kullanır (serverless'ta dikkat!)
- Hardcoded renk değerleri commit etme -- CSS variable token kullan
- Aurora orb'ları içerik katmanının üstüne koyma -- z-index: 0'da kalmalı
- `console.log` commit'e gönderme
- `any` type kullanma -- `unknown` tercih et

---

## 8. Responsive Behavior

### Breakpoints
| İsim | Genişlik | Değişiklikler |
|------|----------|---------------|
| Mobile | <640px | Tek kolon grid, sidebar gizli, hamburger menü, `px-4` |
| Tablet | 640-1024px | 2 kolon grid, sidebar collapse edilebilir |
| Desktop | 1024-1280px | 3 kolon grid, sidebar açık, tam layout |
| Large | >1280px | Max-width container, ekstra breathing room |

### Dokunma Hedefleri
- Minimum dokunma alanı: `44x44px` (WCAG 2.5.5)
- Buton padding mobilde: en az `py-3 px-4`
- Yıldız derecelendirme mobilde: yıldız boyutu `28px`'e çıkar

### Daraltma Stratejisi
- Kart grid: `grid-cols-1` (mobil) -> `sm:grid-cols-2` -> `lg:grid-cols-3`
- Sidebar: Masaüstünde sabit, mobilde overlay drawer şeklinde
- `background-attachment: fixed` -> mobil Safari'de `scroll`'a döner
- `html.dn-scroll-locked` class'ı ile mobil search açıkken scroll kilitleme
- Confirmation modal: masaüstünde `max-w-sm`, mobilde tam genişlik `mx-4`

---

## 9. Agent Prompt Guide

### Hızlı Renk Referansı
- Primary CTA: `linear-gradient(160deg, #34d399, #10b981, #059669, #047857)`
- Background (dark): `#0a0f1e`
- Background (light): `#f5f7fa`
- Heading text (dark): `#ecf2ff`
- Body text (dark): `#94a8c8`
- Border (dark): `#1e3044`
- Accent / Gold: `#10b981` (emerald)
- Accent light: `#34d399`
- Danger: `#e53e3e`

### CSS Namespace: `dn-` Prefix Tam Liste
```css
.dn-reveal          /* Sayfa yüklenme animasyonu */
.dn-line-reveal     /* Satır satır reveal */
.dn-aurora-float-*  /* Yüzen ışık efektleri (1, 2, 3) */
.dn-aurora-core     /* Aurora merkez efekti */
.dn-shimmer-text    /* Shimmer text animasyonu */
.dn-badge-sheen     /* Badge parlama efekti */
.dn-dot-pulse       /* Canlı nokta pulse */
.dn-cta-primary     /* Ana aksiyon butonu */
.dn-cta-ghost       /* Ghost buton (nefes alma) */
.dn-landing-card    /* Landing kartı */
.dn-nav-cta-btn     /* Nav buton (yeşil gradient) */
.dn-new-note-*      /* Yeni not glow efektleri */
.dn-compose-editor  /* Rich text editor wrapper */
.dn-scroll-locked   /* html class -- scroll kilidi */
.dn-delay-1         /* Stagger delay 0.06s */
.dn-delay-3         /* Stagger delay 0.26s */
.dn-delay-4         /* Stagger delay 0.42s */
```

### Animasyon Sistemi Referansı

**Reveal Animasyonu (CSS Keyframes)**
```css
@keyframes dn-reveal-up {
  0%   { opacity: 0; transform: translateY(20px) scale(0.985); filter: blur(8px); }
  100% { opacity: 1; transform: translateY(0)    scale(1);     filter: blur(0); }
}
/* Duration: 0.86s, Ease: cubic-bezier(0.16, 0.8, 0.24, 1) */
```

**Badge Sheen**
```css
.dn-badge-sheen::after {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
  animation: dn-badge-sheen 4.6s ease-in-out infinite;
}
```

**Tema Geçiş Animasyonu**
```css
transition: background-color 0.3s ease, color 0.3s ease;
```

### Örnek Component Prompt'ları

- "DigyNotes tarzında bir içerik kartı oluştur: `#101828` bg, `1px solid #1e3044` border, `1rem` radius, `0 18px 40px rgba(2,8,18,0.55)` shadow. Başlık `#ecf2ff`, açıklama `#94a8c8`. Sağ üstte yarım yıldız derecelendirme (`#10b981`). Sol altta kategori badge (pill, emerald)."

- "DigyNotes nav bar'ı oluştur: `#080d1a` bg, sabit üst, sağ tarafta emerald gradient CTA buton (`linear-gradient(160deg, #34d399, #10b981, #059669, #047857)`), beyaz text, `text-shadow: 0 1px 2px rgba(4,120,87,0.3)`."

- "DigyNotes landing hero section'ı: `#0a0f1e` bg, Avenir Next Condensed başlık (`#ecf2ff`), emerald vurgu kelimeler, arka planda 3 aurora orb animasyonu (emerald/cyan, çok düşük opacity). `dn-reveal-up` animasyonu ile başlık belirsin."

- "DigyNotes tag input'u: `var(--bg-raised)` bg, `1px solid var(--border)`, focus'ta border `#10b981`. Altta otomatik tamamlama dropdown'u (`var(--bg-card)` bg, `var(--shadow-card)` shadow)."

### İterasyon Rehberi
1. Öncelikle renk tokenlarını CSS variable olarak tanımla -- hardcoded renk kullanma
2. Dark mode'u önce yap, sonra `.light` class ile light override'ları ekle
3. Animasyonları en son ekle -- önce statik UI'ı tamamla
4. `prefers-reduced-motion` kontrolünü her animasyonlu bileşenin sonuna ekle
5. React Quill gibi SSR-uyumsuz bileşenleri her zaman `dynamic import` ile yükle
6. Prisma şema değişikliği yapıldıysa `npx prisma generate` çalıştırmayı unutma

---

## Teknoloji Notu

| Katman | Seçim | Not |
|--------|-------|-----|
| Framework | Next.js 14 (App Router) | Server Component öncelikli |
| Stil | Tailwind CSS v3 | `darkMode: 'class'` |
| Animasyon | Framer Motion 12 + CSS Keyframes | CSS ağırlıklı, FM destekli |
| Tema Sistemi | Class tabanlı (`html.light`) | `localStorage` key: `dn_theme` |
| Veritabanı | PostgreSQL (pg driver) | Serverless'ta dikkat -- `pg` kullanılıyor |
| ORM | **Prisma** | Drizzle değil -- `prisma generate` gerekli |
| Auth | next-auth **v4** | v5 değil -- API farklılıkları var |
| İkon | @phosphor-icons/react | lucide-react değil |
| Toast | react-hot-toast | -- |
| Rich Text | React Quill | SSR: `dynamic import` zorunlu |
| Deployment | Vercel | `pg` + serverless = connection pool dikkat |
