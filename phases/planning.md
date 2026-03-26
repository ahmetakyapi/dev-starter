# Planning Phase

**6 adımda fikirden geliştirmeye hazır story'lere.**

> Planlama tamamlanmadan development başlamaz.
> Her adımın çıktısı bir doküman — karar havada kalmaz.

---

## Akış

```
P1: Discovery & Brainstorm
    ↓
P2: Product Definition
    ↓
P3: Architecture Design
    ↓
P4: Screen Design
    ↓
P5: Story Writing
    ↓
P6: Dev Readiness Check
    ↓
[DEVELOPMENT BAŞLAR]
```

---

## P1: Discovery & Brainstorm

**Amaç**: Projenin ne olduğunu, kimin için olduğunu ve neyi çözdüğünü netleştir.

**Süreç**:
1. Kullanıcıyla interaktif brainstorm
2. 5 temel soruyu cevapla:
   - Bu proje hangi problemi çözüyor?
   - Hedef kullanıcı kim?
   - Başarı kriteri ne?
   - Scope sınırları ne? (ne yapılmayacak)
   - Bilinen kısıtlar ne? (teknoloji, zaman, bütçe)
3. Kararları kaydet

**Çıktı**: `docs/brainstorming/decisions.md`

```markdown
## Kararlar

| # | Karar | Gerekçe | Durum |
|---|-------|---------|-------|
| 1 | [karar] | [neden] | APPROVED |
```

**ROUTEMAP güncelle**: P1 → DONE

---

## P2: Product Definition

**Amaç**: İş mantığını, kapsamı ve öncelikleri dokümante et.

**Süreç**:
1. P1 kararlarından PRODUCT.md oluştur
2. Scope belirle (in/out)
3. Feature'ları önceliklendir (must/should/could/won't)

**Çıktı**: `docs/PRODUCT.md`

```markdown
# Product Definition — [Proje Adı]

## Problem
[1-2 cümle]

## Hedef Kullanıcı
[persona tanımı]

## Temel Özellikler
### Must Have
- [feature 1]

### Should Have
- [feature 2]

### Could Have
- [feature 3]

### Won't Have (bu versiyon)
- [feature 4]

## Başarı Kriterleri
- [metrik 1]

## İş Kuralları
- [kural 1]
```

**ROUTEMAP güncelle**: P2 → DONE

---

## P3: Architecture Design

**Amaç**: Teknik kararları, stack'i ve veri modelini belirle.

**Süreç**:
1. Stack seçimi (framework, DB, hosting)
2. Veri modeli tasarımı (tablolar, ilişkiler)
3. API tasarımı (endpoint listesi)
4. Klasör yapısı
5. 3. parti servisler (auth, storage, email)

**Çıktı**: `docs/ARCHITECTURE.md`

```markdown
# Architecture — [Proje Adı]

## Stack
| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Frontend | Next.js 15 | SSR + App Router |
| Database | PostgreSQL (Neon) | Serverless uyumlu |
| ORM | Drizzle | Type-safe, lightweight |
| Auth | next-auth v5 | App Router native |
| Hosting | Vercel | Zero-config deploy |

## Veri Modeli
[Tablo tanımları, ilişkiler, FK'lar]

## API Endpoints
| Method | Path | Açıklama | Auth |
|--------|------|----------|------|

## Klasör Yapısı
[tree]

## ADR (Architecture Decision Records)
[Önemli teknik kararlar ve gerekçeleri]
```

**ROUTEMAP güncelle**: P3 → DONE

---

## P4: Screen Design

**Amaç**: Kullanıcının göreceği ekranları, navigasyonu ve bileşenleri planla.

**Süreç**:
1. Route listesi çıkar
2. Her ekran için ASCII wireframe veya açıklama
3. Paylaşılan bileşenleri belirle
4. Design token'ları tanımla (varsa `knowledge/themes/` referans al)

**Çıktı**: `docs/SCREENS.md`

```markdown
# Screens — [Proje Adı]

## Route Haritası
| Route | Sayfa | Auth | Layout |
|-------|-------|------|--------|
| / | Landing | Hayır | Public |
| /dashboard | Dashboard | Evet | App |

## Ekran Detayları

### Landing (/)
[Wireframe veya açıklama]
- Hero section
- Features grid
- CTA

### Dashboard (/dashboard)
[Wireframe veya açıklama]

## Paylaşılan Bileşenler
- Header (logo, nav, theme toggle)
- Sidebar (dashboard layout)
- Footer

## Design Tokens
[Renk paleti, typography, spacing — veya tema referansı]
```

**ROUTEMAP güncelle**: P4 → DONE

---

## P5: Story Writing

**Amaç**: Her feature'ı implementasyon-ready story'lere böl.

**Süreç**:
1. PRODUCT.md'deki feature'ları story'lere ayır
2. Her story için acceptance criteria yaz
3. Bağımlılıkları belirle (hangi story hangisine bağlı)
4. Faz'lara grupla (Wave 1, Wave 2...)
5. Story dosyalarını oluştur

**Story Formatı**: `docs/stories/STORY-NNN-title.md`

```markdown
# STORY-NNN: [Başlık]

## Açıklama
[Ne yapılacak, neden]

## Acceptance Criteria
- [ ] [kriter 1]
- [ ] [kriter 2]
- [ ] [kriter 3]

## Teknik Notlar
- Etkilenen dosyalar: [liste]
- API: [endpoint bilgisi]
- DB: [schema değişikliği]

## Bağımlılıklar
- [STORY-XXX tamamlanmış olmalı]

## Tahmini Büyüklük
S | M | L | XL
```

**ROUTEMAP güncelle**: P5 → DONE, story'leri tabloya ekle

---

## P6: Dev Readiness Check

**Amaç**: Development başlamadan önce her şeyin hazır olduğunu doğrula.

**Checklist**:

### Dokümantasyon
- [ ] PRODUCT.md tamamlandı ve onaylandı
- [ ] ARCHITECTURE.md tamamlandı
- [ ] SCREENS.md tamamlandı
- [ ] Story'ler yazıldı ve ROUTEMAP'e eklendi
- [ ] Her story'nin acceptance criteria ölçülebilir

### Teknik
- [ ] Stack kararları kesinleşti
- [ ] DB schema tanımlandı
- [ ] API endpoint listesi var
- [ ] Auth akışı planlandı
- [ ] 3. parti servis hesapları hazır

### Altyapı
- [ ] Repo oluşturuldu
- [ ] Template uygulandı (nextjs-fullstack veya landing)
- [ ] .env.example hazır
- [ ] CLAUDE.md projeye özel kurallarla güncellendi
- [ ] ROUTEMAP oluşturuldu

### Tasarım
- [ ] Tema seçildi veya Design DNA çıkarıldı
- [ ] Bileşen kütüphanesi belirlendi (@ahmetakyapi/ui veya custom)
- [ ] Responsive strateji belirlendi (mobile-first?)

**Sonuç**: Tüm maddeler ✅ → Development başlayabilir

**ROUTEMAP güncelle**: P6 → DONE, Faz: Planning → DONE, Development → IN_PROGRESS
