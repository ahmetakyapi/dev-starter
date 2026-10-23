---
description: Gate denetimi — 6+1 adımı gate subagent'ıyla koşturur, raporu docs/gate/'e yazar, sonucu ROUTEMAP'in Gate kolonuna işler. Commit kontrolünı açan komut budur.
argument-hint: "[story-id — boşsa ROUTEMAP'teki aktif story]"
---

# /gate — Kalite Kapısı

Story: **$ARGUMENTS** (boşsa `docs/ROUTEMAP.md`deki IN_PROGRESS/IN_REVIEW story).

`/check` teknik sağlıktır ve Gate kolonuna YAZILMAZ; commit iznini yalnız bu
komut açar.

1. Aktif story'yi ve diff'i belirle (`git diff` + story dosyası). Story yoksa
   kullanıcıya söyle ve işi KÜÇÜK boy olarak değerlendir
   (`~/dev-starter/phases/development.md → İşin Boyu`).
2. `gate` subagent'ını çalıştır. Rol tanımı:
   `~/dev-starter/agents/gate-agent.md` (6+1 adım, her pass'te komut + exit
   kodu). Görev Tanımı'na story dosyasını ve değişen dosya listesini koy.
3. Agent raporu döndürünce `docs/gate/<story-id>.md` dosyasına yaz
   (dizin yoksa oluştur).
4. Sonucu ROUTEMAP'teki story satırının **Gate** kolonuna işle:
   - `PASSED` / `PASSED_WITH_WARNINGS` → story IN_REVIEW ise kullanıcıya
     "commit'e hazır" de
   - `FAILED` → GATE_FAILED bulgularını story dosyasının **GATE-LOG** bölümüne
     ekle; Gate kolonunu FAILED → FIX_1 → FIX_2 sırasıyla ilerlet; düzeltmeyi
     ilgili agent'a yönlendir
   - FIX_2 sonrası hâlâ FAILED → kolona `ESCALATED` yaz, kullanıcıya seçenekli
     özet sun
5. Kullanıcıya üç satır özet ver: sonuç, bulgu sayısı, rapor yolu.

Kural: Her pass bir KOMUT çalıştırır; komutsuz pass raporda "uygulanmadı"
diye görünür. `hooks/gate-guard.sh` commit'i bu kayda göre açar.
