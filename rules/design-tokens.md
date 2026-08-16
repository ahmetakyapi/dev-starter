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
| `rgb\(` / `rgba\(` / `hsl\(` / `hsla\(` | Hardcoded renk fonksiyonu | Semantic token kullan (istisna: alfa kanallı gölge katmanları — aşağı bak) |
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

## Degrade Kuralları

**Degrade yasak değildir.** Marka ifadesinin meşru bir aracıdır — başlıkta da,
butonda da, metinde de kullanılabilir. Yasaklanan tek şey yoktur; **disiplinsizlik**
vardır. İki kural bağlayıcıdır, gerisi tasarım kararıdır.

> Bu bölüm 2026-08-16'da yeniden yazıldı. Önceki hali degrade metni tamamen
> yasaklıyor ve degradeyi üç yere sınırlıyordu. Uygulamada bu fazla katı çıktı:
> `acilis-zili`, `onepiece-hub` ve `ahmetakyapi.com` üçü de degradeyi kasıtlı ve
> doğru kullanıyordu. Yasak, çözdüğünden çok soruna yol açıyordu.

### Kural 1 — Degrade token'dan gelir, elle yazılmaz

Aynı degradeyi iki dosyada elle yazmak, iki farklı degrade demektir. Bu teorik
bir risk değil, iki kez ölçüldü:

| Proje | Bulgu |
|-------|-------|
| dev-starter | "Marka degradesi" sanılan **5 farklı varyant**, hiçbiri aynı değil |
| onepiece-hub | Kategori rengi **109 yerde** ham Tailwind sınıfı, palette tanımsız |

Tekrar eden her degrade bir token olmalı: `gradients.signature` → `bg-signature`,
`--display-gradient`, `--mark-gradient` gibi. Tek seferlik dekoratif bir geçiş
token gerektirmez.

```bash
# Token dışı, elle yazılmış degrade taraması
grep -rnE 'from-[a-z]+-[0-9]+ +(via-[a-z]+-[0-9]+ +)?to-[a-z]+-[0-9]+' \
  --include="*.tsx" .
```

### Kural 2 — Degrade metin solid fallback taşır

`background-clip: text` + `-webkit-text-fill-color: transparent` koşulsuz
yazıldığında, kırpma desteklenmeyen yerde harfin dolgusu şeffaf kalır ama arkasına
degrade basılmaz — **metin tamamen görünmez olur.** Bu bir zevk meselesi değil,
hatadır. Üç projede birden bulundu (`ahmetakyapi.com`, `onepiece-hub`, ve
`acilis-zili` bunu zaten doğru yapıyordu).

```css
/* ✅ Önce solid renk, kırpma @supports içinde */
.display-ink { color: var(--text-strong); }

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .display-ink {
    background-image: var(--display-gradient);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    padding-bottom: 0.06em;   /* g, y, ş kırpılmasın */
  }
}
```

Uzun cümleyi degrade span'e koyma — satır kırılması öngörülemez olur
(`mistakes.md` #23). Kısa vurgu kelimesi ve display metni sorunsuz.

### Kapsam dışı

- **Kart zeminleri** — `.glass` / `.surface` içindeki `linear-gradient(180deg, …)`
  bir *cam derinliği*dir, renk geçişi değil
- **Hairline ayırıcılar** — `from-transparent via-X to-transparent` bir çizgi
  fade'idir
- **Mask** — `maskImage: linear-gradient(...)` renk taşımaz

### Palet tutarlılığı

Marka paleti **indigo · blue · cyan · emerald · sky**'dır. `violet`, `purple`,
`fuchsia` bu palette yoktur — ama bu bir *yasak* değil, bir *gözlem*: bu renkler
görünüyorsa ya palete eklenmeli ya da sızıntıdır.

Ayrımı yapmanın yolu sayıya bakmak değil, **token tanımına** bakmaktır. `onepiece-hub`
80 mor kullanımıyla "bilinçli mor tema" sanılmıştı; paleti okumak yetti — mor tanımlı
değildi, sızıntıydı ve `fruit` olarak token'landı. `ahmetakyapi.com`'da ise violet
`Projeler` bölümünün kimliği ve `CodeHighlight`'ta syntax vurgusu; ikisi de kasıtlı.

```bash
grep -rnE '(bg|from|via|to|text|border)-(violet|purple|fuchsia)-[0-9]+' \
  --include="*.tsx" --include="*.css" .
```

---

## AI-Slop Yasakları

Bu kalıplar `impeccable` detector'ı tarafından otomatik yakalanır
(`npm run design:detect`).

| Kalıp | Neden | Doğrusu |
|-------|-------|---------|
| Fallback'siz degrade metin | Kırpma desteklenmezse metin görünmez olur | `@supports` + solid `color` |
| Elle yazılmış tekrarlı degrade | Aynı sanılan farklı degradeler birikir | Token'a taşı |
| `transition: width, height` | Her karede layout thrash | `transform: scale()` |
| Emoji ikon | Cross-platform tutarsız render | `lucide-react` |
| Kart içinde kart | Hiyerarşi kaybı | Tek seviye + ayırıcı |
| Her başlığın üstünde yuvarlak ikon karesi | Şablon hissi | Seçici kullan |

**Detector'ın son sözü yoktur.** Impeccable'ın kendi doktrini *"the brief wins"*
der: pinlenmiş estetik, doygun-kalıp uyarısını yener. Bir bulgu kasıtlı bir tasarım
kararıysa gerekçesini yaz ve bırak — ama gerekçe "böyle daha güzel" değil,
"şu sorunu şöyle çözüyor" olmalı.

Susturman gerekiyorsa `ignoreRules` yerine dosya içi istisna tercih et:

```css
/* impeccable-disable gradient-text: token'lanmış marka display'i, fallback'li */
```

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
- **Alfa kanallı gölge ve kenarlık katmanları** — `box-shadow` içindeki
  `rgba(255,255,255,α)` / `rgba(0,0,0,α)` bir renk değil, **derinlik ifadesidir**.
  Bu dosyanın kendi "Multi-layer shadow stack" bölümü tam olarak bunu öneriyor;
  aynı değeri CRITICAL ihlal saymak kendi kendisiyle çelişirdi. Kural: tekrar
  ediyorsa `--shadow-*` token'ına çıkar, tek kullanımlıksa yerinde kalabilir.

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
