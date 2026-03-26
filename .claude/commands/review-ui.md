---
description: UI/UX kod incelemesi — design token, responsive, a11y, dark mode
---

$ARGUMENTS dosyasini veya dizinini UI/UX perspektifinden incele.

Kontrol listesi:

1. **Design Token Compliance** (`rules/design-tokens.md`)
   - Hardcoded hex renk var mi?
   - `bg-white`, `text-gray-*` gibi Tailwind varsayilan renkleri kullanilmis mi?
   - Semantic token veya CSS variable kullanilmali

2. **Responsive Design**
   - Mobile-first yaklasim uygulanmis mi?
   - Breakpoint'ler: 375px, 768px, 1024px, 1440px+
   - Overflow/scroll sorunlari olabilir mi?

3. **Dark/Light Mode Parity**
   - Her metin rengi icin `dark:` varyanti var mi?
   - Glass/surface bilesenler her iki modda calisiyor mu?
   - Gorsel kontrast yeterli mi?

4. **Erisilebilirlik (a11y)**
   - Interaktif elemanlarda `aria-label` var mi?
   - Gorsellerde `alt` text var mi?
   - Keyboard navigation destekleniyor mu?
   - Renk kontrast orani yeterli mi?

5. **Animasyon Performance**
   - GPU-accelerated transform'lar kullanilmis mi?
   - `will-change` gereksiz kullanilmamis mi?
   - `AnimatePresence` dogru uygulanmis mi?

6. **Bileşen Mimarisi**
   - Server vs Client Component dogru secilmis mi?
   - `'use client'` en alt seviyede mi?
   - Gereksiz re-render riski var mi?

Sonucu Gate raporu formatinda sun.
