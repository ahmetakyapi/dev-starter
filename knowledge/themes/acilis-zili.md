---
# Makine-okunur token katmanı (resmî DESIGN.md spec)
# Kaynak: ~/Desktop/Projects/acilis-zili/app/globals.css — elle uydurulmadı
name: Açılış Zili
description: Türkiye ve ABD piyasalarını takip eden, veri yoğun finans yayını
colors:
  page-bg: '#f7f9fb'
  surface-solid: '#ffffff'
  text-strong: '#101c2b'
  text-body: '#54677c'
  text-muted: '#586a7c'
  primary: '#0d74c4'
  primary-hover: '#0a5a9a'
  on-primary: '#ffffff'
  up: '#0c7350'
  down: '#c01a3d'
  flat: '#586a7c'
  line: 'rgb(16 32 52 / 0.1)'
  # Koyu tema karşılıkları
  dark-page-bg: '#070d16'
  dark-text-strong: '#eaf1f8'
  dark-primary: '#35b8ff'
  dark-on-primary: '#06121f'
  dark-up: '#3ddc97'
  dark-down: '#ff5c7a'
typography:
  display:
    fontFamily: 'Schibsted Grotesk, system-ui, sans-serif'
    fontWeight: 800
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'Schibsted Grotesk, system-ui, sans-serif'
    fontWeight: 400
rounded:
  xs: '0.375rem'
  sm: '0.5rem'
  md: '0.5625rem'
  lg: '0.875rem'
  xl: '1rem'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
---

# Görsel Hafıza: Açılış Zili

Kaynak proje: `~/Desktop/Projects/acilis-zili`
Versiyon: Next.js 16 (App Router), Tailwind v4 (`@theme`), Drizzle + Neon, next-auth

> **Bu proje ekosistemin en disiplinli görsel sistemi.** Denetimde (2026-08-16)
> pratikte sıfır ihlal çıktı — tek bulgu kasıtlı bir tasarım kararıydı.
> Bkz. `knowledge/live-projects-audit.md`.
>
> Ekosistemin geri kalanına örnek olan üç özelliği: tüm geçişler tek marka
> eğrisinde, kontrast oranları hesaplanıp token'a yazılmış, ve her token
> ayrımının gerekçesi kod içi yorumda yaşıyor.

---

## 1. Visual Theme & Atmosphere

Veri yoğun bir finans yayını. Ekranın işi okutmak ve karşılaştırtmak; süs
yok. Yüzeyler neredeyse düz, derinlik gölgeyle değil **ton farkıyla** kuruluyor
(`surface` → `surface-elevated` → `surface-sunken`). Renk, dekorasyon değil
**anlam** taşıyor: mavi etkileşim, yeşil yükseliş, kırmızı düşüş.

**Temel Karakteristikler:**
- Tek font ailesi — Schibsted Grotesk, değişken eksen 400–900
- Lacivert→mavi tek renk ailesi; ikinci bir vurgu rengi yok
- Yön renkleri (`up`/`down`) kendi `wash` zeminleri üzerinde ölçülmüş
- Efekt yok: glassmorphism, glow, blur kullanılmıyor
- Çift tema, varsayılan açık — koyu tema ayrı token setiyle

**Fotoğraf yok.** Yazıların görseli, metinden çizilen `:::` bloklarıdır
(`sayilar` · `bar` · `pay` · `akis` · `oncesi` · `zaman` · `grafik`). Model
yalnızca satırları yazar, çizimi site yapar — telif riski ve barındırma
ihtiyacı ortadan kalkıyor.

---

## 2. Color Palette & Roles

### Arka Plan ve Yüzeyler
| Token | Light | Dark | Kullanım |
|-------|-------|------|----------|
| `--page-bg` | `#f7f9fb` | `#070d16` | Sayfa zemini |
| `--surface` | `rgb(16 32 52 / .028)` | `rgb(255 255 255 / .05)` | Temel yüzey |
| `--surface-elevated` | `rgb(16 32 52 / .07)` | `rgb(255 255 255 / .12)` | Yükseltilmiş |
| `--surface-solid` | `#ffffff` | `rgb(255 255 255 / .085)` | Kart dolgusu |
| `--surface-sunken` | `rgb(16 32 52 / .045)` | `rgb(0 0 0 / .3)` | Gömülü alan |

> Açık temada kart dolgusu **solid beyaz** — saydamlık sayfa zemininde
> kayboluyordu.

### Metin
| Token | Light | Dark | Not |
|-------|-------|------|-----|
| `--text-strong` | `#101c2b` | `#eaf1f8` | Başlık |
| `--text-body` | `#54677c` | `#94a7ba` | Gövde |
| `--text-muted` | `#586a7c` | `#8497a9` | 10–13px künyeler |

> `--text-muted` bir kontrast düzeltmesidir. Eski `#75879a` sayfa zemininde
> 3,50:1 ve yükseltilmiş yüzeyde 3,06:1 veriyordu — WCAG AA'nın 4,5 eşiğinin
> altında. Bu token 10–13px metinlerde kullanılıyor, hiçbiri "büyük metin"
> istisnasına girmiyor. Yeni değer iki zeminde de geçiyor: **5,28 ve 4,62**.

### Etkileşim
| Token | Light | Dark |
|-------|-------|------|
| `--primary` | `#0d74c4` | `#35b8ff` |
| `--primary-hover` | `#0a5a9a` | `#7fd2ff` |
| `--on-primary` | `#ffffff` | `#06121f` |

### Yön Renkleri
| Token | Light | Dark | Wash üzerinde kontrast |
|-------|-------|------|------------------------|
| `--up` | `#0c7350` | `#3ddc97` | 4,69 (light) · 11,02 (dark) |
| `--down` | `#c01a3d` | `#ff5c7a` | 4,90 (light) · 6,55 (dark) |
| `--flat` | `#586a7c` | `#8497a9` | — |

> Yön renkleri sayfa zemininde değil, **kendi wash'leri üzerinde** ölçülür:
> sitenin en çok tekrarlanan bileşeni `ChangePill` (`bg-up-wash text-up`,
> 11–12px) ve rozet zemini sayfa zemininden koyu.

---

## 3. Typography Rules

Tek aile: **Schibsted Grotesk** (`next/font`, `latin` + `latin-ext`, `display: swap`).

`weight` listesi **verilmez** — aile değişken, ekseni 400–900. Ölçüldü: liste
vermek üretilen dosya sayısını ve boyutunu değiştirmiyor (latin + latin-ext,
20 KB + 46 KB). Tailwind'in `font-medium/semibold/bold` sınıfları ekseni
kullanıyor.

Mono: `ui-monospace, "SF Mono", Menlo, monospace` — sistem yığını, indirme yok.

### Title Case kuralı
Vurgu taşıyan her metin Title Case: sayfa/bölüm/kart başlıkları, buton ve
bağlantı metinleri, kategori-filtre-sekme-rozet etiketleri, tablo başlıkları.

Title Case **olmayan** yerler (bunlar cümledir): paragraflar, açıklama
satırları, boş durum ve hata gövdeleri, ölçü altı mikro künyeler
(`olaydan bugüne`, `bilanço`, `son 1 ay`).

> `title()` / `capitalize` **kullanma** — `i → I` üretir, `İ` değil.
> Küçültürken `toLocaleLowerCase("tr-TR")`.

---

## 4. Component Stylings

### Marka karesi
Ekosistemdeki "marka döşemesi" karşılığı — projenin **tek** degrade kullanımı:
```css
--mark-gradient: linear-gradient(145deg, #4fb3f5 0%, #1f7fd4 48%, #0a4d9e 100%);
--mark-shadow: 0 1px 2px rgb(13 92 182 / .28), 0 4px 10px rgb(13 92 182 / .22);
```

### `.display-ink` — manşet mürekkebi
Sayfa başlıkları ve geri sayım bu degradeyle yazılır. **Ekosistemin
`gradient-text` yasağına belgeli istisna** (bkz. § 7):

```css
.display-ink { color: var(--text-strong); }        /* fallback ÖNCE */

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .display-ink {
    background-image: var(--display-gradient);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    padding-bottom: 0.06em;   /* g, y, ş kırpılmasın */
  }
}
```

`--display-gradient` açık uç `%92`'ye çekilmiş: `%100`'de en soluk ton harfin
son pikseline denk gelip kelime sonunu sönük gösteriyordu.
`--display-gradient-tight` (13–16px) açık ucu kasten `#1e6fbe`'de duruyor —
daha açığı 14px yarı kalın metinde AA'nın altına düşüyor.

> **TUZAK**: `.display-ink` içindeki bir çocuğa `opacity` veya `transform`
> vermek yeni bir stacking context açar ve degrade kırpması bozulur.

### Radius ölçeği
`xs 0.375` · `sm 0.5` · `md 0.5625` · `lg 0.875` · `xl 1` (rem)

---

## 5. Layout Principles

Veri yüzeyleri ızgaraya oturur; kart içinde kart yok. Gün Şeridi'nin ekseni
bir **oluk**tur: `--rail-track` zeminin içine gömülü, olaylar üstünde durur.

> Eksen bir dönem `surface-elevated` ile çiziliyordu — koyu temada bu, panelden
> daha parlak bir bant demekti: ekrandaki en güçlü yatay öğe, üstündeki
> içeriğin değil zeminin kendisi oluyordu.

Grafik çubukları `--bar` token'ıyla çizilir, `surface-elevated` ile
karıştırılmaz: gece temasında çubuklar 1,35:1'e düşüp kayboluyordu.

---

## 6. Depth & Elevation

Gölge neredeyse yok. Derinlik **ton** ile kurulur:
`surface-sunken` → `page-bg` → `surface` → `surface-elevated`

Tek gerçek gölge marka karosunda (`--mark-shadow`) — rozet hissi oradan gelir.
Ayırıcılar: `--line` / `--line-soft` / `--line-strong`, odak `--line-focus`.

---

## 7. Do's and Don'ts

### Do
- Rengi anlam için kullan: mavi etkileşim, yeşil yükseliş, kırmızı düşüş
- Kontrast oranını **ölç ve token yorumuna yaz** — sonraki kişi gerekçeyi görsün
- Derinliği tonla kur, gölgeyle değil
- Yeni bir token ayırıyorsan sebebini yanına yaz

### Don't
- Fotoğraf ekleme — `:::` blokları kullan
- Görselin etrafına çerçeve koyma; görsel kutunun kendisidir
- `--bar` yerine `surface-elevated` ile grafik çizme
- `.display-ink` çocuğuna `opacity`/`transform` verme
- `title()` / `capitalize` kullanma

### Ekosistem kuralından sapma — belgeli istisna

`rules/design-tokens.md` degrade metni yasaklar. Bu proje **istisnadır**,
çünkü yasağın önlemeye çalıştığı iki sorunu da çözmüş durumda:

| Yasağın gerekçesi | Bu projede nasıl çözülmüş |
|---|---|
| Satır kırılması öngörülemez | Yalnızca kısa display metni (manşet, marka adı, nav etiketi) |
| Descender kırpılması | `padding-bottom: 0.06em` |
| Fallback yok, metin kaybolur | `@supports` guard + öncesinde solid `color` |
| Token'sız, her yerde farklı | İki token: `--display-gradient`, `--display-gradient-tight` |

Detector bunu `gradient-text` olarak işaretler (2 bulgu). **Düzeltilmemeli** —
kod içi `impeccable-disable` yorumu veya `.impeccable/config.json` gerekçeli
girdisiyle kasıt beyan edilmeli.

---

## 8. Responsive Behavior

Çift tema (`data-theme`), varsayılan **açık**. Mobilde alt çubuk sekmeleri
`--text-muted` kullanır — bu token'ın AA'ya çekilmesinin sebeplerinden biri.

Saat kuralı: kaynaklar New York saatiyle yayın yapar, okuyucu Türkiye'de.
`lib/session-clock.ts` tek kaynak; TR dilinde birincil saat İstanbul.

---

## 9. Agent Prompt Guide

Bu projede çalışırken:

- **Geçiş eğrisi yazma.** `--ease-brand: cubic-bezier(0.22, 1, 0.36, 1)`
  `--default-transition-timing-function` olarak ayarlı; her geçiş onu alır.
  Ayrıca eğri belirtmek gürültüdür.
- **Kontrast iddiası yapma, ölç.** Bu projede token yorumları ölçüm taşır;
  aynısını sürdür.
- **Kod içi yorumlar karar kaydıdır, silme.** Projenin CLAUDE.md'si bunu
  açıkça söylüyor.
- `npm run typecheck` öncesi **`npm run build`** çalıştır — `PageProps` ve
  `RouteContext` tipleri Next 16 tarafından `.next/types` altına üretiliyor
  ve gitignore'da. Build almadan onlarca sahte "Cannot find name" hatası alırsın.
- `npx tsc` **çalışmaz**, `npm run typecheck` kullan.

---

## Teknoloji Notu

Tailwind v4 — yapılandırma `@theme {}` bloğunda, `tailwind.config.ts` **yok**.
Token'lar `app/globals.css` içinde CSS değişkeni olarak yaşıyor.

> Bileşen katmanı utilities'ten **önce** gelir. Bir dönem katmansız kurallar
> `@layer utilities` içindeki Tailwind yardımcılarını eziyordu:
> `class="plate text-nano text-primary"` yazan kırk çağrıda punto ve renk
> hiç uygulanmıyordu — yazılmış ama ölü.
