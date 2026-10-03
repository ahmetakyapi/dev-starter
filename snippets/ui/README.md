# snippets/ui — Bileşen Kütüphanesi

Kopyala-yapıştır kütüphane (shadcn mantığı): paket değil, kaynak. Her dosya
tek başına bir projeye kopyalanır ve yalnızca şunlara dayanır:

- `@/lib/utils` → `cn()` (şablondaki, punto adları twMerge'e tanıtılmış)
- `@/lib/motion` → `SPRING` (yalnızca `segmented-control.tsx`)
- `app/globals.css` token sınıfları (`bg-page`, `text-strong`, `border-line`,
  `bg-primary-wash`, `text-primary-ink`, `shadow-modal`, `.skeleton`, `.surface`…)
- `lucide-react`, `next/link`
- Altı dosyada `@base-ui/react` (başsız katman; karar ve gerekçe:
  [guides/10](../../guides/10-component-library.md#2-başsız-kütüphane-kararı))

Sabit renk, hex, Tailwind'in hazır paleti ve `dark:` yok; tema token'la döner.
Hepsinde `focus-visible` halkası (globals.css), dokunmatikte ≥ 44 piksel hedef,
hareketi azaltana saygı ve Türkçe varsayılan metin (prop ile değişir).

Projeye alma: `/snippet <ad>` ya da elle `components/ui/` altına kopyala.
Doğrulama: Next 16.3 + React 19.2 + Tailwind 4 + Base UI 1.8 şablon kopyasında
`build`, `typecheck`, `lint` temiz; 390 ve 1280 piksel, açık ve koyu temada
gözle ve klavyeyle denetlendi (Ekim 2026).

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
| `button-group.tsx` | Bağlı düğmeler | yok | Hayır | `role="group"` + ad; odaklı düğme öne |
| `segmented-control.tsx` | 2-5 seçenekten biri, anında etki | motion (`domMax`) | Evet | Radyo grubu, gezici tabindex, ok tuşları |
| `copy-button.tsx` | Panoya kopyala | lucide | Evet | Sonuç canlı bölgede; hata da söylenir |
| `kbd.tsx` | Klavye tuşu, kısayol | yok | Hayır | Simgeli tuşta `label`; kombinasyon tek ad |

### Katmanlar

| Dosya | Ne Zaman | Bağımlılık | İstemci | Erişilebilirlik |
|-------|----------|------------|---------|-----------------|
| `dialog.tsx` | Onay, kısa form, yıkıcı eylem | yerel `<dialog>` | Evet | Odak tuzağı ve Escape tarayıcıdan, odak açana döner, sayaçlı kilit |
| `sheet.tsx` | Telefonda alttan çekmece, masaüstünde yan panel | yerel `<dialog>` | Evet | Diyalogla aynı; sürükleme tek yol değil |
| `popover.tsx` | Sayfayı kilitlemeyen küçük kutu | Base UI | Evet | Dış tıklama, Escape, odak dönüşü |
| `tooltip.tsx` | `Tooltip`: görsel etiket · `InfoTip`: açıklama | Base UI | Evet | Tooltip dokunmatikte açılmaz (bilinçli); InfoTip tıklamayla açılır |
| `dropdown-menu.tsx` | Eylem menüsü | Base UI | Evet | Menü düğmesi kalıbı tam: oklar, Home/End, harf, Escape |
| `command-palette.tsx` | ⌘K / Ctrl+K komut paleti | yerel `<dialog>` | Evet | Combobox + listbox, `aria-activedescendant`, Türkçe arama |

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
| `switch.tsx` | Anında etki eden aç/kapa | yerel giriş | Hayır | `role="switch"`, JS'siz form gönderimi |
| `checkbox.tsx` | Onay, çoklu seçim | yerel giriş | Hayır | Etiketin tamamı hedef; `indeterminate` ref ile |
| `radio-group.tsx` | 2-6 görünür seçenek | yerel giriş | Hayır | `fieldset` + `legend`, tarayıcı ok gezinmesi |
| `select.tsx` | 5-15 seçenek, dar yer | Base UI | Evet | Listbox, gizli yerel giriş, etiket bağı |
| `combobox.tsx` | Çok seçenek, aranır | Base UI | Evet | `locale="tr-TR"` süzgeç, `aria-activedescendant` |
| `tabs.tsx` | `Tabs`: sayfa içi · `TabLinks`: ayrı adresler | `next/link` | Evet | WAI-ARIA tabs; bağlantı sekmesi `aria-current` |
| `accordion.tsx` | SSS, katlanır bölüm | yerel `<details>` | Evet* | Ctrl+F kapalı içeriği bulur; açılınca bastığın yerde kalır |
| `breadcrumb.tsx` | Konum çubuğu | `next/link` | Hayır | Son öğe `aria-current`; telefonda tek geri bağlantısı |
| `badge.tsx` | Durum/kategori etiketi | yok | Hayır | Metin asıl işaret, renk hızlandırır |
| `avatar.tsx` | Görsel + baş harf yedeği | Base UI | Evet | Baş harf `tr-TR` büyük harf; adın yanındaysa `alt=""` |
| `stepper.tsx` | Çok adımlı akışta konum | lucide | Hayır | `<ol>`, `aria-current="step"`, gizli "Tamamlandı" |
| `file-dropzone.tsx` | Dosya yükleme | yok | Evet | Klavyeyle açılır, reddedilen dosya nedeniyle okunur; SVG varsayılan RED |
| `timeline.tsx` | Tarihli olaylar | yok | Hayır | `<ol>` + `<time dateTime>` |
| `empty-state.tsx` | Boş durum: ikon / sahne / satır | yok | Hayır | Sahne `aria-hidden`; başlık düzeyi `as` ile |

\* `accordion.tsx` yalnızca kaydırma çapası koruması için istemci; katlama
JavaScript'siz de çalışır.

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
- **`segmented-control.tsx`** düzen animasyonu için `domMax` yükler
  (`domAnimation`dan büyük özellik paketi; yalnızca o denetim görününce).
