---
description: Tek story'yi uçtan uca işler: görev tanımı hazırla → subagent'lara dağıt (FE/BE/QA paralel) → Gate → commit → ROUTEMAP. Development fazının ana iş komutu.
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
2. **Boyu beyan et** (KÜÇÜK/ORTA/BÜYÜK). KÜÇÜK ise subagent açmadan
   `~/dev-starter/rules/dev-cycle.md` kısayoluyla ilerle.
3. **Dalga planı** (BÜYÜK; ORTA'da ana oturum ya da tek subagent — tanımın
   tek kaynağı `~/dev-starter/phases/development.md` → İş Boyu): işi alanlara böl ve kayıtlı subagent'lara
   **Görev Tanımı** ile dağıt (`AGENT_PROTOCOL.md → Orkestrasyon`):
   - Wave 1 paralel: `backend` (schema/API + testleri), `qa` (test planı +
     failing testler), UI kararları ana oturumda
   - Wave 2: `frontend` (UI + entegrasyon)
   - Aynı dalgadaki iki subagent aynı dosyalara dokunacaksa önce `sinir:` ile
     dosya sahipliğini ayır; ayrılamıyorsa `isolation: worktree` (sıra ve
     birleştirme: `~/dev-starter/phases/development.md → Worktree ile Paralel
     Çalışma`). Subagent commit ATMAZ.
   - Dalga arası: build + typecheck
4. **Kabul ön-doğrulaması**: her teslimi story kabul kriterleriyle madde madde
   karşılaştır; eksikse agent'a iade et, Gate'e gönderme.
5. **Gate**: ROUTEMAP: durum → IN_REVIEW, sonra `/gate <story-id>` akışını çalıştır. FAILED döngüsü
   FIX_1 → FIX_2 → ESCALATED.
6. **Commit**: Gate PASSED sonrası `git status`la yalnız amaçlanan dosyaları
   stage'le; ROUTEMAP'te durum → DONE (aynı commit'e girer); conventional
   commit (`~/dev-starter/rules/commit-conventions.md`), sonra düz `git push`
   ("commitle = push": `~/.claude/CLAUDE.md` → Commit ve Push; `main`e push
   üretim deploy'u tetikliyorsa bu, kullanıcının bilerek verdiği onaydır).
   Gate'ten sonra koda dokunduysan hook commit'i bloklar: `/gate`i yeniden çalıştır.
7. **Compound** (`rules/dev-cycle.md → 8`): mistakes/patterns/decisions'lık
   çıktı var mı? Varsa taslağı kullanıcı onayına sun
   (`rules/self-improvement.md`).

Çıktı: kullanıcıya kısa rapor:

```text
STORY — <id> <başlık>: DONE | BLOCKED (<neden>) | ESCALATED
Değişen: <dosya listesi ya da sayı + ana dosyalar>
Kabul:   <n/n kriter> · Gate: <sonuç> (docs/gate/<id>.md)
Commit:  <hash> <konu> · push: <yapıldı | yapılmadı (neden)>
Sıradaki: <önerilen story>
```
