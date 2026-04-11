# Design Token Enforcement

**Kural**: Hiçbir bileşende hardcoded görsel değer kullanılmaz. Tüm renkler, tipografi, spacing ve efektler semantic token'lar üzerinden gelmelidir.

> Bu kural Gate Agent tarafından her teslimatta otomatik olarak kontrol edilir.
> İhlaller severity'ye göre işaretlenir ve auto-fix uygulanır.

---

## Grep Kontrol Desenleri

Gate Agent bu pattern'leri arar. Eşleşme = ihlal.

### CRITICAL — Otomatik Düzelt

| Pattern | Açıklama | Doğru Kullanım |
|---------|----------|----------------|
| `#[0-9a-fA-F]{3,8}` | Hardcoded hex renk | CSS variable: `var(--color-primary)` veya Tailwind token |
| `rgb\(` / `rgba\(` / `hsl\(` / `hsla\(` | Hardcoded renk fonksiyonu | Semantic token kullan |
| `[0-9]+px` (inline style) | Hardcoded pixel değeri | Tailwind spacing veya CSS variable |
| `font-size:\s*[0-9]` | Hardcoded font-size | Tailwind typography scale |
| `font-weight:\s*[0-9]` | Hardcoded font-weight | Tailwind font-weight token |

### HIGH — Otomatik Düzelt

| Pattern | Açıklama | Doğru Kullanım |
|---------|----------|----------------|
| `bg-white` / `bg-black` | Light/dark uyumsuz renk | `bg-background` / `bg-card` semantic token |
| `text-white` / `text-black` | Light/dark uyumsuz metin | `text-foreground` semantic token |
| `text-gray-*` / `bg-gray-*` | Raw Tailwind gray scale | Semantic renk token'ı |
| `border-gray-*` | Raw border rengi | `border-border` semantic token |

### MEDIUM — Uyar

| Pattern | Açıklama | Doğru Kullanım |
|---------|----------|----------------|
| `<input` / `<button` / `<select` / `<textarea` | Raw HTML element | UI kit bileşeni kullan (`Button`, `Input` vb.) |
| `<svg` (inline) | Inline SVG | Icon component veya sprite |
| `shadow-none` (card üzerinde) | Card'da elevation eksik | Design system elevation token |
| `z-[` arbitrary z-index | Magic z-index | Z-index scale token |
| `w-[` / `h-[` (sık kullanım) | Arbitrary boyut | Tailwind scale veya design token |

---

## İstisnalar

Bu durumlarda ihlal sayılmaz:

- **Tailwind config / theme dosyası** (`@theme {}`, `tailwind.config.ts`) — token tanımı yapılan yer
- **CSS variable tanımı** (`:root {}`, `[data-theme]`) — kaynak dosya
- **SVG dosyaları** (`.svg`) — asset dosyası
- **Test dosyaları** (`*.test.*`, `*.spec.*`) — test fixture
- **`globals.css`** — base layer tanımları
- **Storybook dosyaları** (`*.stories.*`) — demo/preview amaçlı

---

## Auto-Fix Stratejisi

Gate Agent ihlal bulduğunda:

1. **Hex renk → Semantic token**: En yakın semantic token'ı eşleştir
2. **bg-white → bg-background**: Dark mode uyumlu karşılığı koy
3. **Raw HTML → UI Component**: `<button` → `<Button`, `<input` → `<Input`
4. **Inline pixel → Tailwind class**: `style={{ padding: '16px' }}` → `className="p-4"`

Eşleştirme yapılamazsa, sorunu raporla ve developer'a bırak.

---

## Gelismis Teknikler

### Shadow-as-Border
Cok ince kenarliklari `border` yerine `box-shadow` ile yap. Avantaji: border box model'i etkilemez, birden fazla "border" katmani eklenebilir.

```css
/* Tek pixel kenarlik */
box-shadow: 0 0 0 1px rgba(255,255,255,0.06);

/* Kenarlik + glow birlikte */
box-shadow:
  0 0 0 1px rgba(255,255,255,0.06),
  0 8px 32px rgba(0,0,0,0.4);
```

### Multi-Layer Shadow Stack
Gercekci derinlik icin birden fazla shadow katmani kullan. Tek shadow flat gorunur.

```css
/* Iyi — 3 katmanli elevation */
box-shadow:
  0 0 0 1px rgba(255,255,255,0.05),   /* ince kenarlik */
  0 2px 4px rgba(0,0,0,0.15),          /* yakin golge */
  0 12px 24px rgba(0,0,0,0.25);        /* uzak golge */

/* Kotu — tek katman */
box-shadow: 0 4px 16px rgba(0,0,0,0.3);
```

### DESIGN.md 9-Section Referansi
Tema dosyalari (`knowledge/themes/*.md`) DESIGN.md 9-section formatindadir. Her projenin gorsel kurallarini bu dosyalardan oku:
- Section 2: Renk token tanimlari
- Section 4: Bilesen stil detaylari
- Section 6: Shadow ve depth seviyeleri
- Section 7: Projeye ozgu do/don't kurallari

Yeni tema olusturmak icin: `templates/docs/DESIGN.template.md`

---

## Kontrol Komutu

```bash
# Manuel kontrol — tüm src/ altında design token ihlali ara
grep -rn --include="*.tsx" --include="*.ts" --include="*.css" \
  -E '#[0-9a-fA-F]{3,8}|bg-white|bg-black|text-white|text-black|text-gray-|bg-gray-|border-gray-' \
  src/ --exclude-dir=node_modules
```
