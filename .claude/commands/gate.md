---
description: Gate denetimi — 6+1 adımı gate subagent'ıyla koşturur, raporu docs/gate/'e yazar, sonucu ROUTEMAP'in Gate kolonuna işler. Commit iznini açan komut budur.
argument-hint: "[story-id — boşsa ROUTEMAP'teki aktif story]"
---

# /gate — Kalite Kapısı

Story: **$ARGUMENTS** (boşsa `docs/ROUTEMAP.md`deki IN_PROGRESS/IN_REVIEW story).

`/check` teknik sağlıktır ve Gate kolonuna YAZILMAZ; commit iznini yalnız bu
komut açar.

1. Aktif story'yi ve diff'i belirle: story dosyası + `git status --short`
   (yalın `git diff` stage'lenmiş ve izlenmeyen dosyaları göstermez). Story
   yoksa kullanıcıya söyle ve işi KÜÇÜK boy olarak değerlendir
   (`~/dev-starter/phases/development.md → İşin Boyu`). Story IN_PROGRESS ise
   ROUTEMAP'te durumu **IN_REVIEW** yap (`rules/routemap-discipline.md`).
   Değişiklik bir worktree'deyse önce ana ağaca al
   (`~/dev-starter/phases/development.md → Worktree ile Paralel Çalışma`):
   Gate ve kapsam izi ana ağaçta hesaplanır.
2. `gate` subagent'ını çalıştır (Görev Tanımı: `to: GATE`, story dosyası,
   değişen dosya listesi, `cikti: rapor gövdesi`). Rol tanımı:
   `~/dev-starter/agents/gate-agent.md` (6+1 adım, her pass'te komut + exit
   kodu). Gate çalışırken dosya DEĞİŞTİRME: kapsam izi bozulur.
3. Agent raporu döndürünce `docs/gate/<story-id>.md` dosyasına yaz
   (dizin yoksa oluştur) ve sonuna kapsamın izini ekle:
   `echo "Kapsam: $(bash ~/dev-starter/hooks/lib/gate-hash.sh)" >> docs/gate/<story-id>.md`.
   `hooks/gate-guard.sh` commit anında izi yeniden hesaplar; Gate'ten sonra
   kod değiştiyse commit bloklanır ve Gate yeniden çalışır. KÜÇÜK işte rapor
   `docs/gate/adhoc-<YYYY-MM-DD>-<konu>.md`.
4. Sonucu ROUTEMAP'teki story satırının **Gate** kolonuna işle:
   - `PASSED` / `PASSED_WITH_WARNINGS` → story IN_REVIEW ise kullanıcıya
     "commit'e hazır" de
   - `FAILED` → GATE_FAILED bulgularını story dosyasının **GATE-LOG** bölümüne
     ekle; Gate kolonunu FAILED → FIX_1 → FIX_2 sırasıyla ilerlet; düzeltmeyi
     ilgili agent'a yönlendir
   - FIX_2 sonrası hâlâ FAILED → kolona `ESCALATED` yaz, kullanıcıya seçenekli
     özet sun
5. Kullanıcıya üç satır özet ver:

```text
GATE — <story-id>: PASSED | PASSED_WITH_WARNINGS | FAILED (FIX_n) | ESCALATED
Bulgular: <CRITICAL n · HIGH n · MEDIUM n · LOW n> — en önemlisi: <tek cümle>
Rapor: docs/gate/<story-id>.md · Sıradaki: <commit | düzeltme: kim, ne>
```

Kural: Her pass bir KOMUT çalıştırır; komutsuz pass raporda "uygulanmadı"
diye görünür. `hooks/gate-guard.sh` commit'i bu kayda göre açar.
