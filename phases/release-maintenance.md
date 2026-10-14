# Release & Maintenance Phase

**Production'a çıkış ve sonrası bakım protokolü.**

---

## Release Akışı

```
E2E & Polish DONE
    ↓
1. Pre-Release Checklist
    ↓
2. Version Tag
    ↓
3. Deploy
    ↓
4. Post-Deploy Verification
    ↓
5. Maintenance Mode Aktif
```

---

## 1. Pre-Release Checklist

### Kod
- [ ] Tüm story'ler DONE (ROUTEMAP'te kontrol)
- [ ] E2E & Polish fazı tamamlandı
- [ ] Tüm testler geçiyor
- [ ] Build başarılı (`npm run build`)
- [ ] TypeScript hata yok (`tsc --noEmit`)
- [ ] Lint temiz
- [ ] console.log / debug kodu yok

### Environment
- [ ] Production env vars hazır (Vercel dashboard)
- [ ] DATABASE_URL (production)
- [ ] AUTH_SECRET (unique, production)
- [ ] AUTH_URL (production domain, HTTPS — v5'te opsiyonel)
- [ ] NEXT_PUBLIC_APP_URL (production)
- [ ] 3. parti API key'ler (production)

### Database
- [ ] Migration'lar hazır (`drizzle-kit generate`)
- [ ] Production DB'ye migrate edildi
- [ ] Seed data (gerekiyorsa)
- [ ] Backup alındı

### Domain & DNS
- [ ] Domain Vercel'a bağlı
- [ ] SSL sertifikası aktif
- [ ] www redirect var

---

## 2. Version Tag

Semantic Versioning:

```bash
# İlk release
git tag -a v1.0.0 -m "Initial release"

# Sonraki
git tag -a v1.1.0 -m "feat: [feature açıklaması]"   # minor
git tag -a v1.0.1 -m "fix: [fix açıklaması]"         # patch
git tag -a v2.0.0 -m "breaking: [değişiklik]"        # major
```

**ROUTEMAP güncelle**: Release → version numarası + tarih

---

## 3. Deploy

Deploy Agent (`/deploy`) checklist'ini takip et:

```
1. npm run build (lokal doğrulama)
2. vercel --prod (veya Vercel dashboard'dan)
3. Deploy URL'i kontrol et
```

---

## 4. Post-Deploy Verification

Production'da çalıştır:

- [ ] Ana sayfa yükleniyor (200)
- [ ] Auth akışı çalışıyor (login/logout)
- [ ] Temel CRUD çalışıyor
- [ ] Dark/Light mode çalışıyor
- [ ] Mobile'da kullanılabilir
- [ ] API endpoint'leri response veriyor
- [ ] Health check endpoint (`/api/health`) 200

**Sorun varsa**: Immediate rollback → önceki deploy'a dön

---

## 4.5 Knowledge Capture — Bilgi Toplama

Yayın "bitti" demek değildir; öğrenilen kayda geçmeden faz kapanmaz
(`rules/self-improvement.md`). `/retro` bu adımı yürütür:

- [ ] `knowledge/themes/<proje>.md` dolduruldu (şablon: `templates/docs/DESIGN.template.md`)
- [ ] Proje boyunca yaşanan ama kaydedilmemiş hatalar `knowledge/mistakes.md`ye
      (+ önleyici adım ilgili `guides/` dosyasına)
- [ ] Kendini kanıtlamış yeni desenler `knowledge/patterns.md`ye
- [ ] "Dene" halkasında kullanılan teknoloji canlıya çıktıysa
      `knowledge/tech-radar.md`de terfi
- [ ] Değişen kararlar `knowledge/decisions.md`ye ("Değişti (tarih)" başlığıyla)
- [ ] Süreç notu: bu projede zinciri yavaşlatan adım neydi — tek paragraf,
      ROUTEMAP Kararlar Logu'na

Hepsi taslak olarak sunulur; kullanıcı onaylar (`/retro` akışı).

---

## 5. Maintenance Mode

Release sonrası mimari **dondurulur** (`rules/immutable-architecture.md` Production kuralları aktif):

### Gelen Talep Triage

```
Talep geldi
    ↓
BA Agent triage yapar
    ↓
├── HOTFIX  — Production'da kullanıcıyı etkiliyor
│     → Hemen TDD fix, kısa Gate, patch release
│
├── BUGFIX  — Bilinen bug, acil değil
│     → Normal bugfix protocol, patch release
│
├── ENHANCE — Yeni özellik veya iyileştirme
│     → Story yaz, Development pipeline, minor release
│
└── BREAKING — Mimari değişiklik gerekiyor
      → BA Agent + kullanıcı kararı, major release planla
```

### Maintenance Kuralları

1. **Breaking API change YASAK** — sadece additive (yeni endpoint, yeni alan)
2. **DB column silme/rename YASAK** — yeni column ekle, eskiyi deprecated işaretle
3. **Component interface değişikliği YASAK** — yeni prop ekle, mevcut kaldırma
4. **Her fix regression test ile gelir**
5. **Her fix `knowledge/mistakes.md`'ye eklenir**

### Hotfix Akışı

```
Production bug
    ↓
1. Sorunu reproduce et
2. Failing test yaz (bugfix-protocol.md)
3. Minimum fix uygula
4. Gate Agent (kısa: Pass 1,2,3,4)
5. Commit: fix(scope): description
6. Deploy: vercel --prod
7. Post-deploy verify
8. ROUTEMAP: maintenance log güncelle
9. mistakes.md güncelle
```

### Proaktif Bakım

Reaktif triage yetmez; canlı proje sessizce çürür. Aylık tur (ya da `/evolve`
çağrısıyla):

- [ ] `bash ~/dev-starter/scripts/audit-project.sh <proje>` — çıktı
      `knowledge/live-projects-audit.md`ye tarih damgasıyla
- [ ] `npm outdated` + `npm audit` — kritik güvenlik yaması varsa HOTFIX
      triage'ına girer
- [ ] Vercel panosunda hata oranı / CWV bozulması var mı
- [ ] `/api/health` hâlâ 200 mü (uptime kontrolü)
- [ ] Neon yedekleri ve migration durumu

### Maintenance Logu

`docs/maintenance/` altında:

```markdown
# BUG-001: [Başlık]

**Tarih**: [tarih]
**Severity**: HOTFIX | BUGFIX
**Bildiren**: [kim/nereden]

## Semptom
[Kullanıcı ne gördü]

## Root Cause
[Neden oldu]

## Fix
[Ne yapıldı]
[Commit hash]

## Regression Test
[Test dosyası ve açıklama]
```
