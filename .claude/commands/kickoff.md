---
description: Yeni bir fikri pazar araştırması, yön seçenekleri, teknoloji kararları ve MVP planına çevirir (strategist agent'ı). Argüman: fikrin kısa tarifi.
argument-hint: "[fikir — ör. 'ergoterapistler için seans takip uygulaması']"
---

# /kickoff — Fikirden Plana

Fikir: **$ARGUMENTS**

Bu komut kod yazmaz. Sonunda `docs/KICKOFF.md` ve taslak `docs/PRODUCT.md`
oluşur, kullanıcı onaylarsa `/new-project`'e geçilir. Fikir boşsa önce tek
cümlelik tarifini iste.

1. **Hedef dizini belirle.** Bulunulan dizin bir proje değilse (ör.
   `~/dev-starter` ya da ev dizini) proje adını sor; hedef
   `${PROJECTS_DIR:-~/Desktop/Projects}/<ad>/` (yoksa `mkdir -p <hedef>/docs`;
   üst dizin de yoksa yeri kullanıcıya sor). Belgeler oraya yazılır.
2. **`strategist` subagent'ını Kickoff modunda çalıştır** (Görev Tanımı:
   `to: ST`, fikir, hedef dizin, `cikti: <hedef>/docs/KICKOFF.md + taslak
   <hedef>/docs/PRODUCT.md`). Rol tanımı:
   `~/dev-starter/agents/strategist-agent.md`. Belgeleri **agent yazar**
   (şablon: `~/dev-starter/templates/docs/KICKOFF.template.md`); ana oturum
   yeniden yazmaz.
3. **Agent `SORULAR` bloğu döndürürse** (dosya yazmadan durur): soruları
   kullanıcıya **tek seferde** sor (AskUserQuestion; cevabı fikirden çıkan
   soruyu atla), sonra agent'ı yanıtlar Görev Tanımı'na eklenmiş olarak
   **yeniden çağır**. Subagent tek turluktur; "cevabı ilet" yeni çağrıdır.
4. Dönen dosyaları oku ve kullanıcıya özetle: önerilen yön ve nedeni,
   teknoloji kararlarından sapmalar, MVP'nin Must listesi, en büyük risk.
   Ardından sor: **"Bu planla `/new-project`'e geçelim mi?"**
5. Onay gelirse `/new-project <ad>` akışına geç; şablon, palet ve varsayılan
   tema KICKOFF.md'den gelir, ayrıca sorma. Onay gelmezse belgeler yerinde
   kalır; düzeltme istenirse agent'ı o notla yeniden çağır.

Çıktı: iki dosya yolu, önerilen yön (tek cümle), Must listesi, en büyük risk,
sıradaki adım.

Kural: Pazar iddiası kaynaksız yazılmaz. Teknoloji önerisi
`~/dev-starter/knowledge/tech-radar.md` dışına çıkıyorsa gerekçesi yazılır.
