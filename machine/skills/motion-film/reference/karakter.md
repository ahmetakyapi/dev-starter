# Karakter — oynayan bir figür kodla

Kod: `assets/character-kit.ts` (tipli Canvas 2D kukla, `ink-engine.ts` fırçasıyla).
Mimari: [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)
`src/clawd.js`, `src/core.js`, `ANIMATION_GUIDE.md` (MIT © 2026 John Heibel).
Oradaki maskotun görünüşü, paleti, adı ve çizimleri alınmadı; kitteki karakter
bizim: **Mürekkep**, yere oturmuş, tepesi arkaya yatan bir mürekkep damlası.
Kendi karakterini kuracaksan tabloları değiştir, mimariyi tut.

## 1. Mimari: dört tablo, bir çizim fonksiyonu

| Parça | Ne | Neden |
|-------|----|-------|
| `VIEWS` | çizilmiş anahtar görünüşler: `front`, `q` (3/4), `side`, `qback`, `back`; her biri ekranın sağına bakar, `flip` sola çevirir | Dönüş **çizilir**: model sayfası gibi. Döndürülmüş 3D kutu ya da izdüşüm "üretilmiş" okunur. |
| `spinView(a)` | yön (tur: 0 ön, 0,25 sağ, 0,5 arka) → en yakın sekizde bir görünüş | Çizilmiş dönüş görünüşten görünüşe adım atar; ara açı yoktur. |
| `turn(t, t0, t1, a0, a1)` | dönüş: görünüş adımları + aradaki smear (`0,55·sin(πk)`) | 0,12–0,25 sn'lik dönüş; smear ara çizimleri örter. |
| `EMO` | duygu = VERİ: gözler, ağız, ton (TOKEN ADI, hex değil), yanak, işaret, tepki boyu (`take`), boşta beden `body(t)` | Yeni duygu bir satırdır; hiçbir duygu donmaz. |
| `feel(ad, t)` | o duygu, t anında canlı | `drawCharacter(ctx, t, x, y, u, feel("happy", t), pal)` |
| `emotions(t, keys)` | oynanan duygu çizelgesi | Yüzler değişmez, oynar (§3). |
| `drawCharacter` | tek kare: gölge → arka kol → ayaklar → gövde + ton → yüz → ön kol → `draw` kancası → işaret | Ressam sırası tablodan gelir, elle yazılmaz. |
| `handAt` | elin dünya konumu, çizimle AYNI dönüşümden | Atılan şey elden çıkar (§5). |

**Seçenekler yayarak birleşir, ezerek değil:**
`{ ...emotions(t, keys), ...turn(t, 2, 2.2, 0, 0.25), aR: 1.2, armR: kalem }`.
Sonra yayılan kazanır: önce duygu, sonra poz. Bir alanı hem duygu hem poz
sürüyorsa (`dy`, `sq`) üstüne yazma, **topla**: `dy: duygu.dy + zıplama.dy`.

**Renk token'dan:** `readPalette(kök)` filmin başında bir kez
`--color-strong`, `--color-surface`, `--color-page`, `--color-danger-wash` ve
duyguların tonlarını (`--color-danger`, `--color-warning`,
`--color-primary-soft`, `--color-muted`) okur. Ton gövdenin üstüne %55'e kadar
boyanır; geçişte eskisi söner, yenisi gelir (hex karıştırma yok, her CSS rengi çalışır).

## 2. Sahneleme kuralları

- **Boy plana göre** (u = boy birimi; Mürekkep ~8,4u × 11u):

  | Plan | u | Ne için |
  |------|---|---------|
  | Geniş | 10–16 | manzarada küçük; yalnız kuruluş planı, filmin tamamı asla |
  | Orta | 20–28 | olağan oyun boyu |
  | Yakın | 40–70 | yüz oyunu |
  | Çok yakın | 90+ | kamera gözlere itilmiş |

  Kilit anlarda özne kare yüksekliğinin en az 1/3'ü (`yonetmenlik.md` § 6).
- **Önce anahtar pozlar, durağan olarak.** Her planın hikâye pozlarını temas
  sayfasında (`--range` anahtar anlarda) bak: siluet tek bakışta okunuyor mu,
  beden yaptığı işe yaslanıyor mu? Pozlar okunmuyorsa aradaki hareket kurtarmaz.
  Hareket pozlar okununca eklenir.
- **Gözler önce gider**, beden 2–4 kare sonra, kollar ve tutulan şey en son
  oturur. Her parçanın zamanı bağlı olduğundan biraz kaysın.
- **Ağırlık:** ağır şey geç kalkar, geç durur, az seker; hafif şey sıçrar ve
  çırpınarak oturur. Taşınan kutunun ağırlığını kolların açısı ve adımın
  uzunluğu söyler, yazı değil.
- **Ekran yönü kesmeler boyunca aynı.** Sağa giden karakter sonraki planda da
  sağa gider; karakter ve aksesuar plandan plana taşınır.
- **Neden, sonra tepki.** Bir şey olur, karakter ona tepki verir (tepki,
  duygu değişimi, ona dönüş); tepki çoğu zaman en komik anıdır, süresini ver.
- **Duygu planı bütün film için.** `emotions` anahtarlarını plan plan değil
  filmin başından sonuna yaz; karakterin duygu yayı hikâyeyi izler.
- **Hiçbir şey durmaz:** her duygunun kendi boşta hareketi var; donmuş kare hata gibi okunur.
- **Kaynama parça başına:** `id` karakter başına sabit; her parçanın tohumu
  `partSeed(id, parça)`. Sahneye girip çıkan karakter varsa `id`'yi mutlaka ver,
  yoksa kıpırdayan kol duran gövdeyi yeniden kaynatır.

## 3. Yüz oynar, sıçramaz

`emotions(t, [[0, "sleepy"], [1.9, "surprised", { lookX: 0.8 }], [2.5, "happy"]])`
her değişimde şu sırayı oynar (sayılar kitte):

| An | Ne olur |
|----|---------|
| −0,10 sn | gözler kısılır (`squint` 0 → 1), beden 0,12 × tepki boyu kadar çöker (hazırlık) |
| 0 | yüz kısılmanın ALTINDA değişir; tepki ateşlenir: `sq = −0,26·take·e^(−6a)·cos(16a)`, küçük sıçrama |
| 0–0,14 sn | gözler açılır |
| 0–0,40 sn | beden yeni duygunun pozuna `backOut` ile, bir kez taşarak oturur (karakter tek küçük öğedir) |
| 0–0,30 sn | ton, yanak ease-in-out ile geçer — **renk taşmaz** |
| 0,06–0,32 sn | yeni işaret belirir; tek seferlikse (`fade`) 1,4–1,8 sn'de söner |

`eyes`/`mouth`'u iki kare arasında elle değiştirme. Tek istisna bilinçli,
tek karelik komik patlama. Her ifadeyi son boyunda kontrol et: **kaş yönü**
"üzgün"ü "kızgın"dan ayıran tek çizgidir (iç uç yukarı üzgün, aşağı kızgın).

**İşaretler boyanır, yazılmaz:** ünlem, soru, ter damlası, kıvılcım, kalp, üç
nokta, bulut, uyku kavisleri fırçayla çizilmiş işaretlerdir. Ekranda "!",
"Zzz", konuşma balonu ya da hikâyeyi tekrar eden levha harfle yazılmaz.

## 4. Görünüş ve dönüş

- Sağa dönüş: `turn(t, 2, 2.2, 0, 0.25)`; sola: `a1 = −0.25`; arkaya: `0.5`.
- Ekran boyunca yürüyüş `side` görünüşte, `walk` fazıyla (ayaklar sırayla kalkar).
- Damlanın tepesi (`tipX`) baktığı yönün tersine yatar; dönüş en çok bundan okunur.
- `side`da tek kol görünür; `q`da uzak kol arkada ve %70 opak.

## 5. Temaslar — kontrol listesi

Kodla çizilen karakterde en sık görünen kusur "havada kalan" şeydir (ClaudeAnimationBase
"common failures"; lemo-opuscar `DIRECTOR.md` § 9). Şeritte (`--strip`) ve
4× kırpmada bak:

- **Ayak yerde.** Duruşta ayak tabanı `y`de; yürürken yalnız kalkan ayak
  yerden ayrılır, basan ayak kaymaz. Zıplamada gölge küçülür, inişte squash.
- **Tutulan şey elde.** Aksesuarı `armL` / `armR` kancasında kol ucunda
  (kol uzayında +x dışa) çiz; kolla birlikte döner, ezilir, çevrilir. İki elle
  tutulan şey iki avucun **arasında**, derinliği iki kolun arasında; elden
  ele geçiş bir avuçtan öbürüne ara değerlenir.
- **Atılan şey elden çıkar.** Fırlatmanın ilk karesinde nesne `handAt(...)`
  noktasında; yolu oradan kavis (`yonetmenlik.md` § 3). Elin yanında beliren
  ya da bir kare sonra elin önünde duran nesne kopuk okunur.
- **Yuvarlanan şey mesafe ÷ yarıçap kadar döner**; kayan tekerlek sahte görünür.
- Kolların taşıyamadığı büyük nesne ayrı çizilir ama aynı pozdan hesaplanan
  noktada: `handAt` iki elin ortası.

## 6. Kendi karakterin

`VIEWS`'ta beş görünüşü yeniden ölç (u biriminde), `dropPts` yerine kendi
gövdeni çiz, `EMO`'ya yeni satır ekle (gözler, ağız, ton token'ı, `take`,
`body(t)`). Kural aynı: dönüş çizilir, yüz oynar, renk token'dan, her parça
kendi tohumuyla kaynar, kare t'nin saf fonksiyonu.

İnsan biçimli kukla (gövde, baş, uzuvlar her karede çözülür) gerekiyorsa
lemo-opuscar `TECHNIQUE.md` § 10'dan iki not: omuz dönüşünü önce açılma
(abduction) sonra öne kaldırma (flexion) sırasıyla uygula, ters sıra
kaldırılmış kolları X yapar; kol kalkarken omuz kuşağı yükselip öne gelsin
ve gövdeyle örtüşen kol parçasının dış çizgisini çizme (kukla dikişi gibi okunur).
