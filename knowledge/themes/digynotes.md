# Görsel Hafıza: DigyNotes

Kaynak: https://github.com/ahmetakyapi/DigyNotes
Stack: Next.js 14, Tailwind v3, Framer Motion 12, **Prisma + PostgreSQL** (pg), next-auth v4, React Quill (rich text editor)

---

## Genel Karakteristik

DigyNotes kendine özgü tasarım diline sahip bir not uygulaması. ahmetakyapi.com ve Mimio'dan **farklı** bir kimlik:
- Derin lacivert (`#0a0f1e`) ana zemin — daha soğuk, daha "gece" hissi
- **Emerald yeşil** dominant vurgu rengi (`#10b981`, token adı `--gold`)
- Aurora animasyonları — sayfada yüzen ışık efektleri
- `dn-` prefix'li özel CSS class'lar — namespace koruması
- **Avenir Next** font (system font, Google Fonts değil)

---

## Renk Sistemi (CSS Variables)

### Dark Mode (default)
```css
--bg-base:    #0a0f1e;    /* Ana zemin — derin lacivert */
--bg-card:    #101828;    /* Kart arka planı */
--bg-raised:  #182036;    /* Yükseltilmiş yüzey */
--bg-header:  #080d1a;    /* Header */
--bg-soft:    #0e1626;    /* Soft yüzey */
--bg-overlay: rgba(8,12,22,0.76);

--border:         #1e3044;
--border-subtle:  #182840;

/* Vurgu — "gold" adı altında emerald */
--gold:       #10b981;
--gold-light: #34d399;

--text-primary:   #ecf2ff;
--text-secondary: #94a8c8;
--text-muted:     #6b7f9e;

--shadow-card: 0 18px 40px rgba(2,8,18,0.55);
--shadow-soft: 0 8px 20px rgba(2,8,18,0.35);
```

### Light Mode
```css
--bg-base:    #f5f7fa;
--bg-card:    #ffffff;
--bg-raised:  #eef2f7;
--border:     #d4dde8;
--gold:       #059669;    /* Light'ta biraz daha koyu */
--gold-light: #10b981;
--text-primary: #0f172a;
```

---

## Tipografi

| Role | Font | Fallback |
|------|------|---------|
| Sans (UI) | **Avenir Next** | Segoe UI Variable, Segoe UI |
| Display | **Avenir Next Condensed** | Trebuchet MS |
| (Mono yok — code bloğu yok) | — | — |

> Not: Google Fonts kullanılmıyor. System font stack — daha hızlı yükleme.
> `letter-spacing: -0.012em` — display font'lar için

---

## Sayfa Arka Planı

```css
/* Dark */
background-image:
  radial-gradient(circle at 8% -12%, rgba(16,185,129,0.1), transparent 42%),
  radial-gradient(circle at 88% 4%,  rgba(6,182,212,0.08), transparent 44%),
  linear-gradient(180deg, rgba(10,15,30,0.7) 0%, rgba(10,15,30,0) 48%);
background-attachment: fixed;

/* Light */
background-image:
  radial-gradient(circle at 12% -8%,  rgba(16,185,129,0.06), transparent 36%),
  radial-gradient(circle at 86% 6%,   rgba(6,182,212,0.05), transparent 40%),
  radial-gradient(circle at 50% 108%, rgba(16,185,129,0.04), transparent 46%),
  linear-gradient(180deg, #f8fafc 0%, #f5f7fa 60%, #f0f4f8 100%);
```

---

## Tema Sistemi

- Sınıf tabanlı: `html.light` veya `html[data-theme="light"]`
- Geçiş: `transition: background-color 0.3s ease, color 0.3s ease`
- **Scroll lock** utility: `html.dn-scroll-locked` — mobil search açıkken

---

## CSS Namespace: `dn-` Prefix

DigyNotes tüm custom class'larını `dn-` prefix'i ile korur:

```css
.dn-reveal          /* Sayfa yüklenme animasyonu */
.dn-line-reveal     /* Satır satır reveal */
.dn-aurora-float-*  /* Yüzen ışık efektleri */
.dn-shimmer-text    /* Shimmer text animasyonu */
.dn-badge-sheen     /* Badge parlama efekti */
.dn-dot-pulse       /* Canlı nokta pulse */
.dn-cta-primary     /* Ana aksiyon butonu */
.dn-cta-ghost       /* Ghost buton (nefes alma animasyonu) */
.dn-landing-card    /* Landing kart */
.dn-nav-cta-btn     /* Nav buton (yeşil gradient) */
.dn-new-note-*      /* Yeni not glow efektleri */
.dn-compose-editor  /* Rich text editör */
```

---

## Animasyon Sistemi

### Reveal Animasyonları (CSS, Framer Motion değil)
```css
@keyframes dn-reveal-up {
  0%   { opacity: 0; transform: translateY(20px) scale(0.985); filter: blur(8px); }
  100% { opacity: 1; transform: translateY(0)    scale(1);     filter: blur(0); }
}
/* Duration: 0.86s, Ease: cubic-bezier(0.16, 0.8, 0.24, 1) */

/* Stagger delays */
.dn-delay-1  { animation-delay: 0.06s; }
.dn-delay-3  { animation-delay: 0.26s; }
.dn-delay-4  { animation-delay: 0.42s; }
```

### Aurora (Yüzen Işık Efektleri)
```css
/* Üç ayrı aurora orb, farklı süre ve yön */
.dn-aurora-float-1  { animation: dn-aurora-float-1 15s ease-in-out infinite; }
.dn-aurora-float-2  { animation: dn-aurora-float-2 17s ease-in-out infinite; }
.dn-aurora-float-3  { animation: dn-aurora-float-3 18s ease-in-out infinite; }
.dn-aurora-core     { animation: dn-aurora-core 9s ease-in-out infinite; }
```

### Badge Sheen
```css
/* Soldan sağa kayan parlaklık süpürmesi — 4.6s */
.dn-badge-sheen::after {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
  animation: dn-badge-sheen 4.6s ease-in-out infinite;
}
```

---

## CTA Buton Tasarımı

```css
.dn-nav-cta-btn {
  background: linear-gradient(160deg, #34d399 0%, #10b981 28%, #059669 64%, #047857 100%);
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(4,120,87,0.3);
}
/* Light'ta daha koyu gradient */
```

---

## Rich Text Editor (React Quill)

DigyNotes not editörü için React Quill kullanır. `ql-*` class'ları tema renkleriyle override edilmiş:
```css
.ql-toolbar.ql-snow { background: var(--bg-raised); border: 1px solid var(--border); }
.ql-container.ql-snow { background: var(--bg-card); min-height: 280px; }
/* Active/hover state: --gold rengi */
```

---

## Glow Efektleri

```css
/* Yeni not kartı etrafında nefes alan glow */
--new-note-glow: 0 0 0 1px rgba(16,185,129,0.2), 0 2px 8px rgba(16,185,129,0.1);
.dn-new-note-soft-glow { box-shadow: var(--new-note-glow); }
```

---

## Teknoloji Seçimleri (Farklılıklar)

| Özellik | DigyNotes | ahmetakyapi.com/Mimio |
|---------|-----------|----------------------|
| ORM | **Prisma** | Drizzle |
| Auth | **next-auth v4** | next-auth v5 (Mimio yok) |
| Font | Avenir (system) | Manrope/Plus Jakarta Sans |
| Animasyon | CSS + Framer Motion 12 | Framer Motion 11 |
| Editor | React Quill | Yok |
| İkon | @phosphor-icons/react | lucide-react |
| Toast | react-hot-toast | Yok |
| DB bağlantı | **pg** (dikkat!) | @neondatabase/serverless |

> ⚠️ DigyNotes `pg` kullanıyor. Vercel serverless'da connection sorununa dikkat et.

---

## Scrollbar

```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: var(--border); }
::-webkit-scrollbar-thumb:hover { background: var(--gold); }
```

---

## Prefers-Reduced-Motion Desteği

Tüm `dn-*` animasyon class'ları `prefers-reduced-motion: reduce` ile devre dışı bırakılıyor — erişilebilirlik düşünülmüş.
