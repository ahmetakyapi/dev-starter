# Kinetik yazı — dev kelime

Bir perdenin tek kelimesi çerçeveyi doldurur ("Manşetler", "Rapor Hazır",
sembol). Küçük açıklama altyazıda ya da künyede kalır; ikisi aynı şeyi
tekrarlamaz.

## Tuvalde (`film-kit.ts → kinetic`)

```ts
const size = fitSize(ctx, family, word, width * 0.86, 150);
kinetic(ctx, word, { x: cx, y: cy + size * 0.36, size, family, color: pal.ink, t,
  inAt: 10.0, outAt: 11.1, stagger: 0.04 });
```

- Harfler satırın **maskesinden** sırayla yükselir (`ease.out`, taşma yok),
  çıkışta önce hafif çöker (`backIn`) sonra yukarı kaçar.
- Harf yerleri `glyphX`ten (aşağıda): ön ekin ölçüsü kerning'i düşürür.
- Hızlı harfin arkasında iki soluk kopya (α 0,3 ve 0,16, hızın 1,1 ve 2,2 katı
  geride): bulanıksız hareket izi (smear).
- Maske üstte 1,02em, altta 0,3em: Türkçe imler (İ, Ü, Ö) ve kuyruklar (ğ, ş, ç) kesilmez.
- Font yüklenmeden ölçme: `document.fonts.load("850 40px Aile", "İşğÜ")` → sonra çiz.
- Değişken aile varsa ağırlık 800–900; Title Case; Türkçe büyük harf `toLocaleUpperCase("tr-TR")`.
- Dönen kelimeler (bekleyen perde): her 1,9 sn'de bir, `slot = floor(since / 1.9)`;
  düşen öğelerin yoluyla kesişmeyen bir bantta.

## Kelimeyi parça parça çizmek: kerning tuzağı

Harf harf giriş, söylenen/söylenmemiş iki renk, kırpılmış silme — hepsinde
koşu parçalara bölünür ve her parçanın x'i gerekir.

- **YANLIŞ:** `x0 + measureText(text.slice(0, i)).width`. Ön ek i−1. harfte
  biter, sonraki harfi görmez; (i−1, i) kerning çifti düşer. Her harf kendi
  sol çiftini kaybeder: "AV", "Yo", "Ta", "Ve" arası açılır, aralık düzensiz
  okunur. Ön eklerin ilerlemelerini toplamak da aynı hata, yalnız biriktirir.
- **DOĞRU (Canvas 2D):** harfi ön eke kat, kendi ilerlemesini çıkar —
  `x_i = W(text[0..i]) − W(text[i])`. Çift ölçünün içinde kalır; her x tek
  ölçüden geldiği için hata birikmez ve son harfin x'i + ilerlemesi bütün
  koşunun genişliğine eşittir (`film-kit.ts → glyphX`; kaynak:
  mexicat/pdoom-video, MIT).
- **`actualBoundingBox*` konum değildir:** harfin mürekkep kutusu, başlangıç
  noktasına göre (italikte sola taşar, "j" kuyruğu geri döner). Konum
  ilerlemeden (`width`), maske ve kırpma payı mürekkep kutusundan: i. harfin
  sağ kenarı `x_i + measureText(text[i]).actualBoundingBoxRight`. Ligatürsüz
  harfte tek başına ölçülen kutu koşudakiyle aynıdır; kerning yalnız konumu kaydırır.
- **Silmede koşuyu hiç bölme:** bütün satırı soluk renkte çiz, sonra aynı
  satırı parlak renkte `clip()` dikdörtgeniyle yeniden çiz; dikdörtgenin sağ
  kenarı `x0 + glyphX(k) + kesir × harf genişliği`. Harfler hep tek koşuda
  çizildiği için kerning, ligatür (fi, fl) ve bağlamsal biçimler bozulmaz.
  Harf harf ayrı çizim yalnız harfler ayrı hareket ediyorsa (yükselme,
  dağılma) gerekir; o zaman konum `glyphX`ten.
- Ölçerken `ctx.letterSpacing = "0px"`; izleme isteniyorsa `i × izleme` elle
  eklenir (aralık eklenmiş tek harfin ölçüsü çıkarmayı bozar). Ölçüm ve
  çizim AYNI `ctx.font` ve `fontKerning` ile.
- Ölçek değişiyorsa (dev yazı büyüyor) harfleri ölçekli ölçme: sabit bir
  puntoda ölç, dönüşümle büyüt — ilerlemeler puntoyla tam orantılı değil
  (ipuçlama, alt piksel konumlama), her karede başka puntoda ölçülen x'ler titreyebilir.

## Şarkı sözü (karaoke)

Sözcük düzeyinde zamanlanmış söz (`muzik-klibi.md`) kinetik yazıyla
oynanırken. Kurallar (kaynak: mexicat/pdoom-video, MIT):

- **Vurgu sesin önüne asla geçmez.** Kelime `start`ında tam 0, `end`inde tam
  1 (`wordProgress`); hece zamanı varsa hece hece, heceler arasında bekler.
  Erken parlayan kelime, geç parlayandan çok daha "yanlış" okunur.
- **Ön gösterim soluk ve kısa:** satır sesten en çok **0,4 sn** önce soluk
  (α ~0,3) görünebilir; okuyan göz önden gitsin, ama vurgu sese bağlı kalsın.
  Satırı daha erken gösterme: izleyici okuyup sesi beklemeye başlar.
- **Başlık güvenli alan ≥ 96 px** (1080p'de; 4K'da 192): söz kenara, köşedeki
  künyeye ya da kontrol çubuğuna değmez. Sosyal medya kırpması varsa
  9:16 güvenli alanını ayrıca dene.
- **Söz görüntünün İÇİNDE, altyazı DEĞİL.** Her sahne sözü kendi nesnesiyle
  taşır: kalemle yazılır, eğri üstünde kayar, forma damgalanır, kumaşa
  dokunur, haritaya etiket olur. Ekranın altında ortalanmış satır klip değil,
  karaoke makinesidir. Erişilebilirlik ve arama için ayrıca `.srt`/WebVTT ver.
- Tekrarlanan nakarat aynı yazıyla dönmez: aynı motif, her nakaratta değişmiş hâli.
- Kesme sözden türer: satırın ilk kelimesinden önceki son vuruş (`cutAt`);
  ekrandaki satır sahne değişmeden önce yarıda kalmaz.
- Okuma süresi kuralı (harf ÷ 15 + 1,5 sn) burada şarkıya teslim
  olur: süreyi şarkı verir. Satır okunamayacak kadar hızlıysa yazıyı küçült
  ya da kelimeyi tek tek göster, sesi bekletme.

## DOM'da (`KineticText`)

```tsx
export function KineticText({ text, delay = 0, stagger = 32 }: { text: string; delay?: number; stagger?: number }) {
  const words = text.split(" ");
  const starts = words.map((_, w) => words.slice(0, w).reduce((s, x) => s + Array.from(x).length, 0));
  return <span>
    <span className="sr-only">{text}</span>
    {words.map((word, w) => <Fragment key={w}>
      <span className="word" aria-hidden>{Array.from(word).map((ch, c) =>
        <span key={c} style={{ "--d": `${delay + (starts[w] + c) * stagger}ms` } as CSSProperties}>{ch}</span>)}</span>
      {w < words.length - 1 && " "}
    </Fragment>)}
  </span>;
}
```

```css
.word { display:inline-block; overflow:hidden; white-space:nowrap; vertical-align:bottom;
        padding:.12em .02em .22em; margin:-.12em -.02em -.22em; }
.word > span { display:inline-block; animation:letter-rise 760ms var(--ease-brand) var(--d,0ms) both; }
@keyframes letter-rise { from { translate:0 112%; } to { translate:0 0; } }
@media (prefers-reduced-motion: reduce) { .word > span { animation:none; } }
```

- Ekran okuyucu metni bir kez düz okur (`sr-only`); harfler `aria-hidden`.
- Kelime bölünmez, satır kelime arasında kırılır.
- Her harf ayrı `inline-block` olduğu için harfler arası kerning kaybolur
  (kutu sınırı çifti böler). Gövde puntosunda görünmez; dev başlıkta "Ta",
  "Yo" açılırsa hareketi kelime düzeyine al ya da çifte elle negatif `margin` ver.
- Gecikmeyi render sırasında sayaç artırarak verme (`index++`): React derleyici
  kuralına takılır; önek toplamıyla hesapla.
- **TUZAK — degrade başlık:** `background-clip: text` + `-webkit-text-fill-color:
  transparent` ebeveyne uygulanınca ayrı taşınan (`inline-block` + `translate`)
  harflere degrade boyanmıyor, harfler SAYDAM kalıyor. Sitenin başlıkları
  varsayılan degradeyse kinetik başlıkta onu kapat (Açılış Zili: `data-ink="plain"`).

## Künye (`tag`)

Küçük etiketler (Zirve 191,86 · 20 Günlük · RSI 71): maskeden yükselir,
altında 4 px kâğıt renginde hale (çizgi içinden geçse de okunur). Yerleşimi
çakışmaya göre seç: zirve son seanslardaysa son kapanış künyesi alta iner;
kadran ucun karşı yarısına gider; ekrana sabit düğmelerin altında künye kalmaz.
