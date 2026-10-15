# Dev Cycle Pipeline

**Her feature/story implementasyonu bu pipeline'ı takip eder.**

> Fazın kendisi (story seçimi, boy, alt ajanlara dağıtım, dalga planı):
> `phases/development.md`. Bu dosya TEK story'nin iç akışıdır.

---

## İşin Boyu

Pipeline işe göre ölçeklenir (`phases/development.md → İşin Boyu`):

- **KÜÇÜK** (tek dosya/kozmetik): story yok; Develop → Self-Check → Gate (hafif) → Commit
- **ORTA** (tek story): bu pipeline'ın tamamı
- **BÜYÜK** (çok alan): dalga planı; adım 3 kayıtlı subagent'lara dağıtılır

---

## Pipeline Akışı

```
[Görev Tanımı]
    ↓
1. PLAN — Ne yapılacak, nasıl yapılacak
    ↓
2. VALIDATE — Plan yeterli mi? (Plan Quality Gate)
    ↓
3. DEVELOP — Test yaz (önce), kod yaz
    ↓
4. SELF-CHECK — Developer kendi çıktısını kontrol eder
    ↓
5. GATE — Gate Agent 6+1 pass kalite kontrolü (/gate)
    ↓
6. COMMIT — Conventional commit ile kaydet
    ↓
7. REVIEW — BA Agent çıktıyı inceler
    ↓
8. COMPOUND — Ders var mı? (mistakes / patterns / decisions taslağı)
    ↓
[Tamamlandı]
```

---

## Adım Detayları

### 1. Plan

Görev başlamadan önce kısa bir plan oluştur:

```markdown
## Plan — [Görev Adı]

### Hedef
[Tek cümle: ne yapılacak]

### Etkilenen Dosyalar
- [dosya yolu] — [ne değişecek]

### Yaklaşım
1. [adım 1]
2. [adım 2]
3. [adım 3]

### Kabul Kriterleri
- [ ] [kriter 1]
- [ ] [kriter 2]

### Risk / Dikkat
- [varsa potansiyel risk]
```

**Küçük görevler** (tek dosya, net değişiklik): Plan opsiyonel, mental not yeterli.
**Büyük görevler** (birden fazla dosya, yeni özellik): Plan zorunlu.

### 2. Validate (Plan Quality Gate)

Plan şunları içermeli:

- **Hedef** net tanımlanmış mı?
- **Etkilenen dosyalar** listelenmiş mi?
- **Kabul kriterleri** ölçülebilir mi?
- **Yaklaşım** mevcut patterns.md ile uyumlu mu?
- **Risk** değerlendirilmiş mi?

Eksik varsa → planı düzelt, devam etme.

### 3. Develop

Geliştirme sırasında uyulacak kurallar:

- `rules/immutable-architecture.md` — her zaman geçerli
- `rules/design-tokens.md` — UI değişikliklerinde
- `knowledge/mistakes.md` — bilinen hatalardan kaçın
- `knowledge/patterns.md` — onaylanmış desenleri kullan

**Geliştirme Sırası:**
1. Backend/API (varsa) — schema, endpoint, validation
2. Frontend — bileşen, sayfa, state
3. Entegrasyon — API bağlantısı, data flow
4. Test — unit + integration

### 4. Self-Check

Developer (FE/BE Agent) kendi çıktısını Gate'e göndermeden önce şunları kontrol eder:

```
□ TypeScript hata yok (tsc --noEmit)
□ Lint temiz (eslint)
□ Build başarılı (npm run build)
□ Testler geçiyor (npm test)
□ Hardcoded değer yok (design token kontrolü)
□ console.log / debug kodu kaldırıldı
□ Unused import yok
```

Herhangi biri fail ediyorsa → önce düzelt, Gate'e gönderme.

### 5. Gate

Gate kayıtlı subagent'tır; iş ona **Görev Zarfı** ile gider
(`AGENT_PROTOCOL.md → Orkestrasyon`):

```
GOREV_ZARFI
  to:    GATE
  task:  [görev adı] kalite kontrolü
  oku:   [story dosyası + değişen dosya listesi]
  sinir: [kod değiştirme — bulgu + düzeltme talimatı üret]
  cikti: [rapor gövdesi; ana oturum docs/gate/<story>.md'ye yazar]
  kabul: 6+1 pass çalıştı, her pass'te komut + exit kodu raporda
```

Gate sonuçları:
- **PASSED** → commit aşamasına geç
- **PASSED_WITH_WARNINGS** → uyarıları değerlendir, commit'e geç
- **FAILED** → Gate raporundaki sorunları düzelt, tekrar Gate'e gönder (max 2 döngü)

### 6. Commit

`rules/commit-conventions.md` kurallarını takip et:

```bash
# Stage only relevant files
git add [dosyalar]

# Conventional commit
git commit -m "feat(scope): description"
```

### 7. Review

BA Agent final inceleme yapar; sonucu tek satırla ROUTEMAP Kararlar Logu'na düşer:

- Görev kapsamla örtüşüyor mu? → **APPROVED** | **REWORK** (gerekçeyle ilgili ajana)
- Over-engineering var mı?
- Kullanıcı değeri sağlanmış mı?
- Bir sonraki adım ne?

### 8. Compound

İş bittikten sonra üç soru (`rules/self-improvement.md`):

1. Bu işte düzeltilen hata `mistakes.md`lik mi?
2. Bulunan desen `patterns.md`lik mi?
3. Değişen karar `decisions.md`lik mi?

Evet'ler için taslak öner — **onaysız yazma**. Koşu başına en fazla 1-2 ders.

---

## Paralel Geliştirme (Büyük Özellikler)

Bağımsız parçalar paralel çalışabilir:

```
Wave 1 (paralel):
  → BE Agent: API endpoint + schema
  → UI Agent: Tasarım kararları

Wave 2 (Wave 1 bittikten sonra):
  → FE Agent: UI + API entegrasyonu

Wave 3:
  → Gate Agent: Kalite kontrolü
  → BA Agent: Review
```

Wave arası: Build kontrolü yap, çakışma varsa çöz.

---

## Pipeline Kısayolları

| Durum | Atlanan Adımlar |
|-------|-----------------|
| Tek satır fix (typo, config) | Plan, Validate, Self-Check → doğrudan Gate |
| Hotfix (production bug) | Bugfix Protocol'e geç (TDD akışı) |
| Refactoring (davranış değişmez) | Plan kısa tutulabilir, testler zorunlu |
| Dokümantasyon | Gate'in sadece Pass 1-2'si uygulanır |
