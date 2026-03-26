# Dev Cycle Pipeline

**Her feature/story implementasyonu bu pipeline'ı takip eder.**

---

## Pipeline Akışı

```
[Görev Tanımı]
    ↓
1. PLAN — Ne yapılacak, nasıl yapılacak
    ↓
2. VALIDATE — Plan yeterli mi? (Plan Quality Gate)
    ↓
3. DEVELOP — Kod yaz, test yaz
    ↓
4. SELF-CHECK — Developer kendi çıktısını kontrol eder
    ↓
5. GATE — Gate Agent 6-pass kalite kontrolü
    ↓
6. COMMIT — Conventional commit ile kaydet
    ↓
7. REVIEW — BA Agent çıktıyı inceler
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

Gate Agent'a handoff:

```
AGENT_HANDOFF
  from: [FE | BE]
  to: GATE
  task: [görev adı] kalite kontrolü
  context:
    - değişen dosyalar: [liste]
    - kabul kriterleri: [plan'dan]
  acceptance_criteria:
    - 6-pass Gate PASSED
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

BA Agent final inceleme yapar:

- Görev kapsamla örtüşüyor mu?
- Over-engineering var mı?
- Kullanıcı değeri sağlanmış mı?
- Bir sonraki adım ne?

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
