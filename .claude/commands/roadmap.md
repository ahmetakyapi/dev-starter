---
description: Var olan projeyi kod, canlı durum ve piyasa açısından değerlendirip sıradaki en değerli 5 işi, fırsatları ve dokunulmaması gerekenleri önerir (strategist agent'ı).
argument-hint: "[odak — opsiyonel: büyüme | kalite | özellik | teknik-borç]"
---

# /roadmap — Sırada Ne Var?

Odak: **$ARGUMENTS** (boşsa dört eksenin hepsi)

1. `strategist` subagent'ını **Roadmap** modunda bu projenin kökünde çalıştır
   (Görev Tanımı: `to: ST`, odak, canlı adres, `cikti: docs/ROADMAP-ONERI.md`).
   Rol tanımı: `~/dev-starter/agents/strategist-agent.md` → "Roadmap Akışı".
2. Projenin canlı adresi CLAUDE.md, README ya da `package.json`'da varsa
   Görev Tanımı'na koy: agent siteyi gerçekten açar (WebFetch; ekran
   görüntüsü ve konsol için Playwright betiği). Açamazsa raporda söyler.
3. Çıktı (agent yazar): `docs/ROADMAP-ONERI.md`:
   - "Sıradaki 5 İş" tablosu (iş, etki 1-5, çaba S/M/L, neden şimdi)
   - Fırsatlar (keşif isteyen büyük fikirler)
   - Dokunma (iyi çalışan, korunacaklar)
   - Rakiplerin son 6 ayda yaptıkları (kaynaklı)
4. Kullanıcıya ilk 5 işi kısa bir tablo olarak göster ve hangisiyle
   başlamak istediğini sor. Seçilen işi `docs/ROUTEMAP.md`ye **ana oturum**
   ekler (Story Takibi tablosuna NOT_STARTED satırı; story dosyası `/story`
   ile açılır).

Bu komut kod değiştirmez.
