---
description: Benzer ürünler/projeler bu sorunu nasıl çözmüş — researcher subagent'ıyla kaynaklı web araştırması. Çıktı docs/research/<konu>.md + ekosisteme uyarlanmış öneri + öne çıkma fırsatı.
argument-hint: "<konu — ör. 'takvim senkronu', 'onboarding akışı', 'fiyatlandırma sayfası'>"
---

# /research — Benzer Çözümleri Araştır

Konu: **$ARGUMENTS**

1. `researcher` subagent'ını çalıştır. Rol tanımı:
   `~/dev-starter/agents/researcher-agent.md`. Görev tanımına koy: konu, projenin tek
   cümlelik tarifi (PRODUCT.md'den), stack kısıtları ve
   `~/dev-starter/knowledge/tech-radar.md`deki mevcut varsayılan (varsa).
2. Agent en az 3 benzer çözümü kaynaklı karşılaştırır, ekosistem stack'ine
   (Next 16, Tailwind v4, `motion/react`, Drizzle/Neon) uyarlanmış öneri ve
   "öne çıkma fırsatı" üretir; raporu `docs/research/<konu>.md`ye yazar.
3. Kullanıcıya üç satır özet + açık öneriyi sun. Karar kullanıcınındır:
   - Onaylanırsa ROUTEMAP Kararlar Logu'na işle; iş doğuyorsa story olarak ekle
   - Öneri tech-radar/decisions'ı değiştiriyorsa güncellemeyi ayrıca onaylat
     (`~/dev-starter/rules/self-improvement.md`)

Kural: kaynaksız bulgu rapora girmez; bulunamayan "doğrulanamadı" diye yazılır.
Bu komut kod değiştirmez.
