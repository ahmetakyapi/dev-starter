---
description: Kaldığın yer raporu — ROUTEMAP + git log + açık işlerden hızlı özet ve sıradaki en değerli 3 iş önerisi. /roadmap'in ağır pazar analizine girmeden gündelik yön bulma.
argument-hint: ""
---

# /status — Neredeyiz, Sırada Ne Var?

Bu komut kod değiştirmez; yalnız okur ve önerir.

1. **Durumu topla** (komutlarla, tahminle değil):
   - `docs/ROUTEMAP.md`: aktif faz, IN_PROGRESS/IN_REVIEW/BLOCKED story'ler,
     Gate durumları, son kararlar
   - `git log --oneline -10` ve `git status --short`: son işler + bekleyen değişiklik
   - Varsa son Gate raporu (`docs/gate/`) ve son araştırma (`docs/research/`)
2. **Tutarsızlık varsa söyle**: DONE ama Gate PASSED değil, 30+ gündür duran
   IN_PROGRESS, bağımlılığı çözülmüş BLOCKED.
3. **Sıradaki 3 işi öner**, her biri tek satır: iş + neden şimdi + tahmini boy
   (KÜÇÜK/ORTA/BÜYÜK). Kaynak: ROUTEMAP NOT_STARTED satırları + tutarsızlıklar.
   Pazar/rakip analizi gerekiyorsa `/roadmap`e, bilinmeyen alan varsa
   `/research`e yönlendir.
4. **Tek soruyla bitir**: "Hangisiyle başlayalım?" Seçilen iş `/story` ile açılır.

Çıktı formatı:

```text
DURUM — <proje> (<faz>)
━━━━━━━━━━━━━━━━━━━━━━
Aktif: [story'ler + gate durumları] | yok
Son:   [son 2-3 commit özeti]
Dikkat: [tutarsızlık/blokaj] | temiz

Sıradaki 3 İş
1. ...
2. ...
3. ...
```
