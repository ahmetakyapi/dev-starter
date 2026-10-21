# Kaynaklar — neyi nereden öğrendik

Bu skill on açık çalışmanın rehberlerinden ve Açılış Zili'nin bekleme
filminden (Ekim 2026) damıtıldı. Metinler kendi sözlerimizle; kod
`assets/`te ve Açılış Zili'nden (sahibinin kendi kodu). MIT kaynaktan
uyarlanan kodun dosya başında atfı var. Lisansı olmayan üç repodan kod ve
metin alınmadı, yalnız fikirleri anlatıldı. Şarkı, söz, font, karakter
tasarımı gibi kaynağın lisansının kapsamadığı varlıklar hiçbir zaman
kopyalanmaz.

| Kaynak | Lisans | Ne aldık |
|--------|--------|----------|
| [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | MIT (liste); prompt'lar ve videolar yaratıcılarının | 703 kodla üretilmiş videonun prompt'u ve özgün gönderisi (Ekim 2026: motion 369, 3D 117, explainer 116, etkileşimli 101). Prompt kalıpları ve alanda sınanmış tuzaklar (`inceleme-dongusu.md` § tuzaklar; yazar adıyla, kendi sözlerimizle). |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | MIT | `DIRECTOR.md` (tretman, kanca, kafiyeli son, yerli hamle, ses yarısıdır, sessizlik, okuma süresi), `TECHNIQUE.md` (sözleşme: `DUR / render(t) / READY / EV / TEXTS`, tek zaman çizelgesi, JPEG yakalama, gren ffmpeg'de, −14 LUFS), 51 stil; özellikle `one-line` ve `ink-wash`. Ekim 2026 eklemeleri: okuma süresi denetleyicisi (`scripts/film-read.mjs`'in kaynağı), render sağlamlığı, kanıt filmleri (`FACTS.md`, veri dürüstlüğü), stil kartı ve "stili kendine uyarla" (`MY-STYLES.md`). Örnek filmlerdeki gerçek kişi ve karakterler alınmaz. |
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | MIT | `ANIMATION_GUIDE.md`: üç hedef (elle yapılmış, canlı, tek parça), boil + `boilSeed`, "okumalar" ile zamanlama, animasyon ilkeleri, geçiş her dikişte, storyboard biçimi, temas sayfası/şerit/kırpma inceleme döngüsü, yaygın hatalar. `src/clawd.js` + `src/core.js`: karakter rig'inin MİMARİSİ (çizilmiş görünüş tablosu, duygu tablosu, duygu geçişinde oyunculuk, işaret olarak emote, kol ucunda prop) → `assets/character-kit.ts`, `karakter.md`. Clawd'ın kendisi (görünüşü, paleti, adı) Anthropic'in maskotu olabilir; alınmadı, kitin karakteri bizim. |
| [diggerhq/shipvideo](https://github.com/diggerhq/shipvideo) | yok — yalnız fikir | URL/prompt → tek HTML film → sanal saatle (`__seek(t)`) kare kare Chromium → ffmpeg (libx264, crf 18, yuv420p, faststart). Sahnede `Math.random`, CSS transition, `<video>` yasak; render öncesi `check_scene` (JS hatası + her anın görünen metni). |
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | yok — yalnız fikir | Model önce `STORYBOARD.md` yazdı, alt ajanlara `ANIMATION_GUIDE.md` ile brif verdi; dokuz bölüm paralel; şarkı sözü ekrana yazılmadan *oynandı*. Paralel ve kaldığı yerden süren kare yazımı fikri (`film-video.mjs --workers`). Karşı örnek: söz süpürmesi tahminle, BPM elle — ölçülmüş zamanlama `muzik-klibi.md`. |
| [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) | MIT (şarkı, söz, `lyrics.json` ve fontlar hariç) | Aynı şarkının ölçülmüş zamanlamalı klibi: vuruş ızgarası ve sözden türeyen kesmeler, içerikle söz arama, sözcük düzeyinde hizalama hattı, mp3 kodlayıcı gecikmesi tuzağı, karaoke kuralları, kerning'li parça konumu (`muzik-klibi.md`, `kinetik-yazi.md`); ortalanmış perde açısıyla bulanıklık ve `frameIdx` kuralı, BT.709 renk etiketi, `--scale` ile gerçek 4K, ses saatine kilitli önizleme, durumlu sahne ön sarması (`video-uretimi.md`, `film-video.mjs`, `film-page.html`). |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | MIT (üçüncü taraf dokular ve fontlar hariç) | Jüri rubriği (yedi boyut, sabit puan çapaları, zaman kodlu düzeltmeler — `inceleme-dongusu.md`), kısa film sayıları (`sayilar.md`), sayılı stil tarifleri: morph, çizgi, sıvı, Bauhaus (`stil-tarifleri.md`; parlayan uç, cam, neon gibi görünüşler değil, yalnız sayılar), ses senkron noktaları ve mono güvenliği (`ses.md`), merkezlenmiş alt kare formülü. |
| [athemeroy/awesome-claude-5-5-videos](https://github.com/athemeroy/awesome-claude-5-5-videos) | CC BY 4.0 (yalnız kendi metni ve tabloları) | Yedi üretim yolu ve hangisinin ne zaman seçildiği, kabul kapıları (en zor 2–4 sn önce, farklı sırayla aranarak yeniden render), "tek prompt" arkasındaki gizli iş ve maliyet fişi, üretim brifi; yaratıcı prompt'ları ve görselleri hariç. |
| [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) | yok — yalnız fikir (prompt'lar yazarlarına ait) | Tür iskeletleri (işletme açıklayıcısı, tarif, onun kuvvetleri yakınlaşması, uzun tarih filmi, gerçek görüntü uyarlama, piksel sanatı), anlatım/TTS akışı, `preserve-3d` tuzağı, tek satırlık A/B taban çizgisi; `prompt-kaliplari.md`te kendi sözlerimizle, özgün gönderiye bağlantıyla. |
| [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | MIT | Açıklayıcı figür: "nesne açıklamanın kendisidir", Figür/Kahraman/Destan boyutu, doğruyu saf modelde tutmak, figür kartı (Fig n, başlık, ipucu, canlı künye), hareket kuralları (dt kırpma, takip, alt adımlı yay, `settle`, `burst`, boşta tur, ekran dışında durma ve SON kayıt tuzağı), erişilebilirlik (künye ≠ erişilebilir değer), çizgilerin bir şeyde bitmesi, 4× inceleme. `assets/figure-kit.ts` bu kuralların bizim yazdığımız kodu; anatomy'nin kendi kiti (izometrik SVG, lathe/tube, WebGL, 3D) bootstrap'le ayrıca kurulur. |
| Florence (@flxrnc), *Opus 5.5 Motion Lab: Make Claude Animate Like a Studio* (X makalesi, Ekim 2026) | makale — fikirler ve sayılar, kendi sözlerimizle | Sıfat → sayı ilkesi ve A/B deneyi, sekiz satırlık yönlendirilmiş prompt (GOAL…QA), yasak listesi, render sözleşmesi (`renderAt(t)`, 0..N−1, `?t` dondurma, `getAnimations`), sayı tablosu (eğri, ζ, süre, kademe, vuruş ızgarası, bekleme, kamera, WCAG), animasyonun beş ilkesinin karelerle yazılışı, inceleme döngüsü (kare numaralı notlar, soğan kabuğu, hız grafiği, komşu kare farkı, sayısal denetim), ses ölçümü (1 kare sonra, telefon bandı, −14 LUFS, −2,2 dBTP), GIF zamanlama tuzağı. Kod (`motion-tokens.ts`, `--onion`, `--probe`, `--gif`) bizim. |
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
