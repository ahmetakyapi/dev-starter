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

6. **Dokumanlar olustur**:
   - `docs/PRODUCT.md` — `templates/docs/PRODUCT.template.md`'den
   - `docs/ARCHITECTURE.md` — `templates/docs/ARCHITECTURE.template.md`'den
   - `docs/SCREENS.md` — `templates/docs/SCREENS.template.md`'den

7. **Bagimliliklari kur**: `npm install`

8. **Git init**: `git init && git add -A && git commit -m "feat: initialize $ARGUMENTS"`

9. **Ozet**: Olusturulan dosyalari ve sonraki adimlari listele
