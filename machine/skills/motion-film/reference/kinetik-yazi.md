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
- Harf yerleri ön ekin ölçüsünden: `measureText(text.slice(0, i))` — kerning korunur.
- Hızlı harfin arkasında iki soluk kopya (α 0,3 ve 0,16, hızın 1,1 ve 2,2 katı
  geride): bulanıksız hareket izi (smear).
- Maske üstte 1,02em, altta 0,3em: Türkçe imler (İ, Ü, Ö) ve kuyruklar (ğ, ş, ç) kesilmez.
- Font yüklenmeden ölçme: `document.fonts.load("850 40px Aile", "İşğÜ")` → sonra çiz.
- Değişken aile varsa ağırlık 800–900; Title Case; Türkçe büyük harf `toLocaleUpperCase("tr-TR")`.
- Dönen kelimeler (bekleyen perde): her 1,9 sn'de bir, `slot = floor(since / 1.9)`;
  düşen öğelerin yoluyla kesişmeyen bir bantta.

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
