# Context Curation

**Kural**: Her agent sadece ihtiyacı olan bilgiyi alır. Full context vermek token israfıdır ve kaliteyi düşürür.

> İki katman: token bütçesi **kayıtlı subagent'larda** fizikseldir (ayrı
> context penceresi); ana oturum rollerinde (BA/UI/AG) okuma-sırası
> disiplinidir. Ekip listesi: `agents/AGENT_PROTOCOL.md → Agent Ekibi`.

---

## Referansla Aktar

Subagent çıktısı DOSYAYA yazılır (`AGENT_PROTOCOL.md → Çıktı Adresleri`);
ana oturuma yalnız **yol + üç satır özet** döner. Rapor/kod gövdesini sohbete
yapıştırmak iki kez ödetir: önce üretirken, sonra her compaction'da.
Görev tanımının `oku:` alanı da aynı ilkeyle doldurulur: belge değil, belgenin
İLGİLİ BÖLÜMÜNÜN adresi.

---

## Neden?

- Claude Code'un context window'u sınırlı (~200k token)
- Full context verince agent odağını kaybeder
- 20+ story'lik bir faz'da her agent'a her şeyi vermek bütçeyi patlatır
- Curated context = daha iyi çıktı

---

## Agent Bazlı Context Matrisi

### BA Agent (Business Analyst)
**Context seviyesi**: FULL — Tüm dokumanları okur

| Kaynak | Oku | Neden |
|--------|-----|-------|
| ROUTEMAP | ✅ | Proje durumunu bilmeli |
| PRODUCT.md | ✅ | İş mantığını bilmeli |
| ARCHITECTURE.md | ✅ | Teknik kısıtları bilmeli |
| SCREENS.md | ✅ | Kullanıcı deneyimini bilmeli |
| Story dosyaları | ✅ | Scope kontrolü için |
| mistakes.md | ✅ | Risk değerlendirmesi |
| Kod dosyaları | ❌ | Kod incelemiyor |

### UI/UX Agent
**Context seviyesi**: FOCUSED — Tasarım odaklı

| Kaynak | Oku | Neden |
|--------|-----|-------|
| ROUTEMAP | ✅ (sadece aktif story) | Nereden devam |
| SCREENS.md | ✅ | Ekran referansı |
| themes/[proje].md | ✅ | Design DNA |
| ARCHITECTURE.md | ❌ | DB/API bilmesine gerek yok |
| Story dosyası | ✅ (sadece aktif) | Görev tanımı |
| rules/design-tokens.md | ✅ | Token kuralları |
| Mevcut bileşenler | ✅ | Tutarlılık için |

### Frontend Agent
**Context seviyesi**: TASK-SPECIFIC — Görev bazlı filtrelenmiş

| Kaynak | Oku | Neden |
|--------|-----|-------|
| ROUTEMAP | ✅ (sadece aktif story) | Nereden devam |
| Story dosyası | ✅ (sadece aktif) | Görev tanımı |
| ARCHITECTURE.md | ✅ (ilgili bölüm) | API contract, route yapısı |
| İlgili mevcut dosyalar | ✅ | Pattern takibi |
| patterns.md | ✅ | Onaylı desenler |
| mistakes.md | ✅ (ilgili bölüm) | Bilinen hatalar |
| PRODUCT.md | ❌ | İş mantığı story'de zaten var |
| Diğer story'ler | ❌ | Odak dağıtır |

### Backend Agent
**Context seviyesi**: TASK-SPECIFIC — Görev bazlı filtrelenmiş

| Kaynak | Oku | Neden |
|--------|-----|-------|
| ROUTEMAP | ✅ (sadece aktif story) | Nereden devam |
| Story dosyası | ✅ (sadece aktif) | Görev tanımı |
| ARCHITECTURE.md | ✅ (DB + API bölümü) | Schema, endpoint contract |
| lib/schema.ts | ✅ | Mevcut DB schema |
| lib/db.ts | ✅ | Connection pattern |
| patterns.md | ✅ (DB + API bölümü) | Onaylı desenler |
| mistakes.md | ✅ (DB + auth bölümü) | Bilinen hatalar |
| SCREENS.md | ❌ | UI bilmesine gerek yok |

### QA Agent
**Context seviyesi**: TASK-SPECIFIC — Test odaklı

| Kaynak | Oku | Neden |
|--------|-----|-------|
| Story dosyası | ✅ (sadece aktif) | Kabul kriterleri = test planı girdisi |
| tests/ dizini + test scriptleri | ✅ | Mevcut altyapı ve desen |
| rules/bugfix-protocol.md | ✅ | TDD akışı |
| mistakes.md | ✅ (indeksten ilgili kayıtlar) | Regression listesi |
| ARCHITECTURE.md | ✅ (API bölümü) | Sözleşme testleri |
| SCREENS.md | ❌ | Görsel test kapsamı DR'de |

### Researcher Agent
**Context seviyesi**: TASK-SPECIFIC — Soru odaklı

| Kaynak | Oku | Neden |
|--------|-----|-------|
| Araştırma sorusu + PRODUCT özeti | ✅ | Bağlam |
| tech-radar.md | ✅ | Mevcut varsayılanlar |
| decisions.md | ✅ | Çelişki kontrolü |
| patterns.md | ✅ (başlık düzeyi) | Çözülmüşü yeniden önermemek |
| Kod dosyaları | ❌ | Kod yazmıyor |

### Gate Agent
**Context seviyesi**: REVIEW — Story + plan + implementasyon

| Kaynak | Oku | Neden |
|--------|-----|-------|
| Story dosyası | ✅ | Acceptance criteria kontrolü |
| Değişen dosyalar (git diff) | ✅ | Kod inceleme |
| rules/* (tümü) | ✅ | Kural uyumu kontrolü |
| mistakes.md | ✅ | Regression kontrolü |
| ARCHITECTURE.md | ✅ (ilgili bölüm) | Mimari uyum |
| PRODUCT.md | ❌ | İş mantığı story'de |
| Diğer story'ler | ❌ | Sadece aktif story |

### Deploy Agent
**Context seviyesi**: MINIMAL — Deploy odaklı

| Kaynak | Oku | Neden |
|--------|-----|-------|
| ROUTEMAP | ✅ | Release durumu |
| .env.example | ✅ | Env var listesi |
| package.json | ✅ | Build scripts |
| Vercel config | ✅ | Deploy ayarları |
| mistakes.md | ✅ (deploy bölümü) | Bilinen deploy hataları |
| Story dosyaları | ❌ | Deploy'la ilgisiz |
| ARCHITECTURE.md | ❌ | Deploy'la ilgisiz |

---

## Context Verme Tekniği

Kayıtlı subagent'a görev verirken bağlam **Görev Tanımı'nın `oku:` alanıdır**
(`AGENT_PROTOCOL.md → Orkestrasyon`); belge değil, belgenin ilgili bölümünün
adresi verilir:

```text
GOREV_TANIMI
  to:    FE
  task:  Dashboard chart bileşeni implementasyonu
  oku:
    - docs/stories/STORY-005-dashboard-charts.md
    - docs/ARCHITECTURE.md#api-endpoints (sadece chart API)
    - knowledge/patterns.md#recharts
    - components/ui/Panel.tsx (pattern referansı)
  sinir: diğer story'ler, DB şema detayları ve auth akışı KAPSAM DIŞI
  cikti: değişen dosya listesi + üç satır özet
  kabul: [story'nin kriterleri]
```

---

## Token Bütçesi Rehberi

Bütçelerin tek kaynağı `agents/AGENT_PROTOCOL.md → Context Curation`
tablosudur (12 agent'ın tamamı, seviye + max token). Burada kopyası tutulmaz —
iki tablo ayrışınca biri sessizce bayatlıyordu.
