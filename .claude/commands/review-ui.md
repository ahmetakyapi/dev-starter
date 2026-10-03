---
description: Arayüz kod incelemesi: token, kimlik ve palet, iki tema, ekran düzeni, erişilebilirlik, hareket
argument-hint: "[dosya veya dizin]"
---

`$ARGUMENTS` dosyasini veya dizinini UI/UX perspektifinden incele. Bu komut
her projeden cagrilabilir; kurallar `~/dev-starter/guides/` altinda. Projenin
kendi `THEME.md` / `knowledge/themes/<proje>.md` dosyasi varsa o ONCE gelir.

Kodun yaninda ekrani da gormek gerekiyorsa `design-reviewer` alt ajanini oner.

## Kontrol listesi

1. **Token** (`~/dev-starter/guides/02-design-tokens.md`, `rules/design-tokens.md`)
   - Hardcoded hex, hazir palet sinifi (`bg-white`, `text-gray-*`) var mi?
   - `dark:` varyanti var mi? (yeni tech stack'te olmamali; tema token'la doner)
   - Ozel punto sinifi `cn()` icinde birlesiyorsa `extendTailwindMerge` kaydi var mi?
   - Element varsayilanlari `@layer base` icinde mi (katmansiz kural utility'yi ezer)?

2. **Kimlik ve palet** (`~/dev-starter/guides/00-brand-identity.md`)
   - Derinlik ton farkiyla mi; glass yalnizca altindan icerik gecen ogede mi?
   - Degrade yalnizca uc yerde (display baslik, birincil eylem, marka karosu) ve tek aile mi?
   - Degrade metinde `@supports` + solid fallback + descender payi var mi?
   - Palet disinda kalan renk (sizinti) var mi?

3. **Iki tema**
   - Her iki temada okunuyor mu? Acik tema ters cevrilmis degil, tasarlanmis mi?
   - `--text-muted`, `-ink`/`-wash` ciftleri ≥ 4,5:1 (olc, tahmin etme)

4. **Ekran duzeni** (`~/dev-starter/guides/05-components.md` § 3)
   - Sira: baslik → kunye → ana gorsel → olcu izgarasi → metin → uyarilar → damga
   - Her panelin `h2`si var mi? Ekranda tek `primary` dugme mi?
   - Bos / yukleniyor / hata durumlari cizilmis mi; iskelet yapiyla eslesiyor mu?
   - Izgara hucreleri `minmax(0,1fr)`; sigmayan tablo kaydiriliyor, ezilmiyor

5. **Duyarli tasarim**
   - 390 ve 1280'de yatay tasma yok; dokunmatikte input ≥ 16 px
   - Yapiskan baslik odagi ortmuyor (`scroll-padding-block`)

6. **Erisilebilirlik**
   - Dokunma hedefi ≥ 44 px, gorunur `focus-visible` halkasi (kirpan kapta `-2px` offset)
   - Ikon dugmelerde `aria-label`, gorsellerde `alt`, klavye ile tam akis
   - Title Case baslik/dugme; `capitalize` / `toUpperCase` yok

7. **Hareket** (`~/dev-starter/guides/04-motion.md`)
   - `motion/react` + `m.*`; `framer-motion` yeni projede yok
   - Yalnizca `transform`/`opacity`; `width`/`height` animasyonu yok
   - Kahraman/LCP Reveal'e sarili degil; reduced-motion'da `initial={false}` yok
   - Sayfa giris animasyonunda fill-mode yok (fixed modallari kaydirir)
   - Magnetic/imlec efektleri yalnizca `pointer: fine`

8. **Bilesen mimarisi**
   - `'use client'` en alt seviyede mi; `"use client"` modulden sabit export ediliyor mu?
   - Sayfa ici filtre baglantilari `scroll={false}`

Sonucu Gate raporu formatinda sun: her madde ✅ / ⚠️ / ❌, bulgu basina dosya:satir ve onerilen duzeltme.
