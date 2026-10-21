# Mürekkep ve kâğıt — elle yapılmış görünüm

Hedef "bir insan bunu kare kare boyamış" hissi. Araçlar `assets/ink-engine.ts`
ve `assets/film-kit.ts`te; aşağıda neyin neden öyle olduğu.

## Fırça

`brush(ctx, pts, o)` çizgiyi `lineWidth` ile değil, merkez hattın iki yanına
basınç kadar açılan **dolu çokgen** olarak çizer: girişte ince, ortada dolgun,
çıkışta sivri (`sin(πu)^0,55`), üstüne tohumlu gürültü. `progress` yay
uzunluğuyla keser ("yarısı çizildi" gerçekten yolun yarısı); çizilen ucun
kendisi de sivrilir.

Seçenekler: `taper` (uç incelmesi), `taperStart` (iki yarımın birleştiği
yerde 0: boğum kalmasın), `wobble` (kenar titremesi), `dry` (kuru fırça
izleri), **`boil`**, **`pressure`**.

## Boil — 12 karede bir yeniden çizim

```ts
const bo = boilFrame(t, FPS); // saniyede 12, kare sırasından
brush(ctx, line, { width: 2.6, seed: 11, boil: bo, color: pal.ink });
```

- `Math.floor(t * 12)` YAZMA: karenin tam anında değişir ve bulanıklıklı
  render'da (`--shutter`) her ikinci karede çift pozlama verir
  (`video-uretimi.md` § kare sırası kuralı).

- Yalnız KENAR gürültüsü kayar (`noise1(seed + bo * 7919, …)`). Kuru fırça
  izleri ve basınç sabit kalır; yoksa izler "sürünür" (ink-wash: "small boil
  on the width noise").
- **Her öğeye kendi tohumu.** Tek bir rastgele akış paylaşılırsa hareket
  eden bir öğe sonrakilerin akışını kaydırır ve duran her şey her karede
  kaynar (ClaudeAnimationBase `boilSeed`). Bizim motorda tohum açık parametre:
  öğe başına sabit `seed + n` ver.
- Hareketi azaltan için kare donuk: `t` sabit → `bo` sabit.

## Kalem: zaman eğriliğe, basınç hıza

```ts
const pen = penTiming(points);                       // film-kit.ts
const now = pen.at(ease.inOut(span(t, A, B)));       // { arc, idx }
brush(ctx, points, { progress: now.arc, pressure: pen.pressure, boil: bo, ... });
for (const i of pen.pools) if (now.idx >= i) blot(ctx, points[i].x, points[i].y, 1.5 * pen.pressure[i], { ... });
penShadow(ctx, pen.nib(now.idx), pal.ink);           // kalemin kendisi çizilmez
```

- Zaman ağırlığı `segment × (1 + 2,5 × dönüş açısı)`: keskin dönüşte el yavaşlar.
- Basınç `0,7 + 0,75·e^(−2,2 / (1 + 2,5·dönüş))`: yavaş = kalın, hızlı = ince.
- Dönüş > 0,75 rad: mürekkep göllenir (küçük `blot`).
- Kalem kalkınca **sarkık damla** (`teardrop`), yuvarlak leke değil.
- Kalemin gölgesi düz ve soluk (α 0,075); bulanık gölge ekosistemde yok.
- Çentik/işaret gibi kalemle birlikte doğan şeyler `pen.at(...).idx`ten
  doğsun — doğrusal `i / n` kalemden önde ya da geride kalır.

## Kâğıt

- `fibres(ctx, w, h, pal.ink, cam.z, seed)` DÜNYA koordinatında çizilir:
  kamera kayınca kâğıt da kayar, sahne "üstüne çizilen bir yüzey" olur.
- Yakında biraz belirginleşir, kalınlık zoom'la büyümez (`0,7 / z`).
- Tam ekran gren ayrı bir katmanda ve videoda ffmpeg'de eklenir; sayfa
  içinde gren her kareyi sıkıştırılamaz yapar (lemo-opuscar TECHNIQUE).

## Sel (ink flood) — sert açık/koyu geçiş

```ts
const cover = inverted(ctx, flood, pal, p => ({ ...p, ink: p.paper, paper: p.ink }), p => world(p), seed, t);
```

1. Sel yoksa ya da tam değilse dünya normal paletle çizilir.
2. Selin kenarı (`floodPath`: açının periyodik üç sinüsü — değer gürültüsü
   0/2π'de kırık bırakır, küçük selde çiçek gibi okunur) mürekkeple doldurulur
   ve **kırpma** yolu olur.
3. Aynı dünya ters paletle bu kırpmanın içine çizilir: sınırı geçen çizgi
   rengini tam orada değiştirir.
4. Dönen `cover` (0–1) DOM'a gider: altyazı ≥ 0,72'de kâğıt rengine döner.

Kaynak ve hedef birer ÖĞE olsun: sel bir çizginin ucundan dökülür, bir
milin damlasına çekilir. Selin merkezi kamera dönüşümünden geçmiş EKRAN
noktası olmalı.

## Damla, sıçrantı, mühür

- `blot(x, y, r, { squash })`: hacmi koruyan ezilme; düşerken > 1 (uzar),
  değişte < 1, `damped` ile toparlanır. Hız yönünde uzatmak için önce
  `ctx.rotate(hızın açısı)`.
- `splatter(t)`: çarpmadan sonra savrulan damlacıklar, tohumdan; `fade` ile
  kurur (başka şeklin üstünde çil gibi kalmasın).
- `seal`: tek vurgu renginde kare; yazı `destination-out` ile **oyulur**
  (arkadaki kâğıt görünür). Büyükten iner, değince ezilip toparlanır,
  kenarından boya sıçrar. Pürüzler yalnız kenar bandında.

## Renk

- Mürekkep = temanın en koyu metin rengi, kâğıt = OPAK sayfa zemini
  (yarı saydam yüzey token'ı ters palette yanlış renk verir). Ters palette
  kâğıt rengi metin olur.
- Tek vurgu rengi (pirinç, kırmızı mühür…), anlamlı yerde, bir kez ya da iki
  kez (kafiye için). Yön renkleri (yeşil/kırmızı) yalnız anlam taşıyorsa.
- Logo karosunun zemini projenin logo token'ı (`--logo-plate` gibi); elle `#fff` yok.
- Glow, blur, cam yok (ekosistem kuralı; bulanıklık yerine smear ve alt kare).
