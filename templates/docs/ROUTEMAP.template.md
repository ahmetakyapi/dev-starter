# ROUTEMAP — [Proje Adı]

> Tek gerçek kaynak. Projenin tüm durumu burada. Session'lar arası kaybolmaz.
> Her adım tamamlandığında bu dosya güncellenir.

**Proje**: [proje adı]
**Başlangıç**: [tarih]
**Durum**: PLANNING | DEVELOPMENT | E2E_POLISH | RELEASED | MAINTENANCE

---

## Faz Durumu

| Faz | Durum | Başlangıç | Bitiş | Protokol |
|-----|-------|-----------|-------|----------|
| Planning | NOT_STARTED | | | `phases/planning.md` |
| Development | NOT_STARTED | | | `phases/development.md` |
| E2E & Polish | NOT_STARTED | | | `phases/e2e-polish.md` |
| Release & Maintenance | NOT_STARTED | | | `phases/release-maintenance.md` |

---

## Planning Adımları

| Adım | Açıklama | Durum | Çıktı |
|------|----------|-------|-------|
| P1 | Discovery & Brainstorm | NOT_STARTED | decisions.md |
| P2 | Product Definition | NOT_STARTED | PRODUCT.md |
| P3 | Architecture Design | NOT_STARTED | ARCHITECTURE.md |
| P4 | Screen Design | NOT_STARTED | SCREENS.md |
| P5 | Story Writing | NOT_STARTED | stories/ |
| P6 | Dev Readiness | NOT_STARTED | checklist |

---

## Story Takibi

| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | [başlık] | 1 | HIGH | NOT_STARTED | — | — |

### Durum Açıklamaları
- `NOT_STARTED` — Henüz başlanmadı
- `IN_PROGRESS` — Aktif geliştirme
- `IN_REVIEW` — Gate Agent'ta
- `DONE` — Gate PASSED + commit yapıldı (hooks/routemap-sync.sh bu değişmezi denetler)
- `BLOCKED` — Bağımlılık veya karar bekliyor

### Gate Durumları
- `—` — Henüz Gate'e gönderilmedi
- `PASSED` — 6+1 pass tamamlandı (rapor: `docs/gate/<story>.md`)
- `PASSED_WITH_WARNINGS` — Uyarılarla geçti
- `FAILED` — Düzeltme gerekiyor (bulgular story dosyasının GATE-LOG bölümünde)
- `FIX_1` / `FIX_2` — Düzeltme döngüsünde
- `ESCALATED` — 2 döngüde çözülmedi; kullanıcı kararı bekliyor

---

## Orkestrasyon Durumu

> Yalnız BÜYÜK işlerde dolar (`phases/development.md`). Session resume bu
> tablodan hangi alt ajanın ne beklediğini okur; sohbet geçmişine bağımlı kalmaz.

| Alt Ajan | Görev (zarf özeti) | Beklenen Çıktı | Durum |
|----------|--------------------|----------------|-------|
| | | | |

---

## Kararlar Logu

| Tarih | Karar | Gerekçe | Etkisi |
|-------|-------|---------|--------|
| | | | |

---

## Bug Pattern'ler

| ID | Pattern | Root Cause | Etkilenen |
|----|---------|------------|-----------|
| | | | |

---

## Notlar

- ROUTEMAP her story tamamlandığında güncellenir
- Session başında ROUTEMAP okunur, kaldığı yerden devam edilir
- Gate PASSED olmadan story DONE yapılamaz
