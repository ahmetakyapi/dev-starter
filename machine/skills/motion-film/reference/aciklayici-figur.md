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
- **Hareketi azalt:** tur, akış ve nabız yok; hedeflere atla ama girdiye yine cevap ver.
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
  geri gelince geçen zamandan sürer; kaçırılan sesler çalmaz.
- Tuvalin alt payı altyazı bloğuna göre yeniden ölçüldü (149/150 px → pay 172/180).
