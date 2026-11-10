---
description: Arayüz kod incelemesi: token, kimlik ve palet, iki tema, ekran düzeni, erişilebilirlik, hareket
argument-hint: "[dosya veya dizin]"
---

`$ARGUMENTS` dosyasını veya dizinini UI/UX perspektifinden incele. Bu komut
her projeden çağrılabilir; kurallar `~/dev-starter/guides/` altında. Projenin
kendi `THEME.md` / `knowledge/themes/<proje>.md` dosyası varsa o ÖNCE gelir.

Kodun yanında ekranı da görmek gerekiyorsa `design-reviewer` subagent'ini öner.

## Kontrol listesi

0. **Kod taraması** — önce çalıştır, bulguları aşağıdaki maddelere dağıt:
   `bash ~/dev-starter/scripts/slop-scan.sh $ARGUMENTS`
   (tek taraflı şerit, ölü bağlantı, transition-all, font-black, dolgu
   sözcüğü, yer tutucu, gökkuşağı degrade, emoji, scale(0), yuvarlak sayı).
   `slop-ok` ile susturulan satırın gerekçesi var mı?

1. **Token** (`~/dev-starter/guides/02-design-tokens.md`, `rules/design-tokens.md`)
   - Hardcoded hex, hazır palet sınıfı (`bg-white`, `text-gray-*`) var mı?
   - `dark:` varyantı var mı? (yeni tech stack'te olmamalı; tema token'la döner)
   - Özel punto sınıfı `cn()` içinde birleşiyorsa `extendTailwindMerge` kaydı var mı?
   - Element varsayılanları `@layer base` içinde mi (katmansız kural utility'yi ezer)?
   - İç içe radius formülle mi: iç = dış − boşluk, boşluk < 32 px (`guides/02` § 4)?

2. **Kimlik ve palet** (`~/dev-starter/guides/00-brand-identity.md`)
   - Derinlik ton farkıyla mı; glass yalnızca altından içerik geçen öğede mi?
   - Degrade yalnızca üç yerde (display başlık, birincil eylem, marka karosu) ve tek aile mi?
   - Degrade metinde `@supports` + solid fallback + descender payı var mı?
   - Palet dışında kalan renk (sızıntı) var mı?

3. **İki tema**
   - Her iki temada okunuyor mu? Açık tema ters çevrilmiş değil, tasarlanmış mı?
   - `--text-muted`, `-ink`/`-wash` çiftleri ≥ 4,5:1 (ölç, tahmin etme)

4. **Ekran düzeni** (`~/dev-starter/guides/05-components.md` § 3)
   - Sıra: başlık → künye → ana görsel → ölçü ızgarası → metin → uyarılar → damga
   - Her panelin `h2`si var mı? Ekranda tek `primary` düğme mi?
   - Boş / yükleniyor / hata durumları çizilmiş mi; iskelet yapıyla eşleşiyor mu?
   - Örnek içerik gerçekçi mi (ad, marka, sayı, tarih); sistem mesajı sakin ve
     somut mu; `href="#"` yok, etkin sayfa `aria-current` (`guides/05` § 7)
   - Izgara hücreleri `minmax(0,1fr)`; sığmayan tablo kaydırılıyor, ezilmiyor

5. **Duyarlı tasarım**
   - 390 ve 1280'de yatay taşma yok; dokunmatikte input ≥ 16 px
   - Yapışkan başlık odağı örtmüyor (`scroll-padding-block`)

6. **Erişilebilirlik**
   - Dokunma hedefi ≥ 44 px, görünür `focus-visible` halkası (kırpan kapta `-2px` offset)
   - İkon düğmelerde `aria-label`, görsellerde `alt`, klavye ile tam akış
   - Title Case başlık/düğme; `capitalize` / `toUpperCase` yok

7. **Hareket** (`~/dev-starter/guides/04-motion.md`)
   - `motion/react` + `m.*`; `framer-motion` yeni projede yok
   - Yalnızca `transform`/`opacity`; `width`/`height` animasyonu yok
   - Kahraman/LCP Reveal'e sarılı değil; reduced-motion'da `initial={false}` yok
   - Sayfa giriş animasyonunda fill-mode yok (fixed modalları kaydırır)
   - Magnetic/imleç efektleri yalnızca `pointer: fine`
   - Bento görsel hikâyesi: tasarımda başlıyor/bitiyor, ekran dışında duruyor,
     kartlar aynı anda oynamıyor, nesne `scale(0)`dan gelmiyor (`guides/04` § 14)

8. **Bileşen mimarisi**
   - `'use client'` en alt seviyede mi; `"use client"` modülden sabit export ediliyor mu?
   - Sayfa içi filtre bağlantıları `scroll={false}`

9. **Tanıtım sayfası** (yalnızca pazarlama yüzeyi; `guides/10` → Ribbon Turu)
   - Birincil eylemin hemen altında doğrulanabilir güvence var mı (`trust-line`);
     sıfat değil olgu, en çok üç; sahte kıtlık sayacı yok
   - Kahraman başlığı JS'i beklemeden görünüyor mu (`blur-in` CSS, ya da hiç giriş yok)
   - Cam (`liquid-glass`) yalnızca görsel zemin üstünde; düz zeminde `bg-cta`
   - Ürün anlatımı bayatlayan ekran görüntüsü yerine canlı/token'li maket mi
     (`app-window`, `dock`); maket `role="img"` + tek cümle ya da `aria-hidden`
   - Sabit konumlu öğeler (menü, maskot, sohbet balonu, çerez bandı) 390'da
     metni ya da birincil eylemi örtmüyor mu; sayfada en çok bir oyunbaz öğe
   - Hikâye: ürün denenebiliyorsa deneme yerine sayfada canlı demo var mı

Sonucu Gate raporu formatında sun: her madde ✅ / ⚠️ / ❌, bulgu başına dosya:satır ve önerilen düzeltme.
