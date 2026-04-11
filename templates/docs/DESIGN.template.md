# Görsel Hafıza: [PROJE_ADI]

> Bu dosya DESIGN.md 9-section formatını takip eder.
> AI agent'ları bu dosyayı okuyarak pixel-perfect UI üretebilir.

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
