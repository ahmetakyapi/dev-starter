# Tasarım Yönü Kataloğu

> Her yeni proje farklı görünür. Palet, hero, uygulama kabuğu, kart ve popup
> dili projenin işine göre SEÇİLİR; "geçen projedeki gibi" bir gerekçe değildir.
> Seçim akışı: `/kickoff` üç yön adayı sunar → kullanıcı seçer → `docs/DESIGN.md`
> frontmatter'ına `direction:` yazılır → `knowledge/direction-log.md`'ye kayıt düşer.
> Yardımcı araç: `npm run direction -- --help` (`scripts/pick-direction.mjs`).

**Bu dosyanın sözleşmesi:** her yön `### \`kimlik\` — Ad` başlığıyla açılır ve
`Etiket` satırı taşır; `pick-direction.mjs` ve health-check bu iki şeyi okur.
Yeni yön eklerken `Etiket` satırını ve aşağıdaki sabit alanları (Palet, Yazı,
Biçim, Hero, Kabuk, Kart, Popup, Grafik, Boş Durum, Hareket, Yasak) eksiksiz yaz.

---

## Temel Kurallar

1. **Aynı görünüm yasağı.** Son beş projenin yönü yeni projede ÖNERİLMEZ
   (`direction-log.md`). Aynı yöne dönmek için yazılı gerekçe gerekir
   ("marka zaten bu", "müşteri istedi").
2. **Varsayılan yoktur.** "Mavi palet + showcase hero + sol menü" kendiliğinden
   seçilmez; her alan (`hero`, `shell`, `card`, `popup`, `density`, `motion`)
   yönün tablosundan, ürünün işine bakılarak seçilir.
3. **Yön bir yasak listesidir de.** Yönün Yasak satırı o proje için bağlayıcıdır;
   `design-reviewer` ekranı bu satıra göre de denetler.
4. **Token disiplini yönden bağımsızdır.** Hardcoded renk, `dark:` ve keyfi
   punto her yönde yasak (`rules/design-tokens.md`). Yön, token DEĞERLERİNİ
   ve bileşen SEÇİMİNİ belirler; kuralları gevşetmez.
5. **Başlıklarda ve hero metinlerinde virgül yok.** `h1` ve `h2` ile hero
   başlığı tek, kesintisiz bir ifadedir ("Tek Kimlik On Palet", "Sakin ve
   Düzenli Destek"). Virgül başlığı ikiye böler ve makale başlığı gibi okutur.
   İki fikir gerekiyorsa iki tonlu başlık (`tone-text`: iki parça) ya da
   başlık + açıklama kullan. Denetim: `slop-scan.sh` "Başlıklarda virgül".

---

## Yönler

### `editoryal` — Editoryal ve Dergi

- **Etiket:** sektor=kultur,medya,ajans,yayin,egitim · kitle=genel,okur · yogunluk=dusuk · ton=zarif,ciddi · tema=acik · tur=landing,icerik
- **Ne zaman:** Yazı, fotoğraf ya da fikir ürünün kendisiyse (blog, bülten, kültür kurumu, ajans, portfolyo). Okuyucu yavaşlar, tarar, okur.
- **Palet:** `signature` açık; sıcak bej yüzey; vurgu seyrek (tek bağlantı rengi).
- **Yazı:** `editorial` (Instrument Serif başlık + Instrument Sans) ya da `longform` (Newsreader gövde). Başlık yalnız büyük puntoda.
- **Biçim:** yarıçap 0.25-0.5rem, gölge yok, kıl çizgi; yoğunluk düşük; geniş yazı sütunu (60-70 karakter).
- **Hero:** `editorial-split` (metin + görsel) ya da `corner` (koyu sahne, sol altta dev başlık); alternatif `statement`.
- **Kabuk:** ince üst çubuk + içerik sütunu; uzun sayfada `toc-nav`; yan menü yok.
- **Kart:** kartsız; kıl çizgiyle ayrılmış liste, büyük küçük resimli `story-card`.
- **Popup:** nadir; arama için `command-palette`, paylaşım için `sheet`; modal yok denecek kadar az.
- **Grafik:** çizgi ve dar çubuk; etiketler mono; renk tek.
- **Boş Durum:** tipografik (alıntı ya da tek cümle), illüstrasyon yok.
- **Hareket:** yavaş `reveal`; paralaks yok; `tone-text` solan başlık.
- **Yasak:** cam yüzey, degrade metin, rozet yığını, ikon karesi, emoji.

### `kurumsal-guven` — Kurumsal ve Güven

- **Etiket:** sektor=kamu,enerji,sigorta,hukuk,saglik-b2b,uretim,altyapi · kitle=kurumsal,uzman · yogunluk=orta · ton=ciddi,sakin · tema=acik · tur=uygulama,landing
- **Ne zaman:** Karar vericinin güveneceği, denetlenebilir iş. Kamu, enerji, sigorta, hukuk, B2B hizmet. Süs yerine netlik ve doğrulanabilir sayı.
- **Palet:** `signature` açık (lacivert/mavi) ya da `verdant`; durum renkleri ayrı ve tutarlı.
- **Yazı:** `signature` (Schibsted Grotesk + Plex Mono) ya da `calm`.
- **Biçim:** yarıçap 0.5rem, düşük gölge, görünür kenarlık; yoğunluk orta.
- **Hero:** `editorial-split` ya da `product-frame`; ekranda `trust-line` ve doğrulanabilir bir sayı.
- **Kabuk:** sol menü (`app-shell`) + üst özet şeridi; breadcrumb zorunlu.
- **Kart:** çerçeveli, başlıklı; kart içinde kart yok; ölçü şeridi için `stat-strip`.
- **Popup:** onaylar `dialog` + `confirm`; ayrıntı `sheet` (sağdan).
- **Grafik:** sütun ve çizgi, eşik çizgisi, yıllık karşılaştırma; renk anlamlı (iyi/kötü).
- **Boş Durum:** düz metin + tek eylem; "ilk kaydı oluştur".
- **Hareket:** sönük; yalnız durum geçişleri; hareket azaltmaya tam saygı.
- **Yasak:** neon, oyuncul mikro metin, süzülen kartlar, aşırı yuvarlak köşe.

### `veri-yogun` — Veri Yoğun Operasyon

- **Etiket:** sektor=lojistik,enerji,operasyon,ic-arac,uretim,perakende-b2b · kitle=uzman,kurumsal · yogunluk=yuksek · ton=ciddi · tema=acik,koyu · tur=uygulama
- **Ne zaman:** Aynı kişi günde yüzlerce satıra bakıyorsa: iş emri, tahsilat, stok, çağrı merkezi, dağıtım panosu. Hız ve tarama kolaylığı önce gelir.
- **Palet:** `signature` ya da `iris`; nötr ağırlıklı, durum renkleri belirgin; açık ve koyu eşit titizlikte.
- **Yazı:** `dense` (Archivo benzeri tablo rakamları) ya da `board`; `tabular-nums` zorunlu.
- **Biçim:** yarıçap 0.375rem, kıl çizgi, yoğunluk yüksek (satır 32-36 px).
- **Hero:** web sitesinde `live-data` ya da `horizon` (canlı pano); uygulama içinde hero yok, ölçü şeridi var.
- **Kabuk:** sol menü + `command-palette` (⌘K) + genel arama; sekmeli çalışma alanı; breadcrumb.
- **Kart:** kart az; bölümler kıl çizgiyle ayrılır; tablo ana yüzeydir (`data-table`, `saved-views`, `active-filters`).
- **Popup:** sağdan `sheet` (ayrıntı + düzenleme), toplu işlem `selection-bar`; modal yalnız yıkıcı onayda.
- **Grafik:** `sparkline`, `track-bar-chart`, `stacked-bar-chart`; eksen etiketli; süs yok.
- **Boş Durum:** tek satır + filtre temizle.
- **Hareket:** neredeyse yok; 120-160 ms geçişler.
- **Yasak:** dev hero, büyük boşluk, her satırda rozet, süs ikonları, yavaş giriş animasyonu.

### `sicak-butik` — Sıcak ve Butik

- **Etiket:** sektor=yemek,atolye,hizmet,kisisel,perakende,etkinlik · kitle=tuketici,genel · yogunluk=dusuk · ton=sicak,samimi · tema=acik · tur=landing,uygulama
- **Ne zaman:** Küçük işletme, atölye, kafe, kişisel hizmet: insan sesi ve güven duygusu; ürün gerçek bir yerde, gerçek bir kişi.
- **Palet:** `ember` açık (kehribar); sıcak krem zemin.
- **Yazı:** `friendly` (Onest/Jakarta) ya da `studio`; `handFont` yalnız tek bir not için.
- **Biçim:** yarıçap 1rem, yumuşak gölge, dolgulu yüzey; yoğunluk düşük; büyük dokunma hedefi.
- **Hero:** `floating` (süzülen kartlar) ya da `atmosphere`; yüz ya da ürün fotoğrafı öne.
- **Kabuk:** mobilde alt `dock`/sekme, masaüstünde üst çubuk; menü kısa (5 öğe).
- **Kart:** dolgulu, yumuşak; `story-card` ve `category-card`.
- **Popup:** alttan `sheet`; küçük, tek amaçlı.
- **Grafik:** `ring-chart` ve `activity-rings`; sayı yerine anlatım.
- **Boş Durum:** `corner-mascot` ya da `hand-callout`; sıcak tek cümle.
- **Hareket:** yaylı, kısa; `reveal` hafif.
- **Yasak:** soğuk gri paneller, terminal estetiği, mikro tablolar.

### `teknik-gelistirici` — Teknik ve Geliştirici

- **Etiket:** sektor=yazilim,yapay-zeka,api,gelistirici-araci,veri · kitle=gelistirici,teknik · yogunluk=orta,yuksek · ton=cesur,ciddi · tema=koyu · tur=landing,uygulama
- **Ne zaman:** Ürünü kod ve komut anlatıyorsa: API, geliştirici aracı, yapay zeka ürünü. Kitle ekran görüntüsünü ve çalışan örneği ister.
- **Palet:** `iris` koyu (mor-indigo); parlak vurgu tek.
- **Yazı:** `technical` ya da `product` (Geist + Geist Mono); kod bloğu birinci sınıf.
- **Biçim:** yarıçap 0.5rem, 1 px kenarlık, ince parlama (`border-beam` seyrek); yoğunluk orta-yüksek.
- **Hero:** `product-frame`, `scroll-stage` ya da `bento`; yanında çalışan `terminal` ve kopyalanabilir kurulum komutu.
- **Kabuk:** komut merkezli: dar ray + `command-palette`; belge sayfasında `toc-nav`.
- **Kart:** çerçeveli, mono etiketli; `integration-card`, `code-block`.
- **Popup:** `command-palette` birinci; ayrıntı `sheet`; modal az.
- **Grafik:** `line-chart`, `heatmap`, `sankey-chart`; mono eksen.
- **Boş Durum:** örnek komut ve kopyala düğmesi.
- **Hareket:** `stream-text`, `text-shimmer`, `scramble-text` ölçülü; ışıma sürekli değil.
- **Yasak:** pastel dolgu, el yazısı, mascot, stok illüstrasyon.

### `oyuncul-canli` — Oyuncul ve Canlı

- **Etiket:** sektor=oyun,topluluk,etkinlik,cocuk,genclik,eglence · kitle=tuketici,genc · yogunluk=orta · ton=enerjik,cesur · tema=koyu · tur=uygulama,landing
- **Ne zaman:** Eğlence ve topluluk ürünü; kullanıcı ödül, ilerleme, anlık geri bildirim bekler.
- **Palet:** `ember` koyu; canlı ikinci renk yalnız ilerleme ve ödülde.
- **Yazı:** `playful` (Onest benzeri yuvarlak); büyük, kalın sayılar (en çok 800).
- **Biçim:** yarıçap pill/1.25rem, dolgulu renkli yüzeyler, yumuşak parlama; yoğunluk orta.
- **Hero:** `floating` ya da `showcase`; hareketli ürün sahnesi, oyun içi ekran.
- **Kabuk:** alt sekme/`dock`; tek elle kullanım; üstte ilerleme şeridi.
- **Kart:** renkli dolgu, sticker benzeri; `option-cards`, `choice-chips`.
- **Popup:** yarım ekran `sheet`; ödül ve seviye için küçük `dialog`.
- **Grafik:** `activity-rings`, `meter`, `tick-meter`; ilerleme çubukları.
- **Boş Durum:** `corner-mascot`; cesaretlendirici tek cümle (sahte aciliyet yok).
- **Hareket:** yaylı, belirgin; `digit-roll`, `reactions`; her zaman `prefers-reduced-motion` yedeği.
- **Yasak:** kurumsal gri, uzun tablo, sahte kıtlık ve sayaç.

### `luks-minimal` — Lüks ve Minimal

- **Etiket:** sektor=mimari,mucevher,moda,premium-hizmet,portfolyo,otel · kitle=genel,premium · yogunluk=dusuk · ton=zarif,sakin · tema=koyu,acik · tur=landing
- **Ne zaman:** Az şey söyleyip değerli göstermek gerekiyorsa: boşluk lükstür; her öğe hak ederek yer tutar.
- **Palet:** `signature` koyu ya da sıcak nötr açık; tek ince vurgu; renk yok denecek kadar az.
- **Yazı:** `editorial` (serif başlık, büyük punto, açık satır aralığı).
- **Biçim:** yarıçap 0-0.25rem, kenarlık ve gölge yok; yoğunluk çok düşük; geniş kenar boşluğu.
- **Hero:** `minimal` ya da `atmosphere` (tam genişlik görsel zemin) ya da `horizon`.
- **Kabuk:** gizli menü: `morph-nav` ya da tek satır üst çubuk; ekran başına tek fikir.
- **Kart:** kartsız; görsel + tek satır; boşlukla grupla.
- **Popup:** tam ekran katman; küçük modal yok.
- **Grafik:** yok ya da tek çizgi.
- **Boş Durum:** boşluk; metin yok.
- **Hareket:** çok yavaş, az; `blur-in`, `dissolve`.
- **Yasak:** rozet, ikon, gölge, ikinci vurgu rengi, sayaç, kalabalık gezinme.

### `brutalist-net` — Brutalist ve Net

- **Etiket:** sektor=ajans,sanat,manifesto,indie,medya,kultur · kitle=genel,yaratici · yogunluk=orta · ton=cesur,sert · tema=acik · tur=landing
- **Ne zaman:** Kimliğin kendisi ses çıkarıyorsa: ajans, sanat, manifesto, bağımsız ürün. Çıplak yapı ve net hiyerarşi estetiktir.
- **Palet:** `signature` nötrleri (siyah-beyaz) + tek ham vurgu; degrade yok.
- **Yazı:** `technical` (mono ağırlıklı) ya da tek grotesk; devasa başlık (800 sınırı).
- **Biçim:** yarıçap 0, 2 px kalın kenarlık, gölge yok, ızgara görünür; yoğunluk orta.
- **Hero:** `statement` ya da `corner`; metin yüzeyin yarısını tutar.
- **Kabuk:** sabit üst şerit + görünür ızgara çizgileri; menü açık liste.
- **Kart:** kalın çerçeveli kutu, köşe sert; `corner-label`.
- **Popup:** ortalı sert kenarlı modal; kapat düğmesi büyük.
- **Grafik:** sütun, düz dolgu, etiketler büyük.
- **Boş Durum:** tek kelime, büyük punto.
- **Hareket:** kesik, anlık (kısa ve doğrusal); yumuşatma yok.
- **Yasak:** cam, degrade, gölge, yuvarlak köşe, pastel, süs animasyon.

### `doga-organik` — Doğa ve Organik

- **Etiket:** sektor=saglik,wellness,gida,surdurulebilirlik,egitim,tarim · kitle=tuketici,genel · yogunluk=dusuk · ton=sakin,sicak · tema=acik · tur=landing,uygulama
- **Ne zaman:** Sakinlik ve güven satıyorsan: sağlık, terapi, gıda, eğitim, sürdürülebilirlik. Kullanıcı gergin gelir, rahat çıkmalı.
- **Palet:** `verdant` açık (zümrüt); toprak ve krem yüzeyler.
- **Yazı:** `calm` (Jakarta + Schibsted display).
- **Biçim:** yarıçap 1-1.5rem, çok yumuşak gölge; yoğunluk düşük; organik şekil (`pattern-bg`, `halftone-image`).
- **Hero:** `atmosphere` ya da `horizon`; doğal ışık hissi; metin kısa.
- **Kabuk:** sade üst çubuk; mobilde alt sekme; üç dört ana yer.
- **Kart:** yumuşak dolgu, geniş iç boşluk; `category-card`, `status-list`.
- **Popup:** alttan `sheet`; ton sakin, uyarı dili yumuşak.
- **Grafik:** `ring-chart`, `activity-rings`, haftalık yumuşak sütun.
- **Boş Durum:** yumuşak şekil + nazik tek cümle.
- **Hareket:** yavaş, nefes gibi; hızlı hareket yok.
- **Yasak:** neon, sert siyah, yoğun tablo, agresif kırmızı.

### `fintek-keskin` — Fintek ve Keskin

- **Etiket:** sektor=fintek,yatirim,odeme,muhasebe,sigorta-tech,kripto · kitle=tuketici,kurumsal,uzman · yogunluk=orta,yuksek · ton=ciddi,cesur · tema=koyu,acik · tur=uygulama,landing
- **Ne zaman:** Para ve hız söz konusuysa: ödeme, yatırım, muhasebe. Sayılar kahramandır; güven ve netlik tasarımın kendisi.
- **Palet:** `signature` koyu ya da açık; yükseliş/düşüş renkleri ayrı token (`up`, `down`).
- **Yazı:** `product` (Geist) ya da `signature`; `tabular-nums`; ₺ yalnız sans'ta.
- **Biçim:** yarıçap 0.5rem, kıl çizgi, derinlik ton farkıyla; yoğunluk orta-yüksek.
- **Hero:** `live-data` ya da `showcase`; gerçek kaynaklı sayı, `stat-strip`.
- **Kabuk:** ince sol ray + üstte sabit özet şeridi (bakiye, günlük değişim); `command-palette`.
- **Kart:** kıl çizgili bölümler, büyük tabular sayılar; kart içinde kart yok.
- **Popup:** işlem onayı `dialog` + `confirm` (tutar ve alıcı özeti); ayrıntı `sheet`.
- **Grafik:** `area-chart`, `line-chart`, `sparkline`, `gauge-chart`; eksenler sade.
- **Boş Durum:** tek satır + "ilk işlemini yap".
- **Hareket:** `rolling-number`, `animated-number` ölçülü; yanıp sönen sayı yok.
- **Yasak:** oyuncul mikro metin, sahte kıtlık, doğrulanamayan getiri sayısı, mor-pembe degrade.

### `sergi` — Sergi ve Çizim Masası

- **Etiket:** sektor=yazilim,yapay-zeka,mimari,odeme,fintek,planlama,b2b-saas,veri · kitle=kurumsal,uzman,genel · yogunluk=orta · ton=sakin,zarif,ciddi · tema=acik · tur=landing,uygulama
- **Ne zaman:** Ürünün kendisi en iyi argümansa ve onu "ekran görüntüsü" değil sergilenen bir nesne gibi göstermek istiyorsan: yapay zeka araçları, tasarım/çizim yazılımı, ödeme ve finans altyapısı, B2B SaaS. Sakin, emin, abartısız; arayüz keskin, zemin elle yapılmış ve sıcak.
- **Palet:** `signature` ya da sıcak nötr; sayfa beyaz/krem, vurgu SEYREK (yalnız kalem şeridi, odak, tek veri vurgusu). Birincil eylem mürekkep hap (`bg-strong text-page`), ikincil gri kuyu hap; degradeli buton yok.
- **Yazı:** `signature` ya da `product` grotesk, başlık sıkı (−0.05em ve altı) ve büyük; mono yalnız künye ve sayı sütunlarında (büyük harf, geniş aralık). İsteğe bağlı TEK serif italik kelime (`editorial`).
- **Biçim:** yarıçap 0.75-1.75rem kart, hap butonlar; derinlik ton farkı + tek yumuşak gölge; kıl ve KESİK çizgiler (kılavuz, künye). Yoğunluk orta.
- **Hero:** iki tonlu başlık (güçlü iddia / soluk bağlam), içinde en çok bir `head-mark`; solda tanım + iki eylem, sağda mono sayılar; altta `art-mat` paspartusunda gerçek ürün penceresi (yırtık kenar, alttan kırpılmış ya da kaydırınca daralan bant). Landing şablonunda en yakın `horizon` / `product-frame`.
- **Kabuk:** sol menü + ekmek kırıntılı üst çubuk + ⌘K; Pano başlığında kişiye seslenen tek satır ("Günaydın Aylin · Cuma 21 Kasım").
- **Kart:** kıl halkalı beyaz kart, içinde gri kuyu; özellik anlatımında kartsız `feature-list` (renkli çizgi ikon, kıl çizgi).
- **Popup:** ayrıntı `sheet`; onay `dialog`; arama `command-palette`.
- **Grafik:** sakin, palet ailesinden; tek vurgu serisi, değer etiketleri mono.
- **Boş Durum:** tek cümle + tek eylem; illüstrasyon yerine `art-mat` küçük doku.
- **Hareket:** yavaş ve az: başlık satır satır bulanıktan netleşir, kalem şeridi bir kez çekilir, paspartu kaydırınca daralır (yalnız `transform`), `step-tabs` kendiliğinden ilerler (durdurulabilir).
- **Yasak:** her bölüme künye (sayfada en çok iki), aynı sayfada ikiden çok paspartu, veri ekranının arkasında doku, neon/mor-pembe degrade, sahte ekran görüntüsü (pencere gerçek bileşenlerle çizilir), doğrulanamayan yuvarlak sayı ("10.000+").

### `sakin-akis` — Sakin Akış ve Portfolyo

- **Etiket:** sektor=portfolyo,kisisel,ajans,tasarim,yazilim,yapay-zeka,gelistirici-araci · kitle=genel,uzman,gelistirici · yogunluk=dusuk · ton=sakin,zarif · tema=acik,koyu · tur=icerik,landing
- **Ne zaman:** İşin kendisi argümansa ve kişi ya da küçük ekip konuşuyorsa: tasarımcı/geliştirici portfolyosu, ekip sayfası, değişiklik günlüğü, "lab" deney vitrini, bileşen kütüphanesi kapağı. Tek sütun; okur kaydırır, durur, açar. Gösteriş yok, iş akıyor.
- **Palet:** neredeyse tamamen nötr; sayfa beyaz (koyu temada derin kömür), kart gri kuyu (`bg-surface`), metin `text-strong` / soluk `text-muted`. Vurgu YOK denecek kadar az: yalnız odak halkası, beğeni kalbi ve tek durum işareti. Birincil eylem koyu hap (`bg-strong text-page`, küçük).
- **Yazı:** tek grotesk (`product` ya da `signature`), başlık BÜYÜK DEĞİL: ad ve kart başlıkları gövdeyle aynı boyda, orta ağırlıkta. Hiyerarşi boyla değil tonla kurulur (güçlü / soluk). Bağlantılar altı ince çizgili düz metin (`glide-link`).
- **Biçim:** dar ölçü (metin ~34rem, akış kartı ~48rem); kart yarıçapı büyük (1.5-2rem), kıl halka, gölge yok ya da tek yumuşak; boşluk cömert, kartlar arası 2-3rem.
- **Hero:** `profile-intro`: 64 px yuvarlatılmış avatar ya da işaret, ad, "Güncellendi <tarih>" tazelik satırı, koyu hap CTA + anlamına göre hareket eden ikon bağlantılar, 3-4 kısa bio paragrafı. İddia başlığı, degrade, büyük görsel YOK. Altında sayfa sekmeleri (hap vurgu kayar).
- **Kabuk:** üst menü yok; sekmeler (Akış · Notlar · Vakalar · Lab) + sol kenarda `ruler-toc`; araç çubuğu altta yüzer, aşağı kaydırınca saklanır (`scroll-hide-bar`).
- **Kart:** `shot-card`: gri kuyuda ortalanmış sahne (video ya da gerçek bileşen), altında başlık + soluk açıklama; notlar `note-card`; deneyler `demo-frame` (noktalı zemin + "**Kalın.** soluk" künye).
- **Popup:** medya `media-lightbox` (önceki/sonraki, Esc); başka popup neredeyse yok.
- **Grafik:** yalnız katkı takvimi (`heatmap`) ve doğrulanabilir sayı ("316 PR · 997 commit"); pazarlama grafiği yok.
- **Boş Durum:** tek soluk cümle, ortada ("Henüz bir şey eklenmedi.").
- **Hareket:** işlevsel ve ölçülü, eğri `--ease-brand`: medya kaydırdıkça buğudan netleşir (`scroll-focus`), sekme içeriği 480 ms'de 2 px buğu + 6 px kaymayla gelir, seçim hapı kayar, ikon anlamına göre oynar, beğeni kalbi pop. Video yalnız görünümdeyken oynar.
- **Yasak:** büyük iddia başlığı, degrade zemin, logo duvarı (müşteriler düz metin bağlantı listesi), sayaç/rozet gösterişi, her karta farklı renk, özel imleç, otomatik oynayan SESLİ medya, doğrulanamayan sayı.

---

## Seçim Matrisi

Sırayla sor (cevabı üründen çıkıyorsa sorma). Her cevap yönleri puanlar;
ilk üç yön aday olur. `npm run direction` aynı soruları bayrakla alır.

| # | Soru | Seçenekler | Etkisi |
|---|------|------------|--------|
| 1 | Sektör ve ürün işi ne? | finans · saglik · egitim · oyun · yazilim · kultur · yemek · enerji · lojistik · mimari ... | En ağır puan (3) |
| 2 | Kim kullanacak? | kurumsal · tuketici · gelistirici · uzman · genel · genc | 2 puan |
| 3 | Kullanıcı ekranda ne yapıyor? | okuyor (dusuk yogunluk) · gezip seçiyor (orta) · tarıyor ve işliyor (yuksek) | 2 puan |
| 4 | Ton ne olmalı? | ciddi · sicak · enerjik · sakin · cesur · zarif | 2 puan |
| 5 | Tema ve an? | acik (gündüz, masa) · koyu (gece, odak) | 1 puan |
| 6 | Ürün türü? | landing · uygulama (oturumlu) · icerik | 1 puan |
| 7 | Marka rengi var mı? | var (palet ona göre; yön yalnız hero/kabuk/kart seçer) · yok (yönün palet ailesi) | Palet kararı |
| 8 | Son beş projede hangi yönler kullanıldı? | `direction-log.md` otomatik okunur | Dışlama |

**Çakışma kuralı:** `direction-log.md`'nin son beş kaydındaki yön adaylardan
elenir. Elenen yön yine de en uygunsa gerekçeyle ayrıca anılır; seçim yine
kullanıcınındır. Aday sayısı üçün altına düşerse sıradaki yönler eklenir.

**Karışım:** iki yönü karıştırma. Bir yön seç; yalnız tek alanı (örn. hero) bir
komşu yönden ödünç almak kabul edilir ve `docs/DESIGN.md`'de `overrides:` altında
gerekçelenir.

---

## `docs/DESIGN.md` Alanları

```yaml
direction: veri-yogun        # bu dosyadaki kimlik
direction-reason: "..."      # tek cümle, ürüne bağlı
palette: signature           # signature | verdant | ember | iris | marka
font: dense                  # snippets/fonts FONT_PRESETS
hero: live-data              # landing hero.variant ya da "yok"
shell: sol-menu              # sol-menu | ust-cubuk | ray-komut | alt-dock | gizli-menu
card: cizgili                # cizgili | cerceveli | dolgu | kartsiz
popup: sheet                 # sheet | modal | komut | alt-sheet | tam-ekran
density: yuksek              # dusuk | orta | yuksek
motion: sonuk                # yok | sonuk | yayli | yavas
```

Her proje bu on alanı doldurur; boş alan yoktur.
