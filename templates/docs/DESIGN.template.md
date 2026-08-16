---
# ─── Makine-okunur token katmanı (resmî DESIGN.md spec) ─────────────────────
# Bu frontmatter'ı impeccable ve DESIGN.md-uyumlu araçlar okur; aşağıdaki
# markdown bölümleri ise insan/agent bağlamıdır. Token'lar normatiftir.
# Token referansı: {colors.primary} biçiminde. Bileşenler primitive'e referans
# verebilir; primitive'ler birbirine veremez.
name: [PROJE_ADI]
description: [tek satırlık tanım]
colors:
  primary: '#4f46e5'
  accent: '#22d3ee'
  neutral-bg: '#04070d'
  neutral-fg: '#e2e8f0'
typography:
  display:
    fontFamily: 'Manrope, -apple-system, sans-serif'
    fontSize: 'clamp(2.5rem, 6vw, 5rem)'
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: '-0.03em'
  body:
    fontFamily: 'Manrope, -apple-system, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: '-0.01em'
rounded:
  card: '1rem'
  pill: '999px'
spacing:
  section: '5rem'
  gutter: '1.5rem'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#ffffff'
    rounded: '{rounded.pill}'
    padding: '0.875rem 1.75rem'
---

# Görsel Hafıza: [PROJE_ADI]

> Bu dosya iki katmanlıdır:
> - **Frontmatter** — resmî DESIGN.md spec'inin makine-okunur token şeması.
>   `/impeccable document` ve DESIGN.md-uyumlu araçlar bu katmanı okur.
> - **9 bölüm** — ekosistemin kendi görsel hafıza formatı; agent'lar buradan
>   pixel-perfect UI üretir.
>
> Bölümler resmî 8 bölümlük kanonik sıraya şöyle karşılık gelir:
>
> | Bu dosya | Resmî DESIGN.md |
> |----------|-----------------|
> | 1. Visual Theme & Atmosphere | `## Overview` |
> | 2. Color Palette & Roles | `## Colors` |
> | 3. Typography Rules | `## Typography` |
> | 4. Component Stylings | `## Components` + `## Shapes` (radius) |
> | 5. Layout Principles | `## Layout` |
> | 6. Depth & Elevation | `## Elevation & Depth` |
> | 7. Do's and Don'ts | `## Do's and Don'ts` |
> | 8. Responsive Behavior | `## Layout` (responsive kısmı) |
> | 9. Agent Prompt Guide | *(ekosisteme özgü — resmî spec'te karşılığı yok)* |
>
> `/impeccable document` çalıştırırsan çıktı kanonik başlıklarla gelir; bu
> tabloyu kullanarak buraya taşı. Frontmatter'ı ezme — token'lar tek kaynaktır.

Kaynak proje: `~/[PROJE_DIZINI]`
Versiyon: [FRAMEWORK], [STYLING], [ANIMATION_LIB]

---

## 1. Visual Theme & Atmosphere

[Projenin genel görsel hissi, tasarım felsefesi, yoğunluk ve atmosfer açıklaması. 2-3 paragraf.]

**Temel Karakteristikler:**
- [Font ailesi ve kullanım yaklaşımı]
- [Renk stratejisi — monokrom, gradient, vurgu tabanlı vb.]
- [Efekt sistemi — glassmorphism, shadow, depth yaklaşımı]
- [Animasyon felsefesi — minimal, zengin, fonksiyonel vb.]
- [Dark/Light mod stratejisi]

---

## 2. Color Palette & Roles

### Arka Plan
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--bg-base` | | | Ana sayfa arka planı |
| `--bg-card` | | | Kart arka planı |
| `--bg-raised` | | | Yükseltilmiş yüzey |

### Vurgu Renkleri
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--color-primary` | | Birincil vurgu, CTA |
| `--color-secondary` | | İkincil vurgu |
| `--color-tertiary` | | Üçüncül vurgu |

### Metin Renkleri
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--text-primary` | | | Ana metin |
| `--text-secondary` | | | İkincil metin |
| `--text-muted` | | | Silik metin |

### Kenarlık & Çizgi
| Token | Dark | Light | Kullanım |
|-------|------|-------|----------|
| `--border` | | | Standart kenarlık |
| `--border-subtle` | | | İnce kenarlık |

### Durum Renkleri
| Token | Değer | Kullanım |
|-------|-------|----------|
| `--success` | | Başarı |
| `--warning` | | Uyarı |
| `--danger` | | Hata |

### Sayfa Arka Plan Kodu
```css
/* Dark */
background: [gradient_kodu];

/* Light */
background: [gradient_kodu];
```

---

## 3. Typography Rules

### Font Ailesi
- **Sans**: [font_adı] — ağırlıklar: [weights]
- **Mono**: [font_adı] — ağırlıklar: [weights]
- **letter-spacing**: [değer]
- **text-rendering**: optimizeLegibility

### Hiyerarşi

| Rol | Font | Boyut | Ağırlık | Satır Yüksekliği | Letter Spacing | Not |
|-----|------|-------|---------|-------------------|----------------|-----|
| Display Hero | | | | | | |
| Section Heading | | | | | | |
| Card Title | | | | | | |
| Body Large | | | | | | |
| Body | | | | | | |
| Caption | | | | | | |
| Mono | | | | | | |

### Prensipler
- [Tipografi yaklaşımı ve kuralları]

---

## 4. Component Stylings

### Butonlar

**Primary**
- Background: [değer]
- Text: [değer]
- Padding: [değer]
- Radius: [değer]
- Hover: [değer]
- Active/Press: [değer]

**Ghost / Secondary**
- [stiller]

**Pill / Badge**
- [stiller]

### Kartlar & Container'lar
- Background: [değer]
- Border: [değer]
- Radius: [değer]
- Shadow: [değer]
- Hover: [değer]

### Input & Form
- Background: [değer]
- Border: [değer]
- Focus: [değer]
- Placeholder: [değer]

### Navigasyon
- [nav stili açıklaması]

### Proje Özel Bileşenler
- [projeye özgü bileşenler ve stilleri]

---

## 5. Layout Principles

### Spacing Sistemi
- Base unit: [değer]
- Scale: [spacing scale]

### Grid & Container
- Max content width: [değer]
- Container padding: [değer]
- Section gap: [değer]

### Whitespace Felsefesi
- [boşluk kullanım yaklaşımı]

### Border Radius Scale
| İsim | Değer | Kullanım |
|------|-------|----------|
| sm | | Badge, input |
| md | | Button, küçük kart |
| lg | | Kart |
| xl | | Panel, modal |
| full | 9999px | Pill, avatar |

---

## 6. Depth & Elevation

| Seviye | Değer | Kullanım |
|--------|-------|----------|
| Flat (0) | Yok | Sayfa arka planı |
| Subtle (1) | [shadow] | Kartlar |
| Elevated (2) | [shadow] | Aktif kartlar, dropdown |
| Overlay (3) | [shadow] | Modal, dialog |

### Glassmorphism / Efekt Sistemi
```css
/* Ana efekt */
[efekt_kodu]
```

### Dekoratif Derinlik
- [gradient, glow, blur detayları]

---

## 7. Do's and Don'ts

### Do
- [kural 1]
- [kural 2]
- [kural 3]

### Don't
- [yasak 1]
- [yasak 2]
- [yasak 3]

### Ekosistem Geneli (her projede geçerli)

Bunlar proje bazında tartışılmaz — `rules/design-tokens.md` tarafından zorlanır ve
`npm run design:detect` ile otomatik taranır.

**Don't**
- Degrade metin (`background-clip: text`) — vurgu solid accent rengiyle
- Elle degrade yazmak (`from-X to-Y`) — tek kaynak imza token'ı
- Degradeyi 3 imza anının dışında kullanmak (birincil eylem, marka döşemesi,
  seçili gezinme satırı). Veri yüzeyleri ve kart zeminleri degrade taşımaz
- `violet` / `purple` / `fuchsia` — `indigo→violet` en tanınır AI tell'i
- `width` / `height` animasyonu — `transform: scale()` kullan
- Emoji ikon — `lucide-react`

---

## 8. Responsive Behavior

### Breakpoints
| İsim | Genişlik | Değişiklikler |
|------|----------|---------------|
| Mobile | <640px | |
| Tablet | 640-1024px | |
| Desktop | 1024-1280px | |
| Large | >1280px | |

### Dokunma Hedefleri
- [minimum boyut ve padding kuralları]

### Daraltma Stratejisi
- [responsive davranış kuralları]

---

## 9. Agent Prompt Guide

### Hızlı Renk Referansı
- Primary CTA: [renk]
- Background: [renk]
- Heading text: [renk]
- Body text: [renk]
- Border: [renk]
- Accent: [renk]

### Örnek Component Prompt'ları
- "[hero section prompt'u]"
- "[card component prompt'u]"
- "[button component prompt'u]"
- "[navigation prompt'u]"

### İterasyon Rehberi
1. [kural 1]
2. [kural 2]
3. [kural 3]

---

## Teknoloji Notu

| Katman | Seçim | Not |
|--------|-------|-----|
| Framework | | |
| Stil | | |
| Animasyon | | |
| Tema Sistemi | | |
| Veritabanı | | |
| Auth | | |
| Deployment | | |
