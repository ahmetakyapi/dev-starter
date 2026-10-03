---
description: Var olan projeyi kod, canlı durum ve piyasa açısından değerlendirip sıradaki en değerli 5 işi, fırsatları ve dokunulmaması gerekenleri önerir (strategist ajanı).
argument-hint: "[odak — opsiyonel: büyüme | kalite | özellik | teknik-borç]"
---

# /roadmap — Sırada Ne Var?

Odak: **$ARGUMENTS** (boşsa dört eksenin hepsi)

1. `strategist` alt ajanını **Roadmap** modunda bu projenin kökünde çalıştır.
   Rol tanımı: `~/dev-starter/agents/strategist-agent.md` → "Roadmap Akışı".
2. Projenin canlı adresi CLAUDE.md, README ya da `package.json`'da varsa
   ajan siteyi gerçekten açıp gezsin (ekran görüntüsü + konsol).
3. Çıktı: `docs/ROADMAP-ONERI.md`:
   - "Sıradaki 5 İş" tablosu (iş, etki 1-5, çaba S/M/L, neden şimdi)
   - Fırsatlar (keşif isteyen büyük fikirler)
   - Dokunma (iyi çalışan, korunacaklar)
   - Rakiplerin son 6 ayda yaptıkları (kaynaklı)
4. Kullanıcıya ilk 5 işi kısa bir tablo olarak göster ve hangisiyle
   başlamak istediğini sor. Seçilen iş `docs/ROUTEMAP.md`'ye eklenir.

Bu komut kod değiştirmez.
