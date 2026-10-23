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

## Senkron noktası: efekte olayın anını ver

Her ses bir tampon + tamponun içinde bir **senkron noktası**dır; yerleştirirken
o nokta görsel olayın anına konur (kaynak: mg-styles-15, MIT):

| Ses | Senkron noktası |
|-----|-----------------|
| tık, vuruş, darbe, damga | geçici (transient), yani başı |
| whoosh / swish | **geçiş tepesi** (nesnenin kameranın önünden geçtiği an), başı değil |
| riser, ters zil, şarj, kabarma | **sonu** — vardığı darbe |
| geçiş (whoosh → darbe) | darbe |

- Zaman çizelgesine **görsel olayın anı** yazılır; "0,7 sn'lik whoosh'un tepesi
  0,42'de, öyleyse 0,42 erken başlat" hesabını çizelgeye gömme. Ofset sesi
  yerleştiren kodda sesin kendi senkron noktasından çıkarılır; ses değişince
  ya da süresi uzayınca senkron kendiliğinden doğru kalır. `film-sound.ts`teki
  sayfa içi tarifler başlangıçtan çalar; kabaranların tepe süresi yorumunda.
- Whoosh süresi ≈ nesnenin ekrandaki yolculuk süresi; yönü ekran yönü, tepesi
  merkezi geçtiği an.
- Bir karede en çok ~3 efekt üst üste; kahraman darbe katmanlı (darbe + alt
  bas), önüne riser.
- Bazı araçlar sesi bir kare ÖNE alır (geçici o kareye "otursun" diye). Bizde
  yapma: insan sesin öne kaçmasını gecikmesinden çok daha erken fark eder
  (yayın eşiği kabaca +45 / −125 ms), kuralımız aşağıda: resim önce, ses 1 kare sonra.

## Efekt düzeyi: önce normalize, sonra niyet

- Her efekt **loudness'a göre normalize** edilir (ör. kısa süreli ≈ −18 LUFS,
  tepe ≤ −1 dBFS); kazanç 0'da bütün efektler aynı algılanan düzeyde, müzik
  yatağının ~2 dB üstünde. Sentezin ham genliği (tepe değeri) düzey değildir:
  kısa tık tepeye vurur ama sessiz duyulur, uzun gürültü tersi.
- Sonra kazanç yalnız **niyet** söyler: −6 dB ince, 0 olağan, +2 dB kahraman.
  "Bu tık neden bu kadar yüksek" sorusu kazançtan okunabilmeli.
- Stereo sesin loudness'ı kanal güçlerinin ortalamasıyla ölçülür (BS.1770);
  mono toplamla ölçmek geniş sesi düşük okur.
- Çalgılar normalize edilmez; izlerine LUFS hedefi verilir.

## Mono güvenliği

Telefon çoğu zaman mono çalar; sol-sağ farkı orada yok olur ya da birbirini siler.

- Genişletme **M/S** ile (`L = m + s`, `R = m − s`); tek kanala gecikmeli kopya
  (Haas) KOYMA — monoda tarak süzgeci olur, ses içi boş ve metalik çıkar.
- 120 Hz altı mono; stereo örnek kaydı (aralıklı çift mikrofon) yüklerken
  kanallar zamanda hizalanır.
- Ölç: L/R korelasyonu **> 0,3** sağlıklı, **< 0** faz sorunu. Mono toplamın
  loudness'ı stereodan 3 dB'den fazla düşükse bir şey birbirini siliyor.

## Tempo: müziği resme uydur

Film önce çizildiyse (vuruş noktaları resimde) tempo seçilir, resim kaydırılmaz:

- Görsel darbe zamanlarına **8'lik ızgarası en iyi oturan BPM**'i tara
  (tür aralığında 0,05 adımla; hata = darbelerin ızgaraya karesel ortalama
  uzaklığı, en kötüsünü de raporla). En kötü hata < 1 kare değilse en uzak
  darbeyi resimde ızgaraya çek (resim oynar, ses değil).
- Izgaranın çapası: **0. ölçü dropta başlar** (filmin kahraman anı). Akor
  yürüyüşü de dropta başlar; giriş onun sonunu (dönüş) çalar. Bölümler:
  giriş → yükseliş → drop → çıkış, sınırlar ölçü başında.
- Kontrol: her darbenin ızgaraya uzaklığını ms olarak listele, 0 ms hedef
  (lemo-opuscar `cuecheck`, MIT: yalnız bilerek ızgara dışı bırakılan
  "nefes"ler muaf, adıyla).
- Şarkı hazırsa tersi: ızgara ölçülür, resim ona uyar — `muzik-klibi.md`.

## Anlatım ve TTS

- **Anahtar `.env`'de**, kodda, sayfada, script argümanında değil; `.env`
  gitignore'da, örneği `.env.example`'da boş. Sayfa tarayıcıda çalışır:
  sağlayıcıyı sayfadan çağırma, sesi derleme anında üret, WAV'ı sakla.
- **Zamanlama gerçek süreden.** Her satırı ayrı WAV olarak üret, süresini
  ölç (sessizliği kırp), sahne sürelerini bu dosyadan türet. Senaryodan
  tahmin edilen süre (kelime/sn) TTS'in hızıyla tutmaz; tahminle kurulan
  film her satırda biraz kayar.
- **Sayılar TTS metninde yazıyla, altyazıda rakamla:** TTS "yüzde kırk iki",
  altyazı "%42"; "2024'te" → "iki bin yirmi dörtte". Türkçede kısaltma ve
  ek birleşimi (TL, ABD'de, 3'üncü) TTS'in en sık yanlış okuduğu yer.
- **Model duyamaz; geri yazdırarak doğrula.** Her WAV'ı konuşmadan metne
  (ör. Whisper, `language="tr"`) geri çevir, senaryoyla kelime kelime
  karşılaştır, tutmayanı yeniden üret; aynı geçiş kelime zamanlarını da
  verir (altyazı ve vurgu yerleşimi için). **Türkçe telaffuz ayrıca
  işaretlenmeli:** STT doğru kelimeyi duyup yanlış vurguyu, ı/i, ğ ve uzun
  ünlüyü kaçırabilir; çok dilli ya da İngilizce öncelikli sesler özel adları
  ve alıntı kelimeleri İngilizce okur. Özel ad, sayı ve yabancı kelime içeren
  satırları teslimde "insan dinlesin" diye listele; ana dili Türkçe olan ses seç.
- **Anlatıcı durunca resim durmaz:** cümle arası ve nefeste kamera nefes
  alır, ikincil hareket sürer, bir sonraki okumanın hazırlığı başlar. Sesle
  birlikte donan film slayt gösterisi gibi okunur.
- TTS'in tepe/ortalama oranı yüksek: önce sesi sıkıştır, sonra RMS/LUFS ile
  dengele.

### Anlatım ile müzik arası düzey

Eski kuralımız "müzik ~5 dB altına", lemo-opuscar "ses müziğin ~10 dB
üstünde (RMS, sıkıştırılmış sesle)". İkisi farklı şeyi ölçüyordu: 5 dB çoğu
zaman müziğin konuşma girince **ne kadar kısıldığı** (ducking), 10 dB
konuşmanın kısılmış müziğin **üstündeki farkı**. Tek ölçüyle hedef:

- Konuşma bölümlerinde ses izi, müzik izinden **8–12 dB** yüksek (ikisi ayrı
  stem, aynı ölçü: K-ağırlıklı kısa süreli loudness, yalnız konuşulan aralıklar).
- Alt uç (8): seyrek, sözsüz, 1–4 kHz'i boş müzik. Üst uç (10–12): yoğun ya
  da sözlü müzik, telefon hoparlörü, TTS, ikinci dilde dinleyen.
- 6 dB'nin altı anlaşılırlığı kaybettirir (en çok Türkçe ekler, cümle sonları
  yutulur); 14'ün üstünde müzik yok olur, konuşmasız aralara geçişte sıçrar.
- Müziği konuşma boyunca yumuşak ducking ile kıs (atak ~80 ms, bırakma
  ~300 ms), kelime kelime pompalatma.

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
  efekt ve kontrol script'leri aynı sayılardan okur. Görsel vuruş ile müzik
  işaretinin farkı 0 ms hedef.
- `window.EV = [{ t, kind }]` → `film-video.mjs --events` olay dosyası → çevrimdışı miks.
- Üç katman: ortam, foley, müzik; konuşma varsa konuşma müziğin 8–12 dB
  üstünde (yukarıda § anlatım ile müzik arası düzey).
- En az iki gerçek sessizlik (doruktan önce); sessizlikten sonraki ilk ses filmin en önemlilerinden.
- En az iki kez sesle geçiş (J-cut / L-cut).
- Ustalaştırma: iki geçişli loudnorm, −14 LUFS, gerçek tepe sınırı; son dosyada
  `ffmpeg -af ebur128` ve `blackdetect`.
- Telifli müzik yok; CC0 ya da sentez, kaynaklar `CREDITS`'te. Hazır bir
  şarkıya klip (sözler, vuruş ızgarası, kelime hizalama): `muzik-klibi.md`;
  şarkının ve sözlerin hakkı kullanıcıda olmalı.
