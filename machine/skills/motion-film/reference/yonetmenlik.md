# Yönetmenlik — hikâye, okumalar, ilkeler, geçişler

## 1. Tretman (kod yazmadan önce, `TREATMENT.md` ya da yorum bloğu)

```
Tek cümle:  <özne> <ister>, ama <engel>, böylece <sonuç>.
Dünya:      zemin, küçük palet, ışık; filmin boyunca renk yayı (soğuk → sıcak).
Motif:      tekrar eden ve sonda karşılığını bulan şey.
Yerli hamle: yalnız bu ortamın yapabildiği geçiş; duygusal tepede.
Perdeler:
  I   0,0–6,0   [giriş: düğmeden uçan damla]  ne görünür · OLAY · kamera
      okumalar: 0,0–0,6 damla iner (göz neredeyse orada)
                0,6–1,4 logo damgalanır, ad yazılır
                ...
  II  6,0–11,5  [geçiş: çizgi ortalamaya gevşer]  ...
  [çıkış: sel → zil → mühür]
```

Kontrol: her perdede olay var mı? Her okumanın süresi var mı, ikisi üst üste
biniyor mu? Her dikişte geçiş var mı? Son açılışla kafiyeli mi? Ekranda
gereksiz yazı var mı?

Üç yapı adayı yaz (tek yolculuk, önce/sonra, geri sayım, dönüşen liste…),
birini seç ve nedenini yaz. Akla ilk gelen, stilin klişesidir.

## 2. Zamanlama: izleyiciyi modelle

Sen kodu yazdın, ne olacağını biliyorsun; izleyici bir kez, tam hızda görür.

- **Okuma** = izleyicinin anlaması gereken tek şey. Her okumaya: gözün bulma
  süresi + anlama süresi + oturma payı. Küçük, uzak, hızlı, ince şeyler daha uzun.
- **Bir anda bir okuma.** Neden ve tepki sırayla, üst üste değil.
- **Hızlı hareket, yavaş anlam.** Hazırlıkla önceden haber verilmiş hareket
  çok hızlı olabilir; anlamı ise beklenmiş zaman ister. Ritim bu karşıtlıktan
  doğar; tek tempo (hızlı ya da yavaş) filmi düzleştirir.
- **Gözü yönlendir:** önemli okumadan önce göz oraya gitsin (kamera gider, o şey
  önce kıpırdar ya da parlar, bir karakter ona bakar).
- **Uzunluğu okumalar belirler.** Son okuma da oturacak kadar dursun.
- Yazı: animasyonu bittikten sonra ~(harf ÷ 15 + 1,5) sn ekranda; alt yazı ≥ 1,8 sn.
- Sayfa içi bekleme filminde perdeyi gerçek iş sırasına bağla ama süreyi
  okumalar belirlesin (Açılış Zili: 6 / 5,5 / 6,5 sn, sonra sonuca kadar dönen perde).

## 3. Animasyon ilkeleri (kodla hareketin mekanik durmaması için)

| İlke | Kodda |
|------|-------|
| Hazırlık | `backIn` (önce geri sonra ileri), dalıştan önce zoom −%4, kaymadan önce 8 px yaslanma |
| Squash & stretch | düşerken `squash` > 1 (uzar), değişte < 1, sonra `damped` ile toparlanır; hacim korunur (x/s, y·s) |
| Yavaş giriş/çıkış | düz `lerp` yok; ilerlemeyi `ease.inOut/out/in`den geçir |
| Ağırlık | ağır şey geç başlar geç durur, az sekip oturur; hafif şey sıçrar |
| Kavis | atılan damla ikinci derece Bézier (tepe noktası yukarıda) |
| Gecikme / takip | parçalar farklı anlarda; sarkaç: alt ucun x'i, kolun açısal hızının tersiyle kayar |
| İkizleme yok | iki kol, iki göz, iki kefe aynı açıda/aynı anda değil; faz ve tohum kaydır |
| Abartı | ince olan hiç okunmaz; tabakta fazla görünüyorsa geri çek |
| Düşünceyi göster | göz önce gider, sonra gövde |
| İkincil hareket | ana hareketi destekler, onunla yarışmaz |

**Eğri kuralı (ekosistem):** hedefini aşıp geri oturan eğri (`ease.back`,
yay) yalnız TEK KÜÇÜK öğede (damla, ok, mühür, sayaç rakamı). Panel, sayfa,
metin girişi taşmaz.

## 4. Geçiş grameri

| Geçiş | Ne anlatır | Nasıl |
|-------|-----------|-------|
| Biçim değiştirme (morph) | aynı şeyin başka hâli | iki nokta dizisi arasında `mix(a, b, ease.inOut(k))`; nokta sayısı eşit |
| Eşleşen kesme (match cut) | şekil/hareket kesmenin iki yanında aynı | DOM'daki düğme damlası → tuvaldeki damla (konumu ölç, filme ver) |
| Kamera taşıması | devamlılık | yakınlaşma bir sahnede başlar, öbüründe biter |
| Sel (ink flood) | sert açık/koyu dönüş | `film-kit.ts → inverted`; selin merkezi bir öğe (çizginin ucu), çekilince başka öğe (terazinin mili) |
| İris / şekilli iris | bir özneye kapanış | dünya → ekran fonksiyonuyla özneye nişan |
| Fırça silmesi | bölüm sonu | kalın darbeler kaplar (0 → 0,5), örtü altında kes, darbeler çekilir |

Kural: her dikişte bir geçiş; filmin girişi ve çıkışı da. Düz kesme yalnız
hareket üstünde ya da bilinçli şok kesme.

## 5. Kanca, kafiye, doruk

- **Kanca:** ilk 3 sn'de bir olay. Logo tek başına belirmez, bir olayın sonucu olarak gelir.
- **Kafiye:** açılış motifinin değişmiş dönüşü (halka → zilin halkası; logo damgası → sembollü mühür).
- **Doruktan önce durgunluk:** ≥ 0,3 sn her şey yavaşlar, kamera usulca iter; sonra doruk. Ses varsa gerçek sessizlik.
- **Tek yerli hamle doruğa:** dikkat dağılmasın.

## 6. Sık hatalar (ClaudeAnimationBase "common failures" + kendi deneyimimiz)

- Her şey aynı hızda, olaylar üst üste, bekleme yok
- Anlaşılmadan biten anlar; hiçbir şeyin olmadığı ölü saniyeler
- Mekanik hareket: düz `lerp`, her parça aynı anda, ikizleme
- Çekingen pozlar; okunmayan tepkiler
- Hareketsiz şeylerin her karede yeniden kaynaması (öğe başına tohum yok)
- Kesme her yerde; film birden başlayıp birden bitiyor
- Ekranda hikâyeyi tekrar eden yazı ("Kayboldum" levhası)
- Kamera hızlı nesneyi kaçırıyor; kadrajda boş kare (bkz. `kamera.md`)
- Künyeler birbirinin, düğmenin ya da çizginin üstünde (bkz. `inceleme-dongusu.md`)
