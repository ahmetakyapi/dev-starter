# Hikaye Testleri ve a11y Durumu

`npm run test:stories` (storybook içinde) bütün hikayelerin `play` fonksiyonlarını ve
a11y denetimini (axe, `preview.tsx` → `a11y: { test: "error" }`) gerçek Chromium'da
koşturur. CI'da ayrı iş: **Storybook Tests**. Yerelde: `npm run ci:local -- --tests`.

Yaklaşım: `@storybook/addon-vitest` + `vitest` + `@vitest/browser-playwright` (Storybook
10.6'nın resmi yolu; `test-runner` değil). Hikaye listesi `.storybook/main.ts`ten gelir;
`SB_VITEST=1` iken dışlanan klasörler orada (`TEST_EXCLUDED_DIRS`). Ön kurulu Chromium
için `SB_CHROMIUM=/opt/pw-browsers/chromium`. Koşu ~3 dakika.

## Koşu ortamı kararları

- **Hareket azaltma AÇIK** (`vitest.config.ts` → `contextOptions.reducedMotion`) ve
  `.storybook/vitest.setup.ts` geçişleri 1 ms'ye indirir: axe, `play` biter bitmez ölçer;
  giriş animasyonunun ortasındaki yarı saydam metin sahte kontrast ihlali üretiyordu.
- **`heading-order` ve `landmark-unique` Vitest'te kapalı**: bileşen hikayeleri sayfa
  parçasıdır; galeri hikayelerinde aynı adlı bölge zorunlu olarak tekrar eder. Gerçek sayfa
  ekranlarında bu iki kural elle denetlenir (`guides/10` § 6). Storybook arayüzündeki a11y
  panelinde ikisi de açık kalır.
- **`useArgs` Vitest'te çalışmaz** (hikaye bağlamı yok): `stories/_lib/useLocalArgs.ts`
  değişikliği yerelde de tutar (Dialog, Sheet, SegmentedControl, NotificationCenter).

## Dışlananlar (koşmaz)

| Ne | Neden |
|---|---|
| `stories/kuzeyova/**`, `stories/portal/**` | Kuzeyova Portalı: ayrı iş, bu turda testsiz; `TEST_EXCLUDED_DIRS` |
| Auth Card → Bağlantıyla Giriş (`!test`) | React 19 form eylemi (`action`) Vitest'te sonuç döndürmüyor; Storybook'ta çalışır |
| Kapak → palet turu adımı | Palet global'i Storybook kanalından döner; kanal yok, adım Vitest'te atlanır (kalan assertion'lar koşar) |

## a11y TODO (`a11y: { test: "todo" }`: ihlal gösterilir, test kırılmaz)

Kural kimliği × hikaye. Hepsinin nedeni dosyada, `parameters.a11y` satırının yanında yazılı.

| Kural | Nerede | Not |
|---|---|---|
| `color-contrast` | Tema → Renkler, Yüzeyler, Grafik Renkleri, Hareket | Token örnek kartları; koyu kapsam açık sayfada çizilir |
| `color-contrast` | Chat Thread, Çoklu Ajan Sohbeti, Yapay Zeka Sohbeti | Akan yanıt (Motion) yarı saydam anda ölçülüyor |
| `color-contrast` | Ekranlar → Bölümler (Görüşler), Tam Sayfa | Avatar baş harfi `chart-4` üstünde 3,8:1 (landing şablonu) |
| `color-contrast` | Pusula (Bildirimler, Oturum Kapalı, Tanıtım), Kahramanlar (Odak Yığını), Amiral | Başarı metni 4,42:1; `on-brand/75` 4,18:1; Odak Yığını uzak öğeleri bilerek soluk |
| `color-contrast` | Kanal Tablosu | Sütun başlığı 4,47:1 (eşiğin 0,03 altında) |
| `color-contrast` | Köşe Maskotu | Balon geçiş ortasında |
| `label-content-name-mismatch` | Kişi Seçici | Avatar baş harfleri düğme adında yok |
| `label-content-name-mismatch` | Yığılı Sütun Grafiği | Sütun düğmesi adı görünen balon metnini aynen içermiyor |
| `scrollable-region-focusable` | Kayan Sütunlar | Hareket azaltmada sütun kaydırılır ama klavyeyle odaklanamaz |

## Koşuda bulunan ve düzeltilen hatalar

- **`select`: liste hiç açılmıyordu** (`Portal container={null}`): diyalog içinde açılsın diye
  eklenen taşıma, diyalog dışında listeyi hiç çizmiyordu. Düzeltildi; "Pencere İçinde"
  hikayesi diyalog içi davranışı da sınar.
- `label-content-name-mismatch`: Hızlı Oylama `%` biçimi, Pusula hesap seçici adı, Kişi Seçici `+N` ve "Ekle".
- `dlitem`: Kahramanlar'da `Stat` `StatGrid` olmadan çiziliyordu.
- Hikaye hataları: Marquee (hareket azaltmada düğme yok), StepRail (`getByText` çoklu).
