---
paths:
  - "**/*.css"
  - "**/*.tsx"
  - "**/*.jsx"
  - "app/**"
  - "components/**"
---

# Tasarım Skill'leri — taste-skill Ailesi (global, yol kapsamlı)

> Kaynak: `~/dev-starter/machine/rules/design-skills.md` → `~/.claude/rules/dev-starter/`
> (bootstrap). 8 Kasım 2026'ya dek global `CLAUDE.md`nin "Tasarım Skill'leri"
> bölümüydü. VARSAYILAN kuralın kendisi (her frontend işinde kod yazmadan önce
> `design-taste-frontend`) global `CLAUDE.md`de tek satır olarak kaldı; burada
> ayrıntısı (`knowledge/decisions.md` → "Bağlam Dosyaları").

Kurulu ve tüm oturumlarda açık: `~/.agents/skills/` → `~/.claude/skills/`
(symlink). Kaynak: `npx skills add Leonxlnx/taste-skill`, yalnızca kullanılan
yedisi (`machine/bootstrap.sh` → `TASTE_SKILLS`): `design-taste-frontend`,
`redesign-existing-projects`, `high-end-visual-design`, `minimalist-ui`,
`brandkit`, `imagegen-frontend-web`, `imagegen-frontend-mobile`. Depodan ayrıca
`motion-design` ve `motion-film`; dış depodan sabit commit'le `anatomy` ve `cinecode`. Paketin geri kalanı ve impeccable 3 Ekim 2026'da kaldırıldı.

> **VARSAYILAN — her projede geçerli.** `design-taste-frontend` (taste-skill v2)
> tanıtım sayfası, portfolyo ve pazarlama sayfası içeren **her** frontend işinde
> KOD YAZMADAN ÖNCE çağrılır. "Küçük bir düzeltme" bahanesi yok: skill'in
> denetim listesi (em dash yasağı, eyebrow tavanı, bölüm düzeni tekrarı, sahte
> ekran görüntüsü yasağı, kahraman disiplini) tam da o küçük düzeltmelerde
> ihlal ediliyor. Kullanıcı adını anmasa bile çağır.
>
> **Kapsam dışı (skill §13):** panolar, yoğun ürün arayüzü, yönetim panelleri,
> veri tabloları, çok adımlı formlar. Bu ekranlarda skill'in yalnızca pazarlama
> bölümleri geçerlidir; kalanında proje tema dosyası ve ekosistem kuralları
> yürür. İş bir panoysa bunu açıkça söyle, skill'i zorla uygulama.

## Ne Zaman Çağır

| Durum | Skill |
|-------|-------|
| **Her frontend işi — varsayılan** | `design-taste-frontend` |
| Mevcut arayüzü premium'a çekme | `redesign-existing-projects` |
| Marka rehberi, logo sistemi | `brandkit` |
| Görsel referans üretimi (web / mobil) | `imagegen-frontend-web` / `-mobile` |
| Yeni bölüm (menü, CTA, alt bilgi, 404, bento) ya da kullanıcı "bu yapıyı kendi renklerimle kur" diye ekran görüntüsü verdi | `/reference` — galeri `~/dev-starter/knowledge/design-references.md`; yapı alınır, renk/metin/logo alınmaz |
| Hareket kararı, zamanlama | `motion-design` + `~/dev-starter/guides/04-motion.md` |
| Sayfa içi hareket filmi: bekleme/açılış filmi, kinetik yazı, mürekkep sahnesi | `motion-film` |
| MP4 teslim edilen film: kısa film, tanıtım/reklam, müzik videosu, çekim kurgusu | `cinecode` (sabit commit, `bootstrap.sh` → `CINECODE_REF`; iş bölümü `motion-film` § 1b) |
| Sade editoryal arayüz | `minimalist-ui` |

## Mevcut Projeye Girerken — Mod Tespiti (skill §11.A) ŞART

Var olan bir sitede skill'in varsayılan dial'ları (8/6/4) KULLANILMAZ. Mod
"Redesign — Preserve"dir: marka token'ları, IA, çapa (`#anchor`) ve kopya sesi
korunur; dial'lar sitenin kendi okumasından çıkarılır. Skill'i greenfield gibi
çalıştırmak marka kimliğini siler.

## Öncelik Sırası — Çakışma Olursa

1. Proje `THEME.md` ve `knowledge/themes/*` — renk, font, degrade, radius,
   gölge, bileşen dili. Skill bunları **ezmez**.
2. Global ekosistem kuralları (`~/.claude/CLAUDE.md` + bu klasördeki kurallar)
   ve `~/dev-starter/guides/` — kimlik, motion, Tailwind v4, token zorunluluğu.
3. Skill'in zanaat kuralları — eyebrow tavanı, kahraman disiplini, sahte
   ekran görüntüsü yasağı, bölüm düzeni tekrarı, CTA tutarlılığı.

## Bilinen Çakışmalar

- Skill'ler GSAP ya da `framer-motion` önerebilir; ekosistem `motion/react`
  (LazyMotion + `m.*`) ve CSS kullanır. Öneriyi bu tech stack'e çevir.
- `high-end-visual-design` kendi font/gölge setini getirir; tema dosyası olan
  projelerde (Mimio, Açılış Zili) çağırma.
- Skill'ler `lucide-react`'i önermez; ekosistem kuralı `lucide-react` der.
  Mevcut projede zaten kuruluysa skill'in kendi istisnası geçerli, lucide kalır.
- Skill em dash'i tümüyle yasaklar. Bu kural **kullanıcıya görünen arayüz
  metni** için geçerlidir; kod yorumları ve dokümanlar kapsam dışı.

## Sahne Dili — Ekran Tasarlamadan Önce (Sergi Turu, 25 Kasım 2026)

Referans turu (Synaps, Lasso, Grain, Veridical, Finance, Lindy, Nexora;
`knowledge/references.md`) bütün yönlerde işe yarayan yedi kompozisyon
kararına indi. Yeni bir ekran ya da bölüm tasarlarken, kod yazmadan önce
her birine evet/hayır ver; ayrıntı ve yasaklar `knowledge/design-directions.md`
→ `sergi`.

1. **Başlık iki ton:** güçlü iddia + soluk bağlam, iki satır, virgülsüz
   (`section-heading`, `tone-text`). Başlıkta en çok BİR işaret (`head-mark`).
2. **Ürünü sergile, ekran görüntüsü koyma:** gerçek bileşenlerle çizilmiş
   pencere (`app-window`), gerekiyorsa dokulu zeminde (`art-mat`: boya,
   kareli kağıt, sulu boya; yırtık kenar, alttan kırpma). Sayfada en çok iki.
3. **Künye seyrek:** kesik çizgili mono künye (`Eyebrow`) sayfada en çok iki
   bölümde; her bölümde künye hepsini sıradanlaştırır.
4. **Görsel + liste ikilisi:** bir yanda sergilenen ürün, öbür yanda kartsız
   `feature-list` (renkli çizgi ikon, kıl çizgi). Kart yığını değil.
5. **Süreci seçtir:** "nasıl çalışır" yatay `step-tabs` (seçili adım net,
   diğerleri soluk, altında adımın sahnesi); dikey anlatı için `step-rail`.
6. **Uygulama ekranında yoğunluk önce:** satırda TEK durum rozeti (istisna
   olanı göster: "Riskli" varsa "Aktif" yazma), gerekçe tek satır ve
   kırpılır; satır 48-56 px. Pano başlığında kişiye seslenen tek satır.
7. **Hareket bir kez:** başlık satır satır netleşir, kalem şeridi bir kez
   çekilir, paspartu kaydırınca daralır; hepsi `transform`, hareket
   azaltmada durağan. Sürekli dönen şey yalnız durdurulabilir olandır.
