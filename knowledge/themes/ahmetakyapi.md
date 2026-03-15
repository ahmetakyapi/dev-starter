# Görsel Hafıza: ahmetakyapi.com

Kaynak proje: `~/personal-website`
Versiyon: Next.js 14, Tailwind 3, Framer Motion 11, Three.js, next-themes

---

## Renk Sistemi

### Arka Plan
- **Dark**: `#04070d` — neredeyse siyah, lacivert tonu
- **Light**: `#f5f7fb` — soğuk beyaz, gri tonu

### Vurgu Renkleri (gradient katmanlar)
Üç vurgu rengi sayfanın farklı köşelerinde radial gradient olarak kullanılır:

| Renk | RGB | Kullanım |
|------|-----|---------|
| İndigo | `rgb(79,70,229)` | Sol üst, birincil vurgu |
| Cyan | `rgb(34,211,238)` | Sağ üst, ikincil vurgu |
| Emerald | `rgb(16,185,129)` | Alt merkez, üçüncül vurgu |

### Sayfa Arka Plan Kodu
```css
/* Dark mode */
background:
  radial-gradient(circle at 18% 12%, rgba(79,70,229,0.14), transparent 30%),
  radial-gradient(circle at 82% 10%, rgba(34,211,238,0.09), transparent 24%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.05), transparent 28%),
  #04070d;

/* Light mode */
background:
  radial-gradient(circle at 14% 12%, rgba(59,130,246,0.12), transparent 30%),
  radial-gradient(circle at 82% 8%, rgba(14,165,233,0.10), transparent 24%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.06), transparent 28%),
  #f5f7fb;
```

---

## Tipografi

- **Sans**: Manrope (Google Fonts) — `wght@400;500;600;700;800`
- **Mono**: IBM Plex Mono — `wght@400;500;600`
- **letter-spacing**: `-0.01em` (hafif sıkıştırma)
- **text-rendering**: `optimizeLegibility`
- `-webkit-font-smoothing: antialiased`

---

## Glassmorphism Sistemi

### `.glass` (nav, kartlar)
```css
background: linear-gradient(180deg, rgba(8,12,22,0.72), rgba(6,10,18,0.46));
border: 1px solid rgba(148,163,184,0.1);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 34px rgba(2,6,23,0.14);
backdrop-filter: blur(16px);
```

### `.chip` (badge, pill)
```css
background: rgba(7,11,20,0.56);
border: 1px solid rgba(148,163,184,0.14);
border-radius: 999px;
padding: 0.75rem 1rem;
font-size: 0.78rem; font-weight: 600;
backdrop-filter: blur(18px);
```

### `.surface` (modal, panel)
```css
background: linear-gradient(180deg, rgba(8,12,22,0.88), rgba(4,7,13,0.96));
backdrop-filter: blur(20px);
```

---

## Motion Sistemi

### Temel Ease Eğrisi
```ts
const EASE = [0.22, 1, 0.36, 1]  // hızlı başla, yumuşak bitir
```

### Spring Presetleri
```ts
const springs = {
  snappy:   { stiffness: 300, damping: 30 },   // kartlar
  bouncy:   { stiffness: 160, damping: 18 },   // magnetic buton
  smooth:   { stiffness: 140, damping: 16 },   // cursor ring
}
```

### Özel Efektler
1. **Spotlight** — mouse takip eden radial gradient (`620px`, `rgba(96,165,250,0.07)`)
2. **Magnetic Button** — `strength: 0.26`, imleç yaklaştığında buton çekilir
3. **3D Card Tilt** — `intensity: 8`, `rotateX/Y` + holografik parlaklık
4. **Custom Cursor** — nokta (direkt) + yavaş ring (spring: smooth)
5. **Stagger Children** — `0.12s` varsayılan, liste/grid öğeleri için

### Animasyon Varyantları
```ts
fadeUp:      { hidden: { opacity:0, y:24 }, visible: { opacity:1, y:0 } }
fadeUpLarge: { hidden: { opacity:0, y:40 }, visible: { opacity:1, y:0 } }
scaleIn:     { hidden: { opacity:0, scale:0.95 }, visible: { opacity:1, scale:1 } }
modalPanel:  { hidden: { opacity:0, scale:0.96, y:-16 }, ... }
```

---

## Bileşen Desenleri

### Header
- `fixed top-0` + `h-16` + `max-w-7xl mx-auto px-6`
- Scroll'da `glass` class'ı aktif olur (`scrolled > 10px`)
- Logo: `w-10 h-10 rounded-2xl`, indigo→blue→cyan gradient
- Cmd+K ile Command Palette açılır

### Hero Section
- `min-h-[calc(100vh-64px)]`
- Spotlight effect (mouse takip)
- Radial gradient arka plan
- `motion.div` ile fade-up animasyonları

### Kart Tasarımı
- `glass` class + `rounded-2xl`
- 3D tilt efekti (useCardTilt hook)
- Holografik border shine

### Scrollbar
```css
width: 6px;
background: rgba(56,189,248,0.28);
hover: rgba(56,189,248,0.5);
border-radius: 999px;
```

---

## Teknoloji Seçimleri
- **Routing**: Next.js App Router
- **Animasyon**: Framer Motion (GSAP değil)
- **3D**: React Three Fiber + Drei
- **Tema**: next-themes (class strategy, `darkMode: 'class'`)
- **İkonlar**: lucide-react
- **Yorumlar/Blog**: Giscus (GitHub Discussions tabanlı)
- **Deployment**: Vercel

---

## Kritik Notlar
- `suppressHydrationWarning` — `<html>` tag'ine next-themes için şart
- Three.js bileşenleri `dynamic(() => import(...), { ssr: false })` olmalı
- Custom cursor sadece `pointer: fine` cihazlarda (`@media (pointer: fine) and (hover: hover)`)
- `mounted` state kontrolü olmadan `resolvedTheme` sunucu tarafında `undefined` döner
