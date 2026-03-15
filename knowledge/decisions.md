# Mimari Kararlar

Her teknoloji seçiminin gerekçesi. Yeni bir projede alternatif önermeden önce bu dosyayı oku.

---

## Framework — Next.js 14+ (App Router)

**Tercih edildi:** Next.js 14+ App Router
**Alternatifler:** Remix, Vite+React, Astro, SvelteKit

**Gerekçe:**
- Vercel ile birinci sınıf entegrasyon (sıfır config deploy)
- Server Component'ler → daha az client JS, daha iyi ilk yükleme
- App Router → layout nesting, parallel routes, intercepting routes
- `next/image`, `next/font`, `next/og` built-in optimizasyonlar
- Edge runtime desteği (middleware, API routes)
- Geniş ekosistem → next-auth, next-themes, @vercel/og

**Ne zaman değişir:** Sadece içerik ağırlıklı site → Astro. Full SPA → Vite.

---

## ORM — Drizzle ORM

**Tercih edildi:** Drizzle ORM
**Alternatifler:** Prisma, Kysely, raw SQL

**Gerekçe:**
- TypeScript-first — schema = tip tanımı, ayrı tip üretimi yok
- Serverless uyumlu — Neon HTTP driver ile sorunsuz çalışır
- SQL'e yakın söz dizimi — magic yok, ne ürettiğini biliyorsun
- Hafif bundle — Prisma client'ın aksine runtime'da şişirmiyor
- Migration workflow sade: `generate` → `migrate`

**Ne zaman değişir:** Çok karmaşık ilişkiler / raw SQL ihtiyacı arttıkça Kysely düşünülebilir.

---

## Veritabanı — Neon Postgres (Serverless)

**Tercih edildi:** Neon (`@neondatabase/serverless`)
**Alternatifler:** Supabase, PlanetScale, Railway, Vercel Postgres

**Gerekçe:**
- Serverless-first bağlantı modeli — Vercel'de connection pool sorunu yok
- HTTP üzerinden sorgu → soğuk başlatma cezası minimumd
- `@neondatabase/serverless` paketi Vercel Edge Runtime ile uyumlu
- Ücretsiz tier geliştirme için yeterli
- Branch özelliği → staging DB'si kolayca

**Kritik not:** `pg` veya `pg-pool` KULLANMA. Serverless ortamda her request yeni connection açar, timeout'a yol açar. → `mistakes.md #5`

---

## Animasyon — Framer Motion

**Tercih edildi:** Framer Motion
**Alternatifler:** GSAP, React Spring, CSS transitions, Motion One

**Gerekçe:**
- React-native — `motion.div` ile doğrudan JSX
- Declarative variants sistemi → stagger, orchestration kolaylığı
- `AnimatePresence` → mount/unmount animasyonları
- `useSpring`, `useMotionValue` → fizik tabanlı interaktif animasyon
- Layout animation → `layoutId` ile shared element transitions
- Lisans sorunu yok (GSAP'ın aksine)

**Temel sabit:** `EASE = [0.22, 1, 0.36, 1]` — tüm projelerde bu ease eğrisi.

---

## Auth — next-auth v5

**Tercih edildi:** next-auth v5 (Auth.js)
**Alternatifler:** Clerk, Supabase Auth, Lucia, custom JWT

**Gerekçe:**
- Ücretsiz, self-hosted → kullanıcı verisi üçüncü tarafa gitmiyor
- App Router için sıfırdan yazılmış (v5)
- Provider desteği geniş: GitHub, Google, Discord, email, credentials
- Drizzle adapter mevcut
- Middleware ile route koruma kolaylığı

**Ne zaman değişir:** Hızlı prototip / enterprise SSO → Clerk. Multi-tenant → Clerk Organizations.

---

## Stil — Tailwind CSS v3

**Tercih edildi:** Tailwind CSS 3 (`darkMode: 'class'`)
**Alternatifler:** CSS Modules, styled-components, Stitches, UnoCSS, Tailwind v4

**Gerekçe:**
- Utility-first → tasarım sistemi tokenlara doğrudan map edilir
- Purge ile minimal production bundle
- `darkMode: 'class'` → next-themes ile mükemmel uyum
- JIT → her değer dinamik olarak üretilir
- Geniş IDE desteği (IntelliSense)

**Tailwind v4 notu:** v4, `tailwind.config.ts` yerine `globals.css` içinde `@theme {}` bloğu kullanır. Mimio bu pattern'i kullanıyor. Yeni projeler için henüz v3 tercih ediliyor — ekosistem (özellikle plugin'ler) tam olgunlaşmadı.

---

## Deployment — Vercel

**Tercih edildi:** Vercel
**Alternatifler:** Netlify, Railway, Fly.io, AWS, Render

**Gerekçe:**
- Next.js'in birinci sınıf deploy platformu
- Edge Network → global CDN, düşük latency
- Preview deployments → her PR'a otomatik URL
- Analytics, Speed Insights built-in
- Serverless Functions → API routes otomatik ölçeklenir
- Domain yönetimi ve SSL otomatik

---

## Paket Yöneticisi — npm

**Tercih edildi:** npm (workspaces)
**Alternatifler:** pnpm, yarn, bun

**Gerekçe:**
- Herhangi bir ortamda ek kurulum gerektirmez
- npm workspaces → monorepo yönetimi yeterince iyi
- Bun henüz production'da tam olgun değil

---

## Tema Sistemi — next-themes

**Tercih edildi:** next-themes (`attribute: 'class'`)
**Alternatifler:** Custom ThemeProvider, CSS media query, data-theme attribute

**Gerekçe:**
- Hydration mismatch'i otomatik çözer (`suppressHydrationWarning` ile)
- SSR-safe: server'da tema bilinmeden render, client'ta sync
- System preference desteği
- `resolvedTheme` hook'u ile anlık tema değeri

**Kritik:** `mounted` guard olmadan `resolvedTheme` sunucuda `undefined` döner. → `mistakes.md #1`

---

*Yeni bir teknoloji benimsendiğinde bu dosya güncellenir.*
