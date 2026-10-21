# Müzik klibi — şarkıdan film

Hazır bir şarkıya kodla klip: sözler sesle kelime kelime oynar, kesmeler
vuruşa düşer, görüntü davula tepki verir. Kural her yerdeki gibi: **kare
şarkı zamanının saf fonksiyonudur.** Fark şu: zamanın kendisi ölçülür.
Elle yazılan tek saniye, tek BPM yoktur; her sayı şarkının analizinden gelen
bir JSON'dan okunur (kaynak: mexicat/pdoom-video, MIT — bölümün yöntemi ondan,
sözlerimiz ve kodumuz bizim).

Karşı örnek (PDoomVideo, lisanssız, yalnız fikir): aynı şarkı, BPM ve ofset
elle yazılmış, satır zamanları ekrana yakılmış altyazıdan, kelime silmesi
satır boyunca tahmin. Elle yazılan tempo ölçülenle tutmuyordu; her vuruşta
biriken hata şarkının sonunda kesmeleri vuruştan, silmeyi sesten koparır.

## 0. Hak

- Şarkının ve sözlerin hakkı **kullanıcıda olmalı** ya da kullanıcı izni
  almış olmalı (kendi şarkısı, lisanslı, açıkça izin verilmiş). Sormadan
  başlama; yayın platformları içerik tanıma ile klibi sessize alır ya da kaldırır.
- Kod MIT olsa da şarkı, sözler, sözlerden üretilen zamanlama dosyası
  (`lyrics.json`) ve fontlar o lisansın içinde değildir. Örnek bir projeden
  ses, söz ya da söz zamanlaması kopyalanmaz; yalnız yöntem alınır.
- Sözleri model yazmaz, hatırladığından tamamlamaz: kullanıcının verdiği
  metin tek kaynaktır. Repo'ya şarkıyı koymak gerekiyorsa `.gitignore` ve
  lisans notu; `CREDITS`'te söz yazarı, besteci, yorumcu.

## 1. Veri: iki JSON, bütün film onları okur

```ts
// data/audio.json — analiz betiği üretir, elle düzeltilmez
type AudioData = {
  duration: number; bpm: number;          // bpm yalnız bilgi; zaman beats'ten
  beats: number[]; downbeats: number[];    // saniye, gapless çözüm zamanında
  sections: { name: string; start: number; end: number }[];   // ölçü başlarında
  fps: number;                             // zarfların örnek hızı (100)
  features: Record<"rms" | "low" | "mid" | "high" | "vocal" | "drums" | "bass", number[]>;  // 0..1
  onsets: Record<"kick" | "snare" | "hat" | "vocal", [t: number, strength: number][]>;
};
// data/lyrics.json — hizalama hattı üretir (§ 4)
type Lyrics = { lines: { text: string; start: number; end: number;
  words: { w: string; start: number; end: number; conf?: number; syl?: [number, number][] }[] }[] };
```

- **Izgara sabit tempo + faz** olarak oturtulur (pop/elektronik çoğunlukla
  tıkla kaydedilir), sonra her vuruş ayrı yazılır. Kontrol: 15 sn'lik
  pencerelerde faz sapması ≤ 2 ms ise tempo sabit; değilse (canlı kayıt)
  vuruşları tek tek izle, `beats` zaten serbest dizidir.
- Faz kick ataklarında inceltilir (düşük bandın log enerjisinin en dik
  yükselişi), onset tepesinde değil (§ 3).
- **Ölçü başı (downbeat)** davul kalıbından (snare 2 ve 4'te) ve akor
  değişiminden; yarım ölçü belirsizliğini armoni çözer. Yanlış downbeat bütün
  kesmeleri yarım ölçü kaydırır: ilk nakaratın vurgulu hecesi ölçü başına
  düşüyor mu, bak.
- **Bölümler ölçü başında başlar:** ilk söz satırının başladığı ölçü. Satır
  kısa bir öncü (pickup, < 2 vuruş) ile başlıyorsa öncü önceki bölümde kalır;
  nakarat öncüsü uzunsa (3 vuruş) bölüm öncünün ölçüsünde başlar.
- Zarflar 100 fps, hızlı atak (10 ms) yavaş bırakma (90 ms) — görüntüye uygun;
  her biri 0..1'e normalize (yüksek yüzdelikle, en büyükle değil).

## 2. Zaman referansı: mp3 kodlayıcı gecikmesi

Tek bir zaman çizelgesi seç ve her şeyi ona taşı: **mp3'ün gapless çözümü**
(ffmpeg, libsndfile ve tarayıcılar kodlayıcı gecikmesini kırpar). Tuzak: stem
ayıran ya da analiz eden bir araç mp3'ü gecikmeyi kırpmadan çözebilir. LAME
başa ~1105 örnek ekler (48 kHz'de ~23 ms); o araçtan gelen stem ve zamanlar
bütün şarkı boyunca 23 ms geç kalır — sözün iki-üç karesi.

- Ofseti tahmin etme, **çapraz korelasyonla ölç:** stem toplamını (ya da
  vokal stem'ini) gapless karışımla korele et, tepenin gecikmesi ofsettir.
  Şarkının başında, ortasında, sonunda ayrı ölç: sabitse tek kaydırma,
  değilse örnek hızı karışmıştır (44,1 ↔ 48 kHz).
- Kaydırmayı yükleyen tek fonksiyonda uygula (stem'i okurken baştan örnek
  kes), her betik o fonksiyondan okusun; JSON'a "zaman = gapless mp3 çözümü"
  notunu yaz.
- Videoda sesi muxlarken de aynı dosya: başka bir kodlama (AAC) kendi
  dolgusunu ekler; çözülmüş MP4'te bir vuruşun ofsetini ölç (`ses.md`).

## 3. Onset dedektörleri geç okur

Spektral akı (spectral flux) tepeleri atağın ortasına düşer: düz `librosa`
onset'i davul ve efektte **20–40 ms geç** okur. İnceltme: her onset'in
[−60, +10] ms penceresinde 1 ms çözünürlüklü enerji zarfının (40 Hz yüksek
geçiren, log) en dik yükselişini al; davulda ~2–5 ms doğruluk
(kaynak: mg-styles-15 `qc.py`, MIT). Vokalde aynı fikir hecenin girişine:
ünlü üstünde tutulan notada CTC de geç ateşler (§ 4).

## 4. Kelime zamanlama hattı

Satır düzeyi zaman (altyazı dosyası) karaoke için yetmez; kelime, uzun
notada hece gerekir. Hat (kaynak: mexicat/pdoom-video, MIT):

1. **Stem ayır:** Demucs (`htdemucs_ft`) ile vokal; nakaratlar çift kayıtlı ve
   L/R'ye açıksa sol ve sağ kanalı ayrı kaynak olarak da tut (her biri tek
   sese daha yakın). Arka vokal yoğunsa ayrıca bir "karaoke" modeliyle
   yalnız baş vokal. Stem'i § 2'deki ofsetle hizala.
2. **Zorlamalı hizalama (CTC forced alignment):** bilinen söz metnini vokal
   stem'inin CTC olasılıklarına oturt (tek, bütün şarkı boyunca kısıtlı
   Viterbi; satırlar arasına "çöp" belirteci). Birden çok akustik modelin
   olasılıklarını birleştir. Kısaltma, sayı, tuhaf kelime fonetik yazımla
   ("GPT" → "ci pi ti", "3D" → "üç de"); Türkçede çok dilli model (ör. MMS) ve
   romanize metin.
3. **Whisper kelime zamanlarıyla çapraz kontrol** — kaynak değil, kontrol:
   Whisper sözü yanlış duyar, tekrarları atlar, olmayan kelime uydurur.
   İki hizalamanın 60 ms'den fazla ayrıldığı yer incelenecek listeye girer.
4. **Sinyalden incelt** (vokal RMS, perde, onset; 5 ms adım): ≥ 50 ms
   sessizlikten sonra ses CTC'den > 40 ms önce giriyorsa başlangıç oraya
   (tutulan ünlüde CTC geç ateşler); değilse yakındaki en güçlü vokal onset'ine
   çek (ardından sürtünme gelen onset kelime sonudur, alma); bitiş, ses
   kelimenin düzeyinin 15 dB altına ≥ 60 ms indiği yer.
5. **Kelime başına güven** (`conf` 0..1): bağımsız hizalamaların (model,
   kanal) ≤ 60 ms uyumu + CTC olasılığı. Düşük güvenli kelimede görsel vurguyu
   yumuşat (sert silme yerine kısa geçiş), kesme ona bağlanmaz.
6. **Elle düzeltme tablosu (FIX), her satırda gerekçe:** yalnız grafik
   otomatik sonucun yanlış olduğunu açıkça gösteriyorsa. Gerekçesiz düzeltme
   bir sonraki koşuda kimin neden yaptığı bilinmeden geri alınır.
   ```ts
   // (satır, kelime) → düzeltme; gerekçe ZORUNLU, kaynağı grafikteki gözlem
   const FIX: Record<string, { start?: number; end?: number; conf?: number; why: string }> = {
     "4:2": { start: 18.31, why: "uzun legato ünlü; perde düşüşü 18,31'de, CTC 0,2 sn geç ateşledi" },
     "31:0": { start: 101.6, conf: 0.4, why: "baş vokal arka koronun altında; ritim 2. nakaratla aynı yerden" },
   };
   ```
7. **QA grafikleri satır satır:** spektrogram + perde + vokal zarfı + onset'ler
   + kelime sınırları üst üste. Model sesi duyamaz; grafiğe bakar. Her satır
   bir PNG, şüpheli satırlar yakınlaştırılmış.

**Bilinen hata kipi — sözler şarkının sonuna doğru geç kayar.** Küçük bir
ofset hatası, bir yerde kaçan satır ya da satır zamanından tahmin edilen
kelimeler birikir; ilk dakika kusursuz görünür, son nakarat yarım vuruş geç.
Her zaman **son nakaratı** ve köprüden sonraki ilk satırı ayrıca kontrol et;
aynı nakaratın tekrarlarındaki kelime aralıkları birbirini tutmalı (ritim
aynıysa aralık aynıdır).

## 5. Kurgu veriden türer

Sahne sınırı saniye değil, söz + ızgaradır. Söz **içeriğiyle** aranır; bulunamazsa
fırlatır (`film-kit.ts → lyric`). Hizalama yeniden koşunca zamanlar değişir,
kurgu kendiliğinden izler; söz düzeltilince eşleşmeyen arama yazarken patlar.

```ts
import { lyric, cutAt, downbeatAfter, type BeatGrid, type LyricLine } from "./film-kit";

export function edit(lines: LyricLine[], g: BeatGrid & { sections: { name: string; start: number }[] }, duration: number) {
  /** Satırın ilk kelimesinden önceki son vuruş: kesme kelimeyi bölmez, resim sesten önce değişir. */
  const cut = (q: string, nth = 0, tol = 0.02) => cutAt(lyric(lines, q, nth), g, tol);
  /** Satır bittikten sonraki ilk ölçü başı. */
  const after = (q: string, nth = 0) => downbeatAfter(lyric(lines, q, nth), g);
  const b = {
    verse: cut("ilk dizenin başı"),
    hook1: cut("nakaratın başı", 0),      // tekrarlanan nakarat: nth
    hook2: cut("nakaratın başı", 1),
    // vuruşundan 32 ms ÖNCE başlayan kelime: tol büyür, kelime yarıya bölünmesin
    bridge: cut("köprü dizesi", 0, 0.05),
    outro: g.sections.find(s => s.name === "outro")?.start ?? after("son dize"),
    end: duration,
  };
  return b;
}
```

- `cut` asla kelimeden SONRA değildir; ilk kelime vuruştan birkaç ms önce
  başlıyorsa `tol`u büyüt ve nedenini yorumda yaz.
- Çoğu kesme ölçü başında sert kesmedir; geçiş yalnız bilinçli.
- Vuruş bazlı her şey (kamera itişi, ölçüde yerleşim değişimi)
  `floor(beatAt(t))`, `beatAt(t) % 1` (vuruş fazı) ile; `t * bpm / 60` değil.

## 6. Davula tepki: durumsuz darbe

```ts
const kick = hit(audio.onsets.kick, t, 0.12);   // 1 vuruş anında, 0,12 sn'de yarıya
const snare = hit(audio.onsets.snare, t, 0.14);
const scale = 1 + 0.04 * kick;                   // ölçek darbesi; renk ve opaklık zıplamaz
```

- `hit` onset listesinden hesaplar: t'den önceki onset'lerin üstel sönümünün
  en büyüğü. Kare sırası, geri sarma, alt kare örneklemesi aynı sonucu verir.
  "Her kickte sayaç artır" kare sayar; alt karelerde ve sarmada bozulur.
- Sürekli tepki zarftan: `env("low", t)` doğrusal ara değerle. Titreme
  istenen tepki için zarfı tepe tutmayla oku (son 80 ms'nin en büyüğü).
- Ölçü ve vuruş fazı (`beatAt(t) % 1`) hareketin döngüsüdür; darbe yalnız
  vurgudur. Her vuruşta her şey değişmez (`sayilar.md` § vuruş).
- Saniyede ≤ 3 parlama kuralı müzikte de geçer: hat'e parlama bağlama.

## 7. Söz ekranda

Karaoke kuralları ve kerning'li parça konumu: `kinetik-yazi.md` § şarkı sözü.
Özet: vurgu sesin önüne geçmez (`wordProgress`, hece hece), soluk ön gösterim
≤ 0,4 sn, kelime başında tam 0 sonunda tam 1, başlık güvenli alan ≥ 96 px
(1080p), söz altyazı değil görüntünün içinde.

## 8. Teslimden önce

- [ ] Şarkı ve sözlerin hakkı kullanıcıda; `CREDITS` dolu; örnekten ses/söz/zamanlama alınmadı
- [ ] Kodda elle yazılmış saniye ve BPM yok; her sınır `cut`/`after`/bölümden
- [ ] Zaman referansı gapless çözüm; stem ofseti çapraz korelasyonla ölçüldü, sabit
- [ ] Onset'ler inceltildi (ham spektral akı değil)
- [ ] Hizalama: düşük güvenli kelimeler listelendi; her FIX'in gerekçesi var; QA grafikleri satır satır
- [ ] Son nakarat ve köprü sonrası ayrıca kontrol edildi; tekrarlanan nakaratların aralıkları tutuyor
- [ ] Çözülmüş MP4'te üç vuruş (baş, orta, son) karesiyle hizalı (ms olarak yazıldı)
