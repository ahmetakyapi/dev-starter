---
description: Proje temasini uygula veya guncelle
---

`$ARGUMENTS` projesinin gorsel temasini uygula.

1. `knowledge/themes/$ARGUMENTS.md` dosyasini oku (DESIGN.md 9-section formati)
2. Tema dosyasindaki 9 section'dan ilgili verileri cikart:
   - **Section 2** (Color Palette): CSS variable tanimlari, gradient kodlari
   - **Section 3** (Typography): Font ailesi, boyut hiyerarsisi, letter-spacing
   - **Section 4** (Component Stylings): Buton, kart, input, navigasyon stilleri
   - **Section 5** (Layout): Spacing sistemi, grid, border radius scale
   - **Section 6** (Depth): Shadow seviyeleri, glassmorphism kodlari
   - **Section 7** (Do/Don't): Projeye ozgu yasaklar ve kurallar
3. Projenin `globals.css` dosyasini tema ile eslesecek sekilde guncelle
4. Tailwind config/preset'i guncelle (v3: tailwind.config.ts, v4: @theme blogu)
5. Mevcut bilesenleri tema tokenlarina uyumlu hale getir

Mevcut temalar (DESIGN.md 9-section formatinda):
- `ahmetakyapi` — Ana gorsel dil (indigo/cyan/emerald, glassmorphism, Manrope)
- `digynotes` — Emerald accent, aurora animasyonlari, Avenir Next
- `mimio` — Indigo vurgu, custom data-theme, Plus Jakarta Sans
- `keskealsaydim` — Finance dashboard, HSL variables (shadcn), Space Grotesk
- `ramazan-vakitleri` — Dark only, mor+pembe+mavi, system font

Yeni tema olusturmak icin: `templates/docs/DESIGN.template.md` sablonunu kullan.

Kurallar:
- Hardcoded renk YASAK — CSS variable veya Tailwind token kullan
- Dark/light mode parity sagla (ramazan-vakitleri haric — dark only)
- Shadow-as-border teknigi: cok ince kenarliklari `box-shadow: 0 0 0 1px` ile yap
- Multi-layer shadow stack: elevation icin birden fazla shadow katmani kullan
- `knowledge/mistakes.md` #26, #30 kurallarini uygula
