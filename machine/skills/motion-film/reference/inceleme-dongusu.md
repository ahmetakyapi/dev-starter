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

## Kapı: önce en zor 2–4 saniye

Tam render'dan önce filmin **en zor** 2–4 saniyesini (en hızlı hareket,
ilk geçiş, temaslar, döngü eki) tek başına çıkar ve 12–24 komşu kareye
bak: örtüşme, temas, hız, döngü eki, altyazının sınırları
(kaynak: athemeroy/awesome-claude-5-5-videos `docs/visual-effects-fit.md`, CC BY 4.0).

Aynı aralığı **başka bir sırayla** yeniden çiz (tersten, karışık) ve aynı
zamanlardaki kareleri bayt bayt karşılaştır. Fark varsa kare t'nin saf
fonksiyonu değildir: kareden kareye taşınan durum, tohumsuz rastgelelik ya
da çizim sırasına bağlı bir akış.

```bash
node $S/film-sheet.mjs film.html --strip=3.0:4.0 --out=out/ileri.png
node $S/film-sheet.mjs film.html --times=4,3.5,3,3.75,3.25 --cols=5 --out=out/karisik.png
# ileri şeridindeki 3, 3.25, 3.5, 3.75, 4 kareleriyle karşılaştır (ör. ImageMagick: compare -metric AE)
```

Kapıdan geçmeden tam render yok: hatanın en pahalı yeri tam render'dır.

## Bağımsız jüri

Filmi yapan oturum kendi filmine iyi not verir. Puanı **ayrı bir oturum ya
da subagent** verir: ekosistemde `design-reviewer` (kaynak:
Vincentwei1021/mg-styles-15 `rubric.md`, MIT). Jüriye yalnız şunları ver:
film dosyası ve prompt'un stil, çıktı ve imza özellikleri bölümü; yapım
konuşmasını verme.

**1. Gerçekten bak:** 0,5 sn arayla temas sayfası, en hızlı ve en önemli
hareketlerin ve doruğun şeritleri, 5–8 anahtar anda tam çözünürlüklü kare.
Kenar, yazı dizgisi, merdivenlenme, bantlaşma, doku, kırpılma tam boyda.

**2. Teknik şartname:** süre tam, çözünürlük ve fps doğru, ses var,
≈ −14 LUFS (±1), gerçek tepe ≤ −1 dBTP, istenmeyen siyah kare ve ölü durgun
aralık yok, görsel vuruşlar ses başlangıçlarıyla aynı karede.

**3. Yedi boyut, 1–10:**

| Boyut | Ne aranır |
|-------|-----------|
| Stil sadakati | stil tek bakışta tanınıyor; her imza özelliği ve tekniği var ve doğru |
| Konsept / wow | net bir fikir, ilk 0,5 sn'de hook, şaşmaz bir doruk anı, tatmin eden son kare |
| Hareket zanaatı | eğri, aralık, örtüşme, hazırlık ve takip, kavis, geçişler, hareket bulanıklığı; ölü ya da titrek hareket yok |
| Tasarım & tipografi | kompozisyon, hiyerarşi, ızgara, dizgi, palet, boşluk |
| Bitiş | ışık, doku, gren, ayrıntı stile uygun; bantlaşma, merdiven, kusur yok |
| Ses senkronu | müzikalite, tür doğruluğu, ses tasarımı, görüntüyle eşleşme, miks |
| Teknik | şartnameye uyum, fontlar yüklü, aksaklık, kırpılma, ani beliriş yok |

**Sabit çapalar:** 5 yetkin öğrenci işi · 6 iyi şablon · 7 sağlam profesyonel ·
8 üst düzey ajans · 9 ödül kısa listesi · 10 dünyanın en iyisi.
**İlk render çoğunlukla 5–7 alır; şişirme.**

**4. Düzeltme listesi:** etkiye göre sıralı **5–10 madde**, her birinde
zaman kodu, gözlenen kusur, neden önemli ve **sayılı** nasıl (eğri, kare
sayısı, px, token, yerleşim değişikliği). Birkaç büyük yükseltme, çok sayıda
kılı kırk yarma değil. **En az biri wow'u yükseltir**, yalnız cilalamaz.

**5. Kritik işaretle:** jenerik ya da şablon görünen her şey, doğal olmayan
metin, yedek font ya da kutucuk (tofu), her şartname hatası.

**Revizyon** (yapan oturuma jüri raporu yapıştırılır): önce mevcut film ve
kaynak **sürüm N** olarak saklanır; her kritik ve yüksek etkili düzeltme
uygulanır (daha iyi bir çözüm seçilirse nedeni yazılır); **jürinin güçlü
dediği hiçbir şey geriletilmez**; tam çözünürlükte yeniden render, şartname
yeniden ölçülür, düzeltmeler gerçekten oturana kadar karelere bakılır;
uygulanan/atlanan her madde gerekçesiyle raporlanır. Sonra jüri yeniden
puanlar.

## Temaslar

Karakter ya da nesne varsa şeritte ve 4× kırpmada ayrıca bak
(ayrıntı: `karakter.md` § 5):

- [ ] Ayaklar yerde; basan ayak kaymıyor, zıplamada gölge küçülüyor
- [ ] Tutulan şey eli GERÇEKTEN tutuyor; elin yanında havada durmuyor
- [ ] Atılan şey ilk karesinde elde (`handAt`), oradan kavisle çıkıyor
- [ ] Yuvarlanan şey mesafe ÷ yarıçap kadar dönüyor

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

## Saha tuzakları — başkalarının ölçtükleri

awesome-opus5-5-videos'taki prompt'ların `<gotchas>` bloklarından, kendi
sözlerimizle; her prompt yaratıcısına aittir (handle ile anıldı).

| Belirti | Çare | Kaynak |
|---------|------|--------|
| Merkez dışındaki bir noktaya kamera zoom'u yana savrulup sıçrıyor | Kamerayı noktaya dalırma; noktayı AÇ (iç dünya dairesel maskeyle görünür) | @twoclipping |
| Kapanan iris ilk karelerinde zıplıyor | İrisi yarıçapa göre değil **alana** göre yumuşat: `r = R·√(ease(k))` | @twoclipping |
| Sönen kartlar bir anda beliriyor | `globalAlpha` değiştiren yardımcı çağıranınkini geri koysun (`save/restore` ya da çarparak) | @twoclipping |
| Sayaç rakamları bulaşık | Sayaç alt karenin değil **karenin** zamanını okur (`floor(t·fps)/fps`) | @twoclipping |
| Vuruşta bir diş dönen desen kekeliyor gibi | **Sürekli** döndür; her halkanın hızını son karede aynı desene oturacak seç | @twoclipping |
| Hızlı savurmada (whip) hayalet kopyalar | Hızlı planlarda **≥ 8 alt kare** (`--subframes=8`); 4 yetmez | @twoclipping |
| Biçim değiştiren şey geçişte sıçrıyor | Biçim değiştirme ayrıldığı sahnenin **aynı kamera dönüşümünün** içinde kalır | @twoclipping |
| Sel bitince bir kare yarım ekran değişiyor | Seli köşelerin ötesine taşır (≥ köşegen), ~0,3 sn sürsün; dolunca tam kare dikdörtgene geç | @twoclipping |
| Chromium'da `backdrop-filter: url()` yer değiştirme haritasını yanlış okuyor | Sahneyi klonla, süzgeci kopyaya uygula | @twoclipping |
| Video `<video>`da ileri sarılmıyor | `python -m http.server` aralık isteğini (Range) desteklemiyor; blob URL ya da aralık destekli sunucu | @twoclipping |
| Maske bütün kutuyu dolduruyor | Siluet ALFA kanalında olsun; kare kenarında kesilen uzuv düz kenar verir, maskeyi kadrajın dışına uzat | @twoclipping |
| Aynı öğeyi gösteren iki sahne arasında atlama | O sahnelere **ortak bir zoom fonksiyonu**; giden sahneyi geçişin altında çiz | @twoclipping |
| 3D kartın iki yüzü birden görünüyor | `preserve-3d` öğesine opaklık ya da süzgeç verme (düzleşir); wrapper'ı söndür | @raphaelaubryy |
| Eşleşen kesmede öğe kayıyor | Konumları **çalışma anında ölç** (`getBoundingClientRect`), elle yazma | @raphaelaubryy |
| İmleç hedefi ıskalıyor, sıçrıyor | İmleci hedefin **varacağı** yere nişanla; hız **< 65 px/kare** | @flxrnc |
| Döngü ekinde tekleme ya da çift kare | `[0, süre)` dışa aktar, son kare ilk kareyi tekrarlamaz; sesi de döngüle | @thegrootdev |
| Anlatıcı susunca film donuyor | Anlatıcının duraklamasında görüntü hareket etmeye devam eder; sayaç donarsa render bozuktur | @notdwd |

## Headless tarayıcı notları

- `el.screenshot()` çalışan CSS animasyonunu başa sarılmış karede çekebilir;
  yerleşimi hareketi azaltma taklidiyle çek, animasyonu sayıyla doğrula
  (`getAnimations()`), görüntüyle değil.
- Font yüklenmeden ölçülen yazı yanlış genişlikte: `document.fonts.load(...)`.
- `pkill -f "next dev"` gibi desenler script'in kendi kabuğunu da öldürebilir;
  sunucuyu PID dosyasıyla ya da `ss -ltnp | grep :PORT` ile durdur.
