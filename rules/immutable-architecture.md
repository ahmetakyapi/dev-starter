# Immutable Architecture Rules

**Bu kurallar tüm agent'lar tarafından her zaman uygulanır. İstisna yoktur.**

---

## 1. Server Component First

- Varsayılan: Server Component
- `'use client'` sadece şu durumlarda: state, effect, browser API, event handler
- Client boundary'yi mümkün olduğunca aşağıda tut (yaprak bileşen)
- Tüm sayfa/layout bileşenleri Server Component olmalı (zorunlu olmadıkça)

## 2. Performance-First Mindset

- Image: Her zaman `next/image` + `width`/`height` veya `fill`
- Font: `next/font` ile self-host (Google Fonts CDN kullanma)
- Dynamic import: Ağır bileşenler (Three.js, editor, chart) `dynamic(() => ..., { ssr: false })`
- Bundle: Kullanılmayan import = CRITICAL ihlal
- DB: Loop içinde query = N+1 bug = CRITICAL

## 3. Database Migrations (Drizzle)

- **Dev**: `drizzle-kit push` kabul edilir
- **Production**: Sadece `drizzle-kit generate` + `drizzle-kit migrate`
- Bir kez deploy edilmiş migration ASLA değiştirilmez
- Her migration geri alınabilir olmalı (up + down)
- Schema değişikliği = yeni migration dosyası, mevcut dosyayı düzenleme YASAK

## 4. Serverless-Safe Database

- **Zorunlu**: `@neondatabase/serverless` + `drizzle-orm/neon-http`
- **Yasak**: `pg`, `pg-pool`, `postgres` (connection pooling serverless'ta kırılır)
- Her tablo zorunlu alanlar: `id` (uuid), `createdAt`, `updatedAt`
- FK ilişkilerde `onDelete` davranışı belirtilmeli

## 5. Input Validation at Boundaries

- Tüm kullanıcı girdisi Zod ile validate edilmeli
- Server Action = Zod schema zorunlu
- API route = Zod schema zorunlu
- İç fonksiyonlar arası (güvenilir kod) validation gereksiz
- Error mesajları kullanıcı dostu olmalı

## 6. Component Architecture

- Her bileşen tek sorumluluk (Single Responsibility)
- Bileşen prop'ları TypeScript interface ile tanımlanmalı
- Hardcoded string/renk/boyut YASAK (design token kullan)
- `cn()` utility ile conditional className
- Bileşen dosya adı: `kebab-case.tsx` | Bileşen adı: `PascalCase`

## 7. State Management

- **Tercih sırası**: Server state (DB) → URL state (searchParams) → React state → Zustand
- Redux YASAK
- Global state sadece gerçekten global olan şeyler için (theme, auth, toast)
- Form state: `useActionState` + Server Action

## 8. Auth Pattern

- next-auth v5 (App Router uyumlu)
- Session kontrolü: `auth()` server-side helper
- Middleware'de auth kontrolü: `auth` wrapper
- Protected route: layout seviyesinde redirect
- Token'lar cookie-based (JWT), localStorage'da auth bilgisi YASAK

## 9. Error Handling

- Server Action: `try/catch` + structured error return (`{ error: string }`)
- API route: Tutarlı response formatı (`{ data, error, status }`)
- Client: Error boundary + fallback UI
- Hata mesajları loglansın ama kullanıcıya stack trace gösterilmesin

## 10. No Shortcuts, No Workarounds

- `// TODO` YASAK — ya yap ya story oluştur
- `// @ts-ignore` / `// @ts-expect-error` — sadece geçici, Gate'de CRITICAL uyarı
- `any` type — YASAK (bilinmeyen → `unknown`, sonra narrow et)
- `!important` CSS — YASAK (specificity sorununu kökünden çöz)
- `eslint-disable` — line-level kabul, file-level YASAK

---

## Production Sonrası Ek Kurallar (Maintenance Mode)

Production'a deploy edildikten sonra mimari **dondurulur**:

- Breaking API change YASAK (sadece additive: yeni endpoint, yeni alan)
- DB column silme/rename YASAK (yeni column ekle, eski deprecated işaretle)
- Component interface değişikliği YASAK (yeni prop ekle, mevcut kaldırma)
- Her fix regression test ile birlikte gelmeli
- Breaking change gerekiyorsa → BA Agent'a escalate, major version kararı
