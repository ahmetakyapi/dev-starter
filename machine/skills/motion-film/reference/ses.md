# Ses — filmin yarısı

"Görünen her olayın bir sesi var; ses de bir geçiş aracı" (lemo-opuscar
DIRECTOR § 6). Ama ortam ikiye ayrılır:

## Sayfa içi film (bekleme, açılış)

- **Varsayılan kapalı.** Bir ürün sayfasında kendiliğinden ses kabalık.
  Filmin köşesinde küçük bir düğme ("Ses Açık / Ses Kapalı", `aria-pressed`),
  tercih `localStorage`'da (`film-sound.ts → soundPreferred / setSoundPreferred`).
- **Kullanıcı hareketi şart.** Tarayıcı `AudioContext`i yalnız tıklama içinde
  başlatır: tercih açıksa filmi başlatan düğmenin `onClick`inde `primeSound()`.
- **Olaylar zaman çizelgesinden.** Çizimin anlarını tek fonksiyonda topla
  (ör. `openingTimes()`), sesi oradan hesapla. Her karede `(son, şimdi]`
  aralığını sor (`cuesBetween`) ve çal; aralık nasıl bölünürse bölünsün olay
  bir kez çalmalı — **birim testle doğrula** (60 Hz dilimlerin birleşimi =
  tek büyük aralık).
- Hareketi azaltma kipinde (donuk kare) ses çalınmaz.
- Bitince (sonuç geldi) dönen perdenin periyodik sesleri susar.

## Tarifler (`film-sound.ts → RECIPES`)

| Olay | Tarif | Malzeme |
|------|-------|---------|
| damla / iniş | sinüs + 2,76× kısmi + alçak geçiren gürültü tıkı | cam + ıslaklık |
| damga / mühür | 130 → 48 Hz kayan sinüs + kısa gürültü + yüksek tık | ahşap + kâğıt |
| kalem | bant geçiren gürültü (3,6 kHz), düzey 35 ms'de bir tohumlu titrer | kâğıt lifi |
| dev yazı girişi | süzgeci 600 → 2400 Hz açılan gürültü | hava |
| sel gelir / çekilir | alçak geçiren gürültü, süzgeç 220 ↔ 1500 Hz | su, metal değil |
| daktilo | 6 × 12 ms yüksek geçiren tık | mekanik |
| çan | kısmi tonlar 0,5 / 1 / 1,19 / 1,56 / 2 / 2,51 / 3,01 × taban, 0,6–2,6 sn sönüm | pirinç |

Ana çıkış: kazanç 0,55 → kompresör (−18 dB, 4:1). Sesler kısa ve alçak;
film sessizken de anlaşılır olmalı.

## Video

- Tek zaman çizelgesi (bölüm, tempo, vuruş) JSON'a çıkar; görüntü, müzik,
  efekt ve kontrol betikleri aynı sayılardan okur. Görsel vuruş ile müzik
  işaretinin farkı 0 ms hedef.
- `window.EV = [{ t, kind }]` → `film-video.mjs --events` olay dosyası → çevrimdışı miks.
- Üç katman: ortam, foley, müzik; konuşma varsa müzik ~5 dB altına.
- En az iki gerçek sessizlik (doruktan önce); sessizlikten sonraki ilk ses filmin en önemlilerinden.
- En az iki kez sesle geçiş (J-cut / L-cut).
- Ustalaştırma: iki geçişli loudnorm, −14 LUFS, gerçek tepe sınırı; son dosyada
  `ffmpeg -af ebur128` ve `blackdetect`.
- Telifli müzik yok; CC0 ya da sentez, kaynaklar `CREDITS`'te.
