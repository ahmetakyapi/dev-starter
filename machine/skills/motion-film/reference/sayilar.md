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

## Bekleme (hold)

Ekrandaki yazı en az **kelime başına 0,3 sn + 0,5 sn** durur (iki kelimelik
başlık 1,1 sn). Beklerken %2'lik yavaş bir itiş kareyi canlı tutar, yazıyı
okunur bırakır. **Okunurken hareket eden yazı** yasak listesindedir.

## Kamera ve paralaks

Görüş açısı 30–50°, kamera hiç park etmez. Paralaks hızları: ön 1,0,
orta 0,5, arka 0,2.

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
