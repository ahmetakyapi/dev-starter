# PROJECT_NAME — Proje Kuralları

> Bu dosyayı projeye özgü bilgilerle doldur.

---

## Proje Özeti

PROJECT_DESCRIPTION

## Teknik Stack

- **Framework**: Next.js 14 App Router
- **Stil**: Tailwind CSS 3 (`darkMode: 'class'`)
- **Animasyon**: Framer Motion
- **DB**: Drizzle ORM + Neon Postgres (`@neondatabase/serverless`)
- **Deployment**: Vercel

## Ekosistem Referansları

- Tema: `~/dev-starter/knowledge/themes/ahmetakyapi.md`
- Hatalar: `~/dev-starter/knowledge/mistakes.md`
- Desenler: `~/dev-starter/knowledge/patterns.md`

## Proje Kararları

<!-- Projeye özgü tasarım ve teknik kararları buraya yaz -->
- [ ] Auth eklenecek mi?
- [ ] Hangi tema kullanılıyor? (ahmetakyapi / digynotes / mimio / minimal)

## Özel Kurallar

<!-- Bu projeye özgü kurallar -->

---

## Kurulum

```bash
cp .env.example .env.local
npm install
npm run db:push   # DB şemasını uygula
npm run dev
```

## Deployment

```bash
/deploy   # Vercel checklist
```
