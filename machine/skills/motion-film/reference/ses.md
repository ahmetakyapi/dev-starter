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

## Video — ses ölçülür, dinlenmez

Model duyamaz; senkronu ve dengeyi **çözülmüş sesi ölçerek** kurar (Florence,
"Motion Lab": 5, 12 ve 0 ses takibi, hepsi ölçümden).

- **Resim 1 kare önce, ses sonra** — her vuruş, resim olayından 1 kare SONRA
  tepe yapar. Resimden önce gelen ses, biraz geç gelenden çok daha erken
  "yanlış" hissettirir; gerçek hayatta da ışık sesten önce gelir.
- **Kosinüs fazıyla başla, 0,5–1 ms atak:** ilk dalga tepesi tam kare + 1'e otursun.
  Bir vuruşun ikinci lobu birincisinden büyükse tepe 2–3 ms kayar — geçici
  (transient) ver ki en büyük tepe ilki olsun.
- **Telefon bandı:** akış sessiz başlar, dokununca telefon hoparlöründen çalar;
  hoparlör 60 Hz altını çalmaz. İlk miksin enerjisinin %80'i 60 Hz altındaydı:
  bası bir oktav yukarı al, kick'e 190 Hz vuruş ver. Ölçüyü 200 Hz–6 kHz bandında da al.
- **Vuruşlar yatağın 3–6 dB üstünde** (K-ağırlıklı, vuruş izi eksi yatak izi);
  vuruş anında yatağı 3–4 dB kıs (ducking). 8 kHz üstü yok, mono güvenli.
- **DC'yi temizle** (her kanalın döngü ortalamasını çıkar); döngüde ilk ve son
  örnek birleşsin.
- **−14 LUFS, tepe −1 dBTP** — AAC kodlaması gerçek tepeyi ~0,9 dB yükseltir:
  WAV'ı −2,2 dBTP'ye sınırla ki çözülmüş MP4 −1'in altında kalsın. Kodlayıcı
  döngü ekine ~16 ms dolgu ekler; eki kodlamadan sonra ölç.
- **İki kez render et, ikincisini tut** (WebAudio ısınması); başlangıçta tam
  seste başlayan kazanç düğümü ve 6 ms gecikme ekleyen kompresör iki bilinen tuzak.
- Kontrol: MP4'ü tarayıcıda çöz, her vuruşu karesiyle hizala (ofset ms, vuruş başına).

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
