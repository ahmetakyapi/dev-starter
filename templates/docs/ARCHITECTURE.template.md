# Architecture — [Proje Adı]

## Stack

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Frontend | Next.js 15 | App Router + SSR |
| Styling | Tailwind v4 | Token-based, utility-first |
| Database | PostgreSQL (Neon) | Serverless uyumlu |
| ORM | Drizzle | Type-safe, lightweight |
| Auth | next-auth v5 | App Router native |
| Hosting | Vercel | Zero-config deploy |

## Veri Modeli

### [tablo adı]
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK, auto-generated |
| createdAt | timestamp | Oluşturma zamanı |
| updatedAt | timestamp | Güncelleme zamanı |

### İlişkiler
- [tablo1] → [tablo2] (1:N, onDelete: cascade)

## API Endpoints

| Method | Path | Açıklama | Auth |
|--------|------|----------|------|
| GET | /api/[resource] | Liste | Evet |
| POST | /api/[resource] | Oluştur | Evet |
| PATCH | /api/[resource]/[id] | Güncelle | Evet |
| DELETE | /api/[resource]/[id] | Sil | Evet |

## Klasör Yapısı

```
app/
├── (public)/          → Auth gerektirmeyen sayfalar
├── (protected)/       → Auth gerektiren sayfalar
├── api/               → API routes
├── layout.tsx         → Root layout
└── page.tsx           → Landing

components/
├── layout/            → Header, Footer, Sidebar
├── sections/          → Page sections
└── ui/                → Reusable UI components

lib/
├── db.ts              → Database connection
├── schema.ts          → Drizzle schema
├── utils.ts           → Utility functions
└── validators.ts      → Zod schemas
```

## ADR (Architecture Decision Records)

### ADR-001: [Karar Başlığı]
- **Tarih**: [tarih]
- **Durum**: ACCEPTED
- **Bağlam**: [neden bu karar verildi]
- **Karar**: [ne kararlaştırıldı]
- **Sonuç**: [etkileri]
