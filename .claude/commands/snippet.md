---
description: Hazır bileşeni projeye uyarlayarak kopyala: snippets/ui kütüphanesi, reveal, theme-toggle, rolling-number, modal, form, toast ve diğerleri
argument-hint: "ui/<ad> (data-table, tree-view, dialog, combobox …) | reveal | theme-toggle | rolling-number | modal | toast | form | og-image | agent-tool"
---

`$ARGUMENTS` tipinde bir bilesen snippet'ini mevcut projeye uyarla. Bu komut
her projeden cagrilabilir; kaynak `~/dev-starter/snippets/`.

**Once oku:** `~/dev-starter/guides/05-components.md` § 2 ve bilesen
kutuphanesi icin `~/dev-starter/guides/10-component-library.md` (`snippets/ui/`:
dialog, dropdown, data-table, tree-view, pagination, stat, sparkline...). Hareket iceriyorsa `~/dev-starter/guides/04-motion.md`.

## Adimlar

1. `ls ~/dev-starter/snippets/ ~/dev-starter/snippets/ui/` ile dosyayi bul ve tamamini oku (`.tsx`, `.ts`;
   `rolling-number` yaninda `.module.css` de var).
2. Projenin yiginini kontrol et:
   ```bash
   grep -E '"(next|react|tailwindcss|motion|framer-motion)"' package.json
   grep -rn "LazyMotion" app components 2>/dev/null | head -3
   ```
3. Uyarla ve projeye yaz (genellikle `components/ui/` ya da `components/motion/`).
4. `npm run typecheck && npm run lint` temiz olmadan bitti deme.

## Kurallar

- **Hareket `motion/react`tan.** Kokte `LazyMotion features={domAnimation} strict`
  varsa bilesende `m.*` (`import * as m from "motion/react-m"`); `motion.*`
  strict altinda hata verir. `framer-motion` kullanan eski projede import yolunu
  projeye uydur, yeni paket kurma.
- `tab-underline` `layout` animasyonu icin kendi `LazyMotion features={domMax}`
  sarmalayicisini getirir; kokteki `domAnimation`i degistirme.
- **Token siniflari:** `bg-surface`, `text-strong`, `text-body`, `border-line`,
  `bg-primary text-on-primary`, `bg-primary-wash text-primary-ink`, `bg-scrim`.
  Hardcoded renk, hazir palet sinifi (`bg-white`, `text-gray-*`) ve `dark:` yok.
  Proje farkli rol adlari kullaniyorsa (shadcn `bg-background` gibi) onlara cevir.
- Sabitler `lib/motion.ts`ten (`EASE`, `DUR`, `SPRING`); yoksa snippet'in
  icindekini kullan, yeni sihirli sayi ekleme.
- `'use client'` yalnizca etkilesimli bilesende.
- Reveal: kahraman/LCP ogesini sarma; reduced-motion'da `initial={false}` yok.
- Erisilebilirlik: diyaloglarda odak tuzagi + `Esc` + sayacli kaydirma kilidi
  (`use-scroll-lock`), dokunma hedefi ≥ 44 px, `aria-label` cumle duzeninde.
- Arayuz metni Turkce Title Case (baslik, dugme), em dash yok.

> `agent-*` ve `action-card` snippet'leri `@copilotkit/react-core@1.69.2` tip
> tanimlariyla `tsc --noEmit` uzerinden dogrulandi. Uyarlarken surum pin'ine
> dikkat — `~/dev-starter/knowledge/mistakes.md` #70, #71. Karar icin: `/agentic`
