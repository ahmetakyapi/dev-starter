# storybook — dev-starter Görsel Kataloğu

**728 hikâye**, her biri açık/koyu tema ve 10 palette. Storybook'un kendi kabuğu (sidebar, araç çubuğu, belge) da seçilen tema ve paletle döner:

| Bölüm | İçerik |
|-------|--------|
| **Kapak** (en üstte) | Kataloğun ilk ekranı: palet karoları bütün arayüzü döndürür, örnek sahne gerçek bileşenlerden, raf ve kurulum |
| **Örnek Tasarım** | **Her Şey Bir Arada**: bütün kataloğu tek uzun sayfada sergileyen vitrin (118/118 bileşen, 15 grafik, bloklar, 10 palet); **Desen Kütüphanesi**: 35 token'lı zemin, Önizle ve Kopyala; **Pusula Paneli**: aynı bileşenlerle kurulmuş uygulama; **Bileşen Kapsamı** |
| Vitrin | Genel bakış + grup grup vitrin sayfaları (`snippets/ui/vitrin/`) |
| Başlangıç, Tema | Manifesto; renkler (iki tema yan yana, WCAG oranları), 10 palet, tipografi, yüzeyler, grafik renkleri, hareket |
| Bileşenler | `snippets/ui`nin bütün bileşenleri + şablonun ortak bileşenleri; her biri varsayılan, durumlar, bütün varyantlar, `play` etkileşimi |
| Grafikler | 15 grafik + Analitik Panosu, Satış Özeti kompozisyonları |
| Bloklar | Uygulama kabuğu, sohbet, giriş, ayarlar, ajan planı, palet seçici |
| Ekranlar | Landing (tam sayfa, 8 üst bölüm varyantı, 11 bölüm), sistem sayfaları, uygulama ekranları |

Ekosistemin bileşenleri, ekranları ve temaları tek yerde, canlı: `snippets/ui`
kütüphanesinin her bileşeni bütün durumlarıyla, landing şablonunun ekranları,
uygulama ekranı kompozisyonları ve token'ların (renk, punto, yüzey, grafik,
hareket) görsel belgesi.

```bash
cd storybook && npm ci     # ilk sefer
npm run dev                # http://localhost:6006  (kökten: npm run storybook)
npm run build              # storybook-static/      (kökten: npm run storybook:build)
npm run typecheck          # hikâyeler + snippet'ler + şablon, tek tip denetimi
```

## Kabuk (Yönetici Arayüzü)

- Tema `.storybook/manager-theme.ts`te, `tokens.ts`ten üretilir (açık + koyu);
  hex kopyası yok. `manager.ts` araç çubuğunu dinler (`SET_GLOBALS`,
  `GLOBALS_UPDATED`) ve `api.setOptions({ theme })` ile kabuğu döndürür.
- Sidebar seçimi, marka karosu ve odak halkası paletten: `paletteCss()`
  10 palet × 2 tema değişkeni üretir, `manager-head.html` kullanır.
  Seçiciler SB 10.6.3'te doğrulandı; Storybook yükseltmesinden sonra gözle denetle.
- Belge sayfası (`docs-container.tsx`) temayı izler, `lang: "tr"`.
- "yeni" etiketli bileşenin adının yanında "Yeni" hapı (`renderLabel`).
- Display yazı tipi Schibsted Grotesk; gövde Inter, kod JetBrains Mono.

## Üst Çubuk

- **Tema** (Açık / Koyu) → `<html data-theme>`, şablonun gerçek mekanizması.
- **Palet** (10 palet) → `<html data-palette>`; değerler şablonun
  `app/palettes.css`inden (tokens.ts'ten üretilir).
- **Accessibility** sekmesi her hikâyede axe denetimini gösterir.

## Nasıl Bağlanır (tek kaynak, kopya yok)

Storybook hiçbir bileşenin ya da token'ın kopyasını tutmaz:

- CSS: `.storybook/preview.css` şablonun `globals.css`, `palettes.css` ve
  `landing.css` dosyalarını içe aktarır; Tailwind `@source` ile depo kökündeki
  snippet ve şablon dosyalarını tarar.
- `@/` takma adı içe aktaran dosyanın yerine göre çözülür
  (`.storybook/resolve-at.ts`): snippet'ler birbirini `@/components/ui/<ad>`
  ile bulur (önce `snippets/ui`, yoksa landing şablonunun `components/ui`),
  şablon dosyaları kendi kökünü görür.
- `tsconfig.json` çıplak paket adlarını (`react`, `next`, `motion`…) bu
  klasörün `node_modules`una yönlendirir: depo kökündeki dosyalar da aynı
  tipleri görür.

Bir snippet ya da token değişince hikâye kendiliğinden günceldir; kırılırsa
CI'daki **Storybook Build** işi (tip denetimi + derleme) yakalar.

## Kural: Adresler İngilizce

Görünen adlar (`title`, `name`) Türkçe; adres (URL) İngilizce. Her meta
İngilizce bir `id` taşır, her hikâye İngilizce adla dışa aktarılır:

```tsx
const meta = { title: "Bileşenler/Katmanlar/Araç İpucu", id: "tooltip", … }
export const Default: Story = { name: "Varsayılan" }   // → tooltip--default
```

Grup kimliği **kısa**: bileşenin dosya adı (`tooltip`, `area-chart`), en çok
24 harf, grup adı (Bileşenler/Katmanlar) adrese girmez. Tek hikâyeli sayfada
dışa aktarım `Overview` (`colors--overview`), grup adı tekrar etmez.

Kısa yönlendirmeler (`vercel.json`): `/showcase`, `/references` (referans arşivi; `knowledge/references.md`ten okunur), `/demo` (örnek uygulama
Pusula; ekranı `/demo/inbox`, `/demo/settings`), `/gallery`, `/start`,
`/theme`, `/palettes`, bir bileşenin belgesi `/c/<ad>` (ör. `/c/tooltip`),
bir hikâye `/s/<ad>/<hikâye>` (ör. `/s/tooltip/default`). Eski `/pusula`
kalıcı olarak `/demo`ya yönlenir.

Araç çubuğu değerleri de adrese girer, bu yüzden ASCII: tema `light`/`dark`
(menüde "Açık"/"Koyu"), palet `signature`, `cobalt`… Örnek uygulamanın iç
adresleri de aynı kuralda: `?view=inbox&tag=gecikme&ticket=PSL-1186&page=2`
(İngilizce anahtar, küçük harfli slug değer; Türkçe ad yalnız ekranda).

Kimlik verilmezse Storybook Türkçe başlıktan `giriş--giris`, `i̇pucu` gibi
bozuk adresler üretir. `npm run check:ids` (CI'da derlemeden sonra) yalnızca
`a-z0-9-` ve Türkçe kelimesiz adreslere izin verir.

## Projeye Al Bloğu ve shadcn Kaydı

Her bileşen belgesinin (`/c/<ad>`) başında "Projeye Al": `add-ui` ve shadcn
kurulum komutları (kopyala düğmeli), iç bileşen, şablon dosyası ve npm
bağımlılıkları. Veri `snippets/ui/registry.json`dan (`.storybook/install-block.tsx`,
`parameters.docs.page`); eşleme meta `id`sinden, istisna kayıttaki `storyId`.
`public/r/*.json` shadcn kaydı, derlemede `/r/<ad>.json` olarak yayınlanır
(`staticDirs`). İkisi de `npm run registry:ui` ile üretilir (depo kökü).

## Hikâye Yazarken

`stories/_lib/Frame.tsx` → `Frame`, `Gallery`, `Cell`, `Screen` çerçeveleri:
boardui vitrini gibi büyük gri kuyu, altında ad. Başlıklar Türkçe hiyerarşi
(`Bileşenler/Katmanlar/Diyalog`), hikâye adları Türkçe, veri gerçekçi Türkçe,
renk yalnızca token sınıfından. Etkileşimli bileşende `play` ile bir
etkileşimi sına (`storybook/test`).

Sürümler sabit (`storybook` 10.6.3): 10.6.2'nin Next taklidinde
`LayoutRouterContext.parentRenderTree` yoktu ve Next 16.4'ün `useRouter`ı
çöküyordu; 10.6.3 bunu düzeltti. Yükseltmeden önce derleyip bir hikâyeyi çiz.

## Doğrulama (Kasım 2026)

Her grup hikâyeleri açık/koyu × 390/1280'de çizildi: `play` sonucu, konsol
hatası, yatay taşma ve axe (ham + eklenti). Yakalanan snippet hataları
kaynağında düzeltildi (chat-composer menü çökmesi, command-palette listbox,
bildirim zili adı, stat/chart-card/textarea/time-field kontrastı,
date-picker diyalog adı, number-field taşması, grafiklerin hareket
azaltmada ekran dışında boş kalması, sr-only tabloların telefonda taşırması).

## Bilinen Sınırlar

- `data-table` yapışkan ilk sütunun zemini `page`/`surface` seçer; `bg-overlay`
  karo içinde koyuda bir ton koyu görünür (`stickyFirst={false}`).
- `data-table` kaydırma solması (`animation-timeline: scroll()`) taşan
  tabloda bitmeyen animasyon sayılır; geçiş bekleyen testler onu dışlamalı.
- `route-progress` aynı adrese (yalnız sorgu değişen) bağlantıda da başlar ve
  10 sn güvenlik durdurmasına kadar kalır.
- Yerel `<dialog>`a sentetik Escape test ortamında `cancel` üretmez; hikâyeler
  "Kapat" düğmesini kullanır.
- Takvimdeki "bugün" işareti gerçek saate bağlı; sabit sahte veri 2 Kasım 2026.

