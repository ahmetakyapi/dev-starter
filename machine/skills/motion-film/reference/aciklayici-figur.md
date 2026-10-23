# Açıklayıcı figür — bir fikri bir makineyle anlatmak

Kaynak: [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT).
Meng To'nun "visual explainer" paylaşımındaki figür (Fig 1 · *One Image, Six
Layers*: bir görselin altı katmana ayrılması, altında 1 Split · 2 Parallax ·
3 Swap Subject · 4 Recolour · 5 Move Title çipleri, her sahnede kamera
yakınlaşır) bu skill'in çıktısı. Bu sayfa onun kurallarını bizim film
diline çeviriyor; Açılış Zili'nin bekleme filmi bunların üçünü aldı (canlı
künye, adlı perde çipleri, ekran dışında durma — 11 Ekim 2026).

**Ne zaman bu sayfa, ne zaman anatomy'nin kendisi?**

| İş | Kullan |
|----|--------|
| Bekleme / açılış filmi, tanıtım videosu, kinetik yazı | `motion-film` (bu skill) |
| Bir sistemin NASIL çalıştığını anlatan figür (blog, belge, ürün sayfası) | Bu sayfa + gerekirse anatomy |
| İzometrik, çok parçalı, gölgeli SVG makine; WebGL ateş/su/ışık; 3D dönen parça | anatomy skill'i (`machine/README.md` → kurulum) |

Şablondan doğan bir Next projesinde anatomy figürü: önce
`node ~/dev-starter/scripts/add-figure-kit.mjs <proje>` (kit `components/iso/`,
CSS importları, font köprüsü). Şablon hazır gelir: `<html class="iso">` tema
geçişini kite taşır, figür dizinleri için ESLint ayarı var (`mistakes.md #98`).
Figür `components/figures/<ad>/` altına.

## 1. Nesne açıklamanın kendisidir

Kutu, ok ve etiket çizme. Kavramın çalışması **gerçek, iyi yapılmış bir
fiziksel şeyin** çalışması olsun; okuyucu makineyi tanıdığı için fikri anlar.

| Kavram | Nesne |
|--------|-------|
| Bir önbellek anahtarı değişmediyse işi atlar | Pimli kilit: bütün pimler oturunca silindir döner, hiçbir şey yeniden çizilmez |
| Yedi render hedefi, farklı bayt/teksel | Yedi çekmeceli dolap; her çekmecenin derinliği baytı kadar |
| Ayrılabilir bulanıklık (49×49 yerine 49+49) | Çivi damgası yanında rayda iki tarak |
| Bir hisseyi sınayan kural seti | Ölçü tezgâhı: her kural bir mastar, geçen yeşil yanar |
| Analiz: kanıtı tartmak | Terazi (Açılış Zili filminin IV. perdesi) |

İki başarısızlık, ikisi de görüldü: **fazla soyut** (yüzen levhalar,
etiketli kutular hiçbir şey olarak okunmaz) ve **fazla düz** (birkaç çizgili
tek büyük levha: hacim yok, keşfedilecek parça yok). Çaresi aynı: tanınan
bir makine, çok sayıda küçük, kesin, işlevli parçadan.

**1× ve 4× kuralı.** 1×'te tek, net bir makine okunur. 4×'te her bölgede
hâlâ bulunacak doğru bir şey vardır; çıplak bir yüz ya da boş bir köşe
"sakinlik" değil, bitmemiş iştir. Ayrıntı yapıdan gelir (ayak, ray, durdurucu,
burç, topuz), dokudan değil.

## 2. Önce boyutla

İşe başlamadan söyle, ilk saatte tarayıcıda açılan bir sayfa olsun:

- **Figür** — tek mekanizma, 40–80 parça; 30–90 dk. Sormadan yap.
- **Kahraman (Hero)** — yoğun nesne, 80–150 parça; 2–4 saat. Söyle, sonra yap.
- **Destan (Epic)** — bütün bir araç/bina/tesis; 6 saat+. Başlama: tahmini ver, özü koruyan bir Kahraman öner.

## 3. Doğru önce gelir

Gerçek sayıları ve davranışı topla (boyut, adet, eşik, eğri) ve **küçük saf
bir modül** yaz (`rig.ts`, `model.mjs`). Hareket, künye, açıklama yazısı ve
erişilebilir değer hep o modülden okur. Filmde de aynı: Açılış Zili'nin
künyesindeki "60 Seans · Son Kapanış 124,77 $" tuvaldeki mumların AYNISIDIR.

### Kanıt ve veri dürüstlüğü

Gerçek bir şey söyleyen film ya da figür (istatistik, tarih, ürün iddiası)
proje klasöründe bir **`FACTS.md`** tutar ve onunla teslim edilir
(kaynak: lemo-opuscar `TECHNIQUE.md` § 11, `styles/data-physical/STYLE.md`,
`styles/archive-lighttable/demo/FACTS.md`, MIT):

```
| # | Ekrandaki sayı / söylenen iddia | Kaynak (URL, veri seti, sürüm, erişim tarihi) | Alıntı (kaynağın kendi sözü ya da satırı) | Türetme |
|---|------|------|------|------|
| F1 | anlatıcı: "En uzunu 57 saniye." | <telgrafın arşiv URL'si> | "longest 57 seconds" | doğrudan |
| F2 | künye "852 ft · 59 sn" | <katalog kaydının URL'si> | "852 feet covered in 59 seconds" | doğrudan |
| F3 | karar: "2 sn eksik" | F1, F2 | — | 59 − 57; nedeni çıkarılmadı |
```

- **Her** ekrandaki sayı, tarih, ad ve söylenen iddia bir satırdır. Türetilmiş
  değer (oran, fark, parça başına birim) nasıl hesaplandığını yazar.
- **Kaynak satırı veriyle birlikte kadrajda** durur (küçük, ~%60 mürekkep,
  altyazıdan uzak bir köşede): ilk okumadan özete kadar. Yalnız jenerikte değil.
- **Sayaç zamana göre değil, inen nesneye göre döner.** Ekranda 37 parça
  oturduysa sayaç 37 der; zamanla dolan sayaç parçalar gecikince yalan söyler.
- **Yuvarlama yakın iki değerin sırasını değiştirebilir.** İki değer bir
  birim içindeyse bunu ekranda söyle ya da daha ince birim seç.
- **Örnekleme, ölçüm değil:** gösterim için yapılan her şey (perspektif
  ölçeği, sayaç animasyonu, nesnenin kaydırılması) `FACTS.md`'de "örnekleme"
  başlığı altında yazılır, gerekiyorsa ekranda "(örnekleme)" etiketi.
- **Lisans:** CC0, kamu malı ve CC BY bir künyeyle olur. **ODbL, CC BY-SA,
  "bilinen kısıtlama yok" ve "ticari olmayan kullanım"** CC0 değildir:
  koşullarını (atıf, aynı lisansla paylaşım) kullanıcıya söyle ve **sor**.
- **Kullanıcının kendi sayıları** (ciro, rapor, satış): iste, geldiği belgeyi
  de iste. **Asla uydurma**, daha iyi hikâye için yuvarlama; üretilmiş
  görsel gerçek verinin yerine geçmez. Sayı yoksa yer tutucu ekranda yer
  tutucu olarak görünür ("— $").

## 4. Figür kartının anatomisi

Figür bir kartın içinde durur; dört köşe sabit görevlidir:

```
┌─────────────────────────────────────────────┐
│ Fig 1                    One Image, Six Layers│  ← sol üst: numara · sağ üst: kısa başlık
│                                               │
│               (makine, kartın %55–65'i)       │
│                                               │
│ Sürükle ← →            camera +8.7 · layer 7.9×│  ← sol alt: etkileşim ipucu · sağ alt: CANLI KÜNYE
└─────────────────────────────────────────────┘
  ① Split  ② Parallax  ③ Swap Subject  ④ Recolour  ⑤ Move Title   ← sahne çipleri
  Lejant ve DOĞRU açıklama yazısı kartın altında; çizimde yazı yok (en fazla tek oyma etiket).
```

- **Canlı künye (readout):** kısa, gerçek birimli, modelden: `block 2 · reads 14.0 px`.
  Parçaların BULUNDUĞU yerden okunur, hedeften değil. Evre sözcüğü ile yanındaki
  sayı AYNI anın AYNI kaynağından gelir: "stroke sonu · 85 bar" diyen tezgâhta
  sözcük modelden, sayı 0,25 sn geriden gelen bir ibreden geliyordu.
- **Bilmediğin şeyin ilerlemesini uydurma.** Claude'un ne kadar süreceğini
  bilmiyoruz; ne kadar geçtiğini biliyoruz. Künye "Geçen 00:21" der, "%60" demez.
- **Sahne çipleri:** her sahnenin adı, etkini belli, gerçek süreyle dolan
  çizgi. Dar ekranda yalnız numara. Kamera her sahnede anlatılan şeye
  yaklaşır ("scene 1–5 için kamerayı değiştir ki daha net anlatsın").

## 5. Hareket

`assets/figure-kit.ts` bunların hepsini taşır.

- **Zamana bağlı, dt kırpılmış** (1/30 sn): arka plandaki sekme dönünce sıçramaz.
- **Hedefe yumuşak:** imleç/klavye HEDEF koyar, parça izler (üstel takip τ 0,1–0,3 sn
  ya da gerçek yay, 240 Hz alt adım). Parça imlece asla yapışmaz.
- **Aşmaması gereken değer** (renk, parlaklık, frekans) kritik sönümlü `settle` ile;
  bir evrede rengi, şekli, parlaklığı birlikte sıçratan tek hızlı yay yerine rengi
  kendi yavaş yayına ver.
- **Tek seferlik olay bir zarftır** (`burst(yaş, atak, sönüm)`): değer değil yaş
  saklanır, üst üste binen olaylar toplanır, bir karede 1'e çıkmak "pop"tur.
- **Ekran dışında ve yerleşince DUR.** `IntersectionObserver` (kenar payı 120px) ve
  **son kayıt** okunur: ekrandan çıkıp dönen öğe tek çağrıda iki kayıt getirir,
  ilkini okuyan figür ekrandayken donar.
- **Boşta tur:** kimse dokunmazken 1,4 sn sonra başlar, dokunuş/odak/basışta durur,
  son etkileşimden 3,6 sn sonra döner; kullanıcının koyacağı hedefleri sürer.
  Turun ortasında basılan adım tuşu turun hedefinden değil görünen değerden adımlar.
- **Oynatma — değer ışınlanmaz** (`carryLeg`, `walkLeg`, `planAt`, `crossings`):
  "şunu göster" diyen düğme değeri hedefe KOYMAZ, bir plan başlatır. Plan
  bacaklardan oluşur: önce olaysız bir **taşıma** (başlangıca, kısa yoldan, 0,6–1,4
  sn), sonra olaylı bir **yürüyüş** (anlatılan süreç, 2–6,5 sn). Başlangıç anlatılan
  olayın biraz önünde seçilir ki olay yürüyüşün ortasında yaşansın. Olay, değer bir
  işaretin üstünden İLERİ geçince tetiklenir; taşıma ve geri sarma olay üretmez.
  Bitince birkaç saniye beklenir, tek taşımayla "şimdi"ye dönülür. Üst bilgi hedefi
  değil değeri izler. Ayrıntı ve ölçüler § 9 → Seans Zili, üçüncü sürüm.
- **Hareketi azalt:** tur, akış, nabız ve yürüyüş yok; hedeflere atla ama girdiye
  yine cevap ver (oynatılan olay bildirimle yine söylenir).
- **Ses:** kaçırılan olaylar dönüşte üst üste çalmaz (`cueWindow`).

## 6. Erişilebilirlik

- Kök odaklanabilir; sürekli denetimde `role="slider"`, ayrık seçimde `role="group"` + düğmeler.
- `aria-valuetext` yalnız okuyucunun SEÇİMİ değişince yazılır, döngüden değil:
  odaktaki kaydırıcının değeri her karede değişirse ekran okuyucu durmadan sayı okur.
- Görsel künye ile erişilebilir değer AYRI. Canlı bölge (`aria-live="polite"`)
  yalnız evreleri söyler, girdi 700 ms durulunca (`quietAnnouncer`); yüklemede boş
  başlar, odakta güncel durumu yazar.
- Klavye: oklar birim, Shift büyük adım, Home/End uçlar, Space/Enter bas/çevir, Esc bırak.

## 7. Çizim zanaatı (SVG figürde; tuval filmde de geçerli olanlar)

- **Çizgiler bir şeyde biter:** bir yüzde, başka bir çizgide ya da uç noktasında.
  Havada biten bağlantı, yüzeyin ortasında duran doku = kırık görünür. Bitmesi
  gereken doku SÖNER (`fade`), kesilmez.
- **Katı, tel kafes değil:** her parça kâğıt rengiyle dolu, ressam sırasıyla
  (arkadan öne, alttan üste) boyanır; kesik gizli kenar yok.
- **Ton hiyerarşisi:** taban `lo`, yapı `mid`, özne `hi`, okuyucunun izlemesi
  gereken TEK parça `lit`. Renk yalnız renk konunun kendisiyse.
- **Yazı çizimde değil:** lejant ve açıklama kartın altında; ok, balon, ölçü oku yok.
- **Hacim:** gerçek kalınlık, dört tonlu yanlar, açık üst, altında yumuşak hale.
- **Kadraj:** nesne kartın %55–65'i, 390 px'te hâlâ okunur.

## 8. İnceleme — eleştirmen gibi

Sahibi kusuru yakınlaştırarak bulur; önce sen yakınlaştır.

- Masaüstü + telefon (390), hover ve hareketin birkaç anı: `scripts/film-sheet.mjs`.
- Her bağlantının, her doku bitişinin **4× yakın çekimi**, iki temada.
- Geçişleri `slow 0.05` ile temas sayfasında izle: hiçbir şey pop yapmaz, renk sıçramaz.
- Kendi PNG'ni örneklerin yanına koy ve sor: bir bakışta gerçek bir nesne mi,
  küçük parçalarla zengin mi, her çizgi bir şeyde bitiyor mu? Evet olana kadar yinele.

## 9. Açılış Zili'nde uygulananlar (11 Ekim 2026)

`components/ai/AnalysisFilm.tsx`:

- **Canlı künye** sağ altta (telefonda altyazının altında), tuvali çizen veriden:
  I `60 Seans · Son Kapanış 124,77 $`, II `RSI 72,8 · 20 Günlük 119,31 $`,
  III `5 Manşet`, IV `Geçen 00:21`. Ekran okuyucuya okunmaz (`aria-hidden`).
- **Adlı perde çipleri** ilerleme çizgisinin üstünde; telefonda yalnız I–IV.
- **Ekran dışında durur** (en yeni kayıt kuralı; ölçüldü: aşağı kaydırınca 0 çizim/sn),
  geri gelince geçen zamandan sürer. (Ses 12 Ekim'de filmden tamamen kalktı;
  `cueWindow` maddesi orada artık geçersiz.)
- Tuvalin alt payı altyazı bloğuna göre yeniden ölçüldü (149/150 px → pay 172/180).

12 Ekim ekleri: `components/motion/PlayOnView.tsx` (sunucu son kareyi basar,
figür ekranın altındaysa görününce bir kez oynar) ve onu kullanan
`hisse/[symbol]/_panels/ExpectedMoveFigure.tsx` (beklenen hareket bandı +
geçmiş raporlar, sekiz satırlık yönlendirme bileşenin başında).

**Denetimde bulunan iki sapma, aynı gün düzeltildi ve yayında** (`35b50f0`):

- IV. perdenin çipi 5 sn'de dolup tam kalıyordu, oysa IV Claude bitene kadar
  sürüyor; dolu çizgi "bitti" diye okunur. Artık açık uçlu: çizgide gidip
  gelen kısa bir parça, süre künyedeki "Geçen"de.
- Hareketi azaltılmış yolda dura kare ekran dışında da 500 ms'de bir
  çiziliyordu; artık görünmezken tuvale dokunmuyor.

Aynı gün anatomy kitinin kendisiyle iki figür (12 Ekim yayında, `9346152`, `2435ed4`):

- **Kural Tezgâhı** (`components/figures/rule-bench`, hisse seçimi raporu):
  hisse bir iş parçası olarak yedi istasyondan geçer, her kural bir lamba.
  Ölçümle bulunan iki hata: kol sırt çizgisi vidaya 1,8 px kala bitiyordu
  (lines.mjs), imleç yalnız yatay mesafeye bakıp komşu istasyonu seçiyordu
  (izometride gövde ile yoklayıcı farklı x'te; ekranda 2B en yakın).
- **Seans Zili** (`components/figures/session-bell`, ana sayfa): 24 saatlik
  kadran, asıl seansın uçlarında kontak, bobin ve dövücü, `lathe.mjs` ile
  döndürülmüş çan. Bulunanlar: canlıda 0,02°lik ibre hareketi için ~40
  karelik takip döngüsü (doğrudan yerine koy, döngüyü yalnız olayda uyandır);
  arka ayağın vidaları ön katmanda çizilip çanın üstüne biniyordu (3× bakış);
  sivri karşı ağırlık ok ucu gibi okunup ibreyi ters gösteriyordu.

İkisinde de sunucu son pozu/canlı anı basıyor, ekran dışında 0 çizim,
hareketi azaltana tur yok. Kurulum `scripts/add-figure-kit.mjs` (`--lathe`).

### Seans Zili, üçüncü sürüm: "Günü Oynat" (12 Ekim, `3f12a99`)

Sahibinin itirazı: "tıkladığı gibi değişmesin, smooth olsun; zil çalmak ne işe
yarıyor anlamadım". İkinci sürümde seans düğmesi ibreyi seansa ışınlıyor, "Zili
Çal" düğmesi bağlamsız tek vuruş yapıyordu. Zilin ne zaman ve neden çaldığı
anlaşılmıyordu. Çözüm, zili bir süs düğmesi olmaktan çıkarıp saatin SONUCU yapmak:

| Etkileşim | Plan | Sonuç |
|---|---|---|
| İlk görünüş | İbre 00:00'dan şimdiye 3,2 sn (ease-in-out-quart) | Yolda açılış ya da kapanışı geçerse zil çalar |
| Seans kartı | Taşıma: seans başı − 20 dk (zilsiz) → yürüyüş: seans boyunca | Açılış ve kapanış zili yolda, sırayla |
| Günü Oynat | Taşıma: ön seans − 20 dk → yürüyüş: akşam seansının sonuna (≤ 6,5 sn) | İki zil sırayla; düğmenin zemini ilerlemeyle dolar |
| Kadranda gezinme | Üstel takip (τ 0,22 sn), 15 dk çentik | 6 sn hareketsizlikte şimdiye döner |
| Oynatma bitti | 4 sn bekle → tek taşıma bacağıyla şimdiye | Geri dönüş zilsiz |
| Canlı saat | 5 sn'de bir doğrudan yerine koy, döngü uyur | Gerçek açılış/kapanış anında döngü uyanır, zil çalar |

Kurallar (`figure-kit.ts` → `carryLeg`, `walkLeg`, `planAt`, `crossings`):

- **Taşıma kübik, yürüyüş sinüs.** Taşıma çabuk varsın; yürüyüş uçlarda yumuşak,
  ortada düz hızda olsun ki süreç okunur. 24 saatlik kadranda taşıma KISA yoldan
  gider (gece yarısını geçebilir); sonraki bacak aynı tur değerinden devam eder.
- **Olay = ileri geçiş.** Her karede `crossings(önceki, şimdiki, işaretler, 1440)`:
  kare atlasa da zil kaçmaz, geri sarmak açılışı yeniden yaşatmaz, taşıma
  bacağında hiç sorulmaz (`planAt(...).events`).
- **Görünen her şey İBREYİ izler**: seans rozeti, iki saat, çizelgedeki "şimdi" imi,
  düğmenin ilerleme zemini. Hedefi gösteren üst bilgi, ibre daha yoldayken
  "16:30" yazar ve hareket boşa düşer.
- **Zil anı söylenir**: sahnede 2,4 sn "Açılış Zili · 16:30 TR" bildirimi, çizelgedeki
  zil imi pirince döner. Bildirimde yalnız birincil saat (iki saat iki satıra taşıyordu).
- **Hareketi azaltana** tekrar, yürüyüş ve canlı döngü yok; kart ibreyi doğrudan
  seansın başına koyar, bildirim yine çıkar.

Testler (Açılış Zili `tests/session-bell.test.ts`): bacak ucunda tam hedef,
gece yarısında kısa yol, seans oynatmasında iki zil, taşımada zil yok, günde iki
zil, tatilde plan yok. Ölçüm: 390 ve 1280 genişlik, iki tema, oynatmanın ortasında
kare; yatay taşma ve konsol hatası yok.
