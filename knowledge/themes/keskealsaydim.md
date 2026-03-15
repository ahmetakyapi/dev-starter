# Görsel Hafıza: Keşke Alsaydım

Kaynak: https://github.com/ahmetakyapi/keskealsaydim
Stack: **React + Vite** (frontend), **Go** (backend), Tailwind v3, shadcn/ui benzeri HSL token sistemi, Docker + Postgres

Uygulama: Yatırım portföy takip — "keşke alsaydım" senaryoları, watchlist, market verileri

---

## Genel Karakteristik

Diğer projelerden en çok ayrışan tasarım:
- **Finance dashboard** hissi — kompakt, veri yoğun
- **HSL tabanlı CSS değişkenler** (shadcn/ui stili)
- Emerald/teal `#00C896` yeşil + mavi ikili vurgu
- **Space Grotesk** öncelikli font — farklı, teknik bir his
- `#12121A` koyu yüzey — siyaha yakın, `#04070d`'den daha koyu

---

## Renk Sistemi (HSL Variables)

```css
:root {
  /* Background */
  --background: 204 42% 7%;      /* #0b1420 — koyu lacivert */
  --foreground: 210 40% 96%;

  /* Card */
  --card:        204 34% 10%;    /* #111e2e */
  --popover:     204 34% 10%;

  /* Primary — Emerald */
  --primary:     160 84% 39%;    /* #10b981 */
  --primary-foreground: 205 47% 8%;

  /* Secondary — Cyan/Blue */
  --secondary:   199 89% 48%;    /* #0ea5e9 */
  --secondary-foreground: 204 42% 7%;

  /* Muted */
  --muted:       205 23% 16%;    /* #1e2d3e */
  --muted-foreground: 214 18% 67%; /* #94a8bc */

  /* Border */
  --border:      205 22% 18%;    /* #213043 */
  --ring:        160 84% 39%;    /* indigo yerine emerald */

  --radius: 1rem;
}
```

### Custom Renkler (Tailwind)
```ts
success: { DEFAULT: "#00C896", light: "#00E6AC", dark: "#00A67A" }
danger:  { DEFAULT: "#FF4757", light: "#FF6B7A", dark: "#E63946" }
surface: { DEFAULT: "#12121A", light: "#1A1A26", dark: "#0A0A0F" }
```

### index.css Ek CSS Variables (Detaylı)
```css
--bg-base:    #0a0f1e;
--bg-card:    #101828;
--bg-raised:  #182036;
--border:     #1e3044;
--gold:       #10b981;    /* Emerald — tek vurgu rengi */
--text-primary: #ecf2ff;
```

---

## Tipografi

| Role | Font | Alternatif |
|------|------|-----------|
| Sans | **Space Grotesk** | Manrope, system-ui |
| Mono | IBM Plex Mono | JetBrains Mono |

> Space Grotesk — teknik, sayısal görünüm için ideal. Finance uygulamasına bilinçli seçilmiş.

---

## Sayfa Arka Planı

```css
body {
  background-image:
    radial-gradient(circle at 20% 10%, rgba(16,185,129,0.12), transparent 38%),
    radial-gradient(circle at 80% 5%,  rgba(14,165,233,0.14), transparent 42%),
    radial-gradient(circle at 50% 90%, rgba(16,185,129,0.08), transparent 44%);
  background-attachment: fixed;
}
/* Light */
radial-gradient(circle at 20% 0%,  rgba(16,185,129,0.07), transparent 38%),
radial-gradient(circle at 80% 5%,  rgba(14,165,233,0.08), transparent 42%),
```

---

## Glassmorphism

```css
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(...);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: var(--radius); /* 1rem */
}
/* Tailwind backgroundImage */
"glass": "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
```

---

## Animasyon Sistemi

```ts
// tailwind.config.js
animation: {
  shimmer: 'shimmer 2s infinite',        /* Skeleton yükleme */
  float:   'float 3s ease-in-out infinite',
  glow:    'glow 2s ease-in-out infinite', /* Emerald ↔ cyan salınımı */
}

/* glow: yeşil ve mavi arasında salınan gölge */
@keyframes glow {
  "0%, 100%": { boxShadow: "0 0 8px rgba(16,185,129,0.45)" },
  "50%":      { boxShadow: "0 0 22px rgba(14,165,233,0.65)" },
}
```

### Finance'e Özel Animasyonlar
```css
.ticker-scroll    { animation: ticker 30s linear infinite; }  /* Hisse fiyat bandı */
.live-dot::before { animation: live-ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }  /* Canlı */
.number-ticker    { font-variant-numeric: tabular-nums; }  /* Sayı değişim */
```

---

## Finance UI Desenleri

### Renk Kodlu Sayılar
```css
.number-positive { color: var(--success); font-weight: 600; }  /* Yeşil */
.number-negative { color: var(--danger);  font-weight: 600; }  /* Kırmızı */
```

### Card Hover Glow
```css
.card-glow-green:hover {
  box-shadow: 0 0 0 1px rgba(16,185,129,0.15), 0 8px 40px -12px rgba(16,185,129,0.25);
}
.card-glow-blue:hover  { /* cyan */ }
.card-glow-red:hover   { /* kırmızı */ }
.card-glow-gold:hover  { /* sarı */ }
```

### Skeleton Shimmer
```css
.skeleton-shimmer::after {
  background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.08) 37%, transparent 63%);
  animation: skeleton-wave 1.8s ease-in-out infinite;
}
```

### Gradient Border
```css
.gradient-border {
  background: linear-gradient(var(--background), var(--background)) padding-box,
              linear-gradient(135deg, #10b981, #38bdf8) border-box;
  border: 2px solid transparent;
}
```

---

## Teknoloji Seçimleri (Öne Çıkan Farklar)

| Özellik | Keskealsaydım | Diğer Projeler |
|---------|--------------|----------------|
| Frontend | React + Vite | Next.js |
| Backend | **Go** | Node.js/Next.js API |
| DB | **PostgreSQL** (Docker) | Neon serverless |
| ORM/Query | Raw SQL migrations | Drizzle/Prisma |
| UI Kit | shadcn/ui benzeri | Custom |
| Auth | JWT (Go) | next-auth |
| İkon | react-icons | lucide-react |
| Animation | Tailwind + CSS | Framer Motion |

---

## AI Playbook (docs/ai-playbook/)

Projede AI geliştirme kuralları dokümanı var — migration pattern'i için önemli:
```
- DB şema değişiklikleri yeni migration dosyasıyla yapılır
- Eski migration dosyası geriye dönük değiştirilmez
- Her frontend değişikliğinde npm run lint + npm run build çalıştır
- Runtime'da dış hotlink görsel kullanılmaz — local assets
- Büyük statik veri blokları lib/constants'a taşınır
```

---

## Scrollbar

```css
::-webkit-scrollbar { width: 6px; }
/* DigyNotes gibi 4px değil, 6px — ahmetakyapi.com ile aynı */
```
