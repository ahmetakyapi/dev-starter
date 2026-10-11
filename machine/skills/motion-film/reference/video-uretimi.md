# Video üretimi — HTML'den MP4'e

Video modeli yok: film bir HTML sayfası, her kare tarayıcıda `render(t)` ile
çizilir ve ffmpeg'e akar (shipvideo ve lemo-opuscar aynı yolu kullanıyor).

## Sözleşme

```js
window.DUR = 24;                       // sn
window.render = (t) => { ... };        // saf; sırasız, paralel çağrılabilir
window.READY = true;                   // fontlar ve görseller hazır
window.EV = [{ t: 0.6, kind: "drop" }];             // isteğe bağlı: ses/işaret olayları
window.TEXTS = (t) => [{ text, x0, y0, x1, y1 }];   // isteğe bağlı: okuma süresi denetimi
```

Başlangıç: `assets/film-page.html` (`?t=2.5` kareye atla, boşluk oynat/durdur,
ok tuşları 1/24 sn; betikler `?capture` ile önizleme döngüsünü kapatır).
TS kitini bundle et: `npx esbuild film.ts --bundle --format=iife --global-name=Film --outfile=film.js`.

## Render sözleşmesi — her hareket prompt'unun altına yapıştır

```
Tek, kendi içinde HTML. Yalnız prompt'un adını verdiği kütüphaneler, sürümü sabit.
Font ve o kütüphaneler dışında ağ isteği yok.
Her kare zamanın (t, saniye) SAF fonksiyonu.
Hareketi JS sürüyorsa window.renderAt(t) tam o kareyi çizer.
CSS keyframe, Web Animations API, SVG, Canvas 2D ya da WebGL.
Date.now yok, setTimeout/setInterval başlatma yok, tohumsuz Math.random yok.
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

## Üretim

```bash
node $S/film-video.mjs film.html --fps=24 --size=1920x1080 --out=out/film.mp4
node $S/film-video.mjs film.html --subframes=4 --from=3 --to=6 --out=out/deneme.mp4   # bulanıklık, kısa aralık
node $S/film-video.mjs film.html --events --out=out/film.mp4                         # + film.events.json (miks için)
```

- `--subframes=N`: her kare için N alt kare çizilir, `tmix` ile ortalanır →
  gerçek hareket bulanıklığı (twoclipping'in "4 alt kare + tmix" tarifi).
  Süre N katı; önce kısa aralıkta dene.
- Çıktı: libx264, crf 18, yuv420p, faststart. JPEG ara kare (PNG'den hızlı).
- Gren gerekiyorsa sayfada değil ffmpeg'de ekle (sayfadaki gren her kareyi
  sıkıştırılamaz yapar).

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
- Hareket bulanıklığı: yarım karelik pencereye yayılmış alt kareler
  **doğrusal ışıkta** ortalanır (180° film obtüratörü).

## Ses ve son kontrol

- `film.events.json` + çevrimdışı miks (Python/sox ya da Web Audio
  `OfflineAudioContext`), sonra mux: `ffmpeg -i film.mp4 -i mix.wav -c:v copy -c:a aac -shortest out.mp4`.
- İki geçişli `loudnorm` → −14 LUFS; `ffmpeg -af ebur128` ile ölç; `blackdetect` boş kare.
- Bir kez tam hızda, sesli izle.
