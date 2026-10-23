---
description: Yeni bir fikri pazar araştırması, yön seçenekleri, teknoloji kararları ve MVP planına çevirir (strategist agent'ı). Argüman: fikrin kısa tarifi.
argument-hint: "[fikir — ör. 'ergoterapistler için seans takip uygulaması']"
---

# /kickoff — Fikirden Plana

Fikir: **$ARGUMENTS**

Bu komut kod yazmaz. Sonunda `docs/KICKOFF.md` ve taslak `docs/PRODUCT.md`
oluşur, kullanıcı onaylarsa `/new-project`'e geçilir.

1. `strategist` subagent'ını **Kickoff** modunda çalıştır. Agent'a fikri ve
   bulunduğumuz dizini ver. Rol tanımı: `~/dev-starter/agents/strategist-agent.md`.
2. Agent en fazla 5 soru döndürürse soruları kullanıcıya **tek seferde**
   AskUserQuestion ile sor (cevabı fikirden çıkan soruyu atla), cevapları agent'a
   geri ilet.
3. Agent'ın çıktısını şablona göre yaz:
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
