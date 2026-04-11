---
description: Yeni proje sihirbazi — template + tema + yapilandirma
---

`$ARGUMENTS` adinda yeni bir proje olustur.

Adimlar:

1. **Template sec**: Kullaniciya sor:
   - `nextjs-fullstack` — Next.js + Drizzle + auth tam uygulama
   - `landing` — Three.js + glassmorphism tanitim sayfasi

2. **Template kopyala**: `templates/[secilen]/` icerigini hedef dizine kopyala

3. **Proje adini yerlestir**: package.json, CLAUDE.md, metadata icindeki placeholder'lari degistir

4. **Tema sec** (opsiyonel): `/theme` skill'i ile gorsel tema uygula

5. **ROUTEMAP olustur**: `templates/docs/ROUTEMAP.template.md` sablonunu `docs/ROUTEMAP.md` olarak kopyala ve proje adiyla doldur

6. **Referans DESIGN.md sec** (opsiyonel): Kullaniciya sor hangi projenin gorsel dilini referans almak istedigini. Secenekler:
   - `ahmetakyapi` — Glassmorphism, indigo/cyan/emerald
   - `digynotes` — Emerald vurgu, aurora animasyonlari
   - `mimio` — Indigo vurgu, custom data-theme
   - `keskealsaydim` — Finance dashboard, HSL tokens
   - `ramazan-vakitleri` — Mor/pembe/mavi, mobil-oncelikli
   - `bos` — Sifirdan tasarla
   Secilen temanin `knowledge/themes/[tema].md` dosyasini oku (DESIGN.md 9-section formati) ve renk paleti, tipografi, bileşen stillerini projeye uygula. Yeni proje icin sifirdan tema olusturulacaksa `templates/docs/DESIGN.template.md` sablonunu `docs/DESIGN.md` olarak kopyala ve doldur.

7. **Dokumanlar olustur**:
   - `docs/PRODUCT.md` — `templates/docs/PRODUCT.template.md`'den
   - `docs/ARCHITECTURE.md` — `templates/docs/ARCHITECTURE.template.md`'den
   - `docs/SCREENS.md` — `templates/docs/SCREENS.template.md`'den

8. **Bagimliliklari kur**: `npm install`

9. **Git init**: `git init && git add -A && git commit -m "feat: initialize $ARGUMENTS"`

10. **Ozet**: Olusturulan dosyalari ve sonraki adimlari listele
