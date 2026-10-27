# Canlı Önizleme Kuralı

**Sitede görünen bir şeyi değiştiren her düzenleme ekranının yanında, sitenin
kendisi yazdıkça güncellenerek durur.** Masaüstü ve telefon, açık ve koyu.
Kullanıcı "Kaydet"e basmadan sonucu görür; kaydedince sitede aynısı çıkar.

Kaynak: Geo Tour yönetim paneli (Ekim 2026). Hazır kit:
[`snippets/live-preview/`](../snippets/live-preview/README.md) — `/snippet live-preview`.
Karar: `knowledge/decisions.md` → "Canlı Önizleme Zorunlu".

---

## Ne Zaman Geçerli

| Durum | Önizleme |
|-------|----------|
| Sayfa metni, başlık, açıklama, SSS, ekip, ürün, blog yazısı düzenleme | **Zorunlu** |
| Görsel, kapak, sıra, görünürlük (yayında/gizli) değiştirme | **Zorunlu** |
| Yazı tipi, punto, satır aralığı, renk vurgusu, tema ayarı | **Zorunlu**, anında (görünüm şeridi) |
| Çeviri (İngilizce sürüm) düzenleme | **Zorunlu**, önizleme o dilde |
| E-posta şablonu, OG görseli | Zorunlu; iframe yerine kendi çizicisi (e-posta HTML'i, `opengraph-image`) |
| Ayar, kullanıcı yönetimi, mesaj kutusu gibi sitede görünmeyen ekran | Yok |

Yeni projede panel planlanırken (P3 mimari, P4 ekranlar) önizleme rotası ve
`content_drafts` tablosu baştan yazılır; sonradan eklemek görünüm bileşenlerini
yeniden kesmeyi gerektirir.

## Değişmezler

1. **Gerçek sayfa, sahte kopya değil.** Önizleme sitenin görünüm bileşenini
   (`HomeView`, `PostView`) iframe içinde çizer; taslak yalnız veri olarak
   girer. Ayrı bir "önizleme bileşeni" yazmak YASAK: bir haftada siteden ayrışır.
2. **İki cihaz, gerçek ölçü.** Masaüstü 1440 × 900 tarayıcı penceresi, telefon
   390 × 844 (durum çubuğu, ada). Ekran gerçek boyunda kurulur, `transform:
   scale()` ile sığdırılır; dar bir iframe'e sayfayı sıkıştırmak değil.
3. **İki tema.** Açık/koyu seçimi önizlemeye `data-theme` olarak gider; panel
   önizlemeyi tema ve görünüm değişkenleri uygulandıktan sonra gösterir (yanlış
   temada bir an bile görünmez). Cihaz ve tema seçimi hatırlanır.
4. **Yazdıkça, sayfa tam yüklenmeden.** İçerik şeridi: yazmayı bırakınca
   ~320 ms sonra taslak yazılır, önizleme `router.refresh()` ile yeniden çizilir,
   kaydırma yerinde kalır. Her tuşta `iframe.src` değiştirmek ya da sayfayı
   yeniden yüklemek YASAK (titrer, kaydırma başa döner).
5. **Görünüm anında.** Yazı tipi, punto, satır aralığı, vurgu rengi CSS
   değişkeni olarak (`lp:vars`) istek beklemeden uygulanır; aynı seçim taslağa
   da yazılır ki yeniden çizim ve yayın aynı sonucu versin. Yazı tipi
   seçenekleri yalnız önizleme rotasında yüklenir, site yalnız seçili olanı.
6. **Taslak canlıya sızmaz.** Taslak ayrı tabloda (`content_drafts`), anahtarı
   `(key, session)`: site o tabloyu hiç okumaz, iki sekme birbirini ezmez,
   dünkü taslak bugünkü önizlemeye karışmaz. Kaydet yayındaki kaydı yazar,
   taslağı siler.
7. **Durum görünür.** Rozet dört hâlden biri: `Yayındaki Hâli` · `Güncelleniyor`
   · `Kaydedilmemiş` · `Hatalı Alan Var`. Durum alanların kendisinden çıkar
   (gönderilenle, kaydedilenle karşılaştırma), ayrı bir bayrak tutulmaz.
8. **İki yönlü bağ.** Önizlemede bölümün üzerine gelince çerçevesi ve adı
   görünür; tıklayınca paneldeki alanı açılır. Paneldeki alana odaklanmak
   önizlemeyi o bölüme kaydırır. Bölümler `data-edit="<bölüm>"` ile işaretli,
   adları panelin bölüm başlıklarıyla aynı.
9. **Her göründüğü yer.** İçerik sitede birkaç yerde çıkıyorsa (kendi sayfası,
   liste, ana sayfa kartı) her biri bir önizleme sekmesi.
10. **Güvenli köprü.** Önizleme rotası yalnız yöneticiye açık ve `noindex`.
    postMessage hedef kökeni `window.location.origin`; alıcı `origin` ve
    `source` denetler. `lp:vars` yalnız `--` ile başlayan değişkeni kabul eder.
    Önizlemede tıklamak gezinmez, form göndermez. Taslak Server Action'ı auth +
    zod + oturum kimliği + boyut sınırı taşır. Sitenin geneli `frame-ancestors
    'none'` kalır; yalnız önizleme yolu `'self'` + `SAMEORIGIN` alır (`mistakes.md` #114).

## Düzen

- **≥ 1280 px:** form solda, önizleme sağda yapışık sütun (`.lp-editor`),
  önizleme sütunu formdan biraz geniş; masaüstü penceresi sütunun boyunu doldurur.
- **< 1280 px:** önizleme formun altında; kaydet çubuğunda "Önizle" düğmesi
  tam ekranı açar. Tam ekran Esc ile kapanır, odak geri döner.
- Telefon görünümünde "Sitede Aç" bağlantısı altta, masaüstünde adres çubuğunda.
- Yüklenirken kaydın kapağı bulanık durur, üstünde "Önizleme Hazırlanıyor".

## Gate'te Denetlenir

`gate` subagent'ı UI adımında (6) düzenleme ekranı içeren her story için:

- [ ] Önizleme var ve sitenin görünüm bileşenini çiziyor (ayrı kopya yok)
- [ ] Masaüstü + telefon, açık + koyu çalışıyor
- [ ] Yazınca ≤ 0,5 sn güncel, kaydırma yerinde; yazı tipi/punto anında
- [ ] Taslak gizli pencerede canlı sitede görünmüyor
- [ ] Önizleme rotası oturumsuz kapalı, `noindex`
- [ ] Bölüm tıklama ↔ alan odağı iki yönde çalışıyor

Eksikse Gate FAIL (önizleme "sonra eklenir" diye ertelenmez).

## Yasaklar

- Önizlemeyi formun içinde, siteden bağımsız bir bileşenle taklit etmek
- Her tuşta iframe'i yeniden yüklemek
- Taslağı yayındaki tabloya yazmak ya da "taslak" bayrağıyla aynı satırda tutmak
- Yazı tipi değişikliğini yalnız sunucu gidiş-dönüşüyle göstermek
- `postMessage(..., "*")`
