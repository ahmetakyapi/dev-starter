# Context Curation

**Kural**: Her agent sadece ihtiyacı olan bilgiyi alır. Full context vermek token israfıdır ve kaliteyi düşürür.

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

Agent'a görev verirken handoff mesajında context'i belirt:

```text
AGENT_HANDOFF
  from: BA
  to: FE
  task: Dashboard chart bileşeni implementasyonu
  context:
    - story: docs/stories/STORY-005-dashboard-charts.md
    - architecture: docs/ARCHITECTURE.md#api-endpoints (sadece chart API)
    - patterns: knowledge/patterns.md#recharts
    - existing: src/components/ui/GlassCard.tsx (pattern referansı)
  NOT_NEEDED:
    - Diğer story dosyaları
    - DB schema detayları
    - Auth akışı
```

---

## Token Bütçesi Rehberi

| Agent | Hedef Context | Max |
|-------|--------------|-----|
| BA Agent | ~50k token | Full docs |
| UI Agent | ~15k token | Tema + ekranlar |
| FE Agent | ~10k token | Story + ilgili dosyalar |
| BE Agent | ~10k token | Story + schema + API |
| Gate Agent | ~20k token | Story + diff + rules |
| Deploy Agent | ~5k token | Config + env |
