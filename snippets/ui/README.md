# snippets/ui — Bileşen Kütüphanesi

Kopyala-yapıştır kütüphane (shadcn mantığı): paket değil, kaynak. Her dosya
tek başına bir projeye kopyalanır ve yalnızca şunlara dayanır:

- `@/lib/utils` → `cn()` (şablondaki, punto adları twMerge'e tanıtılmış)
- `@/lib/motion` → `EASE`, `DUR`, `SPRING` (hareketli bileşenler) ve `motion/react` (`m.*`; kökte `LazyMotion` şablonda hazır)
- `app/globals.css` token sınıfları (`bg-page`, `text-strong`, `border-line`,
  `bg-primary-wash`, `text-primary-ink`, `shadow-modal`, `.skeleton`, `.surface`…);
  grafikler `bg-chart-1…6`, `bg-chart-track`, `text-chart-ink` (2026-11 şablonu)
- `lucide-react`, `next/link`
- On altı dosyada `@base-ui/react` (headless katman; karar ve gerekçe:
  [guides/10](../../guides/10-component-library.md#2-headless-kütüphane-kararı))

Sabit renk, hex, Tailwind'in hazır paleti ve `dark:` yok; tema token'la döner
(tek istisna `color-picker`: renk orada kullanıcı verisi).

**Görsel dil ("board", 2026-11):** kart gri kuyu (`bg-surface`), içindeki
parça beyaz karo (`bg-overlay shadow-raised`), seçim göstergesi kuyunun
üstünde kayan beyaz karo, açılır yüzeyler `rounded-xl` + kıl çizgisi,
birincil eylem `bg-cta shadow-cta`, mikro etkileşimler yayla (anahtar,
onay kutusu tiki çizilerek). Kararın gerekçesi `knowledge/decisions.md` →
"Board Görsel Dili".
Hepsinde `focus-visible` halkası (globals.css), dokunmatikte ≥ 44 piksel hedef,
hareketi azaltana saygı ve Türkçe varsayılan metin (prop ile değişir).

Projeye alma (bağımlılıklarıyla, üstüne yazmadan; ayrıntı
[guides/10 § 7](../../guides/10-component-library.md#7-projeye-alma)):

```bash
node ~/dev-starter/scripts/add-ui.mjs . <ad...> [--dry-run] [--install]   # ya da /snippet ui/<ad>
npx shadcn@latest add https://dev-starter-storybook.vercel.app/r/<ad>.json # dev-starter dışı proje
```

`registry.json` bu klasörün makine-okunur kataloğu (ÜRETİLDİ: `npm run
registry:ui`; kategori ve açıklama aşağıdaki tablolardan). Yeni bileşen
eklerken tabloya satırını yaz, sonra kaydı üret.
Doğrulama: Next 16.3 + React 19.2 + Tailwind 4 + Base UI 1.8 şablon kopyasında
`build`, `typecheck`, `lint` temiz; 390 ve 1280 piksel, açık ve koyu temada
gözle ve klavyeyle denetlendi (Ekim 2026). Kasım 2026 dalgası (37 yeni
bileşen + 31'in yenilenmesi) aynı şablon kopyasında `tsc`, `eslint
--max-warnings 0`, `next build`, 390/1440 × açık/koyu ekran görüntüsü ve
Playwright etkileşim betikleriyle (klavye, yapıştırma, sürükleme) doğrulandı.

## Katalog

`İstemci` sütunu: dosya `"use client"` mı. Sunucu bileşenleri fonksiyon prop
alabilir (`render`, `hrefFor`) ve tarayıcıya JavaScript indirmez.

### Yükleme

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `spinner.tsx` | Satır içi, düğme içi kısa bekleme | yok | Hayır | `role="status"` + gizli etiket; reduced-motion'da sabit yay |
| `loading-mark.tsx` | Sayfa/kart düzeyinde bekleme, marka halkası | yok | Hayır | `role="status"`; döngü yalnızca beklemede, reduced-motion'da sabit |
| `route-progress.tsx` | Kök layout'ta gezinme göstergesi | `next/navigation` | Evet | Canlı bölge hep DOM'da; hap 420 ms sonra; `<Suspense>` şart |
| `skeleton.tsx` | Gelecek içeriğin şeklinde iskelet | `.skeleton` | Hayır | `aria-hidden`; kap `aria-busy` taşır |

### Düğme ve İkon

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `icon.tsx` | lucide ikonu, tek boyut ölçeği | lucide | Hayır | Varsayılan `aria-hidden`; `label` verilirse `role="img"` |
| `icon-button.tsx` | Yalnız ikonlu düğme | lucide | Hayır | `aria-label` TİPTE zorunlu; 44 px |
| `button-group.tsx` | Bağlı düğmeler | yok | Hayır | `role="group"` + ad; `well`de basılı durum `aria-pressed` |
| `segmented-control.tsx` | 2-5 seçenekten biri, anında etki | motion (`domMax`) | Evet | Radyo grubu, gezici tabindex, ok tuşları |
| `copy-button.tsx` | Panoya kopyala | lucide | Evet | Sonuç canlı bölgede; hata da söylenir |
| `kbd.tsx` | Klavye tuşu, kısayol | yok | Hayır | Simgeli tuşta `label`; kombinasyon tek ad |
| `close-button.tsx` | Diyalog, uyarı, çip, duyuru kapatma | lucide | Hayır | `aria-label` TİPTE zorunlu; 44 px dokunma alanı (görsel 28/32); odak halkası dairede |
| `chip.tsx` | `FilterChip`: süzgeç · `RemovableChip`: seçilmiş değer · `ChipGroup` | lucide | Hayır | Süzgeç `aria-pressed` + ✓; yalnız × düğme, adı "Kaldır: İstanbul"; grup `role="group"` + ad |
| `toggle-group.tsx` | Basılı/basılı değil düğmeler: biçim araç çubuğu, görünüm seçimi; tekli ya da çoklu, `well`/`ghost` | Base UI, `tooltip`, `kbd`, lucide | Evet | `aria-pressed`, gezici tabindex ve oklar; yalnız ikonlu öğede `label` tipte zorunlu + tooltip |

### Katmanlar

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `dialog.tsx` | Onay, kısa form, yıkıcı eylem | yerel `<dialog>` | Evet | Odak tuzağı ve Escape tarayıcıdan, odak açana döner, sayaçlı kilit |
| `sheet.tsx` | Telefonda alttan çekmece, masaüstünde yan panel | yerel `<dialog>` | Evet | Diyalogla aynı; sürükleme tek yol değil |
| `popover.tsx` | Sayfayı kilitlemeyen küçük kutu | Base UI | Evet | Dış tıklama, Escape, odak dönüşü |
| `tooltip.tsx` | `Tooltip`: görsel etiket · `InfoTip`: açıklama | Base UI | Evet | Tooltip dokunmatikte açılmaz (bilinçli); InfoTip tıklamayla açılır |
| `dropdown-menu.tsx` | Eylem menüsü | Base UI | Evet | Menü düğmesi kalıbı tam: oklar, Home/End, harf, Escape |
| `command-palette.tsx` | ⌘K / Ctrl+K komut paleti | yerel `<dialog>` | Evet | Combobox + listbox, `aria-activedescendant`, Türkçe arama |
| `context-menu.tsx` | Nesne üstünde sağ tık / uzun basma eylemleri | Base UI, `kbd` | Evet | Menü klavye haritası tam, alt menü sağ/sol okla; yıkıcı öğe ayrı grupta; kısayol `aria-hidden` |
| `notification-center.tsx` | Üst çubukta zil + bildirim listesi | Base UI, lucide | Evet | Zil adı sayıyı söyler ("Bildirimler, 3 okunmamış"); gruplar başlıklı `ul`; `<time dateTime>` |
| `hover-card.tsx` | Bağlantının önizlemesi (@ad, atanan kişi): `HoverCard` + `ProfilePreview` | Base UI, `avatar` | Evet | 500 ms fare beklemesi ya da klavye odağıyla açılır, Escape kapatır; dokunmatikte ilk dokunuş açar; kart yalnız ek bilgi |

### Veri

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `data-table.tsx` | Sıralanabilir tablo, karşılaştırma çubuğu | `next/link` | Hayır | `aria-sort`, `<caption>`, odaklanabilir kaydırma bölgesi, satır başlığı `th` |
| `tree-view.tsx` | Klasör/kategori ağacı | yok | Evet | WAI-ARIA tree, tam klavye haritası, yazarak arama |
| `tree-table.tsx` | Açılır satırlı tablo | yok | Evet | `treegrid`, satır odağı, `aria-level/expanded` |
| `pagination.tsx` | Adreste sayfa numarası | `next/link` | Hayır | `aria-current="page"`; telefonda "3 / 12" |
| `stat.tsx` | Etiket + değer + değişim | lucide | Hayır | Renk tek işaret değil: işaret, ok, "artış/düşüş" |
| `sparkline.tsx` | Eksensiz mini eğri | yok | Hayır | `role="img"` + `title` |

### Form ve Gezinme

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `switch.tsx` | Anında etki eden aç/kapa | yerel giriş | Hayır | `role="switch"`, JS'siz form gönderimi; tutamak iki temada izine karşı ≥ 3:1 |
| `checkbox.tsx` | Onay, çoklu seçim | yerel giriş | Hayır | Etiketin tamamı hedef; `indeterminate` ref ile; tik çizilerek gelir, hareket azaltmada anında |
| `radio-group.tsx` | 2-6 görünür seçenek | yerel giriş | Hayır | `fieldset` + `legend`, tarayıcı ok gezinmesi; iç nokta 0.4'ten büyür, 0'dan değil |
| `select.tsx` | 5-15 seçenek, dar yer | Base UI | Evet | Listbox, gizli yerel giriş, etiket bağı |
| `combobox.tsx` | Çok seçenek, aranır | Base UI | Evet | `locale="tr-TR"` süzgeç, `aria-activedescendant` |
| `tabs.tsx` | `Tabs`: sayfa içi · `TabLinks`: ayrı adresler | `next/link` | Evet | WAI-ARIA tabs; bağlantı sekmesi `aria-current`; kayan karo hareket azaltmada yerinde |
| `accordion.tsx` | SSS, katlanır bölüm | yerel `<details>` | Evet* | Ctrl+F kapalı içeriği bulur; açılınca bastığın yerde kalır |
| `breadcrumb.tsx` | Konum çubuğu | `next/link` | Hayır | Son öğe `aria-current`; ikonlar `aria-hidden`; `iconOnly`de ad gizli metin |
| `badge.tsx` | Durum/kategori etiketi | yok | Hayır | Metin asıl işaret, renk hızlandırır |
| `avatar.tsx` | Görsel + baş harf yedeği | Base UI | Evet | Baş harf `tr-TR` büyük harf; addan türeyen pastel zemin + `text-strong` (iki temada AA); `AvatarGroup` `role="group"` + "… ve N kişi daha" |
| `stepper.tsx` | Çok adımlı akışta konum | lucide | Hayır | `<ol>`, `aria-current="step"`, gizli "Tamamlandı" |
| `file-dropzone.tsx` | Dosya yükleme | yok | Evet | Klavyeyle açılır, reddedilen dosya nedeniyle okunur; SVG varsayılan RED |
| `timeline.tsx` | Tarihli olaylar | yok | Hayır | `<ol>` + `<time dateTime>` |
| `empty-state.tsx` | Boş durum: ikon / sahne / satır | yok | Hayır | Sahne `aria-hidden`; başlık düzeyi `titleAs` ile |
| `announcement.tsx` | Kahraman üstü duyuru hapı; kapatılabilir varyant | `next/link`, lucide, `close-button` | Evet | Hap tek bağlantı, × kardeş öğe; noktasız, yanıp sönmez |
| `carousel.tsx` | Yan yana kaydırılan kartlar | lucide, motion | Evet | `aria-roledescription` carousel/slide; ←/→ Home/End; canlı bölge konumu söyler; otomatik oynatma yok |

\* `accordion.tsx` yalnızca kaydırma çapası koruması için istemci; katlama
JavaScript'siz de çalışır.

### Geri Bildirim

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `progress.tsx` | Bir işin ilerlemesi (belirli/belirsiz) | Base UI, motion | Evet | `progressbar` + etiket bağı + `tr-TR` değer metni; bitince "Tamamlandı"; belirsiz hap hareket azaltmada durur |
| `meter.tsx` | `Meter`: doluluk/kota, eşikte ton · `SegmentedMeter`: dağılım | Base UI | Evet | `role="meter"`; eşik aşılınca durum metni görünür ve `aria-valuetext`te |
| `banner-alert.tsx` | Sayfa içi durum satırı, 4 ton | lucide, `close-button` | Hayır | Wash zemin + ikon + gizli "Hata:" öneki; yalnız `announce` ile `alert`/`status`; tek kenar şeridi yok |
| `divider.tsx` | Yatay / dikey / etiketli ("ya da") ayırıcı | yok | Hayır | `<hr>`; dikeyde `aria-orientation`; etiketlide kap `separator` değil |
| `toast.tsx` | Eylem sonucu bildirimi: `<Toaster />` + `toast.success/error/warning/info/undo/promise` | Base UI, `spinner`, lucide | Evet | Bölge polite, hata `role="alert"` ve kendiliğinden kapanmaz; fare üstünde ya da odakta süre durur; F6 ile bölgeye geçilir; hareket azaltmada yalnız solar |

### Grafik

"Board" dili (2026-11): her grafik `ChartCard` kuyusunda, lejant beyaz
karolarda; seri rengi yalnızca `--chart-1…6` (metin rengi değil), sıra
lejantla aynı. Animasyonlular görünür olunca çizilir, hareket azaltmada son
hal anında; verinin tamamı ekran okuyucuya `sr-only` tablo ya da liste.

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `chart-card.tsx` | Grafik kabı: etiket + değer + değişim + dönem; altta lejant karoları | yok | Hayır | `section` + başlık; lejant `dl`; değişim "artış/düşüş" diye okunur |
| `stage-bars.tsx` | Huni aşamaları, iz üstünde hap çubuk | `chart-card` | Hayır | `ol`; değer ve pay metinde, çubuk `aria-hidden` |
| `track-bar-chart.tsx` | Sıralı tek seri (ay, gün), iz üstünde sütun | `chart-card` | Hayır | Görsel `aria-hidden`, veri `sr-only` tabloda |
| `ring-chart.tsx` | 2-5 kategorinin iç içe halkası, ortada değer | yok | Hayır | `role="img"` + `title`; her yayın kendi `title`ı |
| `area-chart.tsx` | Sıralı eksende 1-2 seri, iki dönemi üst üste koymak; dikey imleç + balon | `chart-card`, motion | Evet | Veri `sr-only` tabloda; çizim `aria-hidden`; odaklan + ←→ Home End, seçilen nokta canlı bölgede |
| `gauge-chart.tsx` | Bütünün 2-4 parçası ya da tek doluluk (`max`); yarım daire, ortada büyük yüzde | `chart-card`, motion | Evet | `role="img"` + bütün parçaları sayan ad; her yayın `title`ı |
| `funnel-chart.tsx` | Daralan aşamalar (`curve`/`step`), sütun başına yüzde hapı, altta lejant | `chart-card`, motion | Evet | Aşamalar `sr-only` `ol` ("ilk aşamaya göre %30"); lejant `dl` |
| `heatmap.tsx` | Günlük bir sayının haftalar × günler ritmi, 5 basamak, Az ↔ Çok | motion | Evet | Aylık toplamlar `sr-only` tabloda; ızgara odaklanır, oklarla gün gün, canlı bölge |
| `radar-chart.tsx` | 5-8 ölçütte 1-2 profil | `chart-card`, motion | Evet | `sr-only` tablo (ölçüt × seri); noktaların `title`ı |
| `sankey-chart.tsx` | İki katmanlı akış (kaynak → hedef), sağda "Ad · %22", düğüm/akış yalıtma | `chart-card`, motion | Evet | Akışlar `sr-only` tabloda; etiketler `aria-pressed` düğme; seçili akış canlı bölgede |
| `bar-list.tsx` | Uzun adlı 3-10 kalem sıralaması, satır arkasında dolgu | `chart-card`, motion, `next/link` | Evet | `ol` + ad; dolgu `aria-hidden`; bağlantılı satır 44/36 px |
| `line-chart.tsx` | Sıralı eksende 2-5 seriyi kıyaslamak; kesik tahmin, hedef çizgisi, lejant süzgeç | `chart-card`, `area-chart`, motion | Evet | Veri `sr-only` tabloda; lejant `aria-pressed` düğmeler, son seri gizlenemez; ←→ Home End ile gezilir, seçim canlı bölgede |
| `combo-chart.tsx` | Birimi farklı iki ölçü: sütun hacmi (sol eksen) ve çizgi oranı (sağ eksen) | `chart-card`, `area-chart`, motion | Evet | Veri `sr-only` tabloda; eksen anahtarı biçimle de ayırt eder (kare / noktalı çizgi); ←→ Home End |
| `scatter-chart.tsx` | İki ölçünün ilişkisi; nokta boyu üçüncü ölçü (√ alan), renk kategori | `chart-card`, `line-chart`, motion | Evet | Veri `sr-only` tabloda; klavyede X sırasıyla gezilir; kategori süzgeci `aria-pressed` |
| `activity-rings.tsx` | Her ölçü kendi hedefine göre tam tur; %100 aşılırsa ikinci tur | `chart-card`, motion | Evet | Çizim `aria-hidden`, aynı bilgi `ul` listede; liste kapalıysa çizim `role="img"` ve özet adı taşır |

### Form Girişleri

Hepsi `label` / `hint` / `error` alır ve şablonun `Field.tsx` düzenini
kullanır (aynı etiket, yardım, hata ve `aria-describedby` bağı).

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `slider.tsx` | Aralıkta yaklaşık değer; tek tutamak ya da aralık | Base UI | Evet | Gizli `input type="range"`; aralıkta tutamak adları ve `aria-valuetext` Türkçe; balon `aria-hidden` |
| `number-field.tsx` | Kesin küçük sayı (adet, kişi), tr-TR biçim | Base UI, lucide | Evet | Ok/Shift ile ×10; düğmeler "Azalt / Artır"; sınırda düğme devre dışı |
| `input-otp.tsx` | Sabit uzunlukta tek kullanımlık kod | Base UI | Evet | `autocomplete="one-time-code"`, tek sekme durağı, kutu adları "Hane N / 6" |
| `textarea.tsx` | Çok satırlı metin, içeriğe göre büyür | yok | Evet | Sayaç alana bağlı; eşikte sabit cümleli canlı bölge |
| `tag-input.tsx` | Serbest ya da önerili çoklu etiket | motion, lucide | Evet | Combobox + listbox, `aria-activedescendant`; ekleme ve silme canlı bölgede |
| `color-picker.tsx` | Kullanıcının kendi rengi (etiket, kategori) | yok | Evet | İki `role="slider"`: alan ve ton; hex alanı; `aria-pressed` hazır renkler |
| `date-calendar.tsx` | Satır içi ay takvimi; tek gün ya da aralık | motion, lucide | Evet | WAI-ARIA grid; oklar, Home/End, PageUp/PageDown (+Shift); `aria-current="date"` |
| `date-picker.tsx` | Formda tarih alanı + açılır takvim | `date-calendar`, `popover` | Evet | Tetikleyicinin adı "etiket + değer"; açılınca odak seçili güne, kapanınca tetikleyiciye |
| `time-field.tsx` | 24 saatlik SS:DD | lucide | Evet | İki `role="spinbutton"`; ok, PageUp/PageDown, rakamla yazınca ilerler |
| `input.tsx` | Tek satır metin; ikon, önek/sonek (₺, .com), temizle, şifre göster/gizle; sm/md/lg | lucide | Evet | Field düzeni (etiket, `aria-describedby`, `aria-invalid`); göster/gizle `aria-pressed` + sabit ad; temizle odağı alana geri verir; dokunmatikte 44 px |
| `search-field.tsx` | Liste süzme, site araması: gecikmeli `onSearch`, yükleniyor, "/" ya da ⌘K; `normalizeTr`/`matchesTr`/`HighlightMatch` | `kbd`, `spinner`, lucide | Evet | `type="search"`, `aria-keyshortcuts`; "Aranıyor" ve "N sonuç" sabit canlı bölgede; Escape önce temizler, sonra odağı bırakır |
| `rating.tsx` | `Rating` gösterim (yarım yıldız) · `RatingInput` giriş (isteğe bağlı yarım adım) | lucide | Evet | Gösterim tek `role="img"`; giriş `radiogroup` + görünmez yerel radyolar (oklar, `required`, JS'siz gönderim) |

### Verimlilik

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `kanban-board.tsx` | Kolonlu iş panosu: sürükle-bırak, WIP sınırı, etiket, sorumlu, son tarih | motion (`domMax`), lucide, `badge`, `avatar` | Evet | Klavye: Boşluk tut, ↑↓ sıra, ←→ kolon, Boşluk bırak, Escape geri al; her adım `aria-live`; dokunmada tutamaktan |
| `week-calendar.tsx` | Haftalık ajanda: saat ızgarası, çakışanlar yan yana, şu an çizgisi; telefonda gün gün liste | lucide | Evet | Gün başına `role="group"` + başlık, etkinlikler `ol`; gün hapları `aria-pressed` |
| `task-list.tsx` | Görev listesi: onay, öncelik, son tarih, alt görevler, tamamlananları gizle, satır içi ekleme | `checkbox`, motion, lucide | Evet | Kısmi alt görevde `indeterminate`; açma düğmesi `aria-expanded` + "2 / 4"; ekleme ve işaretleme canlı bölgede |

### Bloklar

Birden çok bileşenin birleştiği hazır parçalar: uygulama kabuğu, yapay zekâ
sohbeti, giriş, ayarlar, palet seçici.

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `palette-switcher.tsx` | Alttan yüzen palet seçici + açık/koyu anahtarı; vitrin, tema denemesi | `ThemeToggle`, `app/palettes.css` | Evet | `role="radiogroup"`, gezici tabindex, oklar/Home/End; seçim halkası renkle değil kalınlıkla |
| `app-shell.tsx` | Oturum açılmış uygulamanın iskeleti: kenar çubuğu + içerik | `sheet`, `command-palette`, `kbd`, `avatar`, `next/link` | Evet | `nav` + grup başlıkları, `aria-current="page"`, daraltmada `aria-expanded`, ⌘B (metin alanında kapalı) |
| `auth-card.tsx` | Giriş/kayıt kartı, sunucu eylemine bağlanır | `spinner`, `next/link` | Evet | Alan hatasında `aria-invalid` + `aria-describedby`, genel hata `role="alert"`, göster/gizle `aria-pressed`, doğru `autoComplete` |
| `settings-dialog.tsx` | Sayfadan çıkmadan, anında etki eden ayarlar penceresi | `dialog`, `switch`, `select` | Evet | Dikey sekme listesi, oklar, Home/End; paneller `hidden` ile kalır, durum silinmez |
| `agent-plan.tsx` | Ajanın çok adımlı planının kuşbakışı | lucide | Hayır | `<ol>`, `aria-current="step"`, gizli durum metni, `aria-live="polite"`; `<details>` ile JS'siz daraltma |
| `chat-composer.tsx` | Sohbet giriş kutusu | motion, `dropdown-menu` | Evet | Gizli etiket + klavye ipucu, IME'ye saygılı Enter, gönder/durdur adları, model menüsü radyo öğeleri |
| `chat-thread.tsx` | Mesaj akışı, düşünüyor göstergesi, boş durum | motion | Evet | `role="log"`, akarken `aria-busy`, gizli "Sen:"/"Asistan:", düşünüyor `role="status"` |

## Bilinen Sınırlar

- **Base UI tooltip dokunmatikte açılmaz.** Kütüphanenin bilinçli kararı
  (uzun basma tarayıcının bağlam menüsüyle çakışıyor). Okunması gereken bilgi
  `InfoTip`e.
- **Yerel `<dialog>` içinde Tab son öğeden sonra tarayıcı arayüzüne çıkar**
  (adres çubuğu), sayfanın geri kalanına değil. Spesifikasyon davranışı; sayfa
  `inert` kalır.
- **`data-table.tsx` sağ kenar solması** kaydırmaya bağlı CSS animasyonu
  ister (Chrome, Safari 26+). Firefox'ta solma yok, kaydırma çubuğu var.
- **`tree-table.tsx` dar ekranda kayar** ama `data-table`daki solmayı taşımaz.
- **`tabs.tsx` varsayılanı `well`** (kayan beyaz karo, 2026-11): `segmented-control`
  gibi `domMax` yükler. Eski alt çizgi görünümü `variant="underline"`.
- **Palet seçici** `app/palettes.css` ister; nokta renkleri oradaki
  `--swatch-*`. Çerezdeki paletin ilk boyamadan önce gelmesi için tema
  script'ine iki satır (dosya başında).
- **Grafikler JS'e bağlı**: JavaScript yoksa animasyonlu parçalar başlangıç
  halinde kalır; veri `sr-only` tabloda okunur. `heatmap` koyu temada boş gün
  ile 1. basamak yakın; `sankey` çok küçük düğüm etiketlerini çakıştırabilir.
- **Dokunma hedefi istisnaları**: `tag-input` çip kapatma (28 px) ve
  `color-picker` hazır renk noktaları (32 px) 44 px altında; ikisinin de
  klavye yolu var (Backspace, hex alanı).
- **`segmented-control.tsx`** düzen animasyonu için `domMax` yükler
  (`domAnimation`dan büyük özellik paketi; onu içe aktaran rotalarda, denetim
  çizilmese de iner). Gerçekten gerekince indirme yolu dosyanın başında.
