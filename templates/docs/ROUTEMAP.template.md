# ROUTEMAP — [Proje Adı]

> Tek gerçek kaynak. Projenin tüm durumu burada. Session'lar arası kaybolmaz.
> Her adım tamamlandığında bu dosya güncellenir.

**Proje**: [proje adı]
**Başlangıç**: [tarih]
**Durum**: PLANNING | DEVELOPMENT | E2E_POLISH | DOCUMENTATION | RELEASED | MAINTENANCE

---

## Faz Durumu

| Faz | Durum | Başlangıç | Bitiş |
|-----|-------|-----------|-------|
| Planning | NOT_STARTED | | |
| Development | NOT_STARTED | | |
| E2E & Polish | NOT_STARTED | | |
| Documentation | NOT_STARTED | | |
| Release | NOT_STARTED | | |

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
- `DONE` — Gate PASSED + commit yapıldı
- `BLOCKED` — Bağımlılık veya karar bekliyor

### Gate Durumları
- `—` — Henüz Gate'e gönderilmedi
- `PASSED` — 6-pass tamamlandı
- `PASSED_WITH_WARNINGS` — Uyarılarla geçti
- `FAILED` — Düzeltme gerekiyor
- `FIX_1` / `FIX_2` — Düzeltme döngüsünde

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
