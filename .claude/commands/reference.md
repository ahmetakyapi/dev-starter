---
description: Gerçek bir sitenin bir bölümünü (menü, eylem çağrısı, kahraman, alt bilgi, fiyat…) referans alır, YAPISINI projenin kendi token'larıyla kurar. Referans yoksa katalogdan galeri önerir. Renk, metin, logo ve kod kopyalanmaz.
argument-hint: "<bölüm> [ekran görüntüsü | site adresi] — ör. 'navbar', 'cta ~/Desktop/cta.png', 'hero https://ornek.com'"
---

# /reference — Referanstan Kur

Bölüm ve referans: **$ARGUMENTS**

Hazır şablondan kurulan bölüm her projede aynı görünür. Gerçek bir sitenin
iyi çözülmüş bir bölümünü referans vermek sonucu belirgin biçimde ayırır.
Bu komut referansın **yapısını** alır; renk, yazı, ton ve metin projeden
gelir. Kaynak listesi ve kullanım şartları:
`~/dev-starter/knowledge/design-references.md`.

## 0. Bağlam

- Projenin tema kaynağı: `docs/DESIGN.md` ya da
  `~/dev-starter/knowledge/themes/<proje>.md`, seçili palet (`data-palette`)
  ve `app/globals.css` token'ları. Referans bunları **ezmez**.
- `~/dev-starter/guides/05-components.md` (ekran düzeni, şablon bileşenleri),
  `~/dev-starter/guides/10-component-library.md` (menü, çekmece, dialog).
- Pazarlama yüzeyiyse `design-taste-frontend` skill'i (global CLAUDE.md
  varsayılanı); panoda ve yoğun ürün ekranında değil.

## 1. Referans yoksa: galeri öner

Kataloğun **Bölüm → Kaynak** tablosundan o bölüm için en fazla iki galeri
öner ve kullanıcıdan beğendiği örneğin ekran görüntüsünü ya da örneğin
geldiği sitenin adresini iste. Seçim kullanıcınındır: bu bir zevk kararı,
ajan galeriyi tarayıp "en iyisini" seçmez.

## 2. Referansı yakala

- Ekran görüntüsü verildiyse onu oku.
- Site adresi verildiyse (galerideki örnek çoğu zaman yalnız masaüstü
  görüntüsüdür; telefondaki davranışı ancak asıl site gösterir) 1280 ve 390
  genişlikte yakala: Playwright MCP varsa onunla, yoksa sistemdeki Chrome ile
  `puppeteer-core` betiği (`.tmp-reference.mjs`). Yerleşim görüntüsü
  `prefers-reduced-motion: reduce` taklidiyle alınır: başsız Chrome çalışan
  animasyonu ilk karesinde çeker. Hareketi görüntüyle değil sayıyla oku
  (`document.getAnimations()`, kaydırmada iki konumda ölçüm).
- Görüntüler `.tmp-references/` altına (şablonlarda `.tmp-*` gitignore'da).
  **Üçüncü tarafın ekran görüntüsü depoya girmez**; depolar herkese açık.

## 3. Yapıyı çıkar → `docs/references/<bölüm>.md`

`uiux` rolünün Design DNA sürecinden yalnızca yapı boyutları referanstan
alınır: görsel hiyerarşi, yerleşim dili, etkileşim dili, bileşen kişiliğinin
iskeleti. Tipografi, kart sistemi, renk ve duygu tonu projeden gelir.

```markdown
# Referans — <bölüm>

Kaynak: <örneğin geldiği site> · Galeri: <galeri adresi> · Yakalandı: <tarih>

## Alınan (yapı)
- Yerleşim: <ızgara, hizalama, öğelerin sırası>
- Öğe envanteri: <hangi öğeler var, hangisi birincil>
- Hiyerarşi: <göz önce nereye gidiyor, neden>
- Kırılım: <1280 → 390 arasında ne değişiyor>
- Durumlar: <üzerine gelme, odak, açık menü, kaydırınca yapışma/küçülme>
- Hareket fikri: <ne hareket ediyor> → <CSS ya da motion/react karşılığı>

## Alınmayan (kimlik)
Renk, yazı tipi, metin, logo, ikon seti, görsel, birebir ölçü, kod.

## Eşleme
| Referanstaki rol | Projedeki karşılık |
|---|---|
| <ör. koyu zeminde parlak birincil düğme> | <`Button variant="primary"`, paletin degradesi> |
```

## 4. Kur

- `uiux` rolü kurar ya da işi `frontend` alt ajanına Görev Zarfı ile verir;
  zarfa görüntüyü değil `docs/references/<bölüm>.md` yolunu koy.
- Token dışı renk yok, Title Case, ekranda tek `primary`, şablon bileşenleri
  (`Button`/`ButtonLink`, `Panel`). Telefondaki menü `snippets/ui/sheet.tsx`
  üstüne kurulur: odak içeride döner, Escape kapatır, odak açan düğmeye
  döner (`guides/10 § 5`); açan düğme `aria-expanded` taşır. 390'da dokunma
  hedefi 44 px; hareket yalnız `transform`/`opacity`.
- Referans GSAP, Three.js ya da Lenis ile yapılmışsa önce CSS (kaydırmaya
  bağlı animasyon dahil) ve `motion/react` karşılığı aranır. GSAP yalnız
  `knowledge/tech-radar.md`nin tarif ettiği istisnada, kullanıcı onayıyla.

## 5. Ölç

- `design-reviewer` alt ajanı: 390 ve 1280, iki tema, referansla yan yana.
  Sorular: yapı referans gibi okunuyor mu, kimlik projenin mi, referansın
  rengi ya da metni sızmış mı?
- `docs/SCREENS.md`te ilgili ekrana `**Referans**:` satırını yaz (kaynak
  adresi + `docs/references/<bölüm>.md`).

## Kurallar

- Marka öğesi (logo, slogan, illüstrasyon, fotoğraf, ikon) ve metin
  kopyalanmaz.
- Ücretli ya da lisansı yazılı olmayan kod ve prompt depoya girmez; lisans
  kaynakta açıkça yazmıyorsa "kopyalanmaz" say.
- Bir bölüm için birden çok referans birleştirilebilir ama biri omurgadır;
  omurgasız karışım yine şablona döner.
- `/clone-website`ın tersidir: o birebir kopyalar (yalnız dev-starter'da),
  bu yapıyı alıp kimliği değiştirir.
