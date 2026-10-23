# Arayüz animasyon denetimi — bir sitenin bütün hareketini sayıyla elden geçirmek

Kaynak: Açılış Zili, 12 Ekim 2026. Florence'ın sayı tablosu
(`sayilar.md`) ve anatomy'nin figür kuralları (`aciklayici-figur.md`) bir
filme değil, 125 animasyonlu çalışan bir arayüze uygulandı. Bu dosya o
geçişin yöntemi, kuralları ve ölçümle bulunan tuzaklarıdır.

## Yöntem: envanter → sınıf → sayı → ölçüm

1. **Envanter.** Bir subagent'a tara: `@keyframes`, `animation:`,
   `transition:`, motion `initial/animate/exit`, `element.animate`,
   `requestAnimationFrame`, `animation-timeline`. Her satır için dosya:satır,
   ne hareket ediyor, süre, eğri, tetik, döngü mü.
2. **Sınıfla.** Giriş · çıkış · geri bildirim · döngü · kaydırmaya bağlı ·
   sayaç · figür. Her sınıfın sayısı farklı.
3. **Sayıyla düzelt** (aşağıdaki tablo). Toplu iş için script yaz; örnek
   diff'leri gözle kontrol et.
4. **Ölç.** Tarayıcıda `getAnimations()` ile süre ve gecikme, konum için
   `getBoundingClientRect`, ara kare için animasyonları duraklatıp
   `currentTime` ver ve çek (headless Chrome çalışan animasyonu başa sarılmış
   karede yakalar). Yatay taşma her genişlikte.

## Sınıf başına sayı

| Sınıf | Süre | Eğri | Not |
|-------|------|------|-----|
| Geri bildirim (hover, basış) | 100–200 ms | ease-out | Yay yalnız tek küçük öğede |
| Açılır katman girişi | 160–320 ms | ease-out-quint | |
| Açılır katman çıkışı | girişin %55'i | ease-in-quint | `exitOf(giriş)` |
| Her gezinmede oynayan giriş | 200–500 ms | ease-out-quint | Sayfa başlığı 760 → 480 ms indi |
| Kahraman figür / sahne | 600–900 ms | ease-out-quint/expo | Bir kez, görünce |
| İkincil öğe | kahramandan 100–200 ms sonra | aynı | Yolun %50–70'i |
| Simetrik döngü (nefes, iskelet) | ≥ 1,2 sn | ease-in-out-sine | `--ease-loop` |
| Ekran boyunca taşıma | 400–700 ms | ease-in-out-quart | `--ease-move`; tema perdesi |
| Kaydırmaya bağlı | — | **doğrusal kalır** | İlerleme kaydırmadır; eğri ekler, kaydırmayı yalan söyletir |

## Bulunan tuzaklar (hepsi ölçümle)

- **Modül CSS'i Tailwind'in varsayılan eğrisini almaz.**
  `--default-transition-timing-function` yalnız `transition-*`
  yardımcılarına gider. Eğrisiz `transition: opacity 200ms` tarayıcının
  `ease`ine düşer: 43 dosyada 318 geçiş. Kural: modül CSS'inde eğri hep açık.
- **Her öğede kayan-beliren giriş** (yasak listesindeki "fade-and-slide-up
  on every element"). Panel girişi yalnız opaklığa indi; kayma yalnız
  kahramanda kaldı.
- **`left` animasyonu** her karede düzeni yeniden hesaplatır. Yerine ayrı
  `translate` özelliği (öğenin `transform`unu yöneten başka bir animasyonla
  çakışmaz); yüzdeyi piksele çevirmek için ya ebeveyn genişliği
  (`offsetParent.clientWidth`) ya da CSS'te kap sorgusu birimi:
  `container-type: inline-size` + `translate: calc(var(--at) * 100cqw) 0`.
- **Veri değerini 0'dan saymak** uydurma kesinliktir: ara kareler hiç
  yayımlanmamış değerlerdir. Ölçülmüş değer yerinde durur; sayaç yalnız
  boyutsuz puanda ve dolan bir halkayla.
- **Okunan yazıyı küçültüp söndürmek** (kaydırırken kahraman %35'e iniyordu):
  opaklık ≥ .7, ölçek yok, 12 px'lik ikincil geri çekilme yeter.
- **Uzun kademe**: Claude sahnesi 2,9 saniyede kuruluyordu. Kahraman 14 px,
  gerisi 8 px; sonraki öğe öncekinin ~%40'ı bitince → ~1,1 sn.
- **Büyüteç**: 18 px'lik hücrede 1,5 ölçek komşuları örtüyordu; kimliği
  halka veriyor, 1,25 yeter.

## Açıklayıcı figür sayfada: son kareyi bas, ekran dışındaysa kur

Figür bir kez oynar ama okuyucu onu **bitmiş hâliyle** de görebilmeli (JS
yok, hareket azaltılmış, figür ilk ekranda). Desen (`PlayOnView`, Açılış
Zili `components/motion/PlayOnView.tsx`):

```tsx
useEffect(() => {
  const node = ref.current;
  if (!node || reduced || typeof IntersectionObserver === "undefined") return;
  if (node.getBoundingClientRect().top < innerHeight) return; // ilk ekranda: son kare
  node.dataset.armed = "";                                    // görünmeyen yerde kur
  const io = new IntersectionObserver((entries) => {
    if (!entries[entries.length - 1].isIntersecting) return;  // EN YENİ kayıt
    node.dataset.play = "";
    io.disconnect();
  }, { threshold: 0.4 });
  io.observe(node);
  return () => { io.disconnect(); delete node.dataset.armed; delete node.dataset.play; };
}, [reduced]);
```

```css
.stage[data-armed] .band { animation: band 600ms var(--ease-brand) both; }
.stage[data-armed] .dot  { animation: drop 360ms var(--ease-brand) calc(750ms + var(--i) * 70ms) both; }
.stage[data-armed]:not([data-play]) :is(.band, .dot) { animation-play-state: paused; }
@keyframes drop { from { opacity: 0; translate: 0 -10px; } } /* `to` yok: öğenin kendi opaklığına iner */
```

- Taban durum figürün kendisi; animasyon yalnız `data-armed` altında var.
- Öznitelik DOM'a yazılır, React durumuna değil: sunucu HTML'i yeniden
  çizilmez.
- `to`suz anahtar kare, kısık öğenin (`opacity: .55`) kendi değerine iner.
- Ölçüm: önce `paused`, görünce `running`, sonra `finished`; ilk ekranda
  `getAnimations()` boş.

Örnek: Açılış Zili `app/(app)/hisse/[symbol]/_panels/ExpectedMoveFigure.tsx`.
Opsiyonların fiyatladığı ± bant sıfırdan açılır (kahraman), geçmiş
raporların hareketleri en eskiden yeniye bandın içine ya da dışına düşer
(ikincil). Künyede "Son 8 raporun 2 tanesi bandın dışına çıktı" yazar.
Böylece nesnenin kendisi soruyu cevaplar.

## Kontrol listesi

- [ ] Envanter çıkarıldı, her animasyon bir sınıfta
- [ ] Modül CSS'inde eğrisiz `transition`/`animation` yok; elle `cubic-bezier` yok
- [ ] Çıkışlar girişin %50–60'ı, ease-in
- [ ] Her gezinmede oynayan giriş ≤ 500 ms; kademede tek kahraman
- [ ] `left`/`top`/`width`/`margin` animasyonu yok (bilinçli tek düğme morfu hariç, gerekçesi yorumda)
- [ ] Ölçülmüş veri 0'dan sayılmıyor; okunan yazı küçülmüyor
- [ ] Kalıcı döngüler (canlı nokta, işaret) ≥ 2,4 sn ve `--ease-loop`; yükleme döngüleri geçici
- [ ] Açıklayıcı figür son kareyi basıyor, yalnız ekran dışındayken kuruluyor
- [ ] Ölçüm yoruma yazıldı (süre, piksel, kare)
