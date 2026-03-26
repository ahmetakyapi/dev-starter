# Bugfix Protocol (TDD)

**Kural**: Her bug fix, Test-Driven Development akışıyla yapılır. Önce failing test, sonra fix.

---

## Akış

```
Bug bildirimi
    ↓
1. REPRODUCE — Bug'ı anla ve tekrarla
    ↓
2. FAILING TEST — Bug'ı yakalayan test yaz (kırmızı)
    ↓
3. FIX — Minimum değişiklikle düzelt
    ↓
4. GREEN — Test geçtiğini doğrula
    ↓
5. REGRESSION — Mevcut testlerin hala geçtiğini doğrula
    ↓
6. DOCUMENT — knowledge/mistakes.md'ye ekle
    ↓
7. GATE — Gate Agent kalite kontrolü
```

---

## Adım Detayları

### 1. Reproduce

- Bug'ın tam davranışını tanımla
- Beklenen davranış vs gerçekleşen davranış
- Hangi dosya/fonksiyon etkileniyor?
- Edge case mi yoksa ana akış mı?

### 2. Failing Test

```ts
// Önce bu test KIRMIZI olmalı
test('should [beklenen davranış] when [koşul]', () => {
  // Arrange — bug'ı tetikleyen koşulları oluştur
  // Act — bug'lı fonksiyonu çağır
  // Assert — beklenen (doğru) davranışı kontrol et
  // → Bu test şu an FAIL etmeli
})
```

**Kural**: Test, bug'ın ROOT CAUSE'unu yakalayacak seviyede olmalı. Sadece semptom değil, neden.

### 3. Fix

- Minimum değişiklik prensibi — sadece bug'ı düzelt
- Refactoring YAPMA (ayrı story/task olarak planla)
- İlgili olmayan "iyileştirme" YAPMA
- Fix'in neden doğru olduğunu açıklayan kısa yorum ekle (sadece karmaşık durumlarda)

### 4. Green

```bash
# Sadece ilgili test dosyasını çalıştır
npm test -- --grep "[test adı]"

# Tüm test suite'i çalıştır
npm test
```

### 5. Regression

- Tüm mevcut testler geçiyor mu?
- Fix başka bir şeyi kırmış olabilir mi?
- İlgili modüldeki tüm testleri çalıştır

### 6. Document

Bug'ı `knowledge/mistakes.md`'ye ekle:

```markdown
### [N]. [Bug Başlığı]

**Hata**: [Semptom — kullanıcı ne gördü]

**Sebep**: [Root cause — neden oldu]

**Çözüm**: [Nasıl düzeltildi]

**Kural**: [Bu hatayı tekrarlamamak için ne yapılmalı]
```

### 7. Gate

Gate Agent'a gönder — normal 6-pass kalite kontrolü uygulanır.

---

## Triage Seviyeleri

| Seviye | Tanım | Süre Beklentisi |
|--------|-------|-----------------|
| **HOTFIX** | Production'da kullanıcıyı etkiliyor | Hemen düzelt, kısa Gate |
| **BUGFIX** | Bilinen hata, henüz production'da değil | Normal TDD akışı |
| **REGRESSION** | Önceki bir fix'in kırdığı şey | Öncelikli TDD akışı |

---

## Anti-Pattern'ler

- Test yazmadan fix pushlamak
- "Hızlı fix" diye shortcut almak
- Bug'ı düzeltirken scope genişletmek (refactoring)
- Semptomu düzeltip root cause'u bırakmak
- `mistakes.md`'yi güncellememek (aynı bug tekrar edilir)
