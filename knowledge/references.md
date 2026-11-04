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

**Yeni referans alınınca:** buraya satır (en yeni en üstte), kararın
gerekçesi `knowledge/decisions.md`'ye, alınan şey CHANGELOG'a. Satır silinmez;
sonradan vazgeçilirse "Durum" sütunu güncellenir.

Son gözden geçirme: 2026-11-04

---

## 1. Tasarım Dili İncelenen Siteler

| Site | Tarih | Ne aldık | Nerede yaşıyor | Ücret | Durum |
|---|---|---|---|---|---|
| [bencho.dev](https://bencho.dev/) | 2026-11-04 | Mikro etkileşim davranışları: kategorili kota çubuğu (Context meter), avatar yığınlı kişi seçici (Assignees), basılı tut onayı (Slide to confirm yerine), tepkiler (emojisiz), saat cetveli (Time scrubber), imza alanı (Signature pad). Görsel dili board diliyle aynı (gri kuyu + beyaz karo) | `decisions.md` → "Bencho Turu"; `snippets/ui/` → `meter` (`lg`), `assignee-picker`, `hold-button`, `reactions`, `time-scrubber`, `signature-pad` | Ücretsiz katman + Pro (€99/yıl, €129 ömür boyu) | Kullanımda |
| [ui.wensity.com](https://ui.wensity.com/) | 2026-11-03 | Derinlik işçiliği (hesaplanmış stiller ölçüldü): katmanlı negatif yayılmalı gölge merdiveni, üstten ışıklı kenar, dolgu renginde düşüşlü düğme, içe oyulmuş alan, odak halesi, sıkı display harf aralığı. Bileşen sayfası düzeni (Önizleme/Kod sekmesi, paket yöneticisi sekmeli kurulum). Desenler: kod bloğu, kayan şerit, önce/sonra, parıltılı metin | `decisions.md` → "İşçilik Turu"; `guides/02` § 4 Gölge merdiveni; `snippets/ui/` → `code-block`, `marquee`, `compare-slider`, `text-shimmer`; Açılış Zili PR #31 | Ücretsiz bileşenler (MIT) + Pro ($169/yıl, $199 ömür boyu) | Kullanımda |
| [Apple Human Interface Guidelines — Color](https://developer.apple.com/design/human-interface-guidelines/color) | 2026-11-03 | Sistem turuncusu mantığı: canlı ton iki temada AYNI dolgu, metin rengi temaya göre ayrı; bilgi kartında zemin nötr, renk tek noktada | `decisions.md` → "Uyarı Tonu Tek Aile"; `--warning-fill`; Pusula gecikme kartı (`storybook/stories/showcase/_gecikme.tsx`) | Ücretsiz | Kullanımda |
| [shojimac.com](https://shojimac.com/) | 2026-11 | Mac uygulaması ürün sayfası: iki tonlu sıkı başlık, numaralı adımlar, tuş kapakları; Nimbstia'da "kâğıt-mürekkep" yönü | `knowledge/themes/nimbstia.md` § 1; `design-references.md` | Ücretsiz (tek site) | Nimbstia'da denendi, sahibi reddetti ("çok siyah, etiketler okunmuyor"); ders `mistakes.md` #115–118 |
| macOS widget'ları | 2026-11 | Nimbstia'nın ikinci turu: aydınlık, bir bakışta okunan widget kartları, renk yalnız sinyal | `knowledge/themes/nimbstia.md` | — | Kullanımda (Nimbstia) |
| [boardui.com](https://www.boardui.com/) | 2026-11-01 | Board dili: nötr gri sistem (mavi tonsuz), gri kuyu kart + beyaz karo, kısa katmanlı gölge, yukarıdan aşağı tek aile CTA degradesi, pastel ve eşit parlaklıkta grafik serileri, iz üstünde çubuk | `decisions.md` → "Board Görsel Dili"; `--chart-*`; grafik bileşenleri; `board` font preseti | Ücretsiz bileşenler (MIT) + ücretli grafikler/şablonlar | Kullanımda (ekosistemin varsayılan dili) |
| [Açılış Zili](https://aciliszili.com/) (kendi projemiz) | 2026-10-03 | Ekosistemin görsel referansı: `signature` paleti, iki katmanlı token mimarisi, display degradesi | `knowledge/themes/acilis-zili.md`; `decisions.md` → "Palet"; CLAUDE.md → Açık kararlar 1 | — | Kullanımda |

## 2. Bölüm Galerileri (`/reference`)

Tamamı ücretsiz; ayrıntı, kullanım notları ve doğrulama tarihi
`knowledge/design-references.md`'de (2026-10-16).

| Bölüm | Galeri |
|---|---|
| Üst menü | [navbar.gallery](https://www.navbar.gallery/) |
| Eylem çağrısı | [cta.gallery](https://www.cta.gallery/) |
| Alt bilgi | [footer.design](https://www.footer.design/) |
| 404 sayfası | [404s.design](https://www.404s.design/) |
| Bento ızgara | [bentogrids.com](https://bentogrids.com/) |
| Grafik kartı, pano | [boardui.com](https://www.boardui.com/) |

## 3. Değerlendirilip Alınmayanlar

| Kaynak | Tarih | Neden |
|---|---|---|
| [scrolltide.co](https://scrolltide.co/) | 2026-10-16 | Ücretli (121 şablonun 4'ü ücretsiz); şartlar yalnız kişisel ve müşteri işi; React + Vite, GSAP/Three.js varsayıyor |
| [unsection.com](https://unsection.com/) | 2026-10-16 | Freemium (kategori başına 30 bölüm, tamamı aylık 5 $) |
| [60fps.design](https://60fps.design/) | 2026-10-16 | Freemium; kod parçaları yalnız SwiftUI |
| bencho.dev → Sounds, Eye tracker, Slingshot, Slosh slider | 2026-11-04 | Oyuncak etkileşim; nedeni tek cümleyle yazılamıyor (`guides/04-motion.md`) |
| bencho.dev → Emoji reactions (emojiyle) | 2026-11-04 | Arayüzde emoji yasak (slop); desen ikonla alındı |
| bencho.dev → Label input, Create menu | 2026-11-04 | `input` ve `dropdown-menu` zaten karşılıyor |
| ui.wensity.com → kırmızı marka, WebGL sıvı metal düğme, imleci izleyen etiket, `#fafafa` zemin | 2026-11-03 | Paletimiz ayrı; WebGL süsü gerekçesiz; açık zemin board dilinin beyaz sayfa + gri kuyu ayrımını bozardı |
| impeccable (tasarım denetçisi eklentisi) | 3.0.0 | Kaldırıldı: `design:detect`, CI adımı ve `.impeccable/` yerine `slop-scan.sh` (CHANGELOG 3.0.0) |

## 4. Skill ve Kural Kaynakları

| Kaynak | Tarih | Lisans | Ne aldık | Nerede yaşıyor |
|---|---|---|---|---|
| [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) | 2026-10-26 | MIT | AI slop kalıpları (ölçülebilir olanlar), iç içe radius formülü, `design-to-motion` kuralları | `scripts/slop-scan.sh`, `guides/02` § 4, `guides/04`; `decisions.md` → "AI Slop Taraması" |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | 2026-10-03 denetimi | — | Yedi skill: `design-taste-frontend`, `redesign-existing-projects`, `high-end-visual-design`, `minimalist-ui`, `brandkit`, `imagegen-frontend-web`, `imagegen-frontend-mobile` | `machine/bootstrap.sh` → `TASTE_SKILLS`, `machine/README.md` |
| [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) | 2026-10-11 | MIT | Açıklayıcı figür (izometrik SVG) kiti ve kuralları; sabit commit'e kurulur | `machine/bootstrap.sh` → `ANATOMY_REF`, `scripts/add-figure-kit.mjs`, `verify:anatomy` |
| LottieFiles — motion-design skill | 2026-10 | MIT | UI hareketi: zamanlama, easing, koreografi, Disney ilkeleri | `machine/skills/motion-design/` |
| Kodla hareket filmi kaynakları (on bir kaynak: lemo-opuscar, ClaudeAnimationBase, mg-styles-15, pdoom-video, awesome-opus5-5-videos ve diğerleri) | 2026-10 | Kaynağa göre (MIT / yalnız fikir) | Yönetmenlik, render sözleşmesi, inceleme döngüsü, ses, stil tarifleri | `machine/skills/motion-film/reference/kaynaklar.md` (her birinin bağlantısı, lisansı ve ne alındığı orada) |

## 5. Teknik Belge ve Protokoller

| Kaynak | Ne için | Nerede |
|---|---|---|
| [Base UI](https://base-ui.com/) | Headless bileşen katmanı (popover, menü, toast, slider…) | `guides/10` § 2 Headless Kütüphane Kararı |
| [AG-UI](https://docs.ag-ui.com/) | Agentic UI olay protokolü (`@ag-ui/client`, CopilotKit pin'i) | `rules/agentic-ui.md`, `mistakes.md` #71 |
| [google/A2UI](https://github.com/google/A2UI) | Agent'ın ürettiği UI yapıları | `rules/agentic-ui.md`, `/agentic` |
| [Keep a Changelog](https://keepachangelog.com/) · [Semantic Versioning](https://semver.org/) | CHANGELOG biçimi ve sürüm numarası | `CHANGELOG.md`, `/release` |

## 6. Kendi Projelerimiz (İç Referans)

Görsel hafızaları `knowledge/themes/`te (DESIGN.md, 9 bölüm). Yeni bir
projeye "şu projedeki gibi" denirken buradan bakılır.

| Proje | Bağlantı | Görsel hafıza |
|---|---|---|
| Açılış Zili | [aciliszili.com](https://aciliszili.com/) · [GitHub](https://github.com/ahmetakyapi/acilis-zili) | `knowledge/themes/acilis-zili.md` |
| Ramazan Vakitleri | [GitHub](https://github.com/ahmetakyapi/ramazan-vakitleri) | `knowledge/themes/ramazan-vakitleri.md` |
| Keşke Alsaydım | [GitHub](https://github.com/ahmetakyapi/keskealsaydim) | `knowledge/themes/keskealsaydim.md` |
| DigyNotes | [GitHub](https://github.com/ahmetakyapi/DigyNotes) | `knowledge/themes/digynotes.md` |
| Nimbstia | GitHub: `ahmetakyapi/Nimbstia` | `knowledge/themes/nimbstia.md` |
| ahmetakyapi.com | — | `knowledge/themes/ahmetakyapi.md` |
| Mimio | — | `knowledge/themes/mimio.md` |
| dev-starter Storybook | [dev-starter-storybook.vercel.app](https://dev-starter-storybook.vercel.app/) (`/showcase`, `/demo`) | `storybook/README.md` |
