---
description: Bugfix protokolünü (TDD) yürütür: triage → failing test → düzeltme → yeşil → regression → mistakes.md taslağı. Hook'lar fix commit'inde test arar; bu komut o testi üretir.
argument-hint: "[bug tarifi ya da hata mesajı]"
---

# /fix — Bug'ı Protokolle Düzelt

Bug: **$ARGUMENTS**

Akışın kaynağı: `~/dev-starter/rules/bugfix-protocol.md`. Sıra değişmez:

1. **Triage** (BA rolü): HOTFIX (production yanıyor) | BUGFIX (normal) |
   REGRESSION (eski bug geri geldi). Kök neden mi, semptom mu — iki cümleyle
   yaz. `~/dev-starter/knowledge/mistakes.md` indeksine bak: bilinen hata mı?
2. **Reproduce**: Hatayı yerelde üret; üretemiyorsan varsayımla düzeltme —
   kullanıcıdan adım iste.
3. **Failing test**: `qa` subagent'ıyla (ya da KÜÇÜK işte kendin) hatayı
   yakalayan testi yaz ve **kırmızı çıktıyı göster**. Test altyapısı yoksa
   qa agent'ı kurar.
4. **Fix**: En dar düzeltmeyi yap (ilgili alanda `frontend`/`backend` alt
   agent'ı ya da kendin). Kapsam bug kadardır; fırsatçı refactor ayrı iş.
5. **Green + regression**: `npm test` tamamı yeşil; ilgili alandaki mevcut
   testler de geçiyor. Çıktı + exit kodu rapora.
6. **Document**: Hata sınıfı yeniyse `mistakes.md` için taslak kayıt öner
   (onaysız yazma — `rules/self-improvement.md`); kalıcı kural gerekiyorsa
   ilgili `guides/` dosyasına adım öner.
7. **Commit**: `fix(scope): açıklama` + test dosyası aynı commit'te
   (`hooks/quality-scan.sh` testsiz fix'te uyarır). HOTFIX ise kullanıcıya
   deploy adımını sor (`/deploy`).

Çıktı: kök neden (bir cümle), test dosyası, düzeltilen dosyalar, yeşil kanıt,
mistakes taslağı (varsa).
