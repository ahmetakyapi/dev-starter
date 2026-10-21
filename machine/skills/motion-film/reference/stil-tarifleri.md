# Stil tarifleri — bir stilin sayıları

Bir stili "tanınır" yapan şey birkaç sayıdır. Aşağıdaki tarifler o sayılar;
renkler projenin token'larından gelir, burada yalnız kural var. Glow, blur,
cam, neon ve degrade gökyüzü bu tariflerin hiçbirine girmez: kaynak prompt'lar
istese de alınmadı (ekosistem yasağı, `prompt-kaliplari.md` § yasak listesi).

Kaynaklar: [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)
(MIT) `prompts/02-line-art`, `07-liquid`, `08-morph`, `09-bauhaus`, `20-pixel`;
opus-video-prompts `17-pixel-wizard` (Majid Manzarpour; lisanssız, yalnız fikir,
kendi sözlerimizle); [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar)
(MIT) `styles/_template/STYLE.md`, `MY-STYLES.md`.

## 1. Biçim değiştirme (morph)

| Ne | Sayı |
|----|------|
| Karmaşık A → B | doğrudan değil: **A → yalın ara biçim (daire/kapsül) → B**, her yarı **8–12 kare** |
| Nokta eşleme | iki biçimde nokta sayısı eşit; **ilk noktanın yönü aynı** (ikisi de saat 12'den, aynı dönüş yönünde) — değilse biçim düğümlenir |
| Örtü | geçiş boyunca **%10–15 squash & stretch** + hafif dönüş (≤ 15°); ara değerlemenin mekanik görünüşünü örter |
| Eğri | `cubic-bezier(0.7, 0, 0.3, 1)`: ortada en hızlı; baş ve sonda **3'er kare** yastık |
| Alt parçalar | aynı anda biçim değiştirir (buhar → ışın → dalga); geç kalan alt parça kopuk okunur |
| Denetim | her geçişin **orta karesini** durağan çıkar: düğüm, kendini kesen kenar, ters dönen kıvrım var mı? |

Kodda: `mix(a, b, k)` nokta dizileri arasında, `k = bezier(0.7,0,0.3,1)(span(t, t0+3/fps, t1−3/fps))`.
Biçim değiştiren şey sahnenin kamera dönüşümünün İÇİNDE kalır (`inceleme-dongusu.md` § tuzaklar).

## 2. Çizgi (line art, tek çizgi)

| Ne | Sayı |
|----|------|
| Kalınlık | sabit 2–4 px (ya da `ink-engine` fırçasıyla basınçlı, `murekkep-ve-kagit.md`) |
| Kalem hızı | dönüşe yaklaşırken yavaşlar: `cubic-bezier(0.65, 0, 0.35, 1)` ya da `film-kit → penTiming` (eğriliğe göre) |
| Eski çizgi | kamera ilerledikçe geride kalan parçalar **%35 opaklığa** iner; yeni çizgi tam |
| Çizgiden dolguya | taslak bitince dolgu aynı yolun içinden **bir çapadan** yayılır (ilk nokta ya da logonun ağırlık merkezi), 0,4–0,6 sn |
| Tek çizgi | bir şeklin son noktası bir sonrakinin ilk noktası; yollar önceden bağlanır |
| Kamera | ucu izler (`kamera.md` § takip); sonda geri çekilip bütün çizimi poster gibi gösterir |

**Kalem ucu PARLAMAZ.** Kaynağın "ışıyan kalem ucu" alınmadı: ucu düz bir
gölge ya da fırçanın sivri başı gösterir (`film-kit → penShadow`).

## 3. Sıvı

| Ne | Sayı |
|----|------|
| Boyun | iki damla ayrılırken ince boyun; koptuğu anda iki uç **2–3 karelik geri sekme** |
| İkincil damlalar | ana damlayı **2–3 kare geriden** izler |
| Birleşme (metaball) | alan fonksiyonu + eşik: `Σ rᵢ² / dᵢ²` ≥ 1 olan pikseller dolu (tuvalde örnekleme ızgarası + marching squares, ya da düşük çözünürlükte alan → eşik); iki top yaklaşınca kendiliğinden yapışır |
| Düşüş | düşerken uzar (squash > 1), değince yayvanlaşır, hacim korunur |
| Sel geçişi | dalgalı ön kenar, **3–5 faz kaydırılmış tümsek**; köşeleri aşar (`inceleme-dongusu.md` § tuzaklar) |
| Eğri | atılmış, tekdüze değil: `cubic-bezier(0.22, 1, 0.36, 1)` |

Metaball'u "bulanıklaştır + eşikle" diye kurma: tuvalde `filter: blur()` hem
yasak listesinde hem kareden kareye pahalı; alanı doğrudan hesapla.
Parlak yüzey vurgusu ve fresnel ışıltısı alınmadı; derinlik ton farkıyla.

## 4. Bauhaus (geometrik kurgu)

| Ne | Sayı |
|----|------|
| Izgara | tam sayı modül (ör. 1920 px'te 240 px = 8 modül); her yer değiştirme **modülün tam katı**, her iniş ızgara çizgisinde |
| Vuruş | 120 BPM'de vuruş 0,5 sn; her vuruşta TEK modül hareket eder |
| Hareketler | çeyrek daire köşe ekseninde 90° döner, yarım daire bir modül kayar, üçgen ters döner, kare ikiye bölünür |
| Dönüş ekseni | sırayla: kendi merkezi → köşesi → kare merkezi; ritim buradan |
| Eğri | `ease-in-out` (quad) ya da doğrusal; **taşma YOK** — mekanik his özelliktir |
| Palet | üç ana renk + siyah + kâğıt, token'lardan; baskı kayması en fazla 1–2 px |

## 5. Piksel

| Ne | Sayı |
|----|------|
| Mantıksal çözünürlük | sabit, ör. **128×96** ya da 320×180; her şey ekran dışı tuvalde |
| Büyütme | sığan en büyük **tam sayı** kat, ortalı; `imageSmoothingEnabled = false` + CSS `image-rendering: pixelated` |
| Konum | her çizim mantıksal ızgarada tam sayıya oturur; alt piksel, kenar yumuşatma, degrade, `shadowBlur` yok |
| Palet | sabit **~24 renk** (8–32), her piksel paletten; geçiş tonu dither ile |
| Hareket | poz parametreleri (kol açısı, baş eğimi) yumuşak ara değerlenir, sonra her karede ızgaraya **nicelenir**; okunan tempo **8–12 fps** (`floor(t·10)/10`) — film 60 fps olsa da |
| Döngüler | yürüme 6–8 kare, nefes 2–4 kare |
| Paralaks | 3–4 katman, her biri **tam piksel** kayar |
| Siluet | karakter ~24×32 mantıksal piksel; 1 px dış çizgi, iki tonlu gövde |

Belirlilik: kaynak prompt'taki "60 Hz sabit adımlı güncelleme + havuzlu parçacık"
render sözleşmesine uymaz. Kıvılcımın konumu tohumdan ve yaşından hesaplanır
(`ink-engine → splatter` gibi), palet indeksi yaşla adım adım değişir.
CRT süzgeci ve fosfor ışıltısı alınmadı.

## 6. Film stili kartı

Bir stili filmden filme taşırken neyin sabit, neyin her filmde yeniden
verildiğini ayır (lemo-opuscar `styles/_template/STYLE.md`). Kart
`STYLE.md` olarak projede durur; hikâye, plan listesi, açılış/kapanış,
müzik temposu ve demo paleti KARTA GİRMEZ, onlar filmin tretmanına gider.

**Hiç değişmeyen (her filmde aynı):**

1. Öz ve "ne değildir": tek bakışta stili tanıtan 3–5 özellik + karıştırıldığı stillerle sınırı
2. Malzeme ve çizim modeli (fırça, kâğıt, kaynama, katmanlar; neyin dünyaya, neyin ekrana bağlı olduğu)
3. Renk MANTIĞI (kaç ton, zemin, vurgu neye ayrılmış, ne asla renklenmez) — **zemin parlaklığı açıkça yazılır**: "açık kâğıt, L* ~95" ya da "koyu zemin, L* ~12"; tek ortalama palet açık/koyu kararını gizler
4. Yazı rolleri, punto aralıkları, okuma süresi kuralı (`sayilar.md` § bekleme)
5. Hareket niteliği (fps, adım: birler/ikiler, ne kaynar, eğri ailesi, ne asla kıpırdamaz)
6. Kamera sözlüğü (rota değil: hareket → ne anlatır → neye hizmet eder)
7. Ses paleti (çalgılar, malzemenin sesi, sessizlik)
8. Yerli hamleler menüsü, her biri "şuna uyar: …" üç örnekle
9. Ortamın tuzakları ve çaresi
10. Motor: hangi dosya, hangi fonksiyon

**Her filmin karar verdiği:** yapı, karakterler, açılış, kapanış, kamera
rotası, tempo, renk mantığı içinde palet, hangi yerli hamlenin kullanılacağı.

### Stili değiştirmek: üç kova

Kullanıcı bir stili "kendi sürümü" yapmak isterse önce değişiklikleri sırala
(lemo-opuscar `MY-STYLES.md`):

| Kova | Kart bölümleri | Ne söylenir |
|------|----------------|-------------|
| **Güvenli** | palet (mantık içinde), yazı, hareket temposu ve yoğunluğu, ses paleti, bir yerli hamle ekle/değiştir | stil kendisi kalır; her biri için 2–3 öneri |
| **Karakteri değiştirir** | malzeme ve çizim modeli, renk mantığının kendisi, kamera sözlüğü | olur; her biriyle stilin neyi kaybettiğini söyle |
| **Yasak** | öz ve "ne değildir", motor | bu artık başka bir stildir; daha yakın bir taban öner |

Hikâye, yapı, açılış, kapanış, oyuncular ve tempo için yeni stil GEREKMEZ:
her filmde zaten serbesttir. Bir turda en çok 5 değişiklik; fazlası sonucu
yargılanamaz yapar. Ekosistem yasakları (glow, blur, cam, neon, mor degrade)
hiçbir kovada açılmaz.

**Kayıt:** stilin klasöründe

- `STYLE.md` — tabanın tam kopyası, değişiklikler kendi bölümlerine yazılmış ("tabana bak" boşluğu yok); başlığın altında `Taban: <stil adı>` satırı
- `CHANGES.md` — değişiklik başına bir satır:

  ```
  | Bölüm | Taban | Şimdi | Neden |
  |-------|-------|-------|-------|
  | 3 Renk | tek vurgu: pirinç | tek vurgu: --color-success | ürün yeşil |
  ```

**Kanıt:** önce gerçek çizim koduyla TEK stil karesi, tabanın bir karesiyle
yan yana; kullanıcı onaylamadan film yok. Sonra **15–30 sn'lik deneme filmi**:
konu kullanıcınınki ya da hareketli basit bir şey (rüzgârda uçurtma, sabahın
ilk tramvayı; tabanın örnek filmi değil), `CHANGES.md`deki her değişiklik en
az bir kez ekranda, stilin yerli hamlesi bir kez; tek yapı, storyboard yok,
ses var, anlatıcı ve altyazı yok. Teslimde her değişikliğin göründüğü saniyeyi listele.
