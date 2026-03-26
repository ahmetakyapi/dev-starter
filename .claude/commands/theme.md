---
description: Proje temasini uygula veya guncelle
---

`$ARGUMENTS` projesinin gorsel temasini uygula.

1. `knowledge/themes/$ARGUMENTS.md` dosyasini oku
2. Tema dosyasindaki renk paleti, tipografi, bileşen stilleri ve ozel kuralları cikart
3. Projenin `globals.css` dosyasini tema ile eslesecek sekilde guncelle
4. Tailwind config/preset'i guncelle (v3: tailwind.config.ts, v4: @theme blogu)
5. Mevcut bileşenleri tema tokenlarina uyumlu hale getir

Mevcut temalar:
- `ahmetakyapi` — Ana gorsel dil (indigo/cyan/emerald, glassmorphism)
- `digynotes` — Emerald accent, html.light varsayilan
- `mimio` — Custom data-theme, next-themes olmadan
- `keskealsaydim` — shadcn/ui, HSL variables
- `ramazan-vakitleri` — Dark only, mor+pembe+mavi

Kurallar:
- Hardcoded renk YASAK — CSS variable veya Tailwind token kullan
- Dark/light mode parity sagla
- `knowledge/mistakes.md` #26, #30 kurallarini uygula
