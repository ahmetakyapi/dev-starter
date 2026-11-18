# Tasarım Denetimi — dev-starter Storybook — 2026-11-17

Matris: 13 hikaye × 3 genişlik (1440 / 1024 / 390) × 2 tema = **78 ekran** (hepsi açıldı; `demo-app--signed-out` ilk turda yük altında yüklenmedi, tek başına yeniden ölçüldü), ek olarak kabuk (sol menü) 1440 açık/koyu, 1024 açık, 390 açık/koyu.
Yatay taşma: **0 / 78**. Konsol: 3 tür hata (aşağıda B-12, B-13). Hizalama denetimi (`npm run check:align`): **✓ 12 sayfa × 3 genişlik hizalı**. Kod taraması (`slop-scan.sh --quiet storybook/stories`): 0 yüksek, 10 uyarı (çoğu `text-[9px]` künyeleri).

Yöntem: Playwright (Chromium), her hücrede 8,5 sn bekleme (play fonksiyonları), tam sayfa + kaydırarak viewport görüntüsü. Kontrast iki yolla ölçüldü: (1) `getComputedStyle` + ata zincirinin zemin bileşimi, (2) **piksel ölçümü**: metin saydamlaştırılıp altındaki zemin ekran görüntüsünden okundu (renkli/degrade zeminde tek güvenilir yol); yalnız medyan zeminde de eşiği geçemeyenler bulgu sayıldı. Butonlar gerçekten tıklandı (DOM değişimi, piksel farkı, `aria-*` değişimi, dosya seçici, gezinme). Dokunma hedefi 390'da, `::after` genişletmesi hesaba katılarak.

Kanıt dosyaları: `docs/review/storybook-2026-11-17/` (aşağıda yalnız dosya adı yazılı). Ham ölçüm çıktıları ve betikler: `/tmp/claude-0/dr/out/` (`results-all.json`, `deep-*.json`, `clicks-*.json`; geçici).

## Puanlar

| Eksen | Puan | Tek Cümle |
|---|---|---|
| Hiyerarşi | 4 | Sayfa başlıkları tek ölçüde (24 px / 600 / −0.6 px, sol 280 px, üst 84 px); kapakta harita kenar çubuğunu tekrarlıyor. |
| Tipografi | 4 | Ölçek tutarlı; 1024'te takvim ve gelen kutusu başlıkları 34–101 px'e sıkışıp okunmaz kısalıyor. |
| Aralık ve Hiza | 4 | Hizalama denetimi temiz; giriş ekranının mavi panelinde ~290 px boş bant. |
| Renk ve Tema | 3 | Renkli zeminde iki yerde AA kırılıyor (giriş hapları, yüklenen buton); koyu temada soluk metin kabarık yüzeyde 3,96–4,17. |
| Hareket | 4 | Hareket azaltmada içerik görünür, sonsuz animasyon 0; play fonksiyonları sayfa durumunu kalıcı değiştiriyor. |
| Durumlar | 3 | Görev tamamlanınca başlık 8→7 olurken kenar çubuğu rozeti 8'de kalıyor. |
| Erişilebilirlik | 3 | Odak halkaları her durakta var; 390'da 36 ve 32 px hedefler, iki play testi kırık. |
| Duyarlılık | 3 | Taşma yok, ama 1024 ara genişliği takvim ve gelen kutusunda kırık. |
| Karakter | 4 | Pusula gerçek bir ürün gibi okunuyor; kapaktaki sayılar iki ayrı sınıflamadan geliyor. |

## Öncelikli Düzeltmeler

### Yüksek

**Y-1. Giriş ekranı: mavi paneldeki öncelik hapları AA'yı geçmiyor** (renkli zemin)
- Sayfa: `demo-app--signed-out`, `demo-app--magic-link` · 1440 ve 1024 · açık + koyu
- Ölçüm (piksel): `Acil` / `Acil` / `Yüksek` beyaz 12 px / 500 metin, `bg-on-brand/15` hap zemininde **açıkta 3,54 / 3,67 / 3,77:1, koyuda 3,49 / 3,77 / 3,98:1** (eşik 4,5). Zemin medyanı açıkta rgb(72,140,194), koyuda rgb(85,143,174): yarı saydam beyaz, mavi paneli **açarak** metnin kontrastını düşürüyor. Ayrıca `Acil` ile `Yüksek` görsel olarak aynı: renk, ikon ya da ağırlık farkı yok.
- Kanıt: `crop-login-pills-light.png`, `crop-login-pills-dark.png`
- Öneri: `storybook/stories/showcase/_giris.tsx:163` hapı açık zemine çevirme, koyulaştır: `bg-black/20` (ya da `--brand-ink` gibi panelin koyu tonu) + `text-on-brand`. Alternatif: beyaz dolgu + `text-primary-ink`. Öncelik farkı için `Acil`e nokta/ikon ekle. Her iki temada piksel ölçümüyle ≥ 4,5 doğrula.

**Y-2. Yüklenen (pending) buton renkli zeminde okunmuyor**
- Sayfa: `showcase--all-in-one` `#b-spinner` (ve aynı desen `demo-app--magic-link` "Gönderiliyor") · 1440 + 390 · açık + koyu
- Ölçüm (piksel): "Kaydediliyor" 12 px / 600; **açıkta beyaz metin rgb(129,180,221) zeminde 2,21:1; koyuda rgb(6,18,31) metin rgb(36,102,138) zeminde 3,00:1**. Buton bütünüyle `opacity` ile soluyor, metin de soluyor.
- Kanıt: `crop-spinner-light.png`, `crop-spinner-dark.png`; giriş akışında "Gönderiliyor" aynı biçimde (`demo-app--magic-link` 1440 açık tam sayfa görüntüsü, ilk tur)
- Öneri: yüklenme durumunda dolguyu soldurma; `aria-busy` + dönen gösterge yeter. Gerekirse yalnız ikon/dolgu tonu değişsin (`bg-primary-hover`), metin `text-on-primary` tam opaklıkta kalsın. `disabled:opacity-50` yalnız gerçek devre dışı durum için.

**Y-3. 1024 px'te takvim etkinlikleri ve görev başlıkları okunmaz kısalıyor**
- Sayfa: `demo-app--calendar` · 1024 · açık + koyu
- Ölçüm: haftalık ızgarada etkinlik başlığı kutusu **40 px** ("To Y…", "P…", "Gö A…"), saat etiketi "11:30–12:00" 68 px metin **30 px** kutuda; sol "Yapılacaklar" listesinde görev adları 156–210 px metin **34 px** kutuda (16 öğe kısaldı). Video ikonu başlığın üstüne biniyor.
- Kanıt: `demo-app--calendar-1024-light.png`
- Öneri: 1024'te hafta görünümünü 5 güne indir ya da sol listeyi ızgaranın üstüne/çekmeceye al (`lg:` yerine `xl:` kırılımı); etkinlik kutusunda dar sütunda yalnız başlık + saat tek satır, ikon başlığın yanına değil kutunun köşesine `absolute` ve başlık `pr-6`.

**Y-4. 1024 px'te gelen kutusu tablosu: talep başlıkları 101 px'e sıkışıyor, Kanal sütunu kesik**
- Sayfa: `demo-app--inbox` · 1024 · açık + koyu
- Ölçüm: "Siparişimiz hala teslim edilmedi" 209 px metin **101 px** sütunda; 8 talebin hepsi ~10 karakterde kesiliyor; Kanal sütunu "Tele", "E-P" diye görünür alanda yarım kalıyor (tablo yatay kaydırıyor, "devamı var" ipucu yok). Sol klasör ağacı 240 px yer kaplıyor.
- Kanıt: `demo-app--inbox-1024-light.png`
- Öneri: 1024'te klasör ağacını daralt/katla (ikon rayı) ya da Durum + Öncelik sütunlarını başlık altına künye olarak indir; tablonun sağ kenarına kaydırma gölgesi (`guides/05-components.md` § 3 "Kaydırma saklanmaz").

**Y-5. Kapaktaki sayılar ile "Her Şey Bir Arada" sayıları aynı grup adlarında birbirini tutmuyor**
- Sayfa: `cover--overview` ↔ `showcase--all-in-one` · tüm genişlikler
- Ölçüm (DOM metni): Kapak rafları → Temel **10**, Seçim **12**, Form Girişleri **19**, Katmanlar **13**, Geri Bildirim **5**, Yükleme **6**, Hareket ve Doku **9** (13 rafın toplamı **126**). Her Şey Bir Arada gezinme hapları → Temel **15**, Seçim **11**, Form **17**, Katmanlar **12**, Geri Bildirim **6**, Yükleme **5**, Hareket ve Doku **14**. Aynı ekranlarda "141 bileşen", "01 Bileşenler · 119 Parça", kurulumda "108 bileşen", kapakta "17 grafik" ↔ showcase "15 Grafik".
- Kanıt: `sheet-cover--overview-1440-light-0.png` (raflar), `sheet-showcase--all-in-one-1440-light-3.png`
- Öneri: tek sınıflama seç. Kapak sayıları `stories/kapak/_harita.ts` ile kenar çubuğundan (Storybook başlığı) sayılıyor; Her Şey Bir Arada kendi snippet gruplarını kullanıyor. Ya grup adları ayrışsın (ör. kapakta "Raf", showcase'te "Kategori") ya da ikisi aynı kaynaktan (`_harita.ts`) beslensin. Toplamı (141 / 126 / 119 / 108) hangi şeyin saydığını yanında yaz ya da tek sayıya indir.

### Orta

**O-1. Giriş ekranı ilk kare: mavi panelin alt yarısı boş, müşteri şeridi kıvrımın altında**
- Sayfa: `demo-app--signed-out` · 1440 × 900 · açık + koyu
- Ölçüm: belge yüksekliği **1080 px** (görünüm 900); mavi panel **1056 px**; son talep kartının altı y≈448, "Pusula Bu Müşterilere Hizmet Veriyor" başlığı y≈914 → ilk karede ~**290 px boş mavi bant** ve şerit görünmüyor. Sol sütunda bağlantı gönderilince "Hesabın yok mu?" satırı da kıvrımın altına düşüyor (form başlığı y=426).
- Kanıt: `signed-out-1440-dark-ilk-ekran.png`, `signed-out-1440-light-kaydirilmis.png`
- Öneri: paneli `h-[calc(100dvh-24px)] sticky top-3` yap, içeriği `justify-between` ile böl (üstte başlık + talepler, altta şerit); sol formu dikeyde ortala. Giriş ekranı 1440 × 900'de kaydırmasız sığmalı.

**O-2. Görev tamamlanınca kenar çubuğu rozeti güncellenmiyor**
- Sayfa: `demo-app--tasks` · 1440 · açık
- Ölçüm: yüklemede başlık "**8** Açık İş", rozet "Görevler **8**"; play bir görevi bitirince başlık "**7** Açık İş", rozet **8**'de kalıyor.
- Kanıt: `hdr-demo-app--tasks-1440.png`; ölçüm betiği çıktısı (İLK/SON)
- Öneri: rozet ile `_gorevler.tsx:76` aynı `open` sayacından okusun (ortak store / context).

**O-3. Bildirim sayısı sayfadan sayfaya farklı ve sayfa açıklaması küçük harf**
- Sayfa: `demo-app--*` · 1440 · açık
- Ölçüm: aynı oturum verisiyle yükleme sonunda zil/rozet: Pano **3**, Görevler **5**, Takvim **4**, Raporlar **4**, Ayarlar **4**, Bildirimler sayfası **0** ("Tümünü Okundu Say" play'de basılıyor). Bildirimler açıklaması "0 okunmamış · uygulama içinde, e-postayla ve SMS'le" cümle biçiminde; diğer yedi sayfanın açıklaması Title Case ("8 Talep Yanıt Bekliyor · 5 Açık, 3 Beklemede").
- Kanıt: `hdr-demo-app--notifications-1440.png`
- Öneri: play'lerin ürettiği bildirimler hikayeye özgü kalsın ya da başlangıç değeri her hikayede aynı olsun; açıklamayı "0 Okunmamış · Uygulama İçi, E-Posta ve SMS" biçimine getir.

**O-4. Sayfa başlığı eylemleri farklı ölçü ve sayıda**
- Sayfa: `demo-app--*` · 1440 + 390
- Ölçüm (başlık sağındaki denetimler): Pano "Tanıtım Turu" **36 px** + Hafta/Ay/Yıl **32 px** (iki denetim); Gelen Kutusu Paylaş + Görünüm **36**; Takvim "Randevu Oluştur" **36**; Asistan "Yeni Sohbet" **36**; Bildirimler iki buton **36**; Raporlar "Son 30 Gün" **40**; Ayarlar "Hızlı Ayarlar" **40**; Görevler **yok**. (`guides/05-components.md` § PageHeader: "sağda o ekranın **tek** denetimi".)
- Kanıt: `hdr-demo-app--*-1440.png` (ölçüm tablosu), `hdr-demo-app--notifications-1440.png`
- Öneri: başlık eylemi tek boy (`size="sm"` = 36 px masaüstü, 44 px dokunmatik); Raporlar ve Ayarlar 40 → 36. Görevler'e "Görev Ekle" ya da bilinçli boşluk; Pano'da Hafta/Ay/Yıl'ı panelin içine indir.

**O-5. Telefonda 44 px altı dokunma hedefleri**
- Sayfa / ölçüm (390, açık ve koyu aynı):
  - `demo-app--notifications`: satır eylem butonları **36 × 36** (8 adet), "Geri Al" **55 × 26**
  - `demo-app--calendar`: "… grubuna iş ekle" **32 × 32** (4), grup başlıkları **282 × 40** (4), hafta okları **40 × 44**
  - `demo-app--reports`: kaydırıcı noktaları **24 × 44** (5), "Diğer Biçimler" **36 × 44**
  - `demo-app--settings`: bölüm gezinmesi hapları (01 Profil … 11 Webhook) **36 px** yüksek (11 adet)
  - `demo-app--landing`: üst çubuk "Giriş Yap" **83 × 36**, "Yeni: Pencere Şeridi" **177 × 36**, "Bu Akışla Dene" **137 × 36**; tanıtım duyurusu kapat/sıradaki **32 × 32**; şerit rafı butonları **36 × 40**
  - `demo-app--assistant`: "Düşünüyor · 2 sn" **125 × 36**
  - `showcase--all-in-one`: grup gezinme hapları **36 px** (Temel, Seçim, Form …)
- Kanıt: ölçüm çıktısı (results-all.json → `touch`)
- Öneri: `tap-44` sınıfı ya da `min-h-11 pointer-fine:min-h-9` (şablondaki `Button sm` kuralı); takvimdeki `size-8` ikon butonları `size-11 pointer-fine:size-8`.

**O-6. Koyu temada soluk metin kabarık yüzeyde 4,5'in altında**
- Sayfa / ölçüm (koyu):
  - `demo-app--tasks` 1440/1024/390: tarih hapları "3 Kas", "4 Kas" rgb(161,161,161) / rgb(62,62,64) **4,13:1**; "Gecikti · 31 Eki" rgb(255,92,122) / rgb(67,47,52) **4,17:1**
  - `demo-app--settings` 1440/1024/390: "Ekler", "Raporlar", "Sohbet", "Yedek" `text-body` / rgb(63,63,65) **4,07:1**
  - `demo-app--calendar` 390: `dt` künyeleri "Müşteri", "Zaman" rgb(148,148,150) / rgb(54,54,56) **3,96:1**
  - `demo-app--reports` 1440/390: "Sürükleyip bırak ya da seçmek için tıkla" **3,96:1**
  - `demo-app--signed-out` 1440/390: "Örnek uygulamada e-posta gitmez…" **4,26:1** (piksel)
  - `demo-app--notifications` açık: "Onaylandı" hapı rgb(12,115,80) / rgb(209,228,222) **4,44:1**; koyu: yeşil vurgulu satırda künye **4,41:1**
- Kanıt: `crop-tasks-deadlines-dark.png`, `demo-app--settings-1440-dark.png`
- Öneri: koyu temada `surface-raised` (karo içi hap/kuyu) üstünde `text-muted` yerine `text-body`, `text-body` yerine `text-strong` kullan ya da koyu `--surface-raised`ı bir basamak koyulaştır; `--success-ink` açıkta bir basamak koyulaşsın. Token yorumuna "kabarık yüzeyde" oranını yaz (`guides/02-design-tokens.md` § 6).

**O-7. Kapakta harita, kenar çubuğunun aynısı; üç gezinme aynı ekranda**
- Sayfa: `cover--overview` kabuk içinde · 1440 · açık
- Ölçüm: ilk ekranda sol kenar çubuğu (Başla / Kütüphane / Uygulamada, 12 öğe), sağdaki harita kartı (aynı 3 bölüm, aynı 11 öğe, aynı ikonlar) ve üst gezinme (Başlangıç, Bileşenler, Desenler, Pusula) birlikte. Görünümün ~%40'ı (sağ sütun 500 px) kenar çubuğunun tekrarı; "Bileşenler" üst gezinmede `showcase--all-in-one`a, haritada `avatar--default`a gidiyor. "Ekranlar · Giriş, gelen kutusu, açılış sayfası" bağlantısı `settings-page--default`a (Ayarlar sayfası) açılıyor.
- Kanıt: `shell2-1440-light.png`
- Öneri: kabuk içindeyken haritayı "öne çıkan dört sayfa" ya da canlı önizleme ile değiştir (karşılama = "her şeyin olduğu" vitrin: palet + Pusula + bileşen kolajı ilk ekrana); aynı etiket aynı yere gitsin; "Ekranlar" ilk hikayesi açıklamayla uyuşsun (giriş ekranı).

**O-8. Play (etkileşim) testleri kırık / kalıcı durum bırakıyor**
- `cover--overview` (1440 açık, 390 koyu): `AssertionError: expected 'jade' to be 'signature'`; test paleti Yeşim'de bırakıyor, kapak yeşil açılıyor (tam sayfa görüntüsünde Yeşim seçili).
- `demo-app--inbox` 390 açık + koyu: `Unable to find role="button" and name /^Acil/` (filtre telefonda "Seçenekleri Göster" arkasında).
- Öneri: kapak play'inde palet sıfırlamasını `await waitFor(...)` ile bekle ya da testi kaldır; gelen kutusu play'i telefonda önce "Seçenekleri Göster"e bassın ya da `parameters.viewport` ile masaüstüne sabitlensin.

### Düşük

**D-1. Her Şey Bir Arada · Kanal Tablosu (yeni kuyu) telefonda kesik, ipucu yok** — `#b-channel-matrix` 390: kaydırma kabı `scrollWidth 480 > clientWidth 310`; "E-Posta" sütunu "E-P" diye kesik, SMS görünmüyor, sağ kenarda görünür gölge yok. Başlık hücreleri açıkta rgb(107,107,107)/rgb(235,235,235) **4,47:1**. Kanıt: `channel-matrix-390.png`. Öneri: sağ kenar maskesi (`mask-image: linear-gradient(to left, transparent, #000 24px)`), başlık metni `text-body`.

**D-2. Alt palet çubuğu telefonda 10 paletin 2,5'unu saklıyor** — `showcase--all-in-one` 390: çubuk 358 px, iç şerit `scrollWidth 440 > 291`; Kehribar ve İris görünmez, Zümrüt yarım. Ayrıca masaüstünde çubuk kuyu başlıklarının üstüne biniyor ("Metin Alanı" künyesi altında kalıyor). Kanıt: `palettebar-390.png`. Öneri: telefonda tek "Palet" butonu + açılır panel, ya da iki satır; sayfa altına çubuk yüksekliği kadar `padding-bottom`.

**D-3. Devre dışı "Ekle" çok soluk** — `#b-task-list` ve `demo-app--tasks`: beyaz metin rgb(159,188,218) zeminde **1,89:1**. WCAG devre dışı öğeyi muaf tutar ama "basılınca bir şey olmaz mı?" sorusunu doğurur. Öneri: devre dışıda `bg-surface-raised text-muted` (gri), mavi kalmasın.

**D-4. Kapak arama kutusu yalnız kabukta çalışıyor** — `cover--overview` tek başına (`iframe.html`) açıldığında "Bileşen, desen ya da ekran ara" basılınca **DOM/odak değişimi 0**; kabukta Storybook aramasına odaklanıyor (doğrulandı). Öneri: kabuk yoksa butonu gizle ya da `?path=` ile kabuğa gönder.

**D-5. Kapak 390: harita açıklamaları 118 px'e kısalıyor** — 11 açıklamanın hepsi ("Manifesto, token'la…", "Her Şey Bir Ara…") ellipsis; başlık "Her Şey Bir Arada" da kesik. Kanıt: `shell2-390.png`. Öneri: telefonda sayıyı (6 sayfa, 141 bileşen) açıklamanın altına indir, açıklama iki satır.

**D-6. Kabuk telefonda "Kapak/Kapak"** — 390 alt çubuk hikaye yolunu "Kapak/Kapak" yazıyor (grup = hikaye adı). Öneri: tek hikayeli sayfada adı gizle ya da hikaye adını "Genel Bakış" yap.

**D-7. Yinelenen React anahtarı** — `demo-app--signed-out`, `demo-app--magic-link` (her hücrede 2), `showcase--all-in-one` (1): "Encountered two children with the same key". Büyük olasılıkla müşteri şeridinin iki kopyası. Öneri: ikinci kopyada `key={`${id}-b`}`.

## Sağlam Çıkanlar (dokunma)

- **Taşma 0 / 78**; hizalama denetimi 12 sayfa × 3 genişlikte temiz (rozetler aynı sütunda; Pano gecikme kartındaki "+4 / +2 / +1 Gün" artık aynı hizada).
- Pusula sayfa başlıkları bire bir aynı: h1 24 px / 600 / −0.6 px, 1440'ta x=280 y=84, 390'da x=24 y=132; açıklama hep 14 px; kenar çubuğunda etkin sayfa `aria-current="page"` ve görünür biçimde ayrışıyor.
- Odak halkası her ölçülen durakta görünür (2 px `--line-focus` çizgi ya da halka gölgesi); tanıtım sayfasının mavi üst bölümünde "Demoyu Gör" beyaz odak çizgisi taşıyor.
- Tanıtım sayfası mavi üst bölümü: "Ücretsiz Dene" (beyaz dolgu) ve "Demoyu Gör" (çizgili) piksel ölçümünde AA'yı geçiyor; çapa bağlantıları (#tanitim-demo, #tanitim-kisayol) hedefe kayıyor.
- Tıklama turu: kapak (46 öğe), giriş (40), tanıtım (21), 8 uygulama sayfası ve showcase'in channel-matrix → dissolve aralığı (119 öğe) — gerçekten basılan her butonda görünür etki var (menü, diyalog, filtre, dosya seçici, gezinme). Kırık bağlantı (`href="#"`) yok.
- Hareket azaltmada kapak, tanıtım ve giriş sayfasında opaklığı 0'da kalan içerik yok, çalışan animasyon 0.

## Fırsatlar

- Karşılama: kapağın ilk ekranına kenar çubuğunu tekrarlayan harita yerine canlı bir kolaj (Pusula pano karesi + palet numunesi + 3 öne çıkan bileşen) ve tek arama; "her şeyin olduğu" his buradan gelir.
- Giriş ekranı: sağ panelde talepler yerine "bugünün özeti" (3 sayı + şerit) ve ilk karede şeridin görünmesi; sol formda kayıtlı hesap kartı ile e-posta kartı arasında "ya da" ayırıcısı yerine sekme.
- Pusula'da ortak `PageHeader` eylem yuvası (tek denetim kuralını bileşen düzeyinde zorla); rozet sayıları tek store'dan.
- Ölçüm betiğini `check:align` gibi kalıcı bir `check:contrast` (piksel tabanlı, renkli zeminler için) olarak depoya almak; bu turdaki iki AA kırığını otomatik yakalardı.

## Durum (2026-11-17, aynı gün)

Ekran görüntüleri depoya alınmadı (2,6 MB; geçici dizinde kaldı). Bulguların akıbeti:

| Bulgu | Durum | Ne yapıldı |
|---|---|---|
| Y-1 Giriş hapları | Düzeldi | Beyaz hap + zeminin koyu tonu (`.pusula-hero-ink`, ≥ 5,5:1); Acil'de nokta |
| Y-2 Yüklenen buton | Düzeldi | `auth-card` beklemede soldurmuyor; Her Şey Bir Arada'daki örnek `aria-busy` |
| Y-3 Takvim 1024 | Düzeldi | "Bugün" paneli xl altında haftanın üstünde, kendi içinde iki sütun |
| Y-4 Gelen kutusu 1024 | Düzeldi | Klasör ağacı xl'de; daha darda araç çubuğunda "Klasör" seçicisi; Kanal sütunu 1280 altında kapalı başlar |
| Y-5 Sayılar | Düzeldi | Kapak raflarında birim ("sayfa") ve açıklama; Her Şey Bir Arada kendi kurgusunda gruplar |
| O-1 Giriş boş bant | Düzeldi | Panel ekran boyu ve yapışkan; ortada bugünün özeti (3 sayı), şerit ilk karede |
| O-2 Görev rozeti | Düzeldi | Pano durumu uygulama bağlamında: rozet, başlık ve pano aynı sayı; sayfa değişince kaybolmaz |
| O-3 Bildirim | Kısmen | Açıklama Title Case; hikayeler arası sayı farkı play'lerin ürettiği bildirimlerden (bilerek) |
| O-4 Başlık eylemleri | Düzeldi | Raporlar seçicisi ve Ayarlar butonu 36 px; Görevler'de eylem yok (bilinçli) |
| O-5 Dokunma hedefleri | Kısmen | Bildirim satır menüsü, takvim "iş ekle", grup başlıkları, tanıtım menüsü ve duyuru hapı, Geri Al, ayar gezinmesi (`toc-nav`) dokunmatikte 44 px; arc-carousel, notice-deck, thinking-block, rapor kaydırıcı noktaları açık |
| O-6 Koyu soluk metin | Düzeldi (Pusula) | Pusula koyu temasında soluk #ababad, gövde #bcbcbe; rozet tonları (Gecikti 4,17, Onaylandı 4,44) açık |
| O-7 Kapakta üç gezinme | Kısmen | Üst menü kalktı; harita kaldı (sahibinin isteği: ilk ekranda her şey) |
| O-8 Play | Düzeldi | Kapak paleti beklemesi 5 sn; gelen kutusu play'i masaüstü genişliğinde koşar (telefon hikayesi ayrı) |
| D-3 Devre dışı Ekle | Düzeldi | Gri, mavi değil |
| D-4 Arama tek başına | Düzeldi | Kabuk yoksa kabuğu açar |
| D-5 Kapak 390 | Düzeldi | Telefonda açıklama iki satır, sayı sütunu gizli |
| D-7 Yinelenen anahtar | Düzeldi | `morph-nav` anahtarı adres + başlık |
| D-1, D-2, D-6 | Açık | Kanal tablosu kaydırma ipucu, telefonda palet çubuğu, kabuğun "Kapak/Kapak" yolu |
