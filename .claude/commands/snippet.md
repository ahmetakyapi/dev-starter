---
description: Hizli bilesen snippet uret — modal, form, drawer, skeleton, toast, confirm, vb.
---

`$ARGUMENTS` tipinde bir bilesen snippet'i uret.

Mevcut snippet'ler `snippets/` dizininde:
- `animated-number` — Sayi animasyonu
- `infinite-scroll` — Sonsuz kaydirma
- `og-image` — Open Graph gorsel uretici
- `search-bar` — Debounced arama kutusu
- `modal` — Animasyonlu dialog
- `drawer` — Yandan acilan panel
- `form` — Server Action uyumlu form
- `skeleton` — Yukleme placeholder'lari
- `toast` — Bildirim sistemi
- `confirm` — Onay dialog'u

Istenilen snippet `snippets/` dizininde varsa, o dosyayi oku ve projeye uyarla.
Yoksa, mevcut snippet'lerin yapisina uygun yeni bir snippet olustur.

Kurallar:
- `'use client'` sadece interaktif bilesenlerde
- Design token'lar kullan, hardcoded renk YASAK
- TypeScript interface'leri eksiksiz
- Framer Motion varyantlari `variants.ts`'ten import et (mumkunse)
- Dark/light mode parity
- Erisilebilirlik (aria-label, keyboard navigation)
