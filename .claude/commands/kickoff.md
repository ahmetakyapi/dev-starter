---
description: Yeni bir fikri pazar taraması, yön seçenekleri, teknoloji kararları ve MVP planına çevirir (strategist ajanı). Argüman: fikrin kısa tarifi.
argument-hint: "[fikir — ör. 'ergoterapistler için seans takip uygulaması']"
---

# /kickoff — Fikirden Plana

Fikir: **$ARGUMENTS**

Bu komut kod yazmaz. Sonunda `docs/KICKOFF.md` ve taslak `docs/PRODUCT.md`
oluşur, kullanıcı onaylarsa `/new-project`'e geçilir.

1. `strategist` alt ajanını **Kickoff** modunda çalıştır. Ajana fikri ve
   bulunduğumuz dizini ver. Rol tanımı: `~/dev-starter/agents/strategist-agent.md`.
2. Ajan en fazla 5 soru döndürürse soruları kullanıcıya **tek seferde**
   AskUserQuestion ile sor (cevabı fikirden çıkan soruyu atla), cevapları ajana
   geri ilet.
3. Ajanın çıktısını şablona göre yaz:
   `~/dev-starter/templates/docs/KICKOFF.template.md` → `docs/KICKOFF.md`.
   Dizin bir proje değilse önce proje adını sor ve
   `~/Desktop/Projects/<ad>/docs/` altına yaz.
4. Kullanıcıya şunları özetle: önerilen yön ve nedeni, teknoloji kararlarından
   sapmalar, MVP'nin Must listesi, en büyük risk. Ardından sor:
   **"Bu planla `/new-project`'e geçelim mi?"**
5. Onay gelirse `/new-project <ad>` akışına geç; şablon ve tema seçimini
   KICKOFF.md'den al, ayrıca sorma.

Kural: Pazar iddiası kaynaksız yazılmaz. Teknoloji önerisi
`~/dev-starter/knowledge/tech-radar.md` dışına çıkıyorsa gerekçesi yazılır.
