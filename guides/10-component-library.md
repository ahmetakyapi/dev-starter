# 10 — Bileşen Kütüphanesi

Şablon yalnızca her projede gereken yedi parçayı taşır (Button, Panel,
PageHeader, EmptyState, Skeleton, ThemeToggle, Field). Geri kalan her şey
`snippets/ui/` altında: 36 bileşen, katalog ve bağımlılık tablosu
[snippets/ui/README.md](../snippets/ui/README.md)'de.

---

## 1. Mantık: Kaynak, Paket Değil

Kütüphane shadcn gibi çalışır: bileşen projeye **kopyalanır**, sonra projenin
malıdır. Paket olarak yayımlanmaz, çünkü:

- Her proje bileşeni değiştirir (bir varyant, bir metin, bir ölçü). Paketten
  gelen bileşende bu, ya prop patlaması ya da çatallanma demek.
- Kararlar kodun içinde yorum olarak durur ("neden `<dialog>`", "neden
  `min-w-0`"). Kopyalanan dosya gerekçesini de taşır; paketin içinde
  okunmaz.
- Bağımlılık yüzeyi küçük kalır: her dosya yalnızca `@/lib/utils` (`cn`),
  gerekirse `@/lib/motion`, token sınıfları, `lucide-react` ve altı dosyada
  `@base-ui/react` ister.

**Sözleşme (her dosyada):** token sınıfı (hex, hazır palet, `dark:` yok),
`focus-visible` halkası (globals.css'teki genel kural), dokunmatikte ≥ 44 px
hedef (`pointer-fine:` ile farede küçülür), hareketi azaltana saygı, Türkçe
varsayılan metin prop ile değişir, `"use client"` yalnızca gerekene.

---

## 2. Başsız Kütüphane Kararı

**Seçim: Base UI (`@base-ui/react`, 1.8.0).** Kullanıldığı yerler: Popover,
Tooltip, DropdownMenu, Select, Combobox, Avatar. Diyalog, çekmece ve komut
paleti yerel `<dialog>` ile (§ 3).

Ekim 2026 itibarıyla doğrulananlar (npm kayıtları ve paket belgeleri):

| | Base UI | Radix |
|---|---------|-------|
| Paket | `@base-ui/react` (eski `@base-ui-components/react` kullanımdan kaldırıldı) | `radix-ui` (tek paket) ya da `@radix-ui/react-*` |
| Son kararlı | 1.8.0, 4 Eylül 2026 | 1.6.7, 24 Temmuz 2026 |
| Ritim | 1.0 Aralık 2025'te, sonra her ay bir küçük sürüm | Düzenli; 1.7 sürüm adayında |
| React 19 | `peer: ^17 \|\| ^18 \|\| ^19` | `peer: … \|\| ^19.0` |
| Combobox / Autocomplete | Var | Yok |
| Bileşimi | `render` prop'u | `asChild` |
| Belge | Paketin içinde (`node_modules/@base-ui/react/docs`) | Sitede |

İkisi de bakımlı ve React 19 uyumlu; karar şu dört noktadan:

1. **Combobox yerleşik.** Aranabilir seçim en zor erişilebilirlik
   kalıplarından biri (combobox + listbox + `aria-activedescendant` + süzgeç).
   Radix'te yok; ikinci bir kütüphane ya da elle yazmak gerekirdi. Base UI
   `locale` prop'uyla Türkçe karşılaştırma da yapıyor ("i" → "İstanbul",
   "ı" → "Iğdır"; galeride sınandı).
2. **`render` prop'u ekosistemin `asChild yok` kuralıyla uyumlu.** Şablonun
   Button'ı `asChild`i bilerek reddediyor; Base UI bir öğeyi başka bir
   bileşenle birleştirirken `render={<IconButton … />}` kullanıyor, tek
   bileşenin iki öğe gibi davranması gerekmiyor.
3. **Belge pakette.** `node_modules/@base-ui/react/docs/` altında her
   bileşenin Markdown belgesi var; bir ajan ya da geliştirici kurulu sürümün
   API'sini ağa çıkmadan okur. Bu kütüphane o belgelerle yazıldı.
4. **Ekip.** Radix, Floating UI ve MUI'nin yazarlarından; konumlama Floating
   UI ile aynı motor.

**Bilinen bedel:** shadcn ekosisteminin varsayılanı hâlâ Radix; hazır örnek
ve üçüncü taraf bileşen Radix için daha bol. Radix kullanan mevcut bir
projede (shadcn tabanlı projeler) kütüphane değiştirilmez; oraya alınan bileşen
Radix'e uyarlanır.

**Kurulum:** `npm install @base-ui/react`. Positioner'lar `z-50` taşır; kök
layout'ta gövde sarmalayıcısına `isolate` vermek popup'ların başka bir yığın
bağlamının altında kalmasını önler.

---

## 3. Yerel Öğe Önce

Tarayıcı bir kalıbı kendisi çözüyorsa kütüphane kurulmaz:

| Kalıp | Yerel Çözüm | Tarayıcının Verdiği | Bizim Eklediğimiz |
|-------|-------------|---------------------|-------------------|
| Diyalog, çekmece, komut paleti | `<dialog>` + `showModal()` | Odak tuzağı (arka plan `inert`), Escape (`cancel`), üst katman | Odağın açana dönmesi, arka plana tıklama, sayaçlı kaydırma kilidi |
| Akordeon | `<details>` / `<summary>` | Aç/kapa, Ctrl+F ile kapalı içeriği bulma, `name` ile tekil açık | Kaydırma çapası koruması, açılış animasyonu |
| Anahtar, onay, radyo | `<input type="checkbox" role="switch">`, `<fieldset>` | Klavye, form gönderimi, JS'siz çalışma | Görünüm (`appearance-none`, `peer`) |

**Kaydırma kilidi `html:has(dialog[open])` ile yapılmaz:** kökteki `:has()`
her DOM değişikliğinde bütün belgenin stilini yeniden hesaplatır (Açılış
Zili'nde ölçülmüş yavaşlık). Kilit stil özelliğiyle ve sayaçla.

**Sınır:** yerel modal diyalogda Tab son öğeden sonra tarayıcı arayüzüne
(adres çubuğu) çıkar, sayfaya değil. Spesifikasyon davranışı; sayfa `inert`
kaldığı için erişilebilirlik açığı değil.

---

## 4. Bileşenler: Ne Zaman, Ne Zaman Değil

### Yükleme

- **Spinner**: düğme içi, tek hücre. Panel ya da sayfa için değil (iskelet).
- **LoadingMark**: ekranın ortasındaki bekleme. Yüzde göstermez; döngü
  yalnızca beklemede, reduced-motion'da sabit.
- **RouteProgress**: kök layout'ta bir kez, `<Suspense>` içinde. Sığ adres
  güncellemesi (`history.replaceState`) uçuştaki gezinmeyi sessizce öldürür:
  böyle bir denetim `useRouteNavigating()` ile gezinme sürerken kendini
  kapatır, bağlantısına `data-shallow` konur.
- **Skeleton**: içeriğin şeklinde (`SkeletonText`, `SkeletonRow`,
  `SkeletonCard`). Kap `aria-busy` taşır.

### Düğme ve İkon

- **Icon**: süs ikonu `aria-hidden` (varsayılan); anlam taşıyorsa `label`.
- **IconButton**: metinsiz her düğme. `aria-label` tipte zorunlu.
- **ButtonGroup**: bağlı eylemler. Seçim taşıyorsa SegmentedControl.
- **SegmentedControl**: 2-5 kısa seçenek, anında etki ("Gün / Hafta / Ay").
  İçerik bölümü değişiyorsa Tabs. Gösterge `layoutId` ile kayar, bu
  `domMax` ister ve bileşen kendi `LazyMotion`ını açar; kökteki
  `domAnimation`a dokunma.
- **CopyButton**: sonuç ekran okuyucuya da söylenir; izin yoksa "Kopyalanamadı".
- **Kbd**: kısayol ipucu. Dokunmatikte gizle (`pointer-fine:`).

### Katmanlar

- **Dialog**: onay, kısa form, yıkıcı eylem. Yıkıcı onayda ilk odak
  "Vazgeç"te (`autoFocus`). Uzun form için ayrı sayfa.
- **Sheet**: telefonda filtre ve ayrıntı. Sürükleme tek kapatma yolu değil.
- **Popover**: sayfayı kilitlemeyen küçük kutu. İçinde form varsa
  `modal="trap-focus"` ve bir `PopoverClose`.
- **Tooltip / InfoTip**: Tooltip yalnızca görsel etiket ve dokunmatikte
  AÇILMAZ (Base UI'nin bilinçli kararı: uzun basma tarayıcının bağlam
  menüsüyle çakışıyor). Okunması gereken bilgi InfoTip'e: farede üzerine
  gelince, dokunmatikte tıklayınca açılır.
- **DropdownMenu**: eylem listesi. Değer seçtiriyorsa Select. Başka sayfaya
  giden öğe `DropdownMenuLinkItem` (`render={<Link href=… />}` ile istemci
  gezinmesi).
- **CommandPalette**: ⌘K. Komutlar veri; gezinmeyi çağıran yapar.

### Veri

- **DataTable**: sıralama adreste (`?sort=&dir=`), `scroll={false}`; veri
  sunucuda `parseSort` + `sortRows` ile sıralanır. Dar ekranda `table-fixed`
  ile zorlanmaz, kayar; ilk sütun yapışkan, sağ kenar "devamı var" diye
  solar. Karşılaştırma çubuğu yalnızca karşılaştırılabilir ölçüde (farklı
  şirketlerin hisse fiyatında değil). Izgara ya da flex öğesi olduğunda kökü
  `min-w-0` (bileşende var; 390 pikselde ölçülen taşma).
- **TreeView**: hiyerarşik gezinme. Düz liste için değil.
- **TreeTable**: açılır satırlı tablo. Hücreler hazır ReactNode, satırlar
  sunucudan geçer.
- **Pagination**: sayfa adreste. Sonsuz kaydırma yerine, kullanıcının
  konumu paylaşması ya da geri dönmesi önemliyse.
- **Stat**: `StatGrid` (`dl`) içinde. `positiveIsGood={false}` gider ve hata
  oranı gibi ölçülerde.
- **Sparkline**: eğilim işareti; okunacak sayı yanında. `tone="auto"`
  yalnızca "yükselmek iyi" serilerde.

### Form ve Gezinme

- **Switch** anında etki, **Checkbox** kaydet düğmesine bağlı seçim.
- **RadioGroup** 2-6 seçenek, **Select** 5-15, **Combobox** daha fazlası ya
  da aranacaksa. Basit form alanında yerel `<select>` hâlâ doğru.
- **Tabs** aynı sayfada içerik; **TabLinks** ayrı adresler (`aria-current`).
- **Accordion**: SSS ve katlanır bölüm. Ekranın asıl içeriğini katlama.
- **Breadcrumb**: üç ve daha derin hiyerarşide. Telefonda tek geri bağlantısı.
- **Badge**: durum ve kategori. Tıklanan etiket düğmedir, rozet değil.
- **Avatar**: baş harf `toLocaleUpperCase("tr-TR")`. `next/image`
  gerektirmez; uzak avatar için `remotePatterns`a joker host yazmak
  `/_next/image`ı herkese açık bir görsel vekiline çevirirdi.
- **Stepper**: çok adımlı akışta konum. Gezinme değil.
- **FileDropzone**: MIME izin listesi; SVG varsayılan REDDEDİLİR (betik
  taşıyabilir). İstemci denetimi kolaylık; sunucu boyutu ve sihirli baytları
  yeniden doğrular.
- **Timeline**: tarihli olaylar. Görünen zamanı çağıran biçimler (göreli
  zaman sunucu ile istemcide farklı çıkar).
- **EmptyState**: `icon` panel içi, `scene` sayfa düzeyi, `inline` tek satır.
  Panel içine sahne konmaz.

---

## 5. Klavye Haritaları

### TreeView (`role="tree"`)

| Tuş | Etki |
|-----|------|
| ↓ / ↑ | Görünen sonraki / önceki öğe |
| → | Kapalıysa aç; açıksa ilk çocuğa git |
| ← | Açıksa kapat; kapalıysa ebeveyne git |
| Home / End | İlk / son görünen öğe |
| Enter, Space | Seç (çocuklu öğede aç/kapa) |
| * | Aynı düzeydeki bütün kardeşleri aç |
| Harf | O harflerle başlayan sonraki öğe; 500 ms içinde yazılanlar birleşir, Türkçe küçük harfle karşılaştırılır |

Ağaç Tab sırasına tek durak olarak girer (gezici tabindex).

### TreeTable (`role="treegrid"`, satır odağı)

| Tuş | Etki |
|-----|------|
| ↓ / ↑ | Sonraki / önceki görünen satır |
| → | Kapalıysa aç; açıksa ilk alt satıra git |
| ← | Açıksa kapat; kapalıysa üst satıra git |
| Home / End | İlk / son satır |
| Enter | Aç/kapa |

### DataTable

Sıralama başlıkları bağlantı: Tab ile gezilir, Enter ile sıralanır. Kaydırma
kabı odaklanabilir bölge (`tabIndex=0`, adı `caption`): odaklanınca ← / →
tabloyu kaydırır.

### Diğerleri

| Bileşen | Tuşlar |
|---------|--------|
| DropdownMenu | Enter/Space/↓ aç · ↓↑ gez · Home/End · harf · Escape kapat ve odak tetikleyiciye · Tab kapat ve ilerle |
| Select, Combobox | ↓↑ gez · Enter seç · Escape kapat · Combobox'ta yazmak süzer, odak girişte kalır |
| CommandPalette | ⌘K / Ctrl+K aç-kapa · ↓↑ gez · Enter çalıştır · Escape kapat |
| Tabs | ← → sekme (otomatik etkinleştirme) · Home/End · Tab panele geçer |
| SegmentedControl | ← → ↑ ↓ seçimi taşır · Home/End |
| RadioGroup | Tarayıcının yerel ok gezinmesi |
| Dialog, Sheet | Tab içeride döner · Escape kapat ve odak açana |

---

## 6. Erişilebilirlik Kontrol Listesi

- [ ] Metinsiz her düğmenin `aria-label`ı var (IconButton tipte zorunlu)
- [ ] Süs ikonları `aria-hidden`
- [ ] Odak halkası görünür, kırpan kabın içinde içeri alınmış
- [ ] Dokunma hedefi ≥ 44 px (`min-h-11`), farede küçülebilir
- [ ] Katman kapanınca odak açan öğeye dönüyor
- [ ] Escape her katmanı kapatıyor
- [ ] Renk tek ayırt edici değil (Stat: işaret + ok + "artış/düşüş" metni)
- [ ] Durum değişimleri canlı bölgede (kopyalandı, yükleniyor, reddedilen dosya)
- [ ] Tablo `caption` ve sütun başlıkları `scope` taşıyor; sıralı sütun `aria-sort`
- [ ] Kayan bölge klavyeyle odaklanabilir ve adlı
- [ ] Hareketi azaltan kullanıcıda döngü yok, gösterge kaymıyor
- [ ] Türkçe arama ve büyük harf `tr-TR` ile

---

## 7. Projeye Alma

```
/snippet data-table
```

Komut dosyayı okur, projenin yığınını kontrol eder (`next`, `tailwindcss`,
`motion`, LazyMotion), uyarlar ve `components/ui/` altına yazar. Elle:

1. `snippets/ui/<ad>.tsx` dosyasını `components/ui/` altına kopyala.
2. Base UI kullanıyorsa: `npm install @base-ui/react`.
3. Proje farklı rol adları kullanıyorsa (shadcn `bg-background` gibi)
   sınıfları çevir; yapıya dokunma.
4. `npm run typecheck && npm run lint`; görsel bir bileşense 390 ve 1280
   pikselde, iki temada aç.

**Doğrulama kaydı (Ekim 2026):** 36 dosya Next 16.3 + React 19.2 +
Tailwind 4 + Base UI 1.8 şablon kopyasında geçici bir galeri sayfasında
çizildi: `build`, `typecheck`, `lint` temiz; 390 ve 1280 piksel × açık ve
koyu temada yatay taşma yok, konsol hatası yok. Klavyeyle sınananlar: ağaç
(oklar, Home/End, `ı` → "ışık.md", `İ` → "İzmir.md"), menü (oklar,
Home/End, Escape sonrası odak tetikleyicide), diyalog (ilk odak Vazgeç,
Escape sonrası odak açan düğmede), combobox Türkçe süzgeç, komut paleti.
Bu sırada bulunan iki hata düzeltildi: ızgara içindeki DataTable kökünün
390 pikselde 677'ye taşması (`min-w-0`) ve koyu temada kapalı Switch
başparmağının rayla kaynaşması.
