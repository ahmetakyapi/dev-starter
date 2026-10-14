---
description: Tek story'yi uçtan uca işler: zarf hazırla → alt ajanlara dağıt (FE/BE/QA paralel) → Gate → commit → ROUTEMAP. Development fazının ana iş komutu.
argument-hint: "[story-id — boşsa ROUTEMAP'ten sıradaki önerilir]"
---

# /story — Story'yi Uçtan Uca İşle

Story: **$ARGUMENTS**

Akışın tamamı `~/dev-starter/phases/development.md`; bu komut onu tek story
için yürütür.

1. **Seç ve aç**: Argüman boşsa ROUTEMAP'ten sıradakini öner (bağımlılığı
   çözülmüş + öncelik), onay al. Story dosyasını oku
   (`docs/stories/STORY-NNN-*.md`); yoksa
   `~/dev-starter/templates/docs/STORY.template.md`den oluştur ve kabul
   kriterlerini kullanıcıyla netleştir. ROUTEMAP: durum → IN_PROGRESS.
2. **Boyu beyan et** (KÜÇÜK/ORTA/BÜYÜK). KÜÇÜK ise alt ajan açmadan
   `~/dev-starter/rules/dev-cycle.md` kısayoluyla ilerle.
3. **Dalga planı** (ORTA/BÜYÜK): işi alanlara böl ve kayıtlı alt ajanlara
   **Görev Zarfı** ile dağıt (`AGENT_PROTOCOL.md → Orkestrasyon`):
   - Wave 1 paralel: `backend` (schema/API + testleri), `qa` (test planı +
     failing testler), UI kararları ana oturumda
   - Wave 2: `frontend` (UI + entegrasyon)
   - Dosya çakışması riski varsa `isolation: worktree`
   - Dalga arası: build + typecheck
4. **Kabul ön-doğrulaması**: her teslimi story kabul kriterleriyle madde madde
   karşılaştır; eksikse ajana iade et, Gate'e gönderme.
5. **Gate**: `/gate <story-id>` akışını çalıştır. FAILED döngüsü
   FIX_1 → FIX_2 → ESCALATED.
6. **Commit**: Gate PASSED sonrası `git status`la yalnız amaçlanan dosyaları
   stage'le, conventional commit, push. ROUTEMAP: durum → DONE.
7. **Compound** (`rules/dev-cycle.md → 8`): mistakes/patterns/decisions'lık
   çıktı var mı? Varsa taslağı kullanıcı onayına sun
   (`rules/self-improvement.md`).

Çıktı: kullanıcıya kısa rapor — ne değişti (dosya listesi), Gate sonucu,
commit hash'i, sıradaki önerilen story.
