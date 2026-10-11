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

## Ses ve son kontrol

- `film.events.json` + çevrimdışı miks (Python/sox ya da Web Audio
  `OfflineAudioContext`), sonra mux: `ffmpeg -i film.mp4 -i mix.wav -c:v copy -c:a aac -shortest out.mp4`.
- İki geçişli `loudnorm` → −14 LUFS; `ffmpeg -af ebur128` ile ölç; `blackdetect` boş kare.
- Bir kez tam hızda, sesli izle.
