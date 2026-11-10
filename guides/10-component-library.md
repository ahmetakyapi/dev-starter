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

## 2. Headless Kütüphane Kararı

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
   bileşenin Markdown belgesi var; bir agent ya da geliştirici kurulu sürümün
   API'sini ağa çıkmadan okur. Bu kütüphane o belgelerle yazıldı.
4. **Ekip.** Radix, Floating UI ve MUI'nin yazarlarından; konumlama Floating
   UI ile aynı motor.

**Bilinen bedel:** shadcn ekosisteminin varsayılanı hâlâ Radix; hazır örnek
ve üçüncü taraf bileşen Radix için daha bol. Radix kullanan mevcut bir
projede (shadcn tabanlı projeler) kütüphane değiştirilmez; oraya alınan bileşen
Radix'e uyarlanır.

**Kurulum:** `npm install @base-ui/react`. Positioner'lar `z-50` taşır; kök
layout'ta gövde wrapper'ına `isolate` vermek popup'ların başka bir yığın
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
- **Kbd**: kısayol ipucu. Dokunmatikte gizle (`pointer-fine:`). Simgeli
  tuşa `label` ("Command"): görünmez metin olarak okunur, simge gizlenir.

### Katmanlar

- **Dialog**: onay, kısa form, yıkıcı eylem. Yıkıcı onayda ilk odak
  "Vazgeç"te (`data-autofocus`; `autoFocus` istemci çiziminde işlemez).
  Uzun form için ayrı sayfa.
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
- **ChartCard + ChartLegend**: her grafiğin kabı. Kart gri kuyu
  (`bg-surface`), lejant karoları beyaz (`bg-overlay`); başlıktaki büyük
  değer telefonda okunan tek sayıdır, grafik onu destekler.
- **StageBars**: huni. Çizim değil çubuk: ortak taban çizgisinde uzunluk
  doğru okunur. Satırlar `subgrid`, izler hizalı.
- **TrackBarChart**: sıralı tek seri. Etiketler kısa ("Oca"): 12 sütun
  telefonda sütun başına ~24 px.
- **RingChart**: az kategori, büyüklük sırası. Tam oran okunacaksa StageBars.
- Seri rengi sırası sabit (`chart-1` ilk seri) ve lejantla aynı. Renk metin
  rengi olmaz; değer her zaman `text-strong` ile yanında yazılır.

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
- **FileDropzone**: MIME izin listesi (`image/*` joker SVG'yi kapsamaz); SVG
  varsayılan REDDEDİLİR (script taşıyabilir). İstemci denetimi kolaylık; sunucu
  boyutu ve sihirli baytları yeniden doğrular. Bırakılan dosya da form
  girişine yazılır, reddedilen çıkarılır. `maxBytes` taşıyıcının sınırını
  aşmasın: sunucu eylemi varsayılan 1 MB
  (`experimental.serverActions.bodySizeLimit`), Vercel 4,5 MB, nginx 1 MB.
- **Timeline**: tarihli olaylar. Görünen zamanı çağıran biçimler (göreli
  zaman sunucu ile istemcide farklı çıkar).
- **EmptyState**: `icon` panel içi, `scene` sayfa düzeyi, `inline` tek satır.
  Panel içine sahne konmaz.

### Grafik (board dili, 2026-11)

- **AreaChart**: iki dönemi kıyaslamak için; monoton kübik eğri sıfırın altına/tepeye taşmaz. Biçim `valueFormat` (Intl seçenekleri) ile, fonksiyonla değil (istemci bileşeni). Çizim kırpma perdesiyle: `pathLength` + `non-scaling-stroke` çizgiyi yarıda bırakıyor.
- **GaugeChart**: kalan iz `max` ile; parçalar arası boşluk yuvarlak uçların içinden hesaplanır.
- **FunnelChart**: kaybın yeri sorulunca; kesin kıyas için `stage-bars` daha dürüst.
- **Heatmap**: tarihler UTC, bitiş günü veriden (hidrasyon farkı yok); telefonda yatay kayar, en yeni haftada açılır.
- **RadarChart**: en çok iki seri, kısa etiketler.
- **SankeyChart**: yalnızca iki katman; ad 10-12 harfi geçmesin. Yerleşim saf `sankeyLayout`ta.
- **BarList**: varsayılan büyükten küçüğe; anlamlı sıra varsa `sort={false}`.
- **LineChart**: hacim okunacaksa `area-chart`. Lejant süzgeci Y eksenini kalan serilere göre yeniden ölçekler; tahmini `dashed` ile ver ki renkten bağımsız ayırt edilsin.
- **ComboChart**: yalnız iki ölçünün birimi farklıysa. Oranı 0-1 ve `format: { style: "percent" }` ile ver; sağ eksen solun adım sayısına uyar, ızgara tek.
- **ScatterChart**: zaman ekseni varsa bu değil. Kategori gizlenince eksen bilerek kaymaz; 64 px'ten uzak imleç nokta seçmez.
- **ActivityRings**: ölçülerin birbirine oranı okunacaksa `ring-chart`. Beyaz karo üstünde `cut="stroke-overlay"`.
- Bütün grafikler görünür olunca çizilir (`useInView`); hareket azaltmada son hal anında. JS yoksa çizim başlangıç halinde kalır, veri sr-only tabloda okunur.

### Verimlilik

- **KanbanBoard**: durum bileşenin içinde; kalıcılık için `onChange`te sunucu eylemi. `today` verilmezse gecikme vurgusu yalnız istemcide. `limitMode="block"` dolu kolona bırakmayı reddeder. Kendi ağacında `domMax` yükler.
- **WeekCalendar**: tarih seçmek için değil (`date-calendar`). Test ve hikâyede `now` ile saati sabitle. 45 dakikadan kısa blokta saat yalnız ekran okuyucuya söylenir.
- **TaskList**: üst görevi işaretlemek alt görevleri bitirir, son alt görev bitince üst de biter. İş kolonlar arasında akıyorsa `kanban-board`.

### Form Girişleri

- **Slider**: değer yaklaşıksa; kesin sayı için number-field. Ağ isteğini `onValueCommitted`ta yap; aralıkta `minStepsBetweenValues`.
- **NumberField**: basılı tutunca 1,2 sn sonra 5, 2,4 sn sonra 10 adım. Telefon/posta kodu için değil (onlar metin).
- **InputOtp**: doğrulama `onComplete`te, sonuçla `error`. Ayraç ortada (3+3).
- **Textarea**: büyümeyi `field-sizing` yapar, Firefox'ta küçük JS yedeği. Sayaç %90'da uyarı, sınırda tehlike.
- **TagInput**: boş alanda Backspace önce son çipi işaretler, ikincide siler. Sunucuda `formData.getAll(name)`.
- **ColorPicker**: değer `#rrggbb`, kullanıcı verisi olduğu için `style` ile; sistem renkleri token'dır, buradan seçilmez.
- **DateCalendar**: SSR tutarlılığı için `defaultMonth` ver; "bugün" yalnız tarayıcıda. Doğum tarihi için yanlış araç.
- **DatePicker**: gizli giriş `YYYY-AA-GG`; aralıkta `<name>-start`/`<name>-end`.
- **TimeField**: 24 saat, değer sarılır; yarım değer `null`.
- **Input**: içine bir şey (ikon, ₺, temizle, göz) konacaksa bu, yoksa şablonun `Field`ı. Önek görsel ipucudur; anlamı etiket taşır ("Tutar (₺)").
- **SearchField**: süzme ve arama içindir; seçtirmek gerekiyorsa combobox, komut için komut paleti. Sayfada ⌘K paleti varsa `shortcut="/"`. Sunucuda süzülecekse `normalizeTr`/`matchesTr`'yi `lib/`e taşı.
- **Rating**: gösterimde `Rating`, formda `RatingInput`. Beş ayrık seçenek bir radyo grubudur, slider değil. Dolu yıldız `accent-warm`.

### Katman ve Geri Bildirim (ek)

- **ContextMenu**: hızlandırıcıdır, tek kapı olamaz; aynı eylemler görünür bir "Daha Fazla" düğmesinde (`dropdown-menu`) de olsun. Alt menü en fazla bir düzey.
- **CloseButton**: her × buradan; adı neyi kapattığını söyler. `bleed` köşede hizayı bozmaz, 44 px korunur.
- **Divider**: kart içinde kart yerine. "ya da" etiketli kap kasıtlı olarak `separator` değil.
- **Progress / Meter**: iş bitecekse progress, kapasite ise meter. Süre bilinmiyorsa `value={null}`, uydurma yüzde yok. Dolgu `translateX` ile kayar. Meter eşikleri oran (0,75 / 0,9); yüksek değerin iyi olduğu ölçekte `inverted`.
- **Announcement**: anahtar duyuruya özgü (`duyuru:<konu>-<tarih>`); kapatma satır içi betikle ilk boyamadan önce gizlenir (CSP'de nonce gerekir).
- **NotificationCenter**: durum çağıranda (`items` + `onMarkRead`); rozet 9'dan sonra "9+".
- **Carousel**: asıl mesajı 2. slayta koyma; etkin nokta `clip-path` ile uzar.
- **Chip**: tek seçimli süzgeç için `segmented-control`. Çip kaldırılınca odağı taşımak üst bileşenin işi.
- **BannerAlert**: sayfayla gelen satır sessiz; sonradan belirene `announce`. En fazla iki eylem.
- **Toast** (`ui/toast.tsx`): `<Toaster />` sayfada bir kez; mount öncesi çağrılar sıraya girer. Karar gerekiyorsa dialog, kalıcı durum için banner-alert. Hata kendiliğinden kapanmaz; geri al için `toast.undo` (8 sn).
- **HoverCard**: yalnız ek bilgi; içine tek yolu olan eylem koyma (Tab ile karta girilmez). Dokunmatikte iki dokunuş gerekir.
- **ToggleGroup**: seçenekler birbirini dışlıyor ve biri hep seçili olmak zorundaysa `segmented-control`. Yalnız ikonlu öğede `label` zorunlu.

### İşçilik Turu Bileşenleri (2026-11)

- **CodeBlock**: belge, ayar ekranı ("Webhook ile Bağla") ve landing'in kurulum satırı. Kurulumda `installTabs(paket)` + `persist="pm"`: kullanıcının paket yöneticisi bütün bloklarda ve sonraki ziyarette hatırlanır. Renklendirme gerekiyorsa sunucuda üretip `children` ver; kopyalanan metin yine `code`.
- **Marquee**: sayfada tek şerit; beş saniyeden uzunsa durdurma düğmesi kapatılmaz (WCAG 2.2.2). İçindeki bağlantılar bir kez Tab sırasına girer.
- **CompareSlider**: iki katman aynı boyda olmalı (kap uzun olandan boy alır). İçinde tıklanacak öğe koyma: kaydırıcı kabı kaplar. Görselde iki `alt` farkı anlatsın.
- **TextShimmer**: etiket olarak, spinner'ın yanında değil. Uzun iş için `progress`; yüzde biliniyorsa parıltı değil sayı göster.

### Bencho Turu (2026-11)

- **SegmentedMeter `size="lg"`**: kendi karosunda duran kota kartı (Dosya Alanı, Bağlam). Lejant hapına gelince bölüm öne çıkar; %90'da kalan pay `warning-fill` ve "Az Yer Kaldı". Ayar satırında ve rapor kuyusunda `sm` kalır.
- **AssigneePicker**: tek sahipli alan (Atanan) `multiple={false}`, izleyen/ekip çoklu. Kişi listesi uzunsa (50+) sunucu araması için `people`'ı çağıranda süz.
- **Reactions**: yorum, not, duyuru altında; tepki seti sabit altı ikon (emoji yok). Sayıyı sunucuda tut, bileşen iyimser günceller.
- **TimeScrubber**: aralığı görmek önemliyse (06.00-22.00 içinde neredeyim); kesin dakika yazılacaksa `time-field`. Değer gece yarısından beri dakika.
- **SignaturePad**: "Yazarak" yolu kaldırılmaz (WCAG 2.1.1). Sunucuda `formData.get("imza")` SVG ya da ad, `imza-kind` hangisi olduğunu söyler; SVG'yi saklamadan önce yalnız `path d` değerini doğrula.
- **HoldButton**: yalnız geri alınabilir eylemde (bildirimde Geri Al olan). Geri alınamazsa `confirm` diyaloğu; süre 800-1600 ms.

- **TickRuler** (ikinci Bencho turu): `time-scrubber` saate özel (06.00-22.00, dakika dilimi), `tick-ruler` her sayı için (süre, sıcaklık, yüzde; ivmeyle kayar, uçta lastik gibi direnir); saat seçiliyorsa `time-scrubber`.  değer bir süreklilikteyse ve kesinlik ikinciyse (toplantı süresi, termostat). Formda kesin sayı `number-field`, aralık `slider`. Çentik ~500'ü geçmesin; `valueText` ile okunuşu düzelt ("Saat 09:45").
- **DigitRoll**: yalnız değişen değerde. İlk yüklemede dönen sayı `snippets/rolling-number`, ara değerden sayan `snippets/animated-number`; üçü üç ayrı iş. Büyük sayıyı 500 ağırlık ve `tracking-tight` ile, birimi `text-muted` küçük puntoyla yaz.

### EasyUI Turu (2026-11)

- **SplitButton**: kardeşler aynı işin biçimleriyse (CSV/Excel/PDF, Yayınla/Zamanla). Farklı işler (Düzenle, Sil) `dropdown-menu`.
- **SelectionBar**: seçim durumu sayfada (`picked`), çubuk yalnız gösterir. Toplu işlem tek bildirim ve tek Geri Al ile; satır başına bildirim yığma.
- **TocNav**: beş ve daha fazla bölümlü sayfada. Hedef başlıklara `scroll-mt-*` ver (yapışkan hapın boyu); kabuk içinde kullanıyorsan kaydırma kabı `app-shell`in içerik karosudur.
- **ProductTour**: dört-beş adım, bir kez gösterilir; tekrar açma düğmesi ekranda kalır. Hedefe `data-tour="ad"` ver; seçici de olur.
- **AppShell kaydırması (değişti)**: masaüstünde kabuk ekran boyunda, kenar çubuğu yerinde, içerik karosu kendi içinde kayar; telefonda pencere kayar. Sayfa değişiminde başa dönmek için `#icerik`i de kaydır.

### Secki Turu (2026-11)

- **Süren işin dili, kartta biri:** etiket `text-shimmer`, çerçeve `border-beam`, küre `thinking-orb`, nokta matrisi `pixel-loader`. Düğme içinde `spinner`.
- **ToolCall / Reasoning / StreamText**: ajan yanıtının üç katmanı. Araç çağrısı tek satır, açınca girdi/çıktı; düşünce akarken açık, bitince "6 sn düşündü"; yanıt yalnız yeni sözcüğü belirterek akar. Mesaj listesi `chat-thread` (`role="log"`).
- **SlotText ya da DigitRoll**: rakamsa `digit-roll`, etiketse `slot-text`. İkisi de ilk çizimde durağan.
- **PatternBackground**: kap `relative isolate`; hazır birleşimler `PATTERN_PRESETS`. Stil `@layer components`te: `className="fixed"` bütün sayfa zemini yapar.
- **Dial ya da Slider**: kontrol panelinde yan yana birkaç ayar → kadran; formda tek aralık → `slider`; kesin sayı → `number-field`.
- **ExpandableCard**: kartın kendisi büyür (`layoutId`, `domMax`); başka bir yerden açılan pencere için `dialog`.
- **Paket mi kopya mı:** `@ahmetakyapi/ui` 97 bileşeni taşır (Next ve Base UI'sızlar). Kalanlar ve uyarlamak istediğin her şey `add-ui` ile kaynak olarak.

### Ribbon Turu: Tanıtım (2026-11)

- **Görsel zeminli kahraman:** menü `docking-nav` (opak hap, kaydırınca üst kenara oturur), başlık `blur-in` (tek `<em>` vurgu, `editorial` preset), eylem `LiquidGlassLink tone="media"`, altında `trust-line tone="media"`. Düz zeminde cam yerine `bg-cta`, menü yerine şablonun `SiteHeader`ı.
- **Ürün maketi:** ekran görüntüsü yerine `AppWindow` + `WindowStrip` + `Dock`. Tek pencere `focused`; sahne `role="img"` ve tek cümle. Maket etkileşimliyse (`Dock onSelect`) sayfada denenen demo olur.
- **El notu ya da kalem vurgusu:** başka bir öğeyi okla göstereceksen `hand-callout`, metnin kendisini vurgulayacaksan `mark-annotate`. Font: `fonts.ts → handFont`.
- **CornerMascot**: yalnız kişiliği olan tanıtım sayfasında, sayfada bir tane; uygulama, form ve ödeme ekranında yok.
- **Offscreen turu:** maket ya da kahraman arkası için `wallpaper` (8 illüstrasyon sahnesi, `downloadWallpaper()` ile PNG; arayüz paletine uyan sahneyi seç); galeri kahramanında `drift-columns`; sürüm notu ve etkinlik için köşede `notice-deck` (hata/sonuç bildirimi `toast`ta kalır).
- **Paket:** hepsi `@ahmetakyapi/ui` kitinde (97 bileşen).

### Bloklar

- **PaletteSwitcher**: `app/palettes.css` içe aktarılmalı (nokta renkleri oradaki `--swatch-*`). Çerezin ilk boyamadan önce okunması için THEME_SCRIPT'e iki satır (dosya başında). Telefonda on nokta yatay kayar.
- **AppShell**: ikonları öğe olarak ver (`<Inbox />`); kabuk sayfanın kökü değilse `contentAs="div"` (tek `main`). Daraltma bilerek animasyonsuz.
- **AuthCard**: `action` `useActionState` imzasıyla; şifreyi geri döndürme; hata metni hangi alanın yanlış olduğunu söylemez; marka logosu/rengi yok.
- **SettingsDialog**: satırlar `SettingsSection`/`SettingsRow` + `Switch`/`Select` (`hideLabel`); derin bağlantı gerekiyorsa ayrı rota + `TabLinks`.
- **AgentPlan**: bütün durum tek `activeIndex`ten türer; ajan olaylarını bu sayıya indirmek çağıranın işi.
- **ChatComposer**: `onAttach`/`onVoice` yoksa o düğme çizilmez; model menüsü ≥ 2 modelde açılır.
- **ChatThread**: kaydıran kap `data-chat-scroll` taşır; otomatik kaydırma yalnız kullanıcı sondaysa.

### Yönetim Paneli: Canlı Önizleme

Sitede görünen içeriği düzenleyen her form, [`snippets/live-preview/`](../snippets/live-preview/README.md)
kitiyle sitenin kendisini yanında gösterir (kural: `rules/live-preview.md`).
Kit `ui/` bileşenlerinden ayrı durur çünkü tek dosya değil, uçtan uca bir
akıştır: taslak tablosu, Server Action, önizleme rotası, iframe köprüsü,
çerçeve. Masaüstü + telefon, açık/koyu, yazdıkça yeniden çizim; yazı tipi ve
punto CSS değişkeniyle anında.

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

Tek komut; bağımlılık zincirini betik çözer:

```bash
node ~/dev-starter/scripts/add-ui.mjs --list                       # katalog, kategoriye göre
node ~/dev-starter/scripts/add-ui.mjs . date-picker --dry-run      # önce plan: ne kopyalanacak
node ~/dev-starter/scripts/add-ui.mjs . date-picker stage-bars --install
```

`scripts/add-ui.mjs` (bağımlılıksız, Node 22+):

1. **Transitif çözüm**: `date-picker` → `date-calendar` + `popover` →
   `@/lib/utils`, `@/lib/motion`. `@/components/ui/<ad>` önce `snippets/ui`,
   yoksa landing şablonunun `components/ui`si (`ThemeToggle`); öteki `@/…`
   şablondan. Kayıt değil kaynak okunur: kayda girmemiş yeni bileşen de kurulur.
2. **Hedef kök** tsconfig `paths["@/*"]`ten: `src/` düzeni de doğru yere gider.
3. **Üstüne yazmaz**: aynı dosya `aynı`, farklıysa `farklı (atlandı)` ve satır
   farkı; `--force` ezer. `skeleton.tsx` ile şablonun `Skeleton.tsx`i
   macOS/Windows'ta aynı dosya: `harf çakışması` olarak durur.
4. **npm**: eksik paketleri sürümüyle (landing `package.json`; Base UI
   Storybook'tan) projenin paket yöneticisine (npm/pnpm/yarn/bun) komut olarak
   yazar, `--install` çalıştırır.
5. **palettes.css** gereken bileşende (`palette-switcher`) dosyayı kopyalar,
   `globals.css`e eklenecek satırı söyler.
6. **Uyarılar**: hedef `globals.css`te bileşenin kullandığı token yoksa
   (`--color-chart-1`, `@utility skeleton`…), `m.*` var ama `LazyMotion` yoksa,
   atlanan `lib/motion.ts`te bileşenin istediği ad (`SPRING`) yoksa.

Sonra: proje farklı rol adları kullanıyorsa (shadcn `bg-background` gibi)
sınıfları çevir; `npm run typecheck && npm run lint`; görsel bir bileşense 390
ve 1280 pikselde, iki temada aç. `/snippet ui/<ad>` aynı betiği kullanır.

**Dev-starter dışındaki projede (shadcn kaydı):** her bileşen shadcn
registry-item olarak da yayında; `components.json`u olan herhangi bir Next
projesinde:

```bash
npx shadcn@latest add https://dev-starter-storybook.vercel.app/r/stage-bars.json
```

İç bağımlılıklar (`chart-card`, `lib-utils`, `lib-motion`…) URL'le bağlı,
shadcn onları da getirir ve npm paketlerini kurar. Kayıt
`scripts/build-ui-registry.mjs` ile üretilir: `snippets/ui/registry.json`
(Storybook'un her bileşen belgesindeki "Projeye Al" bloğu bunu okur) ve
`storybook/public/r/*.json`. Bileşen değişince `npm run registry:ui`; CI
`npm run verify:registry` ile ayrışmayı yakalar. Sınır: shadcn yorumla başlayan
dosyanın (şablonun `lib/theme.ts`i) ilk yorumunu atar, bu yüzden var olan aynı
dosyayı "farklı" sayıp üzerine yazmayı sorar; `--yes` bu soruyu yanıtlamaz
(etkileşimli yanıtla ya da `--overwrite`). shadcn'in kendi `lib/utils.ts`i
varsa bizimki (`cn` + punto adları twMerge'e tanıtılmış) üstüne yazmayı sorar.

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
