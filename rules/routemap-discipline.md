# ROUTEMAP Discipline

**Kural**: ROUTEMAP projenin tek gerçek kaynağıdır. Tüm agent'lar bunu okur ve günceller.

---

## Temel Prensipler

1. **Tek Kaynak**: Projenin durumu ROUTEMAP'te. Başka yerde durum tutulmaz.
2. **Her Adımda Güncelle**: Story tamamlanınca, Gate geçince, faz değişince — ROUTEMAP güncellenir.
3. **Session Başında Oku**: Her yeni session'da ilk iş ROUTEMAP okumak. Nereden devam edilecek buradan anlaşılır.
4. **Önce ROUTEMAP, Sonra Kullanıcı**: Story DONE işaretlenmeden kullanıcıya "bitti" deme — veri kaybı riski.

---

## ROUTEMAP Konumları

Sırasıyla kontrol et:
1. `docs/ROUTEMAP.md` (tercih edilen)
2. `ROUTEMAP.md` (root fallback)

---

## Durum Geçişleri

İki ayrı kolon, iki ayrı makine (şablondaki kolon adlarıyla; hook'lar kolonu
ada göre bulur — `hooks/lib/routemap.sh`, mistakes.md #99):

**Durum kolonu** (story'nin yaşam döngüsü):

```
NOT_STARTED → IN_PROGRESS → IN_REVIEW → DONE
                    ↓
                 BLOCKED
```

**Gate kolonu** (denetimin sonucu ve düzeltme döngüsü):

```
— → FAILED → FIX_1 → FIX_2 → ESCALATED
         └────────┴──────┴──→ PASSED | PASSED_WITH_WARNINGS
```

### Kurallar

- `NOT_STARTED → IN_PROGRESS`: Agent göreve başladığında
- `IN_PROGRESS → IN_REVIEW`: Developer self-check tamamladığında, Gate'e gönderildiğinde
- `IN_REVIEW → DONE`: Gate kolonu PASSED + commit yapıldığında (Durum FAILED değeri almaz)
- Gate `— → FAILED`: Gate FAILED döndüğünde (bulgular story'nin GATE-LOG'una)
- Gate `FAILED → FIX_1 → FIX_2`: düzeltme döngüleri (ana oturum ilerletir)
- Gate `FIX_2 → ESCALATED`: 2 döngüde çözülemedi; BA kullanıcıya seçenekli özet sunar

---

## Session Resume Protokolü

Yeni session başladığında:

```
1. ROUTEMAP oku
2. Aktif faz ne? (Planning / Development / E2E / Release-Maintenance)
3. Son tamamlanan story/adım hangisi?
4. Bekleyen blocker var mı?
5. Kullanıcıya özet sun:
   "Kaldığımız yer: [faz] — [son story] DONE, sıradaki [sonraki story]"
6. Onay al, devam et
```

---

## Compaction Resilience

Claude Code context sıkıştırması yapabilir. ROUTEMAP buna karşı dayanıklıdır çünkü:

- Dosya olarak diskte durur (context'ten bağımsız)
- Her session başında tekrar okunur
- Tüm durum bilgisi dosyada, hafızada değil
