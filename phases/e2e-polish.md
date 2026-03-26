# E2E & Polish Phase

**Development tamamlandıktan sonra, release öncesi son kalite katmanı.**

> Tüm story'ler DONE olduktan sonra bu faz başlar.
> Amaç: "Çalışıyor" → "Production-ready" dönüşümü.

---

## Akış

```
E0: Seed Data
    ↓
E1: Route Crawl & Smoke Test
    ↓
E2: Interactive E2E Test
    ↓
E3: Performance Optimization
    ↓
E4: UI Polish & Responsive
    ↓
E5: Final Acceptance
    ↓
[RELEASE'E HAZIR]
```

---

## E0: Seed Data

**Amaç**: Gerçekçi test verisi oluştur.

**Kurallar**:
- Türkçe isimler, adresler, şirketler (realistic)
- Her entity için 50+ kayıt (pagination test edilebilsin)
- Zaman serisi verisi 30+ gün (chart'lar dolsun)
- FK ilişkiler tutarlı
- Edge case verileri dahil (boş alan, uzun metin, özel karakterler)

**Çıktı**: `prisma/seed.ts` veya `seeds/seed.sql`

---

## E1: Route Crawl & Smoke Test

**Amaç**: Tüm sayfalar yükleniyor mu?

**Kontrol listesi**:
- [ ] Her route 200 döndürüyor
- [ ] Auth gerektiren route'lar redirect ediyor
- [ ] 404 sayfası çalışıyor
- [ ] API endpoint'leri response veriyor
- [ ] Hiçbir sayfada console error yok
- [ ] SSR hatası yok (hydration mismatch)

---

## E2: Interactive E2E Test

**Amaç**: Kullanıcı akışları çalışıyor mu?

**Test edilecek akışlar**:
- [ ] Kayıt/giriş akışı (baştan sona)
- [ ] Ana kullanıcı journey (PRODUCT.md'deki temel özellik)
- [ ] CRUD operasyonları (oluştur → oku → güncelle → sil)
- [ ] Form validation (hatalı girdi → doğru hata mesajı)
- [ ] Navigasyon (tüm menü linkleri çalışıyor)
- [ ] Edge case'ler (boş state, yetki hatası, network error)

**Sorun bulununca**: Bugfix Protocol'e geç (TDD: failing test → fix → green)

---

## E3: Performance Optimization

**Kontrol listesi**:
- [ ] Lighthouse score: Performance > 90
- [ ] LCP < 2.5s (Largest Contentful Paint)
- [ ] FID < 100ms (First Input Delay)
- [ ] CLS < 0.1 (Cumulative Layout Shift)
- [ ] Bundle size kontrol (gereksiz import yok)
- [ ] Image optimization (next/image, WebP/AVIF)
- [ ] N+1 query yok (DB query count kontrol)
- [ ] Gereksiz re-render yok (React DevTools)
- [ ] Server Component / Client Component ayrımı doğru

**Araçlar**: Lighthouse, Bundle Analyzer, React DevTools Profiler

---

## E4: UI Polish & Responsive

**Kontrol listesi**:

### Responsive
- [ ] Mobile (375px) — tam kullanılabilir
- [ ] Tablet (768px) — layout uyumlu
- [ ] Desktop (1024px) — ana hedef
- [ ] Wide (1440px+) — stretch etmiyor

### Dark/Light Mode
- [ ] Her ekran dark mode'da test edildi
- [ ] Her ekran light mode'da test edildi
- [ ] Geçiş sırasında flash yok
- [ ] Contrast ratio yeterli (WCAG AA)

### Visual Polish
- [ ] Design token'lar tutarlı (hardcoded renk yok)
- [ ] Animasyonlar smooth (60fps, GPU-accelerated)
- [ ] Loading state'ler var (skeleton/spinner)
- [ ] Empty state'ler var (boş liste mesajı)
- [ ] Error state'ler var (hata UI'ı)
- [ ] Türkçe karakter doğru (ç,ğ,ı,İ,ö,ş,ü)
- [ ] Tarih formatı DD.MM.YYYY
- [ ] Sayı formatı 1.234,56

### Erişilebilirlik
- [ ] Keyboard navigation çalışıyor
- [ ] aria-label'lar var
- [ ] alt text'ler var
- [ ] Focus visible

---

## E5: Final Acceptance

**Amaç**: Tüm acceptance criteria karşılanmış mı?

**Süreç**:
1. PRODUCT.md'deki her feature'ı kontrol et
2. Her story'nin acceptance criteria'sını doğrula
3. ROUTEMAP'teki tüm story'ler DONE mu?
4. Bilinen bug kalmamış mı?

**Sonuç formatı**:

```markdown
## Acceptance Report — [Proje Adı]

**Tarih**: [tarih]
**Sonuç**: ACCEPTED | REJECTED

### Feature Coverage
| Feature | Durum | Notlar |
|---------|-------|--------|

### Açık Sorunlar
| # | Sorun | Severity | Story |
|---|-------|----------|-------|

### Karar
[ACCEPTED: Release'e hazır / REJECTED: [sebep]]
```

**ROUTEMAP güncelle**: E2E & Polish → DONE
