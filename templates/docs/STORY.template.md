# STORY-NNN: [Başlık]

**Durum**: TASLAK | ONAYLI | IN_PROGRESS | IN_REVIEW | DONE | BLOCKED
**Öncelik**: P1 | P2 | P3 — [neden bu öncelik, tek cümle]
**Boy**: S | M | L | XL
**Bağımsız Test**: [bu story tek başına uygulansa nasıl doğrulanır — tek cümle]

---

## Açıklama

[Ne yapılacak, neden. Kullanıcı için ne değişecek.]

## Kabul Kriterleri 🔒

> Bu bölüm onaydan sonra KİLİTLİDİR: uygulama sırasında kriter değiştirilmez;
> değişiklik gerekiyorsa story kullanıcıyla yeniden onaylanır.

- [ ] Verildiğinde [başlangıç durumu], olduğunda [eylem], o zaman [beklenen sonuç]
- [ ] Verildiğinde ..., olduğunda ..., o zaman ...
- [ ] [ölçülebilir kriter]

## Teknik Notlar

> BA, P5'te ilgili kesitleri BURAYA damıtır: FE/BE alt ajanı tüm belgeleri
> değil, bu story dosyasını okur (`rules/context-curation.md`).

- **Etkilenen dosyalar**: [liste]
- **API**: [endpoint sözleşmesi — ARCHITECTURE.md'den ilgili satırlar]
- **DB**: [schema değişikliği — varsa Drizzle kesiti]
- **Ekran/tasarım**: [SCREENS.md'den ilgili bölüm + token notları]
- **Geçerli kurallar**: [rules/ dosyalarından yalnız bu işe değenler]

## Test Planı

> QA doldurur: her kabul kriterine en az bir test.

| Kriter | Test | Dosya |
|--------|------|-------|
| 1 | | |

## Bağımlılıklar

- [STORY-XXX tamamlanmış olmalı | yok]

---

## GATE-LOG

> Gate FAILED kayıtları buraya eklenir (beklenen / bulunan / kök neden /
> düzeltme / kaçın). Bir sonraki deneme bunu OKUR; aynı kök nedene ikinci
> kez düşmek başlı başına bulgudur. PASSED raporu: `docs/gate/STORY-NNN.md`.

*(henüz kayıt yok)*
