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

## Degrade Disiplini

**Kural**: Ekosistemde **tek bir renk degradesi** vardır — imza degradesi. Tek kaynağı
`packages/@ahmet/theme/tokens.ts → gradients.signature`, tek kullanım yolu `bg-signature`
utility'sidir.

```text
signature = linear-gradient(135deg, indigo → blue → cyan)
```

### İzinli üç yer

Degrade yalnızca şu üç anda görünür. Dördüncü bir yer eklemek kural ihlalidir:

| # | Yer | Örnek |
|---|-----|-------|
| 1 | **Birincil eylem** | Hero / CTA primary butonu (hover katmanı) |
| 2 | **Marka döşemesi** | Header logo tile, mockup içi marka karesi |
| 3 | **Seçili gezinme satırı** | Aktif nav item vurgusu |

### Degrade taşımayan yüzeyler

- **Metin** — `background-clip: text` + degrade yasak. Vurgu kelimesi solid `.text-accent`.
- **Veri yüzeyleri** — grafik sütunu, avatar, rozet, istatistik kartı. Hepsi solid.
- **Kart zeminleri** — `.glass` / `.surface` içindeki `linear-gradient(180deg, …)` bir
  *cam derinliği*dir, renk degradesi değil; bu kuralın kapsamı dışındadır.
- **Hairline ayırıcılar** — `from-transparent via-X to-transparent` bir çizgi fade'idir,
  renk geçişi değil; serbesttir.

### Violet/purple yasağı

Marka paleti **indigo · blue · cyan · emerald · sky**'dır. `violet`, `purple`, `fuchsia`
bu palette **yoktur**. `indigo → violet` geçişi üretken modellerin en tanınır görsel
imzasıdır (impeccable `ai-color-palette`); markanın parçası değil, sızıntıdır.

```bash
# Sızıntı taraması
grep -rnE '(bg|from|via|to|text|border)-(violet|purple|fuchsia)-[0-9]+' \
  --include="*.tsx" --include="*.css" .
```

---

## AI-Slop Yasakları

Bu kalıplar `impeccable` detector'ı tarafından otomatik yakalanır
(`npm run design:detect`). Yakalanması beklenmez — hiç yazılmaz.

| Kalıp | Neden | Doğrusu |
|-------|-------|---------|
| `bg-clip-text` + degrade | En tanınır AI tell'i; responsive'de satır kırılması öngörülemez | Solid `.text-accent` |
| `from-indigo-* to-violet-*` | Purple gradient tell'i | `bg-signature` token'ı |
| `transition: width, height` | Her karede layout thrash | `transform: scale()` |
| Emoji ikon | Cross-platform tutarsız render | `lucide-react` |
| Kart içinde kart | Hiyerarşi kaybı | Tek seviye + ayırıcı |
| Her başlığın üstünde yuvarlak ikon karesi | Şablon hissi | Seçici kullan |

**Detector'ı susturma.** Bir bulgu kasıtlıysa çözüm `ignoreRules` değil, token'a
taşımaktır — `.impeccable/config.json` bilinçli olarak boş ignore listeleriyle gelir.
Kural gerçekten yanlışsa dosya içi tek satırlık istisna kullan:

```css
/* impeccable-disable overused-font: marka fontu */
```

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
# 1. Token ihlali — hardcoded renk / raw Tailwind scale
grep -rn --include="*.tsx" --include="*.ts" --include="*.css" \
  -E '#[0-9a-fA-F]{3,8}|bg-white|bg-black|text-white|text-black|text-gray-|bg-gray-|border-gray-' \
  src/ --exclude-dir=node_modules

# 2. AI-slop / tasarım anti-pattern taraması (59 kural)
npm run design:detect          # insan okunur
npm run design:detect:json     # CI için

# 3. Ekosistem geneli — token + slop + violet sızıntısı birlikte
bash scripts/health-check.sh   # 12. kategori
```

Bu üçü commit anında `hooks/quality-scan.sh` içinden otomatik çalışır.
