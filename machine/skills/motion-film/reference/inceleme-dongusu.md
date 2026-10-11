# İnceleme döngüsü — hareket okunarak değil bakılarak görülür

## Üç yakınlık

1. **Temas sayfası (contact sheet):** bütün film, 0,5–1 sn arayla. Her
   perdenin olayı tek kareden okunuyor mu? Özne yeterince büyük mü?
   ```bash
   node $S/film-sheet.mjs film.html --range=0:24:1 --cols=6 --out=out/sheet.png
   ```
2. **Şerit (strip):** bir anın her karesi (1/12 sn). Dönüşler, düşüşler,
   geçişlerin ilk ve son 0,5 sn'si. Hazırlık ve takip var mı, sıçrama var mı,
   her şey aynı anda mı hareket ediyor?
   ```bash
   node $S/film-sheet.mjs film.html --strip=3.2:3.8 --cols=7 --out=out/strip.png
   ```
3. **Canlı bileşen:** sözleşme sayfası değil, ürünün kendisi; gerçek saat,
   gerçek düğme. Kare süresi de ölçülür.
   ```bash
   node $S/film-sheet.mjs http://localhost:3000/onizleme --live --click="[data-start]" \
     --times=0.2,0.6,1.2,2,3,5,8 --selector=main --size=390x844 --dark --out=out/live.png
   ```

Her karede sor: izleyici şu an nereye bakıyor, anladı mı? Bir okuma kaç
kare alıyor (24 kare = 1 sn)? Birkaç karelik okuma kaçırılır.

## Animatörün iki görünümü

- **Soğan kabuğu (onion skin):** kareleri %25 opaklıkla üst üste. Eşit aralık
  robotik hareket; anahtar karelere yaklaşırken sıklaşan aralık eğrinin çalıştığı.
  ```bash
  node $S/film-sheet.mjs film.html --strip=1:2 --onion --out=out/onion.png
  ```
- **Hız grafiği:** kahramanın konumu ve kare başına değişimi. Düz çizgi
  doğrusal hareket, keskin köşe ölü kalkış/duruş.
  ```bash
  node $S/film-sheet.mjs film.html --range=0:3:0.0417 \
    --probe="[hero.getBoundingClientRect().x, hero.getBoundingClientRect().width]" --out=out/hiz.png
  ```

## Sayısal denetim

Gözle bakmanın yetmediği yerde canlı sahneyi her karede okuyup prompt'un
sayılarıyla karşılaştır (Motion Lab'in maskot döngüsü: 480 karede 71 denetim,
ilk koşuda 6'sı kaldı). Etiketleri karelere bağla: geç kalan hareket, ekranda
hareketinden önce yanan bir etiket olarak görünür. Yinelerken kare
sayacı/oynatma kafası açık, son render'da kapalı.

## Döngü: render → bak → düzelt

İlk render taslaktır. Durağan kareler çıkar, bak, **kare numaralı** not
yaz, düzelt, yalnız değişeni yeniden render et. İki-dört tur normaldir.
Yaratıcı takipleri say (görünüşü ya da hareketi değiştiren her not);
teknik düzeltmeler ayrı listede.

## Matris

İki tema × iki genişlik (390 telefon, 1280 masaüstü) × iki dil (varsa) ×
hareketi azaltma. Ayrıca: yatay taşma (`scrollWidth > innerWidth`), konsol
hatası, kare süresi p95 ≤ 16,8 ms (60 fps), ses açıkken de.

## Gerçek veri yoksa

Yerelde veritabanı ya da API anahtarı yoksa geçici bir önizleme rotası
(commit'lenmez, işi bitince sil) ve sahte veri; ağ isteklerini tarayıcıda
yakalayıp gerçek biçimde yanıtla (puppeteer `setRequestInterception`).
Yavaş ağı da dene: görsel 2–3 sn geciksin, film ne yapıyor?

## Tuzaklar — ölçümle bulunanlar (Açılış Zili, Ekim 2026)

| Belirti | Neden | Çözüm |
|---------|-------|-------|
| Kinetik başlık hiç görünmüyor | Sitenin başlık degradesi (`background-clip: text`, fill transparent) ayrı taşınan harflere boyanmıyor | O başlıkta degradeyi kapat, düz renk |
| Telefonda film kutusu ekrandan taşıyor | `aspect-ratio` + `min-height` birleşince oran genişliğe de aktarılıyor | Boy verildiğinde `aspect-ratio: auto` |
| 3,4–3,6 sn arası boş kare | Yakın planda hızlı damla, geniş pencereli takip kamerası geride kaldı | Yolda pencereyi daralt + kamerayı aç (`kamera.md`) |
| Şeritler kutu gibi görünüyor | Yılan sırasında komşu şeritler uç noktayı paylaşınca dikey kenar oluştu | Her parça yalnız kendi noktalarını çizsin; bağlantı ayrı darbe, söner |
| Dev kelime selin dışında yarım harfler | Kelime sel ekranı kaplamadan başladı, normal paletle çizildi | Kelimeyi sel tamamlanınca başlat |
| Künyeler üst üste | Zirve son seanslarda, son kapanış künyesiyle aynı yerde; kadran uç künyesiyle aynı köşede | Çakışmaya göre yer seç; hale ekle |
| Künye ses düğmesinin altında | Grafiğin üst payı DOM düğmesini hesaba katmıyordu | Üst payı düğmenin altından başlat |
| Damgada logo yerine "NV" | Film başladığında logo inmemişti | Logoyu önceden indir + `decode()`; film ≤ 450 ms beklesin; yoldaysa karo boş beklesin |
| Logo film sırasında değişince film baştan başladı | Logo efektin bağımlılığındaydı | Filme verilen logoyu başlatma anında dondur |
| Mühürde ".NVDA" | Rastgele pürüz harfin yanına düştü | Pürüzler yalnız kenar bandında |
| Uzun sembolde künye perde sonrasına taştı | Kalem süresi sabitti | Süreyi perde sonuna göre sınırla; birim testle |
| Liste kutu kadar dar, ad tek harf | Açılır liste girdinin genişliğinde | Satırın (girdi + düğme) genişliği |
| Koyu temada açılır liste saydam | Yüzey token'ı koyu temada yarı saydam | Opak yüzey token'ı |

## Başsız tarayıcı notları

- `el.screenshot()` çalışan CSS animasyonunu başa sarılmış karede çekebilir;
  yerleşimi hareketi azaltma taklidiyle çek, animasyonu sayıyla doğrula
  (`getAnimations()`), görüntüyle değil.
- Font yüklenmeden ölçülen yazı yanlış genişlikte: `document.fonts.load(...)`.
- `pkill -f "next dev"` gibi desenler betiğin kendi kabuğunu da öldürebilir;
  sunucuyu PID dosyasıyla ya da `ss -ltnp | grep :PORT` ile durdur.
