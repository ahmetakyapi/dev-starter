# Görsel Hafıza: Ramazan Vakitleri

Kaynak: https://github.com/ahmetakyapi/ramazan-vakitleri
Stack: **React + Vite** (saf, Next.js yok), CSS Variables (Tailwind yok), @vercel/analytics

Uygulama: Ramazan namaz vakitleri — mobil-öncelikli, tek sayfa, minimal

---

## Genel Karakteristik

En sade proje. Diğer projelerden tamamen farklı bir estetik:
- **Mor/pembe/mavi üçlü gradient** vurgu — diğer projelerin yeşil/indigo paletinden kopuş
- **Midnight navy** arka plan (`#1a1a2e` + `#16213e`) — uzay hissi
- **Sadece CSS** — Tailwind, Framer Motion, hiçbir UI kütüphanesi yok
- **Mobil-öncelikli** — `max-width: 430px`, tek sütun
- **Minimal bağımlılık** — sadece React + Vite + Vercel Analytics

---

## Renk Sistemi

```css
:root {
  /* Arka plan — midnight navy gradient */
  --bg-top:    #1a1a2e;    /* Koyu mor-navy */
  --bg-middle: #16213e;    /* Orta lacivert */
  --bg-bottom: #1a1a2e;

  /* Yüzeyler */
  --card-bg:         rgba(255,255,255,0.03);
  --button-bg:       rgba(255,255,255,0.08);
  --button-bg-hover: rgba(255,255,255,0.12);
  --active-bg:       rgba(255,255,255,0.04);
  --active-border:   rgba(255,255,255,0.15);

  /* Metin */
  --text-primary:   #ffffff;
  --text-secondary: rgba(255,255,255,0.5);
  --text-muted:     rgba(255,255,255,0.35);

  /* Vurgu renkleri — diğer projelerden tamamen farklı */
  --accent:       #a78bfa;    /* Lavender/mor — ana vurgu */
  --accent-pink:  #f472b6;    /* Pembe */
  --accent-blue:  #60a5fa;    /* Mavi */

  /* Gradient metinler */
  --gradient-text:     linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%);
  --gradient-text-alt: linear-gradient(135deg, #fff 0%, #a78bfa 100%);

  /* Radii */
  --border-radius:    20px;
  --border-radius-sm: 12px;

  /* Geçiş */
  --transition: all 0.2s ease;
}
```

---

## Sayfa Arka Planı

```css
body {
  background: linear-gradient(180deg,
    var(--bg-top)    0%,
    var(--bg-middle) 50%,
    var(--bg-bottom) 100%
  );
  min-height: 100vh;
}
```

---

## Layout

```css
.app {
  max-width: 430px;        /* iPhone genişliği */
  margin: 0 auto;
  padding: 32px 24px 40px;
  height: 100vh;
  height: 100dvh;          /* Dynamic viewport height */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

---

## Tipografi

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI',
             Roboto, 'Helvetica Neue', Arial, sans-serif;
```
> Sadece system font stack. Google Fonts yok, özel font yok. Hız öncelikli.

---

## Vurgu Gradient Metin

```css
/* Başlıklar gradient metin alıyor */
background: linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #60a5fa 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## UI Desenleri

- Çok minimal kart: `background: rgba(255,255,255,0.03)` + `border-radius: 20px`
- Buton: `background: rgba(255,255,255,0.08)` — frosted glass benzeri
- Aktif sekme: `background: rgba(255,255,255,0.04)` + `border: rgba(255,255,255,0.15)`

### Saat Gösterimi (Özel)
```css
/* Saat rakamları — altın/bronz gradient */
background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 30%, #d4b896 60%, #c9a87c 100%);

/* Ayırıcı (:) — altın/turuncu/kırmızı */
background: linear-gradient(135deg, #ffd700 0%, #ffb347 50%, #ff6b6b 100%);

/* Tabular nums — sayı hizalaması */
font-variant-numeric: tabular-nums;

/* Geri sayım rakamları */
font-size: 4.5rem; font-weight: 300;   /* mobil */
font-size: 5.5rem;                     /* desktop */
```

### Kadir Gecesi Özel Badge
```css
/* Dini gece için altın vurgu */
background: linear-gradient(135deg, rgba(251,191,36,0.10), rgba(245,158,11,0.05));
border: 1px solid rgba(251,191,36,0.20);

/* Animasyonlar */
animation: kadir-glow 3s ease-in-out infinite;     /* badge nefes alır */
animation: kadir-sparkle 2s ease-in-out infinite;  /* ikon scale */
```

### Responsive Container
```css
max-width: 430px;   /* mobil */
max-width: 620px;   /* tablet */
max-width: 520px;   /* desktop (orta kalır) */
```

### Namaz Listesi Stagger
```css
/* Her namaz vakti giriş animasyonu */
animation: prayerItemIn 0.3s ease both;
/* delay: 0.04s, 0.08s, 0.12s, 0.16s, 0.20s, 0.24s */
```

---

## Teknoloji Seçimleri

| Özellik | Ramazan Vakitleri |
|---------|------------------|
| Framework | React + Vite (SPA) |
| Stil | Vanilla CSS |
| Animasyon | CSS transition |
| Bağımlılık | Sadece React + @vercel/analytics |
| Font | System stack |
| Deployment | Vercel |
| Test | Node.js built-in test runner |

---

## Ne Zaman Bu Temayı Kullan

- Küçük, odaklı tek-amaç araçlar
- Mobil-öncelikli deneyimler
- Hızlı prototipleme (kütüphane yükü yok)
- Farklı bir marka rengi gerektiğinde (mor/pembe)

---

## Diğer Projelerden Farkları

| | Ramazan Vakitleri | Diğerleri |
|-|-------------------|-----------|
| Arka plan | Mor-navy gradient | Koyu lacivert (#04070d) |
| Vurgu | Mor (#a78bfa) + Pembe + Mavi | İndigo + Cyan + Emerald |
| Font | System stack | Google Fonts |
| CSS | Vanilla | Tailwind |
| Animasyon | CSS transition | Framer Motion |
| Layout | Mobile-first 430px | Responsive desktop-first |
