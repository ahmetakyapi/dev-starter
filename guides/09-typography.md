# 09 — Tipografi

Font, bir ürünün ilk okunan kimlik parçasıdır ve en geç fark edilen hatasıdır:
Türkçe bir harfin yedek fonttan çizildiği, virgülün rakam genişliğine
yayıldığı ya da ₺'nin başka bir yazı tipiyle durduğu ekran ilk bakışta
"bir şey tuhaf" diye okunur, sebebi aylarca bulunmaz. Bu rehber üç şeyi
sabitler: **hangi aileler** (preset), **hangi ölçek ve rol adları**, **hangi
tuzaklar ölçüldü**.

Kaynak dosyalar:

- `snippets/fonts/fonts.ts`: on preset, `next/font/google` yükleyicileri.
- `snippets/fonts/theme-fonts.css`: `@theme inline` köprüsü ve Schibsted
  bloğu.
- Punto ölçeği şablonda (`app/globals.css`), gerekçesi
  [02-design-tokens.md § 3](02-design-tokens.md#3-punto-ölçeği-ve-ad-çakışması).

---

## 1. Kurulum

1. `snippets/fonts/fonts.ts` dosyasını `app/fonts.ts` olarak kopyala.
2. Seçtiğin presetin yükleyicileri **dışındakileri sil** (gerekçe § 6, ölçüldü).
3. Kök layout:

   ```tsx
   import { fontClass } from "./fonts";

   <html lang="tr" className={fontClass("signature")} data-theme={theme} suppressHydrationWarning>
   ```

   Şablonun `Manrope` + `IBM_Plex_Mono` satırları bu çağrıyla değişir.
4. `theme-fonts.css`teki `@theme inline` satırlarını `globals.css`teki
   `@theme inline` bloğuna taşı (`--font-display` eklenir; sans ve mono
   şablonda zaten var).
5. Gövde Schibsted ise (`signature`) aynı dosyanın son bloğunu aç (§ 5).

---

## 2. Preset Kataloğu

Hepsi Google Fonts'ta var ve `latin-ext` alt kümesi taşıyor (next/font'un
font listesinden doğrulandı, Ekim 2026). Türkçe glif testi § 3.

| Preset | Başlık | Gövde | Mono | Karakter | ₺ Gövdede |
|--------|--------|-------|------|----------|-----------|
| `signature` (varsayılan) | Schibsted Grotesk | Schibsted Grotesk | IBM Plex Mono | Sıkı, gazeteci bir grotesk; rakamları dar. Açılış Zili. | Var, çizimi farklı |
| `studio` | Manrope | Manrope | IBM Plex Mono | Yuvarlak hatlı, geniş, sıcak. ahmetakyapi.com. | Var |
| `calm` | Schibsted Grotesk | Plus Jakarta Sans | IBM Plex Mono | Grotesk başlık, yumuşak gövde. Mimio. | Var |
| `product` | Geist | Geist | Geist Mono | Nötr, dar, yoğun arayüz. | YOK |
| `editorial` | Instrument Serif | Instrument Sans | JetBrains Mono | Dar serif başlık, dergi kapağı hissi. | YOK |
| `longform` | Newsreader (optik boyutlu) | Instrument Sans | IBM Plex Mono | Uzun okuma; serif başlık küçük puntoda da dengeli. | YOK |
| `playful` | Bricolage Grotesque | Onest | JetBrains Mono | Karakterli, değişken genişlikli başlık; sade gövde. | Var |
| `technical` | Space Grotesk | Space Grotesk | JetBrains Mono | Geometrik, teknik. | Var |
| `friendly` | Plus Jakarta Sans | Plus Jakarta Sans | Geist Mono | Yuvarlak, cana yakın tüketici uygulaması. | Var |
| `dense` | Onest | Onest | JetBrains Mono | Dar ve okunaklı; küçük puntoda yoğun tablo. | Var |

**Listede olmayanlar ve nedeni:**

- **Inter varsayılan değil.** Her yerde olduğu için ürüne kimlik vermiyor;
  ekosistemde "jenerik" okunuyor. Gerekiyorsa `dense` ya da `product` aynı
  işi daha karakterli yapar.
- **Fraunces yok.** Simayahi'de denendi ve reddedildi; yeniden önerme.

---

## 3. Türkçe Glif Testi

Her preset bir sayfada "Ğğ Şş İı Öö Çç Üü: Işık, Gölge, Ağaç" ile üç rolde
çizildi, ekran görüntüsünde İ/ı noktaları ve ğ/ş kancaları gözle kontrol
edildi; ayrıca derlenen woff2 dosyalarının karakter tablosu (cmap) okundu.

- **Harfler:** on üç ailenin hepsinde ğ ş İ ı var, nokta ve kancalar yerinde.
  Hiçbir preset elenmedi.
- **₺ (U+20BA):** Geist, Geist Mono, Instrument Sans, Instrument Serif ve
  JetBrains Mono'da YOK; işaret sistem fontuyla çizilir ve komşu rakamlardan
  ayrı durur. Schibsted Grotesk'te VAR ama alışılmış çapa biçimi değil, iki
  çizgili bir "L" (₤ gibi okunabilir). Açılış Zili gövde yığınının başına
  yalnızca ₺ için ayrı bir yüz koyuyor (`font-family: "Lira Sign", …`).

Kural: TL tutarı yoğun bir üründe (finans, e-ticaret, bütçe) ₺ taşıyan bir
preset seç ya da birimi "TL" diye yaz. Yeni bir aile eklerken aynı testi
yap: tek satır örnek metin, açık ve koyu temada ekran görüntüsü, ₺ dahil.

```
✅ subsets: ["latin", "latin-ext"]
❌ subsets: ["latin"]            → ğ ş İ ı yedek fonttan; kelimenin ortasında yazı tipi değişir
```

---

## 4. Seçim Tablosu

Palet [00-brand-identity.md](00-brand-identity.md)'den gelir; font onunla
birlikte seçilir. Hücredeki ilk öneri varsayılan, ikincisi alternatif.

| Ürün Türü | signature (mavi) | verdant (zümrüt) | ember (kehribar) | iris (mor) |
|-----------|------------------|------------------|------------------|------------|
| Finans, veri, pano | `signature` · `dense` | `dense` | `dense` | `product` |
| Geliştirici aracı, SaaS | `product` · `signature` | `product` | `technical` | `technical` · `product` |
| Sağlık, terapi, eğitim | `calm` | `calm` · `friendly` | `friendly` | `calm` |
| Portfolyo, kişisel site | `studio` | `studio` | `playful` | `studio` · `editorial` |
| Blog, bülten, rehber | `longform` | `longform` | `longform` | `longform` |
| Tanıtım, ajans, kültür | `editorial` | `editorial` | `playful` | `editorial` |
| Oyun, topluluk, etkinlik | `playful` | `friendly` | `playful` | `playful` |
| Tüketici mobil uygulama | `friendly` | `friendly` | `friendly` · `playful` | `friendly` |

İki aileden fazlası yok (başlık + gövde, artı mono). Üçüncü bir aile hiyerarşi
eklemez, yalnızca yükleme süresi ekler; ayrımı ağırlık ve punto kurar.

---

## 5. Sayılar: `tabular-nums` ve Schibsted Tuzağı

`tabular-nums` (OpenType `tnum`) her rakamı aynı genişliğe getirir: sütundaki
sayılar basamak basamak alt alta gelir, canlı değişen sayı titremez.
`snippets/ui` bileşenleri (`DataTable`, `Stat`, `Pagination`, `TreeTable`)
sayı sütunlarında bunu kullanır.

**Ne zaman:** tablo sütunu, sayaç, fiyat, saat, değişim yüzdesi. **Ne zaman
değil:** paragraf içindeki sayı (orantılı rakam metinde daha doğal durur),
başlıktaki tek sayı.

**Tuzak, ölçüldü:** Schibsted Grotesk'te `tnum` virgülü ve noktayı da rakam
genişliğine çeker. 100 piksel puntoda virgül 27 birimden 63'e çıkıyor (rakam
63) ve "8,97" ekranda "8 , 97" okunuyor. Türkçede ondalık ayırıcı virgül
olduğu için bu her fiyatta görünür. Öteki dokuz presette virgül dar kalıyor
(20-27 birim).

```css
/* Yalnızca gövdesi Schibsted olan projede (theme-fonts.css son blok) */
@utility tabular-nums {
  font-variant-numeric: normal;
}
```

Tailwind v4'te `@utility` çekirdek yardımcıya bildirimi sona ekler ve kazanır
(derlenerek doğrulandı). Bedeli: basamaklar tam alt alta gelmez; sütunlar
sağa yaslı olduğu için toplam hiza korunur.

```
✅ <td className="text-end tabular-nums">1.240,50</td>      (signature dışı preset)
✅ <td className="text-end">1.240,50</td>                   (signature, blok açık)
❌ <p>Toplam <span className="tabular-nums">3</span> kayıt</p>  (cümle içinde gereksiz)
```

Sayı biçimi her zaman `Intl.NumberFormat("tr-TR")`: binlik nokta, ondalık
virgül, yüzde işareti önde (`%4,2`). Eksi işareti kısa çizgi değil U+2212
(`−`); rakam genişliğinde durur.

---

## 6. Font Yükleme Performansı

- **Değişken font, `weight` yok.** Tek dosya bütün ağırlık eksenini taşır.
  Değişken olmayan iki ailede (Instrument Serif, IBM Plex Mono) ağırlık
  zorunlu; yalnızca kullandığın ağırlıkları yaz.
- **Ek eksen bilerek.** `axes: ["opsz"]` yalnızca Newsreader ve Bricolage'da;
  optik boyut serif başlığı küçük puntoda dengeler. Her eksen dosyayı büyütür.
- **`display: "swap"`** + next/font'un `adjustFontFallback`ı: metin hemen
  yedek fontla görünür, yedeğin ölçüleri asıl fonta ayarlı olduğu için
  geçişte satırlar zıplamaz.
- **Ön yükleme kendiliğinden.** next/font `subsets`taki dosyaları ön yükler;
  elle `<link rel="preload">` yazma.
- **Kullanmadığın yükleyiciyi sil (ölçüldü).** next/font modülde TANIMLI her
  yükleyiciyi o modülü içe aktaran sayfaya bağlar; hangi `variable`ın
  kullanıldığına bakmaz. `fonts.ts`in tamamını içe aktarıp yalnızca
  `signature` kullanan sayfa 32 woff2 ön yüklemesi ve 80 `@font-face` kuralı
  aldı; iki aile yükleyen şablon sayfası 6 ön yükleme.
- **Seçenekler değişmez yazılır.** `subsets: [...LATIN]` gibi bir yayılım
  Turbopack derlemesini "Unexpected spread" ile kırar (denendi).
- **Aynı aile iki rolde iki kez iner.** Başlık ve gövde için iki ayrı
  yükleyici çağrısı ayrı dosya kümesi üretir. `calm` dışında hiçbir preset
  bir aileyi iki rolde kullanmaz; `calm`da Schibsted yalnızca başlıkta.

---

## 7. Punto Ölçeği ve Rol Adları

Ölçek şablonda (`--text-*`); adlar piksel değil rol taşır. Tam değerler ve
ad çakışması tuzakları [02 § 3](02-design-tokens.md#3-punto-ölçeği-ve-ad-çakışması).

| Sınıf | Boyut | Rol |
|-------|-------|-----|
| `text-micro` | 11 | Mono künye, klavye ipucu |
| `text-small` | 12 | Etiket, alan adı, tablo başlığı, rozet |
| `text-base` | 14 | Arayüz varsayılanı: düğme, liste, tablo gövdesi |
| `text-read` | 16 | Okuma gövdesi |
| `text-lead` | 18 | Sayfa açıklaması, giriş paragrafı |
| `text-title` | 20 | Panel başlığı (h2) |
| `text-heading` | 24 | Bölüm başlığı, büyük ölçü |
| `text-display` | 36 | Sayfa başlığı (telefonda) |
| `text-hero` | 40-72 | Kahraman, akışkan (`clamp`) |

- Gövde puntosu `read`, `body` değil: `text-body` RENK token'ı.
- 12 pikselin altı yalnızca mono künyede. Açılış Zili'nde 11 puntoluk kart
  gövdesi "yazılar net okunmuyor" geri bildirimi aldı; taban 13-14'e çıktı.
- `font-display` başlık ailesine bağlanır (`theme-fonts.css`); h1 ve h2
  kendiliğinden alır.

---

## 8. Satır Uzunluğu ve Kırılım

- **Okuma metni 60-75 karakter.** `max-w-[65ch]` ya da kabın kendisi; satırı
  punto taşır, dar sütun değil. Açılış Zili'nde metni kutulardan ayrı dar bir
  sütunda tutmak iki kez denendi, kenarlar her blokta sıçradığı için geri
  alındı.
- **`text-wrap: balance` başlıkta** (şablonda h1-h4 için açık): iki satırlık
  başlık yarım satır + tek kelime diye bölünmez.
- **`text-wrap: pretty` gövdede** (şablonda `body`de açık): son satırda tek
  kelime kalmaz.
- Uzun Türkçe birleşik kelime ve URL'de `break-words` (`overflow-wrap:
  break-word`); `break-all` değil, o kelimeyi harf ortasından böler.

---

## 9. Degrade Başlık

Kural [02 § 7](02-design-tokens.md#7-degrade-metin--belgeli-istisna)'de;
tipografi açısından üç not:

- Yalnızca kısa display metin: bir-üç kelime, `text-display` ve üstü.
  Paragrafa, panele, sayıya degrade yok.
- `padding-bottom: 0.06em` şart: ş, ç, ğ, g, y'nin kuyruğu kırpılır.
- Serif display (editorial, longform) ile degradeyi açık ve koyu temada
  gözle kontrol et: ince serif çizgiler degradenin açık ucunda zeminle
  kaynaşabilir. Şüphedeysen düz `text-strong`.

```
✅ <h1 className="display-ink text-hero">Galeri</h1>
❌ <p className="display-ink text-base">Son güncelleme 3 Ekim</p>
```

---

## 10. Title Case ve Türkçe Büyük Harf

Başlık, düğme, sekme, rozet, tablo başlığı **Title Case**; paragraf,
açıklama, hata gövdesi, `placeholder` ve `aria-label` cümleleri cümle düzeni.
Bağlaçlar (ve, ile, için, de/da, mi) başta değilse küçük: "Faiz, Tahvil ve
Getiri Eğrisi".

- **`text-transform: capitalize` ve `title()` KULLANMA.** Ölçüldü
  (Chromium, `<html lang="tr">`): `capitalize` "istanbul ve izmir"i
  "Istanbul Ve Izmir" yapıyor; hem noktalı İ kayboluyor hem bağlaç büyüyor.
  Title Case metne elle yazılır.
- **Büyük harfe çevirme `toLocaleUpperCase("tr-TR")`**, küçültme
  `toLocaleLowerCase("tr-TR")`. Baş harf (`avatar.tsx`), arama süzgeci
  (`combobox.tsx` → `locale="tr-TR"`, `command-palette.tsx`, `tree-view.tsx`)
  bu kuralla yazıldı.
- **`uppercase` sınıfı `lang="tr"` altında doğru çalışır.** Aynı ölçümde
  "istanbul ılık" → "İSTANBUL ILIK"; `lang="en"` altında "ISTANBUL". Yani
  `<html lang="tr">` ŞART ve İngilizce bir alt ağaçtaki Türkçe metin yanlış
  büyür. Büyük harfli künye yine de seyrek kullanılır, okunması yavaş.

```
✅ "ilker".toLocaleUpperCase("tr-TR")   → "İLKER"
❌ "ilker".toUpperCase()                → "ILKER"
✅ <h2>Hesap Ayarları</h2>
❌ <h2 className="capitalize">hesap ayarları</h2>
```

---

## Kontrol Listesi

- [ ] Preset § 4'ten seçildi, kullanılmayan yükleyiciler silindi
- [ ] `subsets: ["latin", "latin-ext"]`, değişken fontta `weight` yok
- [ ] Değişken adları `-face` sonekli, köprü `@theme inline`da
- [ ] TL tutarı varsa preset ₺ taşıyor ya da birim "TL"
- [ ] Gövde Schibsted ise `tabular-nums` ezme bloğu açık
- [ ] Gövde metni `text-read`, 12 piksel altı yalnızca mono künyede
- [ ] Degrade yalnızca kısa display başlıkta, `padding-bottom` ile
- [ ] Title Case elle; `capitalize` ve `toUpperCase()` yok
