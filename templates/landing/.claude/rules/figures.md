---
paths:
  - "components/iso/**"
  - "components/figures/**"
---

# Açıklayıcı Figür (anatomy, isteğe bağlı)

> Şablon CLAUDE.md'sinden taşındı (dev-starter, 8 Kasım 2026): figür
> dosyasına dokunulunca yüklenir; kitin varlığı ve kurulum komutu
> CLAUDE.md'de tek satır olarak kaldı. İki Next şablonunda bu dosya bayt bayt
> aynıdır (dev-starter `health-check.sh` → `SHARED_TEMPLATE_FILES`).

Ürünün nasıl çalıştığını kutu ve okla değil, çalışan bir makineyle anlatan
izometrik SVG figür. Kit şablonda YOK, tek komutla gelir:

```
node ~/dev-starter/scripts/add-figure-kit.mjs .            # components/iso + CSS importları
node ~/dev-starter/scripts/add-figure-kit.mjs . --example  # + çalışan örnek (test-rig)
node ~/dev-starter/scripts/add-figure-kit.mjs . --lathe    # + döner parçalar (çan, kubbe, küre)
```

- Şablon hazır: `<html class="iso">` (kit `.iso[data-theme="light"]` ile
  açık temaya geçer, ThemeToggle figürü de çevirir) ve `components/iso/**`,
  `components/figures/**` için ESLint ayarı. Figür kare başına ref'e yazar;
  react-hooks 7 bunu hata sayardı (`~/dev-starter/knowledge/mistakes.md #98`).
- Figürü anatomy skill'i yazar: `components/figures/<ad>/` (geometri saf `.ts`,
  statik çizim sunucu bileşeni, tek `"use client"` canlı bileşen).
- `components/iso/` elle düzenlenmez; projeye özgü stil `bridge.css`e.
- React Compiler açılırsa figürün canlı bileşenine `"use no memo"`.
