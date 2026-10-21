# Hareketin sayıları — sıfatı sayıyla değiştir

Kaynak: Florence (@flxrnc), *Opus 5.5 Motion Lab: Make Claude Animate Like a
Studio* (X makalesi, Ekim 2026); easing değerleri Andrey Sitnik'in Easings
başvurusundan, süreler Material 3 ve Nielsen Norman Group'tan, kontrast ve
yanıp sönme WCAG'dan. Kod: `assets/motion-tokens.ts`.

> **Sıfat varsayılan görünümün yaşadığı yerdir.** "Premium", "modern",
> "havalı" dediğin her yerde model kendi varsayılanını seçer (lacivert uzay,
> ışıyan halka, parçacık, dönen ürün). Bir sıfatı bir sayıyla değiştirdiğin
> her yerde kararı modelden geri alırsın.

## Eğriler

| Ad | cubic-bezier | Ne için |
|----|--------------|---------|
| ease-out-expo | 0.16, 1, 0.3, 1 | Yazı ve logo açılışı |
| ease-out-quint | 0.22, 1, 0.36, 1 | Premium giriş — **Açılış Zili'nin `--ease-brand`ı bu** |
| ease-in-out-quart | 0.76, 0, 0.24, 1 | Ekran boyunca taşıma, kamera itişi |
| ease-in-expo | 0.7, 0, 0.84, 0 | Hızlı çıkış |
| ease-out-back | 0.34, 1.56, 0.64, 1 | Taşan küçük "pop" (yalnız tek küçük öğe) |

- **Giriş ease-out, çıkış ease-in, ekran boyunca ease-in-out.**
- **Çıkış girişten %40–50 kısa** (Material 3: 400 ms giriş, 200 ms çıkış).
- **Doğrusal yalnız** dönüşte, ilerleme çubuğunda ve bir döngünün fazında.
  Bir yer değiştirmede doğrusal eğri, render'ı "render gibi" gösteren en hızlı yoldur.
- **Kamera en yumuşak eğriyi alır** (ease-in-out-quart), nesneler daha keskinini.

## Yaylar — tek sayı: sönüm oranı ζ

Her kütüphane düğmelerine başka ad verir; hepsi tek sayıya çevrilir:
`ζ = c / (2·√(k·m))`.

| ζ | His |
|---|-----|
| 1,0 | hiç zıplamaz |
| 0,7–0,85 | premium |
| 0,4–0,6 | oyuncu |
| < 0,3 | çizgi film |

Remotion'un varsayılanı (m 1, c 10, k 100) ζ = 0,5; react-spring'inki
(170/26) ζ = 1,0. **Konum ve boyut zıplayabilir; opaklık ve renk asla.**
Yayı kapalı biçimde yaz (`spring(t, ζ, f)`): N. kare 0..N−1'i hesaplamadan
çizilir — render sözleşmesinin istediği tam bu.

## Süreler ve kademe

| Ne | Süre |
|----|------|
| Arayüz geri bildirimi | 100–200 ms (100 ms "anında" hissi) |
| Arayüz hareketi | 200–500 ms |
| Kahraman açılışı | 600–900 ms |
| Harfler arası | 1 kare (~30 ms) |
| Kelimeler arası | 60–120 ms |
| Liste öğeleri arası | 40–80 ms |

**Sonraki öğe öncekinin %30–50'si bitince başlar**: tam sıralı robotik,
hepsi birden ucuz görünür. Videoda karelerle konuş: 24 fps'te bir kare ~42 ms;
400 ms = 10 kare, 750 ms = 18 kare.

## Hiyerarşi: her planda tek kahraman

- Tek kahraman hareketi; gerisi bekler, %40'a kısılır ya da durur.
- **İkincil hareketler** kahramanın yolunun %50–70'i kadar gider ve
  100–200 ms sonra başlar.
- **Ortam hareketi** kahramanın yolunun %5'inin altında, yavaş bir sinüste,
  hiç durmaz.

## Vuruş ızgarası

`kare/vuruş = fps × 60 / BPM`. 120 BPM, 24 fps → 12 kare; 128 BPM, 30 fps →
14,06. **Her vuruşu zamandan hesapla ve tek tek yuvarla**
(`round(n × 60 / BPM × fps)`): yuvarlanmış 14'ü üst üste eklersen 32 vuruşta
2 kare kayarsın. **Vuruşta kes, ölçüde (4 vuruş) yerleşimi değiştir**; her
vuruşta her şeyi değiştirmek izleyiciyi yorar.

## Kısa film (≤ 15 sn)

Kaynak: Vincentwei1021/mg-styles-15 `prompts/*` "How to work" (MIT).

| Ne | Sayı |
|----|------|
| Kanca | **≤ 0,5 sn**; açılışta **0,3 sn'den uzun** boş ya da siyah kare yok |
| Doruk (kahraman anı) | sürenin **%60–75'inde** (10 sn'de 6,0–7,5 sn) |
| Son kare | **0,8–1,2 sn** tutulur, küçük canlı hareketle (%2 itiş, nefes, kaynama); donmuş son kare hata gibi okunur |
| Planlar | 6–10 anahtar anda durağan kare, her biri tek başına poster olabilmeli |

Uzun filmde kanca ilk 3 sn'de (`yonetmenlik.md` § 5); kısa filmde 0,5 sn.

## Bekleme (hold)

Ekrandaki yazı animasyonu bittikten sonra en az **harf ÷ 15 + 1,5 sn**
durur (boşluksuz harf sayısı; Türkçe kelimeler uzun olduğu için kelime değil
harf): "Seans Açıldı" 11 harf → 2,2 sn. Altyazı en az 1,8 sn. Tek kural bu;
`yonetmenlik.md` § 2 ve `scripts/film-read.mjs` aynısını ölçer. Beklerken
%2'lik yavaş bir itiş kareyi canlı tutar, yazıyı okunur bırakır.
**Okunurken hareket eden yazı** yasak listesindedir.

## Kamera ve paralaks

Görüş açısı 30–50°, kamera hiç park etmez. Paralaks hızları: ön 1,0,
orta 0,5, arka 0,2.

## Renk modu: zemin parlaklığını yaz

"Motion graphics" tek bir paletle gelmez: 350 örnekte 198 koyu, 152 açık
nötr zemin (%57 / %43; kaynak: athemeroy/awesome-claude-5-5-videos
`docs/color-modes.md`, `research-guide.md`, CC BY 4.0). Zemini yazmazsan
model kendi varsayılanını seçer. LOOK satırında her zaman:

- **zemin parlaklığı** açıkça: "açık kâğıt (`--color-page`, L* ~95)" ya da "koyu zemin (L* ~12)"; filmin içinde değişiyorsa hangi perdede
- ana renkler ve TEK vurgu (token adlarıyla)
- planlar arası tutarlılık: zemin her planda aynı mı, sel/ters palet nerede döner

## Kontrast ve yanıp sönme (WCAG)

Yazı **her karede** 4,5:1 (hareketli zemin üstünde de). Saniyede **3'ten
fazla** parlama yok.

## Telefon boyu

Akış her şeyi küçültür: anahtar pozları doğru gelenden %10–30 fazla it.

## Sıfattan sayıya çeviri

| Gelen not | Gönderilecek not |
|-----------|------------------|
| "Patlasın" | ölçek 1,0 → 1,08 → 1,0, 6 karede, tepe vuruşta |
| "Premium hissettirsin" | girişler ease-out-quint, yaylar ζ 0,8, yazıda taşma yok |
| "Sürüklüyor" | her beklemeyi 12 kare kısalt (120 BPM, 24 fps'te bir vuruş), kesmeler ızgarada kalsın |
| "Kalabalık" | tek seferde tek kahraman; gerisi 150 ms sonra, yolunun %60'ı |
| "Yapay zekâ gibi duruyor" | kullandığı varsayılanları ADIYLA say, her birini yasakla, yeniden render et |
| "Sonu ani" | son kareyi 1,0 sn tut, %2 itiş, ζ 0,8'lik yayla otursun |
| "Açılış yavaş" | ilk olay 0,5 sn içinde; ilk 0,3 sn'den sonra boş kare yok |
