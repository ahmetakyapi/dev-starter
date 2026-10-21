# Video üretimi — HTML'den MP4'e

Video modeli yok: film bir HTML sayfası, her kare tarayıcıda `render(t)` ile
çizilir ve ffmpeg'e akar (shipvideo ve lemo-opuscar aynı yolu kullanıyor).

## Sözleşme

```js
window.DUR = 24;                       // sn
window.render = (t) => { ... };        // saf; sırasız, paralel çağrılabilir
window.READY = true;                   // fontlar ve görseller hazır
window.EV = [{ t: 0.6, kind: "drop" }];                       // isteğe bağlı: ses/işaret olayları
window.TEXTS = [{ id, text, from, to, box }];                  // isteğe bağlı: okuma süresi (film-read.mjs)
window.TIMELINE = [{ id: "acilis", start: 0, end: 6 }, ...];  // isteğe bağlı: sahneler (film-sheet --cuts)
```

**TEXTS** ekrandaki her yazının kaydı. `id` yazıyı tanır (aynı id'de metin
değişirse yeni yazıdır), `text` tam metin, `from`/`to` saniye: `from` yazının
okunur hâle geldiği an (giriş animasyonu bitti), `to` ekrandan çıktığı an.
Kutu isteğe bağlı ama verilmeli: `box: (t) => [x0, y0, x1, y1]` (mantıksal px,
çizimle aynı ifadelerden), sabit dizi ya da `sel: "#baslik"` (DOM). Kutu varsa
film-read yazının ömrü boyunca birkaç anda ölçer; hiç tam kadrajda değilse ihlal.
Daktilo yazısında `from` ilk harfin karesidir ve `text` yine tam metindir:
yazılırken okunmaya başlar, süre tam uzunluktan hesaplanır.
İşlev biçimi de okunur: `TEXTS = (t) => [{ id, text, x0, y0, x1, y1 }]`, o an
ekranda olanlar; süre yazının ilk tam kadraja girdiği kareden kesintisiz
kaldığı süredir, aynı id'de uzayan metin aynı daktilo yazısıdır.

**TIMELINE** sahne pencereleri; `film-sheet.mjs --cuts` her `start`/`end`
sınırının iki yanındaki kareleri yan yana döşer (eşleşen kesme tutuyor mu,
sel tek karede mi geçiyor).

Başlangıç: `assets/film-page.html` (`?t=2.5` kareye atla, boşluk oynat/durdur,
ok tuşları 1/24 sn; `?audio=mix.wav` saati sesten alır; betikler `?capture`
ile önizleme döngüsünü kapatır).
TS kitini bundle et: `npx esbuild film.ts --bundle --format=iife --global-name=Film --outfile=film.js`.

## Render sözleşmesi — her hareket prompt'unun altına yapıştır

```
Tek, kendi içinde HTML. Yalnız prompt'un adını verdiği kütüphaneler, sürümü sabit.
Font ve o kütüphaneler dışında ağ isteği yok.
Her kare zamanın (t, saniye) SAF fonksiyonu.
Hareketi JS sürüyorsa window.renderAt(t) tam o kareyi çizer.
CSS keyframe, Web Animations API, SVG, Canvas 2D ya da WebGL.
Date.now yok, setTimeout/setInterval başlatma yok, tohumsuz Math.random yok.
Kare başına titreme ve boil tohumu kare sırasından: Math.round(t * fps), floor(t * x) değil.
Döngü: yalnız 0..N−1 kareleri; N−1. kare 0. kareye akar.
```

`assets/film-page.html` hem `render(t)` hem `renderAt(t)` açar; `renderAt`
sayfadaki CSS/WAAPI animasyonlarını da aynı ana dondurur
(`document.getAnimations()` → `pause()`, `currentTime = t·1000`), yani DOM'la
yapılmış bir film de kare kare yakalanır. Betikler önce `renderAt`'i arar.
`?t=2.5` o kareyi dondurur — model ekran görüntüsünü alıp okuyabilir.

Üç tuzak, üçü de en az bir kez başına gelecek: saat ya da zamanlayıcı (84.
kare her koşuda farklı), tohumsuz rastgelelik (şekiller kareden kareye
titrer), N. kareyi çizmek (ilk kare iki kez görünür: ekteki tekleme).

## Belirlilik kuralları

- `Math.random()` yok (`rng(seed)`), `Date.now()` yok, önceki kareden durum yok.
- Sahnede CSS transition/animation, `<video>`, `<iframe>`, dış görsel yok
  (sanal saatle sürülmezler). Görseller yerelde, `READY` onları bekler.
- Tek dünya → ekran fonksiyonu; ekran koordinatı elle yazılmaz.
- Boyut sabit (1920×1080 ya da dikey 1080×1920); yerleşim `innerWidth`/`innerHeight`'tan.
- "On twos" (12 fps adım) yalnız stilin istediği öğelerde; kamera ve ışık her karede pürüzsüz — adımlı kamera takılma gibi okunur.

### Durumlu sahne: ön sarım (preroll)

Parçacık birikimi ya da geri besleme gibi saf yazılamayan bir sahne, her
atlamada (seek) sıfırlanır ve `t − prerollMax`tan `t`ye **sabit 1/60 sn
adımla** ileri sarılır; değişken adım her koşuda farklı kare verir
(pdoom-video `engine.ts`). Aynı karenin alt kareleri obtüratör içinde geri
adım atar: bunu atlama sayma (pdoom-video |Δt| > 0,25 sn'yi atlama sayar).
Böyle bir sahne yalnız **sabit** `--subframes` ile dışa aktarılır; alt kare
sayısını kareye göre seçen uyarlamalı örnekleme onunla çalışmaz. `--workers`ta
her işçi aldığı her parçanın (8 kare) başında yeniden ön sarar.

## Üretim

```bash
node $S/film-video.mjs film.html --fps=24 --size=1920x1080 --out=out/film.mp4
node $S/film-video.mjs film.html --subframes=8 --from=3 --to=6 --audio=mix.wav --out=out/deneme.mp4
node $S/film-video.mjs film.html --scale=2 --workers=3 --subframes=8 --out=out/film-4k.mp4
node $S/film-video.mjs film.html --events --out=out/film.mp4                         # + film.events.json (miks için)
node $S/film-read.mjs film.html                                                      # yazılar okunacak kadar duruyor mu
```

- Çıktı: libx264, crf 18, yuv420p, faststart, BT.709 etiketli. JPEG ara kare (PNG'den hızlı).
- `--audio=mix.wav`: ses `--from`dan `to − from` kadar kesilip bindirilir
  (AAC 320k, `-shortest`): 3–6 sn deneme klibi de sesle senkron kalır.
- `--grain`: x264 `-tune grain -x264-params aq-mode=3`. Kâğıt dokusu, gren,
  ince tarama varsa: varsayılan ayar onları düz alanda yumuşatır, bantlama başlar.
  Gren sayfada değil ffmpeg'de eklenirse daha da iyi (sayfadaki gren her kareyi
  sıkıştırılamaz yapar).
- `--workers=N`: N **ayrı tarayıcı** (aynı tarayıcıdaki sayfalar tek kompozitörü
  paylaşır, paralel çizmez). Kareler `<out>.frames/` dizinine yazılır
  (`.tmp` + yeniden adlandırma; 1 KB altı dosya bozuk sayılır), işçiler kısa
  parçaları baştan sona sırayla alır. Kesilen render aynı komutla kaldığı yerden
  sürer; ayarlar ya da sayfanın yerel dosyaları değiştiyse eski kareler silinip
  baştan çizilir (http hedefte dosya değişikliği görülmez: sayfayı
  değiştirdiysen dizini sil). Başarıda dizin silinir (`--keep-frames` tutar).
  Tek işçide `--frames-dir=yol` aynı devam edebilirliği açar.
- **Hata erken durdurur:** sayfa hatası ya da gelmeyen betik/belge render'ı
  hemen keser; READY gelmezse sayfanın durumu ve görülen hatalar yazılır. ffmpeg
  gizli bir `.partial` dosyasına yazar, yalnız başarıda asıl ada taşınır: yarım
  kalmış ama bitmiş görünen MP4 kalmaz, önceki iyi çıktı da ezilmez.
- Tarayıcı `--force-color-profile=srgb` ve `--font-render-hinting=none` ile
  açılır (üç betikte aynı): temas sayfasındaki kare videodaki kareyle aynı renkte
  ve aynı yazı genişliğinde. WebGL yazılımla çiziliyorsa (SwiftShader) bir kez uyarır.

### Hareket bulanıklığı: merkezli obtüratör

`--subframes=N --shutter=0.5`: her çıktı karesi kendi N alt karesinin
ortalamasıdır. `f`. karenin `s`. alt karesi

```
t = (f + shutter · ((s + 0,5) / N − 0,5)) / fps
```

anında çizilir: alt kareler karenin anına **ortalanmış**, `shutter` kare
süresinin oranı (0,5 = 180° film obtüratörü, yarım karelik pencere). İz
nesnenin iki yanına eşit uzar, nesne keskin karedekiyle aynı yerde görünür
(ölçülen: 960 px/sn kare, bulanık karede ağırlık merkezi keskin kareyle aynı
pikselde). Pencere karenin anından ileri açılsaydı iz öne kayardı. Gruplar
sabit: ffmpeg `tmix` her N. kareden seçilir, kare yalnız kendi alt karelerine
bağlı; kayan pencere her kareyi komşusunun alt kareleriyle karıştırırdı.

Ortalama **doğrusal ışıkta** alınır: alt kareler sRGB'den doğrusala çevrilir
(16 bit), toplanır, geri çevrilir. sRGB değerinin ortalaması açık bir nesnenin
izini koyu zeminde karanlık ve ince gösterir (çeyrek kaplamada 64 yerine 137).
Süre N katı; önce kısa aralıkta dene. Alt kareler arası adım
`hız × shutter / (fps × N)`: 960 px/sn, 24 fps, 0,5 obtüratör, 8 alt kare →
2,5 px, iz pürüzsüz. Adım birkaç pikseli geçerse iz basamaklı görünür: N'yi artır.

**Kare sırası kuralı:** titreme, boil, kare başına gürültü tohumu **kare
sırasından** alınır: `frameIdx = Math.round(t * fps)` (12'lik boil:
`Math.floor(frameIdx / 2)`). Bu değer bir karenin bütün obtüratörü boyunca
sabittir. `Math.floor(t * fps)` ya da `floor(t * 12)` karenin tam anında
değişir, merkezli obtüratörde alt karelerin yarısı bir durumu, yarısı ötekini
çizer: her karede çift pozlama. Zamanla sürekli değişen gürültü (zamanla
tohumlanan hash) ise her alt karede yeniden örneklenir ve yumuşar; istenmiyorsa
o da `frameIdx`le tohumlanır (pdoom-video ENGINE.md § Motion blur).

### Renk etiketi (BT.709)

Tarayıcı kareyi sRGB çizer; H.264 YUV taşır. Dönüşüm matrisi açıkça
verilmezse ffmpeg BT.601 kullanır, oynatıcılar ve YouTube ise etiketsiz HD'yi
BT.709 diye çözer: kırmızı ve yeşil kayar (ölçülen: `#c0262d` BT.601 ile
çevrilip BT.709 ile çözülünce 177,20,46; doğru yolda 191,37,45). Bu yüzden
filtre zinciri `scale=out_color_matrix=bt709:out_range=tv` ile çevirir;
`scale` yalnız çevirir, etiket yazmaz. Etiketi iki yol yazar:
`setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709` karelere,
`-colorspace/-color_primaries/-color_trc bt709` bayrakları kodlayıcıya. İkisi
birden verilir: ffmpeg 6.1'de ikisi de tek başına yetti, pdoom-video ise başka
bir sürümde bayrakların akışa ulaşmadığını bildiriyor. Denetim:
`ffprobe -show_entries stream=color_space,color_primaries,color_transfer out/film.mp4`
→ üçü de `bt709` (pdoom-video `app/scripts/render.ts`).

## Mantıksal düzen, fiziksel piksel

`--scale=2` 1920×1080'lik filmi 3840×2160 çizer; sayfa değişmez
(pdoom-video ENGINE.md § Output scale):

- **Yerleşim mantıksal pikselde.** `--size` hep 1920×1080; `innerWidth`,
  `innerHeight`, yazı boyu, kamera aynı sayılar. Ölçek yalnız `devicePixelRatio`.
- **Arka depo × ölçek.** Tuval `w·dpr × h·dpr`, çizim `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`
  altında. `film-page.html` kayıtta dpr'yi kısmaz (önizlemede 2'de keser).
  `getImageData`/`putImageData` ve ekran dışı tuvaller fiziksel pikseldir:
  büyük görünen doku atlası dpr× büyük açılır, yoksa 4K'da yumuşak kalır.
- **Kıl çizgi ve gren mantıksal piksel başına.** 1 px çizgi 4K'da 2 fiziksel
  px olur, mürekkebi aynı kalır; `lineWidth = 1 / dpr` yazılırsa 4K'da incelir,
  küçültünce soluklaşır. Gren hücresi de mantıksal pikselde: fiziksel piksele
  bağlı gren 4K'da yarı boy olur, küçültünce kaybolur.
- **Denetim:** 4K kareyi küçült, 1× kareyle yan yana koy; aynı görünmeli,
  yalnız daha keskin. Ayrıntı tam çözünürlükte:
  ```bash
  node $S/film-sheet.mjs film.html --size=1920x1080 --scale=2 --times=3.2 --thumb=960 --out=out/4k.png
  node $S/film-sheet.mjs film.html --size=1920x1080 --times=3.2 --thumb=960 --out=out/1x.png
  node $S/film-sheet.mjs film.html --size=1920x1080 --scale=2 --crop=820,420,280,160 --times=3.2 --out=out/kil.png
  ```

## Hangi araç: Canvas sözleşmesi ne zaman değil

Varsayılan yol bu belgedeki: tek HTML, saf `render(t)`, tarayıcı + ffmpeg.
Şu durumlarda başka araç daha az iş çıkarır:

| Araç | Ne zaman |
|------|----------|
| Remotion | Video React bileşeni olarak yazılıyor ve aynı şablon veriyle çok kez basılacak; ticari kullanımda lisansına bak |
| HyperFrames | Sahne zaten HTML/CSS ile, zaman çizelgesi işaretlemede; aynı tarayıcı yakalama fikri, hazır CLI ile |
| Manim | Matematik, denklem, grafik ve geometrik dönüşüm anlatımı |
| Blender | Gerçek 3D, ışık, kumaş/sıvı/fizik; simülasyon önce önbelleğe pişirilir (bake) ki her kare yeniden üretilebilsin |
| GSAP (seek ile) | Hareket zaten bir GSAP zaman çizelgesinde: `tl.pause()`, `render(t)` içinde `tl.seek(t)`; kendi saati kapalı |
| Three.js | Tarayıcıda 3D sahne; aynı sözleşme, kamera ve ışık `t`den; GPU ister (yazılım WebGL çok yavaş) |
| Harici video modeli | Fotogerçekçi çekim, insan, doğa; belirli değildir, kare numarasıyla düzeltilmez. Ayrı bir rota: izleyiciye modelle üretildiği açıkça söylenir |

## Döngü

- Kareler **0..N−1**, asla N: N. kare 0. karedir.
- Her döngüyü `faz = kare / N` sürsün, **tam devir**: 90° dönen kare, tam 2
  devir yapan dalga ilk karesine döner. Organik sürüklenme için gürültüyü bir
  **çember üstünde** örnekle — başladığı yere döner.
- Biten hareket (yalpalama) 0. kareden geçerek sürsün: ek görünmez.
- **0. kare bitmiş bir kompozisyon olsun**: GIF yüklenirken ekranda o durur.

## Çıktı biçimleri

- MP4 paylaşım için, GIF makale ve satır içi döngü için (`--gif`). GIF
  gecikmeleri 1/100 sn: 24 fps (41,7 ms) yazılamaz, 40'a yuvarlanınca döngü %4
  hızlı koşar ve vuruştan kayar. `film-video.mjs --gif` 25 fps'e (tam 40 ms)
  sabitler; 24'te kalmak gerekirse beş kare 40 ms + bir kare 50 ms.
- Tek palet: kareler arası renk titremez.
- Tuval ilk kareden önce seçilir (sonradan değiştirmek her planı yeniden
  yönetmek demek): 1920×1080 (16:9), 1080×1080, 1080×1350 (4:5), 1080×1920 (9:16).
- X: GIF ≤ 15 MB ve ≤ 350 kare (24 fps'te ~14,5 sn), video 1:3 ile 3:1 arası.

## Ses ve son kontrol

- `film.events.json` + çevrimdışı miks (Python/sox ya da Web Audio
  `OfflineAudioContext`), sonra `--audio=mix.wav` ile tek geçişte bindir. Hazır
  bir MP4'e: `ffmpeg -i film.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart out.mp4`.
- Sesi görüntüye karşı sayfada dinle: `film.html?audio=mix.wav` (saat sesin
  `currentTime`ı, iki güncelleme arası `performance.now()` ile yumuşatılır).
- İki geçişli `loudnorm` → −14 LUFS; `ffmpeg -af ebur128` ile ölç; `blackdetect` boş kare.
- `ffprobe -show_entries stream=duration`: ses ve görüntü süresi eşit mi.
- Bir kez tam hızda, sesli izle.
