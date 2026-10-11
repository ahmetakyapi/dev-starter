---
name: motion-film
description: >
  Kodla çizilen hareket filmi (motion graphics, kinetic typography, bekleme/yükleme
  filmi, ürün tanıtım videosu, açılış sahnesi, logo reveal, "odül alan animasyon")
  yapmak için yönetmenlik, teknik ve inceleme kiti. Canvas 2D / DOM ile saf
  render(t) filmler: kamera, dev kinetik yazı, mürekkep ve kâğıt dokusu, boil,
  sel geçişi, mühür finali, Web Audio sesi; temas sayfası ve MP4 üretim betikleri.
  Use when asked to make a motion design film, animated explainer, launch video,
  kinetic type sequence, cinematic loading screen, visual explainer / animated
  figure that shows how a system works, or to "push the limits" of an animation;
  or to render an HTML animation to video. Kaynaklar: awesome-opus5-5-videos,
  lemo-opuscar, ClaudeAnimationBase, shipvideo, PDoomVideo, wheresryan22/anatomy,
  Florence "Opus 5.5 Motion Lab" + Açılış Zili filmi.
license: MIT
metadata:
  author: Ahmet Akyapı (dev-starter)
  version: "1.2.0"
---

# Motion Film — kodla hareket filmi

UI mikro-hareketi (buton, modal, liste girişi) için `motion-design` skill'i ve
`~/dev-starter/guides/04-motion.md` var. Bu skill bir **film** içindir:
başı, ortası, sonu olan, saniyelerce süren, izlenen bir sahne. Sayfanın içinde
oynayabilir (bekleme filmi, açılış sahnesi) ya da MP4'e dönebilir (tanıtım videosu).

Bu dosya bir harita: kurallar burada kısa, gerekçe ve ayrıntı `reference/`ta,
çalışan kod `assets/` ve `scripts/`te. Okuma sırası: bu dosya → işine göre
referans → kodu kopyala → inceleme döngüsü.

---

## 0. Sıfat değil sayı (ayrıntı: `reference/sayilar.md`, `reference/prompt-kaliplari.md`)

**Sıfat, varsayılan görünümün yaşadığı yerdir.** "Premium, modern, havalı"
diyen 3 sıfatlık prompt lacivert uzay, ışıyan halka, bloom ve parçacık
getirir; her sıfatı bir sayıyla değiştirdiğin yerde kararı geri alırsın
(Florence'ın A/B deneyi). Kod yazmadan önce sekiz satır:
**GOAL · OUTPUT · TIME · LOOK · MOTION · SHOTS · BANNED · QA.**

- Eğri adıyla (`assets/motion-tokens.ts`): giriş ease-out, çıkış ease-in ve
  %40–50 kısa, ekran boyunca ease-in-out; doğrusal yalnız dönüş/ilerleme/faz.
- Yay tek sayı: sönüm oranı ζ (0,7–0,85 premium). **Opaklık ve renk zıplamaz.**
- Süreler karede (24 fps'te 400 ms = 10 kare); sonraki öğe öncekinin %30–50'sinde başlar.
- **Planda tek kahraman**; ikinciller %50–70 yol, 100–200 ms geç; ortam < %5.
- Yazı kelime başına 0,3 sn + 0,5 sn bekler; okunurken kıpırdamaz.
- Vuruş `fps·60/BPM`, her vuruş tek tek yuvarlanır; vuruşta kes, ölçüde yerleşimi değiştir.
- Yasak listesi ADIYLA ve canlı: ilk render'ın kullandığı her varsayılanı ekle.

## 1. Önce karar: film nerede yaşıyor?

| Durum | Ortam | Not |
|-------|-------|-----|
| Sayfa içi, veriye bağlı (bekleme, açılış, sonuç perdesi) | **Canvas 2D** + DOM altyazı | Saf `render(ctx, t)`; tema token'ları `getComputedStyle`'dan |
| Sayfa içi, metin ağırlıklı (başlık, kart girişi) | **DOM + CSS** (`KineticText`) | Erişilebilirlik bedava; JS yükü yok |
| Video çıktısı (tanıtım, sosyal medya) | Tek HTML + sözleşme (`window.render`) → `film-video.mjs` | Ses ayrı miks, −14 LUFS |
| 3D sahne | three.js, aynı sözleşme | Kamera ve ışık her karede pürüzsüz |

**Tek kural her ortamda:** kare zamanın saf fonksiyonudur. `Math.random()`
yok (tohumlu `rng`), `Date.now()` yok, önceki kareden durum taşınmaz, CSS
transition sahnede yok. Böylece kareler sırasız/paralel çizilir, hareketi
azaltana son kare tek çağrı olur, sekme dönünce film olması gereken yerden sürer.

## 2. Yönetmenlik (ayrıntı: `reference/yonetmenlik.md`)

Film, kare güzelliğiyle değil **ses, ritim, kamera, yönetmenlik** sırasıyla
yargılanır. Kodu yazmadan önce yazılı bir tretman:

1. **Tek cümle + üç perde.** Bir özne bir şey ister, bir şey değişir, başladığından farklı biter.
2. **Kanca ilk 3 saniyede.** Yavaş logo açılışı kanca değildir; logo bir *olayın* içinde gelsin (damla düşer → halka → logo damgası).
3. **"Okumalar" (reads) zamanlamayı belirler.** Her an için izleyicinin anlaması gereken şeyi yaz; her okumaya bulma + anlama + oturma süresi ver. İki önemli okuma üst üste binmez. *Hızlı hareket, yavaş anlam.*
4. **Her saniye bir olay; her 1,5–2 sn yeni bir fikir.** Ölü saniye hata gibi okunur.
5. **Tek "yerli hamle"** (native move): yalnız bu ortamın yapabildiği geçiş, duygusal tepede (mürekkep seli, çizginin biçim değiştirmesi, harflerin logoya dönüşmesi).
6. **Kesme yok, geçiş var.** Her dikiş bir geçiş: biçim değiştirme (morph), eşleşen kesme (match cut), kamera taşıması, sel, iris, fırça silmesi.
7. **Son, açılışla kafiyelenir.** Aynı motif, değişmiş hâli (açılıştaki halka sonda zilin etrafına çekilir; logo damgası → mühür).
8. **Doruktan önce durgunluk.** Sonuç geldiğinde hemen patlatma: 0,3 sn hareket durulur, kamera usulca yaklaşır, sonra sel.

## 3. Hareket (ayrıntı: `reference/yonetmenlik.md` § ilkeler, `reference/kamera.md`)

- **Hazırlık (anticipation):** büyük hareketten önce küçük ters hareket (kaymadan önce yaslanma, dalıştan önce geri çekilme, harf çıkmadan önce çökme — `backIn`).
- **Kavis (arc):** canlı şey düz gitmez; atılan damla parabol çizer.
- **Squash & stretch:** düşerken uzar, değince yayvanlaşır, hacim korunur.
- **Gecikme ve takip (follow-through):** parçalar aynı anda hareket etmez; terazinin kefeleri kolu sarkaç gibi geriden izler. İkizleme (twinning) yok.
- **Taşan eğri yalnız tek küçük öğede** (damla, ok, mühür, zil). Panel, sayfa, metin girişi hedefini AŞMAZ.
- **Kamera bir karakterdir:** ucu −0,45…+0,25 sn ortalamasıyla izler; hızlı nesnede pencere daralır ve kamera açılır (yoksa nesne kadrajdan kaçar); sabit kadrajda nefes alır.

## 4. Doku: elle yapılmış görünüm (ayrıntı: `reference/murekkep-ve-kagit.md`)

- **Boil:** çizgi kenarı saniyede 12 kez yeniden çizilir (tohum = kare sırası). Yalnız kenar gürültüsü kaynar; kuru fırça izleri sabit kalır.
- **Kalem:** zaman eğriliğe göre (keskin dönüşte yavaşlar), basınç hıza göre (yavaş kalın), dönüşte mürekkep göllenir, kalkınca sarkık damla kalır, kalemin yalnız düz gölgesi görünür.
- **Kâğıt:** lifler dünyaya bağlı, kamerayla kayar.
- **Sel:** aynı dünya ters paletle selin içine kırpılarak ikinci kez çizilir; sınırı geçen çizgi rengini orada değiştirir.
- **Tek vurgu rengi**, anlamlı bir yerde (mühür, kıvılcım). Glow, blur, cam yok.

## 5. Yazı (ayrıntı: `reference/kinetik-yazi.md`)

Dev kelime çerçeveyi doldurur; harfler maskeden sırayla yükselir; hızlıyken
iki soluk kopya (smear). Metin Title Case, Türkçe büyük harf `toLocaleUpperCase("tr-TR")`.
DOM'da degrade başlık (`background-clip: text`) harfleri ayrı taşınan
kinetik yazıda **saydam kalır** — düz renk kullan.

## 6. Ses (ayrıntı: `reference/ses.md`)

Görünen her olayın bir sesi var; ses de zaman çizelgesinden hesaplanır
(`cuesBetween`). Sayfa içinde **varsayılan kapalı**, görünür düğmeyle açılır,
bağlam başlatan tıklamanın içinde açılır. Videoda: EV listesi → miks → −14 LUFS.

## 7. İnceleme döngüsü — ölçmeden teslim yok (ayrıntı: `reference/inceleme-dongusu.md`)

```bash
S=~/dev-starter/machine/skills/motion-film/scripts
node $S/film-sheet.mjs film.html --range=0:20:1 --out=out/sheet.png          # bütün film
node $S/film-sheet.mjs film.html --strip=3.2:3.8 --out=out/strip.png          # bir anın her karesi
node $S/film-sheet.mjs http://localhost:3000/x --live --click="[data-start]" \
     --times=0.3,1,2,4,8 --selector=main --size=390x844 --dark                 # gerçek bileşen + kare süresi
node $S/film-video.mjs film.html --fps=24 --subframes=4 --out=out/film.mp4    # video
node $S/film-video.mjs film.html --gif --out=out/film.mp4                     # GIF, 25 fps, tek palet
node $S/film-sheet.mjs film.html --strip=1:2 --onion --out=out/onion.png      # soğan kabuğu
node $S/film-sheet.mjs film.html --range=0:3:0.0417 --probe="hero.offsetLeft"  # hız grafiği
```

Notlar his değil **kare numarası** taşır ("84. karede tepe geç, 2 kare öne
al"); turda bir-iki not; tutmayan düzeltmede iki komşu kareyi yan yana
çıkar ve farkı listele. Tutan düzeltme render sözleşmesine eklenir.

Her geçişin ilk ve son 0,5 sn'si, iki tema, telefon + masaüstü, hareketi
azaltma ve kare süresi (p95 ≤ 16,8 ms) ölçülür. Görüntüye bakmadan "oldu" denmez.

## 7b. Açıklayıcı figür ve canlı künye (ayrıntı: `reference/aciklayici-figur.md`)

Bir sistemin nasıl çalıştığını anlatan figür ya da sayfa içi film için
(wheresryan22/anatomy, MIT; Meng To'nun "visual explainer" figürü):

- **Nesne açıklamanın kendisidir:** kutu-ok-etiket değil, mekanizması kavrama
  bire bir oturan gerçek bir makine (kilit, çekmeceli dolap, terazi, ölçü tezgâhı).
  1×'te tek net nesne, 4×'te her bölgede bulunacak doğru bir parça.
- **Kart anatomisi:** sol üst `Fig n`, sağ üst kısa başlık, sol alt etkileşim
  ipucu, sağ alt **canlı künye**; altında adlı **sahne çipleri** (her sahnede
  kamera anlatılan şeye yaklaşır), lejant ve doğru açıklama kartın altında.
- **Künye modelden:** çizimi çizen veriden, bulunulan yerden (hedeften değil),
  evre sözcüğü ile sayı aynı anın aynı kaynağından. Bilinmeyen ilerleme
  uydurulmaz: "Geçen 00:21", "%60" değil.
- **Döngü:** dt kırpılmış, hedefe üstel takip ya da gerçek yay, aşmaması
  gereken değer `settle`, tek seferlik olay `burst` zarfı; **ekran dışında ve
  yerleşince durur** (`IntersectionObserver`, SON kayıt); boşta tur 1,4 sn'de
  başlar, dokununca durur, 3,6 sn sessizlikte döner; kaçırılan sesler çalmaz.
- **Erişilebilirlik:** görsel künye ≠ erişilebilir değer; canlı bölge yalnız
  evreleri, girdi 700 ms durulunca söyler; `aria-valuetext` döngüden yazılmaz.

İzometrik, çok parçalı SVG makine, WebGL ateş/su/ışık ya da 3D dönen parça
gerekiyorsa anatomy skill'inin kendisini kullan (`machine/bootstrap.sh` kurar).

## 8. Kopyalanacak kod

| Dosya | Ne |
|-------|----|
| `assets/ink-engine.ts` | tohumlu rng, gürültü, `span/ease/damped`, değişken basınçlı `brush` (boil + pressure), `blot`, `splatter`, `paperGrain` |
| `assets/film-kit.ts` | `kinetic`, `tag`, `followCamera`, `withCamera`, `penTiming`, `penShadow`, `floodPath`, `inverted`, `teardrop`, `seal`, `fibres`, `cuesBetween` |
| `assets/film-sound.ts` | Web Audio tarifleri: damla, vuruş, kalem, yükseliş, sel, daktilo, çan; tercih + başlatma |
| `assets/film-page.html` | Sözleşme sayfası (DUR, render, READY, EV), `?t=` ile kare, boşluk/ok tuşları |
| `assets/motion-tokens.ts` | Sayılar tek dosyada: `EASE` (reveal/enter/move/exit/pop), `MS`, `STAGGER`, `dampingRatio`, kapalı biçim `spring(t, ζ, f)`, JS `bezier()`, `beatFrame`, `holdFor`, `RANK`, `cascade`, `loopPhase` |
| `assets/figure-kit.ts` | Çalışma zamanı: `watchVisibility` (son kayıt), `loop` (dt kırpılmış, görünmezken durur), `follow`, `spring`, `settle`, `burst`, `idleTour`, `quietAnnouncer`, `cueWindow` |
| `scripts/film-sheet.mjs` | Temas sayfası / şerit / canlı ölçüm (puppeteer ya da playwright) |
| `scripts/film-video.mjs` | Kareler → ffmpeg → MP4, alt kare bulanıklığı, olay dosyası |

Çalışan büyük örnek: Açılış Zili `lib/ink/analysis-film.ts` (beş perdelik
bekleme filmi), `components/ai/AnalysisFilm.tsx` (oynatıcı, ses düğmesi,
hareketi azaltma), `components/ai/ClaudeWorkbench.tsx` (düğmeden filme
kesmesiz geçiş).

## Referanslar

| Dosya | Ne zaman |
|-------|----------|
| `reference/yonetmenlik.md` | Tretman, okumalar, animasyon ilkeleri, geçiş grameri, sık hatalar |
| `reference/kamera.md` | Takip, dalış, nefes, hızlı nesne kuralı |
| `reference/murekkep-ve-kagit.md` | Fırça, boil, kalem, kâğıt, sel, damla, mühür, renk |
| `reference/kinetik-yazi.md` | Tuval ve DOM kinetik yazı, künye, degrade tuzağı |
| `reference/ses.md` | Sayfa içi ses kuralları, tarifler, video miksi |
| `reference/inceleme-dongusu.md` | Temas sayfası, şerit, canlı ölçüm, matris, ölçümle bulunan tuzaklar |
| `reference/video-uretimi.md` | Sözleşme, belirlilik, MP4, alt kare bulanıklığı, loudness |
| `reference/sayilar.md` | Eğri tablosu, ζ, süre ve kademe, hiyerarşi, vuruş ızgarası, bekleme, kamera, WCAG, sıfat → sayı çevirisi |
| `reference/aciklayici-figur.md` | Nesne-açıklama, figür kartı, canlı künye, sahne çipleri, hareket ve erişilebilirlik kuralları, inceleme (anatomy) |
| `reference/prompt-kaliplari.md` | Sekiz satırlık yönlendirilmiş prompt, yasak listesi, kare numaralı inceleme notları, belirti → düzeltme tablosu, film tretmanı iskeleti |
| `reference/kaynaklar.md` | Açık kaynaklar ve makaleler, lisansları ve neyin nereden alındığı |

## 9. Proje kuralları her zaman üstte

Projenin CLAUDE.md'si ve tema dosyası (`~/dev-starter/knowledge/themes/<proje>.md`)
bu skill'den önce gelir: renk token'dan, tek font, eğri kuralları, Title Case,
hareketi azaltana son kare. Skill ilham ve teknik verir, kimliği değiştirmez.

## 10. Teslimden önce

- [ ] Sekiz satır dolu (GOAL…QA); her sıfat bir sayıya çevrildi; yasak listesi adlarla
- [ ] Eğriler token'dan; çıkış girişten kısa; doğrusal yalnız dönüş/ilerleme/faz; opaklık ve renk zıplamıyor
- [ ] Her planda tek kahraman; yazı kelime başına 0,3 + 0,5 sn bekliyor; saniyede ≤ 3 parlama
- [ ] Döngüyse 0..N−1, faz tam devirli, 0. kare bitmiş kompozisyon
- [ ] Tretman yazıldı; okumaların süresi var, üst üste binmiyor
- [ ] İlk 3 sn'de kanca; son açılışla kafiyeli; tek yerli hamle doruğa yakın
- [ ] Her dikişte geçiş; kesme yalnız bilinçli
- [ ] Hazırlık, kavis, gecikme, squash; ikizleme yok
- [ ] Kare saf: `Math.random`/`Date.now` yok, durum taşınmıyor
- [ ] Temas sayfası + kritik anların şeridi iki temada, iki genişlikte incelendi
- [ ] Kare süresi ölçüldü; hareketi azaltana son kare; ses varsayılan kapalı
- [ ] Veri gerçek: filmdeki sayı ekrandaki sayıyla aynı kaynaktan
- [ ] Canlı künye çizimle aynı veriden; bilinmeyen ilerleme uydurulmadı
- [ ] Ekran dışında döngü duruyor (son kayıt okunuyor); dönüşte kaçırılan sesler çalmıyor
- [ ] Canlı bölge yalnız evre değişince konuşuyor; künye ekran okuyucuya sayı seli değil
