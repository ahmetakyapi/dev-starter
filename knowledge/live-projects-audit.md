# Canlı Projeler — Standart Uyum Denetimi

> Tarih: 2026-08-16 · Kapsam: `~/Desktop/Projects/` altındaki 12 aktif proje
> Ölçüm: `bash scripts/audit-project.sh <proje>` · impeccable 3.6.0 (59 kural)
>
> Bu dosya, `rules/design-tokens.md` ile gelen yeni standartların canlı
> projelerde ne durumda olduğunu ve uygularsak nelerin değişeceğini kaydeder.

---

## Yöntem ve Güvenilirlik

Sekiz kontrol çalıştırılır. Hepsi aynı ağırlıkta değil — hangisine ne kadar
güvenileceği aşağıda:

| Kontrol | Güvenilirlik | Not |
|---------|--------------|-----|
| Impeccable detector | **Yüksek** | Deterministik, 59 kural |
| Degrade metin | **Yüksek** | `bg-clip-text` doğrudan aranır |
| Elle yazılmış degrade | **Yüksek** | `from-X to-Y` deseni |
| violet/purple/fuchsia | **Yüksek** | Marka paletinde yok |
| `width`/`height` animasyonu | **Yüksek** | Layout thrash |
| Emoji ikon | Orta | Unicode aralığı; dekoratif metni de yakalayabilir |
| ESLint config | **Yüksek** | Dosya var/yok |
| Işık modu kontrastı | **Düşük — aday listesi** | Manuel doğrulama şart |

**Kontrast sütunu neden zayıf:** `text-white` bir primary buton üzerinde
*doğru* kullanımdır. Filtre iki eleme yapıyor (className'de herhangi bir
`dark:` varyantı varsa, veya `bg-` varsa atla) ama zeminini ebeveynden alan
elemanlar hâlâ listeye giriyor. Sayı **ihlal değil, aday** sayısıdır.

Denetim üç kez düzeltildikten sonra bu sonuçlar alındı — ilk turlarda detector
çıktısını stderr'den okumadığı için "temiz" diyordu, tek temalı projelerde de
kontrast gürültüsü üretiyordu (`karalama` 108, `onepiece-hub` 53 sahte bulgu).
Aşağıdaki sayılar düzeltilmiş turdandır.

---

## Genel Tablo

```text
                      detector   grad-text   elle-grad      violet    w/h-anim       emoji      eslint   kontrast?
                    ----------  ----------  ----------  ----------  ----------  ----------  ----------  ----------
simayahi                     ·           ·           ·           ·           1           ·           ·           –
acilis-zili                  2           5*          ·           ·           ·           ·           ·           ·
Mimio                       10           ·           ·           ·           3           ·           –          43
keskealsaydim               11           5           5           4           ·           ·           –         296
harfiyen                     9           9           ·           ·           1           ·           X           ·
dungeon-mates                5           ·           4           5           ·           ·           –           –
ramazan-vakitleri           11          22           ·           ·           ·           ·           –           –
elevenforge                 13           5           ·           ·           5           ·           ·          19
onepiece-hub                18          10          16          80           6           ·           ·           –
ahmetakyapi.com             20          11           4          12           ·           ·           X           7
derinay                     24           ·          17          15           5           ·           ·           ·
karalama                     –           5          19          15           ·           ·           –           –

·=temiz   –=uygulanamaz/atlandı   X=lint script'i var ama config yok
*=kasıtlı, aşağıya bak
```

`karalama` detector'da `–`: kökte konvansiyonel kaynak dizini yok, tarama
kapsam dışı kaldı. Ayrıca bakılmalı.

---

## Ekosistem Geneli Kırılım

12 projede toplam **123 detector bulgusu**:

| Adet | Kural | Ne demek |
|------|-------|----------|
| 40 | `gradient-text` | Metne degrade kırpma |
| 28 | `gray-on-color` | Renkli zemin üzerinde gri metin — kontrast |
| 18 | `ai-color-palette` | Purple/violet degradesi, cyan-on-dark |
| 12 | `layout-transition` | `width`/`height` animasyonu |
| 11 | `bounce-easing` | Zıplayan easing eğrisi |
| 7 | `border-accent-on-rounded` | Yuvarlak köşede vurgu kenarlığı |
| 4 | `side-tab` | Yan sekme kenarlığı |
| 2 | `codex-grid-background` | Şablonlaşmış grid zemin |
| 1 | `overused-font` | Aşırı kullanılan font |

---

## Üç Stratejik Bulgu

### 1. Referans projenin kendisi standardı ihlal ediyor

`~/.claude/CLAUDE.md` şunu söylüyor: *"Proje seviyesinde farklı tema
belirtilmediği sürece ahmetakyapi.com referans alınır."*

Ama `ahmetakyapi.com` listenin sondan ikincisi: **20 detector bulgusu** —
8× `ai-color-palette`, 7× `gradient-text`, 4× `gray-on-color`. Ayrıca 12 violet
kullanımı ve 4 elle yazılmış degrade.

Yani ekosistemin görsel referansı, ekosistemin yeni kuralına uymuyor. Bu bir
çelişki ve **önce bu çözülmeli** — çünkü diğer projeler bu referansa bakarak
üretiliyor. İki seçenek var: ya referans güncellenir, ya kural referansa göre
yumuşatılır. Referansı güncellemek daha tutarlı; kural zaten dev-starter'da
uygulandı ve orada çalışıyor.

### 2. `gradient-text` yasağı fazla katı — `acilis-zili` bunu kanıtlıyor

Ekosistemdeki en yaygın bulgu bu (40 adet). Ama `acilis-zili`'deki 2 bulgu
**slop değil**. Kod şöyle:

- `--display-gradient` / `--display-gradient-tight` token'ları (light + dark)
- `@supports (background-clip: text)` ile korumalı
- Öncesinde solid `color: var(--text-strong)` fallback'i
- Alt çıkıntılı harfler (g, y, ş) kırpılmasın diye `padding-bottom: 0.06em`
- Yalnızca kısa metinlerde: masthead marka adı ve gezinme etiketleri

Yani yasağın var oluş sebebi olan iki sorunu (satır kırılması, descender
kırpılması) zaten çözmüş. Impeccable'ın kendi doktrini de bunu destekliyor:
*"the brief wins"* — pinlenmiş estetik, doygun-kalıp uyarısını yener.

**Sonuç**: `rules/design-tokens.md`'deki yasak koşullandırılmalı. Degrade metin
şu üç şart birlikte sağlanıyorsa kabul edilebilir:
1. Token'lanmış (inline degrade değil)
2. `@supports` guard + solid `color` fallback
3. Yalnızca kısa display metni (başlık cümlesi değil)

Aksi halde yasak. Bu, 40 bulgunun bir kısmını meşrulaştırır — ama her birinin
bu üç şarta göre tek tek bakılması gerekir.

### 3. Hareket standardı hiçbir yerde zorlanmıyor

Global CLAUDE.md tüm projelerde `ease: [0.22, 1, 0.36, 1]` diyor. Detector
**11 `bounce-easing`** buldu — 8'i Mimio'da. Bu kural yazılı ama hiçbir
kontrol onu denetlemiyordu; şimdi detector üzerinden görünür oldu.

---

## Proje Proje — Standartları Uygularsak Ne Değişir

### `simayahi` — neredeyse temiz ✅
Tek bulgu: 1 `width`/`height` animasyonu. **Değişecek: 1 dosya.**
Ekosistemin en temiz projesi; yeni proje üretirken model alınmalı.

### `acilis-zili` — öncelikli, iki kalem
- 2 `gradient-text` → **kasıtlı, dokunulmamalı** (yukarıya bak). Bunun yerine
  `.impeccable/config.json`'a gerekçeli `ignoreValues` girmeli veya kod içi
  `/* impeccable-disable gradient-text: token'lanmis marka display */`
- ESLint config **var** (`eslint.config.mjs`) ✓, kontrast temiz ✓, violet yok ✓,
  elle degrade yok ✓

**Değişecek: pratikte 0 dosya** — sadece detector'a kasıt beyan edilecek.
Ekosistemin en disiplinli projesi bu.

### `Mimio` — hareket + kontrast
- 8 `bounce-easing` → `[0.22, 1, 0.36, 1]`'e çevrilmeli
- 3 `width`/`height` animasyonu → `transform: scale()`
- 43 kontrast adayı → Mimio **varsayılan açık temalı**, bu yüzden gerçek risk
  yüksek; manuel gözden geçirilmeli

**Değişecek: ~10 dosya (hareket) + kontrast taraması.**

### `ahmetakyapi.com` — referans olduğu için en kritik
- 8 `ai-color-palette` + 12 violet → tek imza degradesine indirilmeli
- 7 `gradient-text` + 11 `bg-clip-text` → 3 şart testinden geçmeyenler solid'e
- 4 elle yazılmış degrade → `bg-signature`
- 4 `gray-on-color` → kontrast düzeltmesi
- Lint script'i var ama **ESLint config yok**

**Değişecek: ~20-25 dosya.** dev-starter'da yapılan işin birebir aynısı.

### `derinay` — en çok bulgu
- 22 `gray-on-color` → erişilebilirlik, en acil kalem
- 17 elle yazılmış degrade + 15 violet
- 5 `width`/`height` animasyonu

**Değişecek: ~25 dosya.** Kontrast tarafı öncelikli.

### `onepiece-hub` — violet ağırlıklı
- **80 violet kullanımı** (ekosistem rekoru) + 16 elle degrade + 6 ai-palette
- 5 `gradient-text`, 4 `side-tab`, 2 layout animasyonu

**Değişecek: ~30 dosya.** Palet kararı verilmeden dokunulmamalı — 80 kullanım
tesadüf değil, muhtemelen bilinçli bir mor tema. Önce "bu projenin paleti
violet mi?" sorusu cevaplanmalı; eğer öyleyse marka istisnası olarak
belgelenmeli, ekosistem kuralı buna göre esnetilmeli.

### `ramazan-vakitleri` — degrade metin ağırlıklı
- 22 `bg-clip-text` + 11 detector `gradient-text`
- Dark-only proje; kontrast kontrolü uygulanmıyor

**Değişecek: ~8 dosya.** Mor+pembe+mavi paleti CLAUDE.md'de zaten belgeli —
marka istisnası mı yoksa güncellenecek mi, karar gerekiyor.

### `elevenforge`
- 9 `layout-transition` (ekosistemde en çok), 3 `gradient-text`, 5 w/h animasyonu
- 19 kontrast adayı

**Değişecek: ~12 dosya.** Layout animasyonları mekanik düzeltme, hızlı.

### `harfiyen`
- 9 `gradient-text`, 1 w/h animasyonu
- Lint script'i var ama **ESLint config yok**

**Değişecek: ~6 dosya.**

### `keskealsaydim` — monorepo
- Go backend + `frontend/` içinde Next.js
- 11 detector, 5 gradient-text, 5 elle degrade, 4 violet
- 296 kontrast adayı — sayı yüksek, manuel doğrulama şart
- Lint script'i yok

**Değişecek: ~10 dosya + kontrast incelemesi.**

### `dungeon-mates`
- 4 elle degrade, 5 violet, 2 `gray-on-color`, 1 `border-accent-on-rounded`
- Dark-only

**Değişecek: ~6 dosya.**

### `karalama` — önce kapsam belirlenmeli
- Kökte konvansiyonel kaynak dizini yok, detector çalışmadı
- Grep'ler: 19 elle degrade, 15 violet, 5 `bg-clip-text`

**Önce yapı incelenmeli**, sonra tahmin edilebilir.

---

## Önerilen Sıra

1. **`ahmetakyapi.com`** — referans olduğu için ilk. Düzelmeden diğerlerine
   dokunmak, yanlış referanstan üretmeye devam etmek demek
2. **`rules/design-tokens.md` güncellemesi** — `gradient-text` için üç şartlı
   istisna maddesi (acilis-zili'nin kanıtladığı durum)
3. **`onepiece-hub` + `ramazan-vakitleri` palet kararı** — bunlar marka
   istisnası mı? Cevap verilmeden 80 + 22 bulgu düzeltilmemeli
4. **Mekanik düzeltmeler** — `elevenforge` (layout), `Mimio` (easing),
   `harfiyen` (gradient-text), `simayahi` (1 satır)
5. **Kontrast turu** — `Mimio`, `keskealsaydim`, `elevenforge`; manuel
6. **`derinay` `gray-on-color`** — 22 adet, erişilebilirlik borcu
7. **`karalama`** — önce kapsam

---

## Belgelenmemiş Projeler

`knowledge/themes/` yalnızca 5 proje belgeliyor (ahmetakyapi, digynotes,
mimio, keskealsaydim, ramazan-vakitleri). Ama canlıda **12 proje** var.
Belgesiz olanlar:

`acilis-zili` · `derinay` · `dungeon-mates` · `elevenforge` · `harfiyen` ·
`karalama` · `onepiece-hub` · `simayahi`

Ayrıca `digynotes` belgeli ama `~/Desktop/Projects/` altında yok — taşınmış
veya arşivlenmiş olabilir.

En az `acilis-zili` ve `simayahi` belgelenmeli: biri ekosistemin en disiplinli
projesi, diğeri en temizi — ikisi de referans değeri taşıyor.

---

## Denetimi Tekrar Çalıştırma

```bash
bash scripts/audit-project.sh ~/Desktop/Projects/acilis-zili   # tek proje
for p in ~/Desktop/Projects/*/; do bash scripts/audit-project.sh "$p"; done
```

Çıkış kodu: bulgu varsa 1, temizse 0 — CI'da kullanılabilir.
