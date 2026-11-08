---
paths:
  - "components/scene/**"
  - "components/heroes/**"
---

# Parçacık Sahnesi (R3F)

> Landing şablonunun CLAUDE.md'sinden taşındı (dev-starter, 8 Kasım 2026):
> sahne ya da hero dosyasına dokunulunca yüklenir.

`components/scene/`. `SceneLayer` kapı: sahne yalnızca hassas işaretçi, en az
768 piksel ve hareket serbestken, tarayıcı boşa çıkınca İNDİRİLİR
(`dynamic(..., { ssr: false })`; ilk tıklamanın önüne uzun görev düşmesin).
Telefonda ve hareketi azaltanda yalnızca `.hero-glow` CSS ışıması kalır.
WebGL açılamazsa ya da parça inmezse `SceneBoundary` yalnızca sahneyi
düşürür; sayfa hata ekranına gitmez, ışıma kalır.
Renk `--primary`den okunur, tema değişince yenilenir. Hero ekrandan çıkınca
ya da sekme arka plandayken çizim durur. İstemiyorsan `hero.scene: false`;
tamamen çıkarmak için klasörü, iki paketi ve `HeroShell`deki satırı sil.
