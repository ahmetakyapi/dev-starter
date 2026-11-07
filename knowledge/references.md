# Referans Arşivi — Neyi Nereden Öğrendik

Ekosisteme bir şey kazandırmış her dış kaynak burada tek listede durur:
tasarım dilini incelediğimiz siteler, kurallarını ya da kodunu uyarladığımız
depolar, yön veren belgeler. Amaç ileride "o gölgeyi nereden almıştık?",
"şu siteye bir daha bakalım" diye aramamak.

Bu dosya bir **kayıttır**, öneri listesi değil:

- `knowledge/design-references.md` → `/reference` komutunun okuduğu,
  yalnız TAMAMEN ÜCRETSİZ bölüm galerileri (navbar, CTA, footer, 404,
  bento). Yeni bir bölüm kurarken oraya bakılır.
- Bu dosya → gerçekten referans aldığımız her şey (ücretli/kısmen ücretli
  dahil), ne aldığımız, ne zaman aldığımız ve kararın nerede yazılı olduğu.

**Kural: alınan şey dil ve davranıştır, kod ve varlık değil.** Renk, metin,
logo, görsel ve font projeden gelir; kod yalnız açık lisansla (MIT vb.) ve
dosya başında atıfla uyarlanır. Ayrıntı `design-references.md` → Kullanım
Şartı.

**Sitede:** Storybook → Örnek Tasarım/Referans Arşivi (`/references`) bu
dosyayı derleme anında okur ve kart olarak gösterir: kartta yalnız ad,
**Kısaca** sütunu (tek satır, ~60 karakter), tarih ve durum görünür; uzun
açıklama burada kalır. Kapak görseli sitenin kendi paylaşım görseli
(`storybook/stories/referans/_covers.ts`, alan adına göre). Tablo biçimini
(başlık satırı, `|---|` ayracı, hücrede `|` yok) bozma; yeni bölüm `## `
başlığıyla açılır ve sayfada kendiliğinden yeni kategori olur.

**Yeni referans alınınca:** buraya satır (en yeni en üstte), kararın
gerekçesi `knowledge/decisions.md`'ye, alınan şey CHANGELOG'a. Satır silinmez;
sonradan vazgeçilirse "Durum" sütunu güncellenir.

Son gözden geçirme: 2026-11-04

---

## 1. Tasarım Dili İncelenen Siteler

| Site | Kısaca | Tarih | Ne aldık | Nerede yaşıyor | Ücret | Durum |
|---|---|---|---|---|---|---|
| [secki.dev](https://secki.dev/) | Tasarım mühendisleri için 332 bağlantılık seçki (bileşen, shader, ikon, skill) | 2026-11-06 | Seçkinin bileşen ve hareket kaynakları tarandı; davranış öğrenildi, kod alınmadı: ışık kenarı (libraries.dev/beam), düşünme küresi (libraries.dev/orbs, aicss thinking-state), piksel yükleyici (d2studio spinners, generativeloaders), kayan metin (textmotion slot-text), çözülen metin (colorion text effects), canlı ikon (itshover, lucide-animated), biçim değiştiren ikon (morphicons), kitap kapağı (spell.sh perspective-book), terminal (termcn), kadran, elle işaretleme, yarım ton (dotforge, ascii-magic), genişleyen kart (motion-primitives morphing dialog), araç çağrısı ve düşünce bloğu (beautifului, hextaui), akan metin (generative-loaders). Storybook kabuğu için örnekler: Grafana, Canvas Kit, Vibe, Geist | `decisions.md` → "Secki Turu"; `snippets/ui/` → 17 yeni bileşen; `guides/04` § 15; `scripts/slop-scan.sh` 17-24; Storybook kapağı ve kabuğu | Ücretsiz | Kullanımda |
| [patterncraft.fun](https://patterncraft.fun/) | Zemin deseni ve ışık kütüphanesi | 2026-11-06 | Kütüphane deneyimi: kategori, arama, kartta canlı önizleme, "Önizle" ile bütün sayfaya uygula, tek tıkla kopyala, favoriler. Desen aileleri (ufuk ışığı, solan ızgara, kesik ızgara, noktalı ızgara, tarama, gren). Onların her rengi sabit hex; bizimkiler token'dan, 10 palet × 2 temada kendiliğinden | `snippets/ui/pattern-bg.tsx` (`PATTERN_PRESETS`); Storybook → Örnek Tasarım → Desen Kütüphanesi | Ücretsiz (MIT) | Kullanımda |
| [easyui.site](https://easyui.site/components) | İş akışı desenleri: seçim çubuğu, bölünmüş düğme, tur, içindekiler | 2026-11-04 | 132 bileşenlik açık kaynak katalog; bizde karşılığı olmayan dört desen: toplu işlem adası (Selection basket), bölünmüş düğme (Split button), ürün turu (Product tour), okuma ilerlemeli içindekiler (Scroll progress nav). Kalanların çoğu kütüphanemizde zaten var | `decisions.md` → "EasyUI Turu"; `snippets/ui/` → `selection-bar`, `split-button`, `product-tour`, `toc-nav`; Pusula Gelen, Raporlar, Pano, Ayarlar | Ücretsiz, açık kaynak | Kullanımda |
| [bencho.dev](https://bencho.dev/) | Mikro etkileşimler: kota çubuğu, kişi seçici, basılı tut, cetvel | 2026-11-04 | Mikro etkileşim davranışları: kategorili kota çubuğu (Context meter), avatar yığınlı kişi seçici (Assignees), basılı tut onayı (Slide to confirm yerine), tepkiler (emojisiz), saat cetveli (Time scrubber), imza alanı (Signature pad). Görsel dili board diliyle aynı (gri kuyu + beyaz karo) | `decisions.md` → "Bencho Turu"; `snippets/ui/` → `meter` (`lg`), `assignee-picker`, `hold-button`, `reactions`, `time-scrubber`, `signature-pad`, `tick-ruler`, `digit-roll` | Ücretsiz katman + Pro (€99/yıl, €129 ömür boyu) | Kullanımda |
| [ui.wensity.com](https://ui.wensity.com/) | Derinlik işçiliği: gölge merdiveni, ışıklı kenar, kod bloğu | 2026-11-03 | Derinlik işçiliği (hesaplanmış stiller ölçüldü): katmanlı negatif yayılmalı gölge merdiveni, üstten ışıklı kenar, dolgu renginde düşüşlü düğme, içe oyulmuş alan, odak halesi, sıkı display harf aralığı. Bileşen sayfası düzeni (Önizleme/Kod sekmesi, paket yöneticisi sekmeli kurulum). Desenler: kod bloğu, kayan şerit, önce/sonra, parıltılı metin | `decisions.md` → "İşçilik Turu"; `guides/02` § 4 Gölge merdiveni; `snippets/ui/` → `code-block`, `marquee`, `compare-slider`, `text-shimmer`; Açılış Zili PR #31 | Ücretsiz bileşenler (MIT) + Pro ($169/yıl, $199 ömür boyu) | Kullanımda |
| [Apple Human Interface Guidelines — Color](https://developer.apple.com/design/human-interface-guidelines/color) | Tek ton uyarı dolgusu, iki temada aynı turuncu | 2026-11-03 | Sistem turuncusu mantığı: canlı ton iki temada AYNI dolgu, metin rengi temaya göre ayrı; bilgi kartında zemin nötr, renk tek noktada | `decisions.md` → "Uyarı Tonu Tek Aile"; `--warning-fill`; Pusula gecikme kartı (`storybook/stories/showcase/_gecikme.tsx`) | Ücretsiz | Kullanımda |
| [shojimac.com](https://shojimac.com/) | Kâğıt-mürekkep ürün sayfası dili | 2026-11 | Mac uygulaması ürün sayfası: iki tonlu sıkı başlık, numaralı adımlar, tuş kapakları; Nimbstia'da "kâğıt-mürekkep" yönü | `knowledge/themes/nimbstia.md` § 1; `design-references.md` | Ücretsiz (tek site) | Nimbstia'da denendi, sahibi reddetti ("çok siyah, etiketler okunmuyor"); ders `mistakes.md` #115–118 |
| macOS widget'ları | Bir bakışta okunan aydınlık widget kartları | 2026-11 | Nimbstia'nın ikinci turu: aydınlık, bir bakışta okunan widget kartları, renk yalnız sinyal | `knowledge/themes/nimbstia.md` | — | Kullanımda (Nimbstia) |
| [boardui.com](https://www.boardui.com/) | Board dili: gri kuyu, beyaz karo, pastel grafikler | 2026-11-01 | Board dili: nötr gri sistem (mavi tonsuz), gri kuyu kart + beyaz karo, kısa katmanlı gölge, yukarıdan aşağı tek aile CTA degradesi, pastel ve eşit parlaklıkta grafik serileri, iz üstünde çubuk | `decisions.md` → "Board Görsel Dili"; `--chart-*`; grafik bileşenleri; `board` font preseti | Ücretsiz bileşenler (MIT) + ücretli grafikler/şablonlar | Kullanımda (ekosistemin varsayılan dili) |
| [Açılış Zili](https://aciliszili.com/) (kendi projemiz) | Ekosistemin görsel referansı ve signature paleti | 2026-10-03 | Ekosistemin görsel referansı: `signature` paleti, iki katmanlı token mimarisi, display degradesi | `knowledge/themes/acilis-zili.md`; `decisions.md` → "Palet"; CLAUDE.md → Açık kararlar 1 | — | Kullanımda |

## 2. Bölüm Galerileri (`/reference`)

Tamamı ücretsiz; ayrıntı, kullanım notları ve doğrulama tarihi
`knowledge/design-references.md`'de (2026-10-16).

| Bölüm | Kısaca | Galeri |
|---|---|---|
| Üst menü | Gerçek sitelerin menüleri | [navbar.gallery](https://www.navbar.gallery/) |
| Eylem çağrısı | Eylem çağrısı bantları | [cta.gallery](https://www.cta.gallery/) |
| Alt bilgi | Üslup filtreli alt bilgiler | [footer.design](https://www.footer.design/) |
| 404 sayfası | 404 sayfaları | [404s.design](https://www.404s.design/) |
| Bento ızgara | 285 bento düzeni | [bentogrids.com](https://bentogrids.com/) |
| Grafik kartı, pano | Grafik kartı ve pano vitrini | [boardui.com](https://www.boardui.com/) |

## 3. Değerlendirilip Alınmayanlar

| Kaynak | Kısaca | Tarih | Neden |
|---|---|---|---|
| [scrolltide.co](https://scrolltide.co/) | Ücretli şablon kataloğu | 2026-10-16 | Ücretli (121 şablonun 4'ü ücretsiz); şartlar yalnız kişisel ve müşteri işi; React + Vite, GSAP/Three.js varsayıyor |
| [unsection.com](https://unsection.com/) | Kısmen ücretli bölüm kütüphanesi | 2026-10-16 | Freemium (kategori başına 30 bölüm, tamamı aylık 5 $) |
| [60fps.design](https://60fps.design/) | Kısmen ücretli, yalnız SwiftUI | 2026-10-16 | Freemium; kod parçaları yalnız SwiftUI |
| bencho.dev → Sounds, Eye tracker, Slingshot, Slosh slider | Oyuncak etkileşimler | 2026-11-04 | Oyuncak etkileşim; nedeni tek cümleyle yazılamıyor (`guides/04-motion.md`) |
| bencho.dev → Emoji reactions (emojiyle) | Emojili tepkiler | 2026-11-04 | Arayüzde emoji yasak (slop); desen ikonla alındı |
| bencho.dev → Label input, Create menu | Zaten karşılığı olan iki blok | 2026-11-04 | `input` ve `dropdown-menu` zaten karşılıyor |
| ui.wensity.com → kırmızı marka, WebGL sıvı metal düğme, imleci izleyen etiket, `#fafafa` zemin | Marka rengi ve WebGL süsleri | 2026-11-03 | Paletimiz ayrı; WebGL süsü gerekçesiz; açık zemin board dilinin beyaz sayfa + gri kuyu ayrımını bozardı |
| easyui.site → Dynamic island, Glitch text, Meteors, Rocket party popper, Car smoke geçişi | Gösteri efektleri | 2026-11-04 | Nedeni tek cümleyle yazılamıyor (`guides/04-motion.md`) |
| easyui.site → Settle modal (0,94 → 1,02 → 1) | Taşan diyalog açılışı | 2026-11-04 | Taşma (overshoot) yalnız küçük tek öğede; diyalog ve panel girişinde değil |
| secki.dev → holosticker, hologram particles, shader stüdyoları (Unicorn, Shaders, ShaderGradient) | WebGL süsleri | 2026-11-06 | Three.js/WebGL yükü ve nedeni tek cümleyle yazılamayan hareket; desen ve ışık CSS'le (`pattern-bg`) |
| sensory-ui (anlamlı arayüz sesleri) | Web Audio ile sentezlenen sesler | 2026-11-06 | Ses iki kez reddedildi (`decisions.md` → Bencho Turu); bileşen yazıldı ama kararla çeliştiği için çıkarıldı, kullanıcı kararına bırakıldı |
| Lenis, Glimm, ScrollyVideo | Kaydırma ve sayfa geçişi kütüphaneleri | 2026-11-06 | Doğal kaydırmayı ele geçirir; ekosistem `motion/react` + CSS kaydırma animasyonu kullanır (`guides/04` § 7) |
| Hallmark, wondelai/top-design, jakubkrehel/better-ui (kurulum) | Kural seti skill'leri | 2026-11-06 | Kimlik kararlarımızla çatışıyor (Inter, künye ayracı, eyebrow, çıkış eğrisi); değerleri `guides/04` § 15'e hasat edildi, skill kurulmadı |
| impeccable (tasarım denetçisi eklentisi) | Eski tasarım denetçisi, yerine slop taraması | 3.0.0 | Kaldırıldı: `design:detect`, CI adımı ve `.impeccable/` yerine `slop-scan.sh` (CHANGELOG 3.0.0) |

## 4. Skill ve Kural Kaynakları

| Kaynak | Kısaca | Tarih | Lisans | Ne aldık | Nerede yaşıyor |
|---|---|---|---|---|---|
| [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) | Slop kalıpları ve radius formülü | 2026-10-26 | MIT | AI slop kalıpları (ölçülebilir olanlar), iç içe radius formülü, `design-to-motion` kuralları | `scripts/slop-scan.sh`, `guides/02` § 4, `guides/04`; `decisions.md` → "AI Slop Taraması" |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Tasarım zevki skill paketi | 2026-10-03 denetimi | — | Yedi skill: `design-taste-frontend`, `redesign-existing-projects`, `high-end-visual-design`, `minimalist-ui`, `brandkit`, `imagegen-frontend-web`, `imagegen-frontend-mobile` | `machine/bootstrap.sh` → `TASTE_SKILLS`, `machine/README.md` |
| [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | İzometrik açıklayıcı figür kiti | 2026-10-11 | MIT | Açıklayıcı figür (izometrik SVG) kiti ve kuralları; sabit commit'e kurulur | `machine/bootstrap.sh` → `ANATOMY_REF`, `scripts/add-figure-kit.mjs`, `verify:anatomy` |
| [sarpstar/cinecode](https://github.com/sarpstar/cinecode) | Kodla film stüdyosu skill'i (Hızlı/Film modu, ses, master) | 2026-11-07 | MIT | Skill'in tamamı; MP4 teslim edilen filmler onunla, sayfa içi film `motion-film`le. Koruma kancası taşıdığı için sabit commit'e kurulur | `machine/bootstrap.sh` → `CINECODE_REF`, `motion-film` § 1b, Açılış Zili `docs/film-kimligi.md` |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) · [jakubkrehel/skills](https://github.com/jakubkrehel/skills) · [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | Tasarım mühendisliği skill'leri (secki → Skills) | 2026-11-06 | MIT | Frekans kapısı, hareketin tek kanal olmaması, keyframe yerine geçiş, kökenli açılır katman, ikon çizgisi ağırlığı; açık kararlar listesi (çıkış eğrisi, basış ölçeği) | `guides/04-motion.md` § 15 |
| [shadcn-ui/lint](https://github.com/shadcn-ui/lint) | Tailwind tasarım sistemi linteri | 2026-11-06 | MIT | `no-raw-colors`, `require-static-classes` fikirleri slop taramasına | `scripts/slop-scan.sh` 17-24, `scripts/test-slop-scan.sh` |
| LottieFiles — motion-design skill | UI hareketi: zamanlama ve easing | 2026-10 | MIT | UI hareketi: zamanlama, easing, koreografi, Disney ilkeleri | `machine/skills/motion-design/` |
| Kodla hareket filmi kaynakları (on bir kaynak: lemo-opuscar, ClaudeAnimationBase, mg-styles-15, pdoom-video, awesome-opus5-5-videos ve diğerleri) | Kodla hareket filmi yapımı | 2026-10 | Kaynağa göre (MIT / yalnız fikir) | Yönetmenlik, render sözleşmesi, inceleme döngüsü, ses, stil tarifleri | `machine/skills/motion-film/reference/kaynaklar.md` (her birinin bağlantısı, lisansı ve ne alındığı orada) |

## 5. Teknik Belge ve Protokoller

| Kaynak | Kısaca | Ne için | Nerede |
|---|---|---|---|
| [Base UI](https://base-ui.com/) | Headless bileşen katmanı | Headless bileşen katmanı (popover, menü, toast, slider…) | `guides/10` § 2 Headless Kütüphane Kararı |
| [AG-UI](https://docs.ag-ui.com/) | Agentic UI olay protokolü | Agentic UI olay protokolü (`@ag-ui/client`, CopilotKit pin'i) | `rules/agentic-ui.md`, `mistakes.md` #71 |
| [google/A2UI](https://github.com/google/A2UI) | Agent'ın ürettiği arayüz yapıları | Agent'ın ürettiği UI yapıları | `rules/agentic-ui.md`, `/agentic` |
| [Keep a Changelog](https://keepachangelog.com/) · [Semantic Versioning](https://semver.org/) | Değişiklik günlüğü ve sürüm biçimi | CHANGELOG biçimi ve sürüm numarası | `CHANGELOG.md`, `/release` |

## 6. Kendi Projelerimiz (İç Referans)

Görsel hafızaları `knowledge/themes/`te (DESIGN.md, 9 bölüm). Yeni bir
projeye "şu projedeki gibi" denirken buradan bakılır.

| Proje | Kısaca | Bağlantı | Görsel hafıza |
|---|---|---|---|
| Açılış Zili | ABD borsasını Türkiye saatiyle anlatan site | [aciliszili.com](https://aciliszili.com/) · [GitHub](https://github.com/ahmetakyapi/acilis-zili) | `knowledge/themes/acilis-zili.md` |
| Ramazan Vakitleri | Ramazan'da vakitler ve iftar geri sayımı | [GitHub](https://github.com/ahmetakyapi/ramazan-vakitleri) | `knowledge/themes/ramazan-vakitleri.md` |
| Keşke Alsaydım | "Keşke alsaydım" portföy takibi | [GitHub](https://github.com/ahmetakyapi/keskealsaydim) | `knowledge/themes/keskealsaydim.md` |
| DigyNotes | Film, kitap, oyun ve seyahat notları | [GitHub](https://github.com/ahmetakyapi/DigyNotes) | `knowledge/themes/digynotes.md` |
| Nimbstia | Klavye öncelikli macOS çalışma tezgâhı | GitHub: `ahmetakyapi/Nimbstia` | `knowledge/themes/nimbstia.md` |
| ahmetakyapi.com | Kişisel portfolyo ve blog | — | `knowledge/themes/ahmetakyapi.md` |
| Mimio | Seansta elde tutulan klinik araç | — | `knowledge/themes/mimio.md` |
| dev-starter Storybook | Bu ekosistemin canlı bileşen kataloğu | [dev-starter-storybook.vercel.app](https://dev-starter-storybook.vercel.app/) (`/showcase`, `/demo`) | `storybook/README.md` |
