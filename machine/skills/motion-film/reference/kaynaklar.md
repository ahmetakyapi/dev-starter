# Kaynaklar — neyi nereden öğrendik

Bu skill altı açık çalışmanın rehberlerinden ve Açılış Zili'nin bekleme
filminden (Ekim 2026) damıtıldı. Metinler kendi sözlerimizle; kod
`assets/`te ve Açılış Zili'nden (sahibinin kendi kodu). Lisansı olmayan
iki repodan kod alınmadı, yalnız fikirleri anlatıldı.

| Kaynak | Lisans | Ne aldık |
|--------|--------|----------|
| [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | MIT | 500+ kodla üretilmiş videonun prompt'u ve özgün gönderisi; kategoriler (motion graphics, explainer, 3D, oyun). Prompt kalıpları için başvuru kütüphanesi. |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | MIT | `DIRECTOR.md` (tretman, kanca, kafiyeli son, yerli hamle, ses yarısıdır, sessizlik, okuma süresi), `TECHNIQUE.md` (sözleşme: `DUR / render(t) / READY / EV / TEXTS`, tek zaman çizelgesi, JPEG yakalama, gren ffmpeg'de, −14 LUFS), 43 stil; özellikle `one-line` ve `ink-wash`. |
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | MIT | `ANIMATION_GUIDE.md`: üç hedef (elle yapılmış, canlı, tek parça), boil + `boilSeed`, "okumalar" ile zamanlama, animasyon ilkeleri, geçiş her dikişte, storyboard biçimi, temas sayfası/şerit/kırpma inceleme döngüsü, yaygın hatalar. |
| [diggerhq/shipvideo](https://github.com/diggerhq/shipvideo) | yok — yalnız fikir | URL/prompt → tek HTML film → sanal saatle (`__seek(t)`) kare kare Chromium → ffmpeg (libx264, crf 18, yuv420p, faststart). Sahnede `Math.random`, CSS transition, `<video>` yasak; render öncesi `check_scene` (JS hatası + her anın görünen metni). |
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | yok — yalnız fikir | Model önce `STORYBOARD.md` yazdı, alt ajanlara `ANIMATION_GUIDE.md` ile brif verdi; dokuz bölüm paralel; şarkı sözü ekrana yazılmadan *oynandı*. |
| [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | MIT | Açıklayıcı figür: "nesne açıklamanın kendisidir", Figür/Kahraman/Destan boyutu, doğruyu saf modelde tutmak, figür kartı (Fig n, başlık, ipucu, canlı künye), hareket kuralları (dt kırpma, takip, alt adımlı yay, `settle`, `burst`, boşta tur, ekran dışında durma ve SON kayıt tuzağı), erişilebilirlik (künye ≠ erişilebilir değer), çizgilerin bir şeyde bitmesi, 4× inceleme. `assets/figure-kit.ts` bu kuralların bizim yazdığımız kodu; anatomy'nin kendi kiti (izometrik SVG, lathe/tube, WebGL, 3D) bootstrap'le ayrıca kurulur. |
| prompt-motion.com derlemesi | — | İyi prompt'ların ortak paydası: tek öğe hiç kesilmez (morph), kamera ölçek değiştirir, dev kinetik yazı, sert açık/koyu geçiş, her 1,5–2 sn yeni fikir, gerçek easing + squash/stretch + stagger + overlap + smear, "her from-state t=0'da (seek-safe)". |
| Açılış Zili bekleme filmi | sahibinin | Bütün tekniklerin sınanmış hâli; ölçümle bulunan hatalar `inceleme-dongusu.md` § tuzaklar. |

## Stillerden iki not (lemo-opuscar, kısaltılmış)

**One-line (tek çizgi):** Kâğıttan hiç kalkmayan tek mürekkep çizgisi; sahneler
kesilmez, biçim değiştirir. Mürekkep yolun etrafında dolu çokgen; genişlik =
taban × basınç (hızdan) × ince gürültü; yavaşlayınca göllenme; durunca
sarkık damla; kalem çizilmez, gölgesi düşer; kamera ucu gecikme ve sezgiyle
izler; tek vurgu rengi, bir kez. Tuzaklar: başıboş bağlantı çizgileri
"kırışık" okunur (topoloji planla), yuvarlak leke ben gibi okunur.

**Ink wash (mürekkep yıkama):** Boş kâğıt alanın kendisi; beş mürekkep tonu
(yanık → berrak), ıslak katman kenarda pigment toplar, kuru fırça kâğıdı
gösterir; tek kırmızı mühür; kesin hamleden önce durgunluk ve yavaş itiş;
geçişler mürekkep açılması, kaydırma ya da sis — asla düz geçiş.
