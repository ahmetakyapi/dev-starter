---
description: Planning fazını yürütür (P1→P6): keşif, ürün tanımı, mimari, ekranlar, story'ler, hazırlık kontrolü. /new-project'ten sonra, development'tan önce çalışır.
argument-hint: "[başlanacak adım — boşsa ROUTEMAP'ten kaldığı yer]"
---

# /plan — Fikirden Story'lere (P1→P6)

Adım: **$ARGUMENTS** (boşsa `docs/ROUTEMAP.md`deki ilk NOT_STARTED P adımı).

Akışın kaynağı: `~/dev-starter/phases/planning.md`. Bu komut onu BA rolüyle
yürütür; her adımın çıktısı bir dosyadır, karar havada kalmaz.

1. **Girişi belirle**: `docs/KICKOFF.md` varsa P1-P2 onun üstünden DOĞRULAMA
   turudur (yeniden üretim değil) — yalnız boşlukları sor. Yoksa P1
   brainstorm'dan başla.
2. **Adımları sırayla yürüt**, her birinde:
   - Çıktı dosyasını şablondan oluştur/güncelle
     (`~/dev-starter/templates/docs/`: PRODUCT, ARCHITECTURE, SCREENS,
     STORY şablonları)
   - Belirsiz alanlara EN ÇOK 5 hedefli soru sor (tek AskUserQuestion turu);
     cevapları belgeye işle, `[NETLEŞTİRME]` işareti bırakma
   - ROUTEMAP'te adımı DONE yap
3. **P5 Story Writing**: her story
   `~/dev-starter/templates/docs/STORY.template.md` ile yazılır
   (öncelik + gerekçe, bağımsız test, Verildiğinde/Olduğunda/O zaman
   senaryoları); ROUTEMAP Story Takibi tablosuna şablondaki kolon düzeniyle
   satır eklenir.
4. **P6 Dev Readiness**: checklist'i KOMUTLARLA doğrula (dosyalar var mı,
   kriterler ölçülebilir mi, şablon kuruldu mu); ayrıca çapraz tutarlılık:
   PRODUCT ↔ ARCHITECTURE ↔ SCREENS ↔ stories birbiriyle çelişiyor mu —
   çelişkileri listele, çözmeden DONE deme.
5. Fazı kapat: ROUTEMAP Planning → DONE, Development → IN_PROGRESS.
   Kullanıcıya ilk story önerisiyle bitir: "`/story STORY-001` ile başlayalım mı?"

Her faz çıktısı kullanıcıya sunulur ve onay ROUTEMAP Kararlar Logu'na işlenir
(`AGENT_PROTOCOL.md → Onay Noktaları`). Bu komut uygulama kodu yazmaz.
