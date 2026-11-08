---
paths:
  - "lib/db*"
  - "lib/schema*"
  - "lib/env*"
  - "drizzle/**"
  - "drizzle.config.*"
  - "**/migrations/**"
  - "**/.env.example"
  - "app/api/**"
  - "**/actions.ts"
  - "**/actions/**"
  - "vercel.json"
---

# Veritabanı, Ortam Değişkeni ve Yayın Kuralları (global, yol kapsamlı)

> Kaynak: `~/dev-starter/machine/rules/data-env.md` → `~/.claude/rules/dev-starter/`
> (bootstrap). 8 Kasım 2026'ya dek global `CLAUDE.md`nin "Kod Standartları →
> Veritabanı / Environment Variables" ve "Öğrenilen Hatalar" (3, 5, 9)
> bölümlerindeydi (`knowledge/decisions.md` → "Bağlam Dosyaları").
> "Server Action herkese açık POST ucudur" kuralı `nextjs-react.md`de.

## Veritabanı

- Serverless (Vercel) ortamında `pg` kullanma — `@neondatabase/serverless` kullan
- Her foreign key'de `ON DELETE` davranışını belirt
- Her migration sonrası Drizzle tipleri yeniden üret
- Migration deploy'da uygulanmaz → yeni özellik kendi tablosunu alır, tablo yokken sessizce düşer

## Environment Variables

- `.env.example` dosyasını her zaman güncelle (değer olmadan)
- Client erişimi gereken varlar: `NEXT_PUBLIC_` prefix
- Vercel'de env varları deploy öncesi ekle

## Öğrenilen Hatalar (veri ve yayın)

Ayrıntı: `~/dev-starter/knowledge/mistakes.md`.

3. Serverless DB → `@neondatabase/serverless` (pg değil), tembel `db`
5. Vercel deploy → env ve migration deploy'dan önce
9. Migration → her zaman yeni dosya, eskiyi değiştirme
