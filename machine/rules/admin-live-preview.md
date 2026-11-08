---
paths:
  - "**/admin/**"
  - "**/panel/**"
  - "**/yonetim/**"
  - "**/(admin)/**"
  - "**/(panel)/**"
---

# Yönetim Paneli — Canlı Önizleme Zorunlu (global, yol kapsamlı)

> Kaynak: `~/dev-starter/machine/rules/admin-live-preview.md` → `~/.claude/rules/dev-starter/`
> (bootstrap). 8 Kasım 2026'ya dek global `CLAUDE.md`nin "Kod Standartları →
> Yönetim Paneli" bölümüydü; kuralın tek satırlık özeti orada kaldı
> (`knowledge/decisions.md` → "Bağlam Dosyaları").

- Sitede görünen bir şeyi (metin, görsel, sıra, yazı tipi, punto, renk) düzenleyen her ekranın yanında
  sitenin **kendisi** durur: masaüstü 1440 × 900 + telefon 390 × 844, açık/koyu, yazdıkça güncellenir
- İçerik ~320 ms sonra taslağa yazılır ve `router.refresh()` ile yeniden çizilir (kaydırma yerinde);
  yazı tipi/punto CSS değişkeniyle anında. Taslak ayrı tabloda, oturuma özel; canlı siteye sızmaz
- Ayrı "önizleme bileşeni" yazılmaz, sitenin görünüm bileşeni iframe'de çizilir
- Kural: `~/dev-starter/rules/live-preview.md` · kit: `~/dev-starter/snippets/live-preview/` (`/snippet live-preview`)
