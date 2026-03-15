# Görsel Hafıza: Mimio

Kaynak: https://github.com/ahmetakyapi/Mimio
Stack: Next.js 15, **Tailwind CSS v4** (`@theme` direktifi), Framer Motion 11, @neondatabase/serverless

---

## Önemli: Tailwind v4 Farkı

Mimio, Tailwind v4 kullanır. `tailwind.config.ts` **yok**. Tüm tokenlar `globals.css` içinde `@theme {}` bloğuyla tanımlanır:
```css
@import "tailwindcss";
@theme {
  --color-primary: #6366f1;
  /* ... */
}
```
Kullanımda `bg-(--color-primary)` syntax'ı kullanılır. `dark:` prefix yok — `data-theme` attribute.

---

## Tema Mimarisi

| Özellik | Değer |
|---------|-------|
| Tema geçişi | `data-theme="dark"` / `data-theme="light"` (html attribute) |
| `next-themes` | Yok — Custom `ThemeProvider` |
| localStorage key | `mimio-theme` |
| Varsayılan | Dark |
| Inline script | `<head>` içinde FOUC önleyici script var |
| Geçiş animasyonu | `transition: color 0.3s ease, background-color 0.3s ease` |

### Inline Anti-FOUC Script (layout.tsx)
```html
<script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mimio-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){}` }} />
```
> Bu pattern `next-themes` kullanmadan hydration mismatch'i önler.

---

## Renk Sistemi (CSS Variables)

### Brand
| Token | Dark | Light |
|-------|------|-------|
| `--color-primary` | `#6366f1` | `#6366f1` (sabit) |
| `--color-primary-hover` | `#4f46e5` | `#4f46e5` (sabit) |
| `--color-primary-light` | `rgba(99,102,241,0.12)` | `rgba(99,102,241,0.08)` |

### Background / Surface
| Token | Dark | Light |
|-------|------|-------|
| `--color-page-bg` | `#04070d` | `#eef2ff` (indigo-tinted) |
| `--color-surface` | `rgba(255,255,255,0.035)` | `rgba(255,255,255,0.65)` |
| `--color-surface-strong` | `rgba(10,16,28,0.88)` | `rgba(255,255,255,0.92)` |
| `--color-surface-elevated` | `rgba(255,255,255,0.055)` | `rgba(255,255,255,0.85)` |

### Text
| Token | Dark | Light |
|-------|------|-------|
| `--color-text-strong` | `#f1f5f9` | `#1e293b` |
| `--color-text-body` | `#cbd5e1` | `#334155` |
| `--color-text-soft` | `#94a3b8` | `#64748b` |
| `--color-text-muted` | `#64748b` | `#94a3b8` |

### Border / Line
| Token | Dark | Light |
|-------|------|-------|
| `--color-line` | `rgba(255,255,255,0.07)` | `rgba(99,102,241,0.10)` |
| `--color-line-soft` | `rgba(255,255,255,0.04)` | `rgba(99,102,241,0.05)` |
| `--color-line-strong` | `rgba(255,255,255,0.12)` | `rgba(99,102,241,0.25)` |
| `--color-line-focus` | `rgba(99,102,241,0.60)` | `rgba(99,102,241,0.50)` |

### Chrome Overlays
| Token | Dark | Light |
|-------|------|-------|
| `--color-sidebar` | `rgba(4,8,16,0.92)` | `rgba(237,241,255,0.94)` |
| `--color-chrome-nav` | `rgba(4,7,13,0.92)` | `rgba(238,242,255,0.93)` |
| `--color-chrome-header` | `rgba(4,7,13,0.88)` | `rgba(238,242,255,0.88)` |

### Accent (Tema Bağımsız)
| Token | Değer |
|-------|-------|
| `--color-accent-green` | `#10b981` |
| `--color-accent-amber` | `#f59e0b` |
| `--color-accent-red` | `#ef4444` |
| `--color-accent-teal` | `#06b6d4` |

### Shadow Scale
| Token | Dark | Light |
|-------|------|-------|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)` | `0 1px 3px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.9)` |
| `--shadow-glow` | `0 8px 24px rgba(99,102,241,0.40), 0 0 0 1px rgba(99,102,241,0.15)` | `0 8px 24px rgba(99,102,241,0.30)` |

---

## Tipografi

| Role | Font | Weights |
|------|------|---------|
| Body / UI | **Plus Jakarta Sans** | 400, 500, 600, 700, 800 |
| Fallback | Inter | 400, 500, 600 |
| (Mono yok) | — | — |

> ahmetakyapi.com'dan fark: Manrope yerine **Plus Jakarta Sans**.

---

## Sayfa Arka Planı

```css
/* Dark */
background:
  radial-gradient(circle at 18% 12%, rgba(79,70,229,0.12), transparent 32%),
  radial-gradient(circle at 82% 10%, rgba(34,211,238,0.07), transparent 26%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.05), transparent 30%),
  #04070d;
background-attachment: fixed;

/* Light */
background:
  radial-gradient(circle at 18% 12%, rgba(99,102,241,0.08), transparent 32%),
  radial-gradient(circle at 82% 10%, rgba(34,211,238,0.05), transparent 26%),
  radial-gradient(circle at 50% 100%, rgba(16,185,129,0.04), transparent 30%),
  #eef2ff;
```

---

## Glass Sistemi

```css
/* .glass */
background: var(--color-surface-elevated);
border: 1px solid var(--color-line);
backdrop-filter: blur(16px);
box-shadow: var(--shadow-card);

/* .glass-strong */
background: var(--color-surface-strong);
backdrop-filter: blur(22px);
box-shadow: var(--shadow-elevated);
```

---

## Radius Scale

| Token | Değer | Kullanım |
|-------|-------|---------|
| `--radius-sm` | `0.5rem` | Badge, input |
| `--radius-md` | `0.75rem` | Button, küçük kart |
| `--radius-lg` | `1rem` | Kart |
| `--radius-xl` | `1.25rem` | Panel |
| `--radius-2xl` | `1.5rem` | Modal, büyük kart |

---

## Token Kullanım Kuralları

```tsx
// ✅ Doğru
<div className="bg-(--color-surface) text-(--color-text-strong) border border-(--color-line)">

// ❌ Yanlış
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
<div style={{ background: "rgba(255,255,255,0.04)" }}>
```

---

## Öne Çıkan UI Desenleri

1. **Sidebar app layout** — `--color-sidebar` + sticky nav
2. **Skeleton animasyonu** — `--color-skeleton-hi/lo` ile
3. **Game canvas** — her zaman dark (`rgba(8,14,28,0.97)`) tema değişmez
4. **Sections bağımsız tema** — `.section-games` kendi token seti

---

## ahmetakyapi.com ↔ Mimio Karşılaştırma

| Özellik | ahmetakyapi.com | Mimio |
|---------|-----------------|-------|
| Dark bg | `#04070d` | `#04070d` (aynı) |
| Light bg | `#f5f7fb` (nötr) | `#eef2ff` (indigo-tinted) |
| Tema sistemi | next-themes (`class`) | Custom (`data-theme`) |
| Font | Manrope | Plus Jakarta Sans |
| Tailwind | v3 | **v4** (`@theme`) |
| DB | Yok | Neon serverless |
| Three.js | Var | Yok |
| Custom cursor | Var | Yok |

---

## Kritik Notlar

- `suppressHydrationWarning` yok çünkü `next-themes` kullanılmıyor — inline script + `data-theme` attribute
- Tailwind v4'te `darkMode: 'class'` konfigürasyonu yok, CSS variable override ile çalışıyor
- `@neondatabase/serverless` kullanıyor — doğru serverless pattern
- `background-attachment: fixed` — sayfa scroll'unda gradient sabit kalır
