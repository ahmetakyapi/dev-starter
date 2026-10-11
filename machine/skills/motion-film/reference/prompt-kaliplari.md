# Prompt kalıpları — bir ajana film yaptırırken

prompt-motion.com ve awesome-opus5-5-videos'taki yüzlerce prompt'un iyi
çalışanlarının ortak yapısı. Kısa "showreel yap, sınırlarını zorla" prompt'u
da iş görür ama sonuç birbirine benzer; yapı vermek onu farklılaştırır.

## Yönlendirilmiş prompt — sekiz satır (önce bunu doldur)

Florence'ın "Opus 5.5 Motion Lab" deneyi: aynı model, aynı konu, aynı teknik
satır; yalnız yön değişince 3 sıfatlık prompt lacivert uzay, ışıyan halka,
bloom, parçacık ve uydurma slogan getirdi; 448 kelimelik yönlendirme bir
stüdyo filmi. Her satır modelin senin yerine vereceği bir kararı geri alır.

```
GOAL:    izleyicinin ne hissetmesi ya da yapması gerektiği, TEK cümle
OUTPUT:  tek HTML (ya da Remotion / bileşen), G × Y, motor ve sürümü sabit
TIME:    saniye × fps = toplam kare; döngü mü (evet/hayır); BPM varsa vuruş = fps·60/BPM
LOOK:    palet hex (ya da token adları), TEK vurgu, font + ağırlık + punto + harf aralığı
MOTION:  eğri cubic-bezier, yay sönüm oranı ζ, süreler KARE cinsinden (reference/sayilar.md)
SHOTS:   kare aralıkları; her planda TEK kahraman hareketi; plan nasıl devreder
         (vuruşta kesme / eşleşen kesme / maske silme — varsayılan kesme, geçiş bir karardır)
BANNED:  asla görmek istemediğin varsayılanlar, ADIYLA
QA:      adlı karelerde durağan kareler, temas sayfası, düzelt, SONRA tam render
```

GOAL önce: izleyicinin ne hissedeceğini tek cümleyle söyleyemiyorsan hiçbir
eğri kurtarmaz. Sonra TIME — her sayı kare sayısına asılır. 3D'de MODEL
(birim = 1 cm, ölçüler) ve CAMERA (görüş açısı, yörünge, itiş) satırları da.
**Değişmeyecek olanı da yaz:** karakterin oranı, logonun ölçüsü — tanınırlığı
koruyan korkuluk o satırdır.

### Yasak listesi (başlangıç)

- mor ya da mavi degrade, glow, lens parlaması
- süs olarak yüzen parçacıklar
- her şeyin aynı anda belirmesi
- **her öğede soluklaş-ve-yukarı-kay** (Anthropic'in frontend-design skill'i
  bunu "yapay zekâ üretimi gibi okunan" varsayılan diye anar)
- her şeyin ortalandığı yerleşim
- okunurken hareket eden yazı

**Liste canlıdır:** her ilk render'dan sonra modelin yine de kullandığını
adıyla ekle. "Jenerik yapay zekâ görünümünden kaçın" demek bir varsayılanı
başkasıyla değiştirir; adı konmuş desen yasaklanır.

### Hiyerarşi satırı (SHOTS'un içine)

Planda tek kahraman. İkinciller yolunun %50–70'i, 100–200 ms sonra. Ortam %5
altında, yavaş sinüs, hiç durmaz. Gerisi bekler ya da %40'a kısılır.

## İskelet (film tretmanı)

```
<girdiler>
  Konu, süre (10–40 sn), boyut (1920×1080 / sayfa içi kutu), dil,
  marka: palet token'ları, font, logo dosyası. Varsa gerçek veri.
</girdiler>
<yön>
  Tek cümle hikâye. Stil (örn. tek çizgi mürekkep, kâğıt zemin, tek vurgu rengi).
  Tek öğe hiç kesilmez; her sahne bir öncekinden biçim değiştirerek doğar.
  Kamera ölçek değiştirir (dalış, takip, geri çekiliş). Dev kinetik yazı.
  Her 1,5–2 sn yeni bir fikir. Son açılışla kafiyeli.
  Yasak: <projenin yasakları — glow, blur, mor degrade, jenerik push/slide…>
</yön>
<yapı>
  Perde perde, saniye saniye; her perdede olay ve okuma.
</yapı>
<yapım>
  1. Her stil t'den hesaplanır (seek(t)); timer, CSS transition, durum yok.
  2. Yaylar kapalı biçim (adım yanıtı); hedefi çok kez değişen değer, her
     değişim için bir yayın toplamı — yine t'nin saf fonksiyonu.
  3. Önce her vuruş için bir kare çiz; ızgaradan kayan, sıkışan, okunmayanı düzelt.
  4. Sonra temas sayfası + kritik anların şeridi; sonra tam çıktı.
</yapım>
<tuzaklar>
  Kameranın ölçeklediği şeye will-change verme (yazı bulanıklaşır).
  Biçim değiştiren kapta yer değiştiren yazının kendi giriş/çıkış zamanı olsun.
  Döngüyse son kare ilk kareyle (imleç konumu ve hızı dahil) birebir.
</tuzaklar>
<başlangıç>
  Önce girdileri sor, sonra kod yazmadan önce perde/vuruş listesini göster.
</başlangıç>
```

## Kısa sürüm (hızlı deneme)

```
<Konu> için <süre> sn'lik bir hareket filmi yap. Önce ~/dev-starter/machine/skills/motion-film/SKILL.md'yi oku.
Stil: <stil>. Marka token'ları: <...>. Önce tretmanı ve okumaları göster,
onaydan sonra render(t) sözleşmesiyle kur, temas sayfası ve şeritleri bana göster.
```

## İnceleme notları — his değil kare (kopyala-yapıştır)

Bir turda bir-iki tane; yedisini birden yapıştırmak düzeltmeyi yeniden yazıma çevirir.

```
0, 24, 48, 72 ve 96. karelerin durağanını çıkar. Her birini izleyicinin göreceği gibi tek cümleyle anlat. Plan listesiyle uyuşuyor mu? Uyuşmayanı düzelt.
Her 12. kareden temas sayfası yap. İki şeyin aynı anda hareket ettiği her kareyi işaretle, sonra hiyerarşiyi düzelt.
24–47. kareleri %25 opaklıkla soğan kabuğu yap. Aralık anahtar karelere yaklaşırken sıklaşmalı; sıklaşana dek eğriyi ayarla.
Kahramanın x konumunu ve ölçeğini kare kare grafik çiz (PNG). Hareketin doğrusal olduğu ya da ölü durduğu yeri göster, token'larımızla düzelt.
Kıdemli bir hareket tasarımcısı gibi incele: etkiye göre sıralı 10 not, her birinde kare numarası ve tam kod değişikliği. İlk 5'i uygula.
Fazla kalabalık. Hareketin %30'unu kaldır, yalnız gözü yönlendirenleri tut.
Son ani. %2 itişli 36 karelik bir bekleme ekle, sonra ζ 0,8'lik yayla otursun.
```

**Düzeltme tutmadıysa:** "84'teki düzeltme tutmadı. 83 ve 85. kareleri yan
yana PNG olarak çıkar, görebildiğin her farkı listele. Buna yol açan kod
satırını bul, yalnız onu düzelt, iki kareyi yeniden çıkar." İki görüntü
arasındaki farkı görmek modelin en güçlü olduğu iş.

**Notu yazarken kare iste:** yineleme sırasında köşede kare sayacı ve boşlukla
duraklatma (`film-page.html?counter`); son kayıttan önce kaldır.

## Belirti → yapıştırılacak düzeltme

| Belirti | Düzeltme |
|---------|----------|
| Titreme, kıpırtı | Her değer t'nin saf fonksiyonu. `Math.random` yerine tohumlu üreteç. Zamanlayıcı ve CSS transition yok. |
| Yanlış/yedek font | Fontu `display=block` ile yükle, ilk kareden önce `document.fonts.ready`. |
| Döngü ekinde tekleme | Yalnız 0..N−1 kareleri; döngüyü tam devirli `faz = kare / N` sürsün. |
| Ses vuruştan kayıyor | Her vuruş `n × 60 / BPM`, tek tek yuvarla; yuvarlanmış kareyi üst üste ekleme. |
| Takılma, düşen kare | Yalnız transform ve opaklık; genişlik/yükseklik/top/left yok. |
| GIF'te bantlaşma | Degrade yok; düz renk ya da paleti dither'la. |
| Bulanık/titreyen yazı | Duran yazıyı tam piksele oturt; 2× çiz, küçült. |
| Yazı okunmadan kıpırdıyor | Her yazı hâli kelime başına 0,3 sn + 0,5 sn beklesin. |
| Her şey aynı anda | Tek seferde tek kahraman; gerisi 150 ms sonra, yolunun %60'ı. |

**Düzeltme tutunca render sözleşmesine ekle.** Sözleşme laboratuvarın
belleğidir: her satırı bir daha görmeyeceğin bir hatadır.

## Fiş tut (receipts)

Takip prompt'larını say ve işle birlikte paylaş. Gerçekçi sayılar: kısa bir
döngü 4–15 yaratıcı takip, ses ayrıca 0–12. "Tek prompt" iddiası şüphe
uyandırır; üç prompt iyi bir sayıdır.

## Prompt seçerken

- awesome-opus5-5-videos `prompts/` ve `data/videos.json`: konu ve kategoriye
  göre ara (motion graphics, explainer, 3D, oyun); prompt'u kopyalayıp kendi
  konunla uyarla. Her prompt yaratıcısına aittir; özgün gönderiye bağlantı ver.
- lemo-opuscar `styles/<stil>/STYLE.md`: bir görünüm seçip konuyu kendin getir
  (43 stil + OPUSCAR 98'in 98 stil prompt'u). Stil dilbilgisini al, referans
  eserlerin karakter/melodi/çekimlerini alma.
- Prompt'ta projenin kurallarını tekrar etme; "projenin CLAUDE.md'sine uy" yeter.
