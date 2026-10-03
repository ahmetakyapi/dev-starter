# Kod Desenleri Kütüphanesi

Projelerde tekrar kullanılan, test edilmiş desenler.

---

## Auth

### next-auth v5 (App Router)
```ts
// auth.ts
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub! },
    }),
  },
})

// app/api/auth/[...nextauth]/route.ts
// next-auth v5'te `handlers` zaten { GET, POST } içerir — destructure edilir.
// `handlers as GET` yazmak TÜM objeyi handler sanıp ilk istekte patlar.
// Kaynak: ~/Desktop/Projects/acilis-zili/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

---

## Database (Drizzle + Neon)

### Bağlantı Kurulumu
```ts
// lib/db.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

> **2026-10-03:** Şablonlar bunun **tembel** sürümünü kullanır: `db` bir
> Proxy, bağlantı ilk sorguda kurulur ve `DATABASE_URL` yokken build ve
> veritabanısız sayfalar çalışır. Kod: `guides/07-data-auth-security.md` § 1.
> Migration deploy'da uygulanmaz → yeni özellik kendi tablosunu alır.

### Schema Örneği
```ts
// lib/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull().unique(),
  name:      text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Migration Workflow
```bash
npx drizzle-kit generate  # migration dosyası oluştur
npx drizzle-kit push      # DB'ye uygula (dev)
npx drizzle-kit migrate   # production'da çalıştır
```

---

## API Route Deseni (Next.js App Router)

### Standart Response Helper
```ts
// lib/api.ts
import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
```

### Korumalı Route
```ts
// app/api/protected/route.ts
import { auth } from '@/auth'
import { ok, err } from '@/lib/api'

export async function GET() {
  const session = await auth()
  if (!session) return err('Unauthorized', 401)
  return ok({ user: session.user })
}
```

---

## UI Desenleri

### Tema: `data-theme` + Çerez + Sunucuda Çizim (varsayılan, 2026-10-03)

```tsx
// lib/theme.ts — "use client" DEĞİL
export const THEME_COOKIE = 'theme'
export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]
export const DEFAULT_THEME: Theme = 'dark'
export const isTheme = (v: unknown): v is Theme =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v)
export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value
  return isTheme(v) ? v : DEFAULT_THEME
}

// app/layout.tsx
const theme = await getTheme()
<html lang="tr" data-theme={theme} suppressHydrationWarning>
```

İstemci `document.documentElement.dataset.theme`ı anında değiştirir, çerezi
server action ile arkadan yazar. Script yok, `mounted` guard yok, FOUC yok.
`themeColor` `generateViewport` içinde çerezden. Tam desen, view transition
ve gerekçe: `guides/03-theming.md`. Snippet: `snippets/theme-toggle.tsx`.

### next-themes Kurulumu (eski projeler — ahmetakyapi.com)
```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Mounted Guard (Hydration-Safe — yalnız next-themes kullanan projeler)
```tsx
'use client'
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
const { resolvedTheme } = useTheme()
const isDark = mounted ? resolvedTheme === 'dark' : true
```

### Three.js Dynamic Import
```tsx
import dynamic from 'next/dynamic'

const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
  ssr: false,
  loading: () => <div className="h-full bg-transparent" />,
})
```

---

## Environment Variables Şablonu

```bash
# .env.example — değerler olmadan commit'lenir
DATABASE_URL=
AUTH_SECRET=              # next-auth v5 (NEXTAUTH_SECRET değil) — `npx auth secret`
CRON_SECRET=              # checkBearer ile korunan uçlar; üretimde yoksa uç 503
NEXT_PUBLIC_SITE_URL=     # boşsa VERCEL_PROJECT_PRODUCTION_URL → localhost

# GitHub OAuth (auth gerekiyorsa)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Vercel Blob (dosya upload gerekiyorsa)
BLOB_READ_WRITE_TOKEN=
```

---

## Motion (`motion/react`)

> **2026-10-03:** Paket `motion`, import `motion/react`. Kökte
> `LazyMotion features={domAnimation} strict` + `MotionConfig reducedMotion="user"`
> olduğu için bileşenlerde `motion.*` değil `m.*` kullanılır (`strict` altında
> `motion.div` hata verir). Sabitler `lib/motion.ts`. Kurallar ve desen
> kataloğu: `guides/04-motion.md`.

### Spotlight Hero
```tsx
'use client'
import { useMotionTemplate, useMotionValue } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect } from 'react'

// Mouse-takip radial gradient — hooks/useSpotlight.ts ile kullan
const mx = useMotionValue(-600)
const my = useMotionValue(-600)
useEffect(() => {
  const h = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY) }
  window.addEventListener('mousemove', h)
  return () => window.removeEventListener('mousemove', h)
}, [mx, my])
const spotlight = useMotionTemplate`radial-gradient(620px circle at ${mx}px ${my}px, rgba(96,165,250,0.07), transparent 78%)`
// <m.div style={{ background: spotlight }} />
```

### Stagger List
```tsx
import * as m from 'motion/react-m'
import { fadeUp, staggerContainer } from '@/lib/variants'

<m.ul
  variants={staggerContainer(0.08)}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
>
  {items.map(item => (
    <m.li key={item.id} variants={fadeUp}>{item.name}</m.li>
  ))}
</m.ul>
```

### AnimatePresence Modal
```tsx
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { modalBackdrop, modalPanel } from '@/lib/variants'

<AnimatePresence>
  {open && (
    <m.div
      variants={modalBackdrop}
      initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim"
      onClick={onClose}
    >
      <m.div
        variants={modalPanel}
        className="surface w-full max-w-lg rounded-xl p-6 shadow-overlay"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </m.div>
    </m.div>
  )}
</AnimatePresence>
```

---

## SEO (Next.js App Router)

### Metadata (layout.tsx)
```tsx
export const metadata: Metadata = {
  title: { template: '%s | PROJECT_NAME', default: 'PROJECT_NAME' },
  description: 'PROJECT_DESCRIPTION',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    title: 'PROJECT_NAME',
    description: 'PROJECT_DESCRIPTION',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'PROJECT_NAME', description: 'PROJECT_DESCRIPTION' },
}
```

### Sitemap
```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com'
  return [{ url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
```

### Robots
```ts
// app/robots.ts
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com'
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${base}/sitemap.xml` }
}
```

### Health Route
```ts
// app/api/health/route.ts — Node çalışma zamanı (varsayılan). Edge'e almak
// için bir sebep yok; veritabanına dokunan bir sağlık ucu edge'de çalışmaz.
export const dynamic = 'force-dynamic'
export function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

---

## Performance

### Image Optimization
```tsx
// next.config.mjs
const config = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
}
```

### Font Preload
```tsx
// Tailwind/CSS ile değil, Next.js font sistemi ile yükle
import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
```

---

---

## UI Tasarım Desenleri

### Bento Feature Grid

Asimetrik feature grid — büyük kart `col-span-2`, küçükler tek hücre.

```tsx
// sm: 2 kolon — büyük tam genişlik
// lg: 3 kolon — büyük 2 hücre, küçükler 1 hücre
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <FeatureCard feature={large} className="sm:col-span-2 lg:col-span-2" />
  {small.map((f) => <FeatureCard key={f.id} feature={f} />)}
</div>
```

### Tilt + Shine Kart Efekti

Fare konumuna göre 3D eğim + holografik parlaklık.

```tsx
import { useCardTilt } from '@/hooks/useCardTilt'

const { ref, rx, ry, shine, onMove, onLeave } = useCardTilt(6)

<m.div
  ref={ref}
  style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
  onMouseMove={onMove}
  onMouseLeave={onLeave}
  className="surface relative overflow-hidden rounded-2xl p-7"
>
  <m.div className="pointer-events-none absolute inset-0" style={{ background: shine }} />
  {/* kart içeriği */}
</m.div>
```

Aynı efekt `@ahmetakyapi/ui` 3.0.0'da `<Surface tilt glow>` (eski ad `GlassCard` takma ad olarak duruyor).
Eğim `prefers-reduced-motion` altında kapanır, parlaklık kalır; yalnızca `pointer: fine`.

### Magnetic Buton

Fare yaklaştığında buton çekilir efekti. **Yalnızca `(hover: hover) and
(pointer: fine)` altında** etkinleştir; dokunmatikte konum yapışıp kalır.

```tsx
import { useMagnetic } from '@/hooks/useMagnetic'

const mag = useMagnetic(0.28)

<m.a
  style={{ x: mag.mx, y: mag.my }}
  onMouseMove={mag.onMove}
  onMouseLeave={mag.onLeave}
  whileTap={{ scale: 0.96 }}
  className="rounded-full bg-primary px-7 py-3.5 font-semibold text-on-primary"
>
  Hemen Başla
</m.a>
```

### Marquee Logo Strip (CSS only, Server Component)

Sonsuz döngü için track ikiye katlanır, mask-image ile kenarlar solar.

```tsx
// Server Component — 'use client' gerekmez
const track = [...LOGOS, ...LOGOS]

<div
  className="relative overflow-hidden"
  style={{
    maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
  }}
>
  <div className="flex animate-marquee gap-14 whitespace-nowrap">
    {track.map((name, i) => (
      <span key={`${name}-${i}`} className="text-small font-semibold text-muted">
        {name}
      </span>
    ))}
  </div>
</div>
```

Tailwind v4'te keyframe `globals.css`teki `@theme` içinde (config dosyası yok):
```css
@theme {
  --animate-marquee: marquee 40s linear infinite;
  @keyframes marquee {
    to { transform: translateX(-50%); }
  }
}
.marquee:hover .animate-marquee,
.marquee:focus-within .animate-marquee { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .animate-marquee { animation: none; } }
```
Hover ve odakta durur, reduced-motion'da statik. İkinci kopya `aria-hidden`.
Uygulama içinde (okunması gereken veri) marquee kullanma.

### Mouse Spotlight

Hero veya sayfa arka planında fare takip eden radial gradient.

```tsx
import { useSpotlight } from '@/hooks/useSpotlight'

const spotlight = useSpotlight() // varsayılan: 620px, rgba(96,165,250,0.07)

<m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: spotlight }} />
```

### Top Accent Line (Kart Dekorasyon)

Kartın üst kenarına ince degrade çizgi (dekoratif hairline; degrade kuralı kapsamı dışında).

```tsx
<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
```

### Radial Glow Orbs (Hero / CTA Arka Plan)

Atmosferik derinlik için konumlandırılmış bulanık daireler. Renkler token'dan
(`--accent-cyan` / `--accent-emerald` projenin `@theme`inde tanımlı olmalı).
Sabit zemin için `.app-bg` ya da Mimio'nun `body::before` katmanı daha ucuz
(`guides/03-theming.md` § 6).

```tsx
<div className="pointer-events-none absolute inset-0 overflow-hidden">
  <div className="absolute -top-1/4 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
  <div className="absolute -left-64 top-1/4 h-[600px] w-[600px] rounded-full bg-accent-cyan/5 blur-[100px]" />
  <div className="absolute -right-64 top-1/3 h-[600px] w-[600px] rounded-full bg-accent-emerald/5 blur-[100px]" />
</div>
```

---

## Error Handling

### API Route Error Handler

```ts
// lib/api.ts — genisletilmis versiyon
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return err(error.errors.map((e) => e.message).join(', '), 422)
  }
  if (error instanceof Error) {
    console.error('[API Error]', error.message)
    return err('Internal server error', 500)
  }
  return err('Unknown error', 500)
}

// Kullanim:
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    // ... islem
    return ok({ success: true }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## Form Submission (React 19)

### useActionState + Server Action

```ts
// app/actions/contact.ts
'use server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmali'),
  email: z.string().email('Gecerli bir e-posta girin'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmali'),
})

type FormState = { success: boolean; message: string; errors?: Record<string, string[]> }

export async function submitContact(prev: FormState, formData: FormData): Promise<FormState> {
  const result = schema.safeParse(Object.fromEntries(formData))
  if (!result.success) {
    return { success: false, message: 'Validasyon hatasi', errors: result.error.flatten().fieldErrors }
  }
  // ... kaydet
  return { success: true, message: 'Mesajiniz alindi!' }
}
```

```tsx
// components/ContactForm.tsx
'use client'
import { useActionState } from 'react'
import { submitContact } from '@/app/actions/contact'

export function ContactForm() {
  const [state, action, isPending] = useActionState(submitContact, { success: false, message: '' })

  return (
    <form action={action}>
      <input name="name" required disabled={isPending} />
      {state.errors?.name && <p className="text-red-400 text-xs">{state.errors.name[0]}</p>}
      {/* ... diger alanlar */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Gonderiliyor...' : 'Gonder'}
      </button>
      {state.message && <p className={state.success ? 'text-emerald-400' : 'text-red-400'}>{state.message}</p>}
    </form>
  )
}
```

---

## Proxy Auth Pattern (Next 16)

### `proxy.ts` — ucuz ön eleme (varsayılan, 2026-10-03)

```ts
// proxy.ts — Next 16: dosya ve fonksiyon adı `proxy`, yalnız Node runtime
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/panel', '/hesap'] as const
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'] as const

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next()
  if (SESSION_COOKIES.some((n) => req.cookies.has(n))) return NextResponse.next()
  return NextResponse.redirect(new URL(`/giris?next=${encodeURIComponent(pathname)}`, req.url))
}

export const config = { matcher: ['/((?!_next|api/auth|.*\\..*).*)'] }
```

Yalnızca çerezin VARLIĞINA bakar: JWT çözmez, veritabanına gitmez. Gerçek
yetki sayfada ve her server action'da `auth()` ile yeniden kontrol edilir.
Neredeyse her şeyi oturum isteyen üründe tersini yap: varsayılan korumalı +
açık rota izin listesi (ElevenForge). Ayrıntı: `guides/06-nextjs-16.md` § 1.

### next-auth v5 Middleware (Next 15 ve öncesi — eski projeler)

```ts
// middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isProtected = req.nextUrl.pathname.startsWith('/dashboard')
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
```

---

## Pagination

### Cursor-Based Pagination (Drizzle)

```ts
// lib/queries.ts
import { db } from '@/lib/db'
import { posts } from '@/lib/schema'
import { lt, desc } from 'drizzle-orm'

type PaginationResult<T> = {
  items: T[]
  nextCursor: string | null
}

// KURAL: cursor, SIRALAMA sütununun değeridir. Farklı bir sütun (örn. rastgele
// UUID `id`) kullanılırsa sorgu SESSİZCE bozulur — ilk sayfa doğru görünür,
// sonraki sayfalar kayar veya kayıt atlar. Sıralama azalan olduğu için
// karşılaştırma da `lt` olmalı; `gt` ters yöne sayfalar.
export async function getPosts(cursor?: string, limit = 20): Promise<PaginationResult<typeof posts.$inferSelect>> {
  const items = await db
    .select()
    .from(posts)
    .where(cursor ? lt(posts.createdAt, new Date(cursor)) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1)

  const hasMore = items.length > limit
  if (hasMore) items.pop()

  return {
    items,
    nextCursor: hasMore ? items.at(-1)!.createdAt.toISOString() : null,
  }
}
```

> Aynı `createdAt` değerine sahip kayıtlar varsa bileşik cursor gerekir —
> `(createdAt, id)` çifti ile sırala ve karşılaştır; aksi halde eşit
> timestamp'lerde kayıt tekrarlanabilir veya atlanabilir.

---

## File Upload

### Vercel Blob Upload

```ts
// app/api/upload/route.ts
import { put } from '@vercel/blob'
import { auth } from '@/auth'
import { err, ok } from '@/lib/api'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return err('Unauthorized', 401)

  const form = await req.formData()
  const file = form.get('file') as File
  if (!file) return err('Dosya gerekli', 400)

  // Boyut limiti (5MB)
  if (file.size > 5 * 1024 * 1024) return err('Dosya 5MB\'dan buyuk olamaz', 400)

  // Tip kontrolu
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) return err('Gecersiz dosya tipi', 400)

  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  })

  return ok({ url: blob.url }, 201)
}
```

---

## Image Optimization

### next/image Best Practices

```tsx
// Responsive hero gorsel
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero gorseli"
  width={1200}
  height={630}
  priority           // LCP icin — above-the-fold gorseller
  placeholder="blur" // Local import ile kullanildiginda
  className="rounded-2xl object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Avatar (sabit boyut)
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>
```

```ts
// next.config.mjs — remote pattern
const config = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
}
```

---

## Landing Page: Animasyonlu Oyun/Ürün Demo

### Auto-advancing Step Tabs + Visual Preview
Ürünün nasıl çalıştığını gösteren interaktif section. Sol tarafta accordion-style adımlar, sağ tarafta animasyonlu görsel.

```tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, useInView } from 'motion/react'
import * as m from 'motion/react-m'

const STEPS = [
  { id: 'step1', title: 'Adım 1', desc: 'Açıklama...' },
  { id: 'step2', title: 'Adım 2', desc: 'Açıklama...' },
]

function Demo() {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '-20%' })

  useEffect(() => {
    if (!inView) return
    const t = setInterval(() => setActive(s => (s + 1) % STEPS.length), 4000)
    return () => clearInterval(t)
  }, [inView])

  return (
    <div ref={ref} className="grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-2">
        {STEPS.map((step, i) => (
          <button key={step.id} onClick={() => setActive(i)}
            className={cn('w-full text-left rounded-2xl p-5', active === i && 'surface')}
          >
            <h3>{step.title}</h3>
            <AnimatePresence mode="wait">
              {active === i && (
                <m.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  {step.desc}
                </m.p>
              )}
            </AnimatePresence>
            {active === i && (
              <m.div className="h-0.5 bg-line mt-3 overflow-hidden">
                <m.div className="h-full origin-left bg-primary"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 4, ease: 'linear' }} key={`p-${active}`}
                />
              </m.div>
            )}
          </button>
        ))}
      </div>
      <div className="surface rounded-3xl p-1">
        <div className="rounded-[20px] bg-surface-sunken aspect-[4/3] relative">
          <AnimatePresence mode="wait">
            {active === 0 && <StepVisual1 key="s1" />}
            {active === 1 && <StepVisual2 key="s2" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
```

**Kurallar:**
- `useInView` ile sadece görünürken auto-advance yap
- Progress bar ile aktif adım göster
- `AnimatePresence mode="wait"` ile geçişler
- İlerleme çubuğu `scaleX` ile (width animasyonu her karede yerleşim hesaplatır, `mistakes.md` #44);
  açılan açıklama yükseklik değil opaklıkla. Yükseklik gerekiyorsa `grid-template-rows: 0fr → 1fr`
- Otomatik ilerleme `prefers-reduced-motion` altında durur
- SVG çizim animasyonu: `strokeDasharray` + `strokeDashoffset`

### SVG Path Drawing Animation
```tsx
const pathRef = useRef<SVGPathElement>(null)
useEffect(() => {
  const el = pathRef.current
  if (!el) return
  const len = el.getTotalLength()
  el.style.strokeDasharray = `${len}`
  el.style.strokeDashoffset = `${len}`
  const anim = el.animate(
    [{ strokeDashoffset: `${len}` }, { strokeDashoffset: '0' }],
    { duration: 2200, fill: 'forwards', easing: 'ease-out', delay: 300 }
  )
  return () => anim.cancel()
}, [])
```

---

## Projelerden Toplanan Desenler (2026-10-03)

Canlı projelerde kendini kanıtlamış, kısa desenler. Uzun gerekçe ilgili
rehberde; burada yalnızca kopyalanacak çekirdek.

### Türkçe ve Okunaklılık İçin CSS Tabanı (Açılış Zili)
```css
@layer base {
  html, body { overflow-x: clip; }                     /* hidden değil: sticky bozulmaz */
  html { scroll-padding-block: 76px 24px; }            /* yapışkan başlık odağı örtmesin (WCAG 2.4.11) */
  h1, h2, h3 { text-wrap: balance; }
  p, li { text-wrap: pretty; }                         /* yetim kelime yok */
  :focus-visible { outline: 2px solid var(--line-focus); outline-offset: 2px; }
  .overflow-hidden :focus-visible { outline-offset: -2px; } /* kırpan kapta halka içeri */
}
@media (pointer: coarse) {
  input, select, textarea { font-size: 16px; }         /* altında iOS yakınlaştırır */
}
```

### `cn()` + Özel Punto Kaydı
`extendTailwindMerge` ile `text-micro`…`text-hero` font-size grubuna kayıtlı;
yoksa `cn("text-small", "text-strong")` puntoyu siler. Kod: `guides/02-design-tokens.md` § 3.

### Görünmez 44 px Dokunma Hedefi
`.tap-44::after` ile; kod `guides/05-components.md` § 5.

### JS'siz Yuvarlanan Sayı (RollingFigure)
Sunucuda çizilir, rakam başına 0–9 şeridi, CSS kaydırır; genişlik son rakamın
görünmez kopyasından. Snippet: `snippets/rolling-number.tsx`.

### Gecikmeli Gezinme Göstergesi (RouteProgress)
Tıklamadan 420 ms sonra görünür; daha hızlı gelen sayfada hiç görünmez.
Sığ adres güncelleyen denetimler gezinme sürerken kendini kapatır
(`useRouteNavigating`), çünkü `history.replaceState` bekleyen gezinmeyi iptal eder.

### Ölçülen Sekme Hapı (ahmetakyapi.com)
`layoutId` yerine: aktif sekmenin `offsetLeft/offsetWidth`ini `--pill-x` /
`--pill-w` değişkenlerine yaz, hap `transform: translateX(var(--pill-x))` +
`width: var(--pill-w)` ile CSS geçişiyle kayar. `domMax` indirmez.
Snippet: `snippets/tab-underline.tsx`.

### İmleç Parlaması `--mx/--my` (ahmetakyapi.com)
```tsx
onPointerMove={(e) => {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}}
```
```css
.glow { background: radial-gradient(320px circle at var(--mx) var(--my), var(--primary-wash), transparent 70%); }
```
React state yok, her `mousemove`da yeniden çizim yok.

### Site Adresi Geri Düşme Sırası (simayahi)
```ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
```
Önizleme dağıtımında da canonical ve OG üretim alanına işaret eder.

### JSON-LD Kaçışı (simayahi)
`JSON.stringify(data).replace(/</g, '\\u003c')` — `</script>` içeren veri bloğu kapatamaz.

### Izgara Hücresi `minmax(0, 1fr)` (simayahi)
`grid-cols-[repeat(3,minmax(0,1fr))]`; düz `1fr` uzun kelimede kolonu genişletip yatay taşma yaratır.

### i18n Sözlüğü Tipten Türer (Açılış Zili)
```ts
export const tr = { nav: { home: 'Ana Sayfa' } } as const
export const en: typeof tr = { nav: { home: 'Home' } }   // tr'ye anahtar eklenince en derlenmez
```
Her özellik kendi ad alanında (`about`, `pairs`…); paralel işler aynı anahtarı ellemez.

### Admin Formu Yalnız Değişeni Gönderir (simayahi)
Ayar formu tüm nesneyi değil `dirty` alanları gönderir; iki sekmede açık
panelin biri ötekinin değişikliğini ezmez.

### Önbellekte Hata Dışarıda
`unstable_cache` içinde `try/catch` yok; sarmalayan fonksiyonda. Yoksa düşen
veritabanının boş listesi saklanır. `guides/06-nextjs-16.md` § 7.

### Smoke Betiği
Rota × 390/1280 × dil; HTTP kodu (soft 404), konsol hatası, yatay taşma.
`guides/08-quality-and-ship.md` § 2.

---

## Agentic UI (AG-UI / CopilotKit)

> Kaynak: Manfred Steyer, *Agentic UI with Angular* (v1.0.0, Ağustos 2026).
> Desenler Angular'dan React'e çevrildi.
>
> **Durum (2026-08-27)**: API haritası ve `snippets/agent-*.tsx` dosyaları
> `@copilotkit/react-core@1.69.2` tip tanımlarına karşı `tsc --noEmit` ile
> **doğrulandı**. Uçtan uca bir uygulamada henüz çalıştırılmadı — derlendiği
> kesin, davranışı POC'de ölçülecek. Desenlerin değeri zaten kod değil,
> **karar**: hangi işi model yapar, hangisini kod.

### Atomik Agent Tool'ları — "hepsini değiştir" yerine granüler operasyonlar

Bir planı/dokümanı/konfigürasyonu agent'a düzenletirken tek bir `setPlan`
tool'u yeterli görünür. Kitabın bulgusu tersi: **yedi küçük tool bir büyükten
hem daha doğru hem daha ucuz.**

```ts
// ✗ Tek tool: "işte yeni plan"
// Model "2 ve 4. adımı yer değiştir" için TÜM planı yeniden üretmek zorunda.
// → adım kaybedebilir, yeniden ifade edebilir, detay uydurabilir
// → değişmeyen içeriği tekrar üretmenin token bedeli
setPlan({ steps: [ /* ...tamamı... */ ] })

// ✓ Granüler operasyonlar, KARARLI id'lerle
addPlanStep({ step })          removePlanStep({ id })
updatePlanStep({ id, patch })  movePlanStep({ id, toIndex })
swapPlanSteps({ idA, idB })    reversePlan({})
getPlan({})                    clearPlan({})
```

**Kritik detay**: adımlar store'un eklerken atadığı **kararlı id'lerle**
adreslenir — modelin her değişiklikten sonra yeniden hesaplaması gereken
pozisyon indeksleriyle değil. `swapPlanSteps(idA, idB)` zor yanılır; yapısal
işi store deterministik yapar.

**Bölümleme de guardrail'dir**: uçuş ve otel için ayrı operasyonlar varsa, bir
otel isteği yanlışlıkla uçuş değiştiremez — o iş için tool zaten yok.

---

### DSL Sınırı — model niyeti çevirir, kod yapıyı derler

Kitabın tek somut ölçümü ve en aktarılabilir kararı. Model tam UI/yapı çıktısı
üretiyordu: **39 sn, 46.000 token**. Model sadece kompakt, uygulamaya özel bir
tarif dili üretmeye indirgendi: **4 sn, ~1.500 token (30× azalma)**. Yapı
cache'lenince: **0,1 sn, sıfır token (300× hızlanma)** — model hiç çağrılmıyor.

```ts
// Modelin ÜRETTİĞİ tek şey bu — kullanıcının serbest metnini buna çevirir
type DashboardDSL = {
  tiles: Array<
    | { type: 'boardingPasses'; count: number }
    | { type: 'bookedFlightsList'; showCheckInButton: boolean }
    | { type: 'flightSearch'; defaultFrom?: string; defaultTo?: string }
    | { type: 'hotels' } | { type: 'rentalCars' } | { type: 'weatherList' }
  >
}

// Kalan her şey MODELSİZ, deterministik kod:
const layout = compileToUi(dsl)        // 1) yapıyı derle
const data   = await loadTiles(dsl)    // 2) veriyi çek (tool call reasoning'i yok)
```

**İki kazanç aynı kararın iki yüzü:**
- *Performans* — küçük çıktı hızlı üretilir, az token yakar, zayıf/ucuz model bile hatasız üretir
- *Guardrail* — model DSL'in öngörmediği hiçbir şeyi ifade edemez: beklenmedik layout yok, uydurulmuş bileşen yok, enjekte edilmiş içerik yok

**Bedeli**: dinamizm DSL'in öngördüğü kadar. "En fazla üç otel göster" için
DSL'de açık seçenek olmalı. İş uygulamalarında bu iyi bir takas — orada
öngörülebilirlik, sınırsız sunum özgürlüğünden değerlidir.

**Cache anahtarı**: kullanıcı tarifinin hash'i, ya da pratikte kullanıcının
kaydettiği dashboard kaydının id'si. Yapı ve veri ayrı mesajlar olduğu için
büyük olan yapı cache'lenir, küçük olan veri her çağrıda yenilenir.

---

### Deterministik Doğrulama Katmanı — model seçer, kod doğrular

Model çıktısına asla doğrudan güvenme; **seçimi adaylar kümesine karşı
doğrula**. Eşleşmiyorsa fallback. Halüsinasyon yapısal olarak elenir.

```ts
// Model uçuşu SEÇER, ama seçebileceği kümeyi kod belirler
function createPlan(raw: ModelOutput, candidates: Leg[]): Plan {
  return {
    ...raw,
    flights: raw.flights.map((chosen, i) => {
      const pool = candidates[i].options
      // Model olmayan bir uçuş numarası uydurduysa sessizce düzelt
      return pool.find((f) => f.id === chosen.id) ?? pool[0]
    }),
  }
}
```

Aynı duruş **istemcide de** geçerli — bu desenin en kolay kaçırılan yanı:

```ts
// Store, otelleri "model doğru sırada yazsın" diye ummaz.
// Her mutasyonda rota boyunca deterministik olarak dizer.
setPlan(plan) {
  this.state = { ...plan, hotels: orderHotelsByRoute(plan.hotels, plan.flights) }
}
```

Kullanıcının gördüğü sıra **kod**, model çıktısı değil.

---

### Action Card + Undo — onay yorgunluğuna panzehir

Her aksiyondan önce onay soran uygulama, kullanıcıyı tıklayıp geçmeye eğitir —
ve deseni var eden kontrolü yok eder. **Geri alınabilir aksiyonlar için:
hemen yap, kart olarak göster, Undo sun.**

```tsx
// Aksiyon SUNUCUDA çalıştı. Kart saf sunum + tek bir geri alma yolu.
function BookFlightCard({ toolCall }: { toolCall: ToolCall<BookArgs> }) {
  const [undone, setUndone] = useState(false)
  const result = parseToolResult(toolCall)   // ← string'dir, bkz. mistakes #58

  return (
    <article>
      <p>Durum: {undone ? 'Geri alındı' : result?.ok ? 'Rezerve edildi' : 'Başarısız'}</p>
      {result?.ok && !undone && (
        // Undo MODELE UĞRAMAZ — doğrudan, deterministik, token'sız
        <button onClick={async () => { await cancelBooking(result.id); setUndone(true) }}>
          Geri Al
        </button>
      )}
    </article>
  )
}
```

**Uygulama seviyesinde değil, aksiyon seviyesinde karar ver:**

| Aksiyon | Desen |
|---------|-------|
| Geri alınabilir (rezervasyon, taslak kaydetme, filtre) | Action Card + Undo |
| Geri alınamaz (ödeme, e-posta gönderimi, kalıcı silme) | Önden onay (interrupt) |
| Kırmızı çizgi (hesap silme) | **Tool'u agent'a hiç verme** — sadece ilgili sayfaya yönlendiren bir tool ver |

Son satır en sağlamı: `deleteAccountTool`'a sahip olmayan bir agent, konuşmanın
en yaratıcı seyrinde bile hesap silmeye kandırılamaz. Talimat rica, eksiklik
garantidir.

---

### Protokol = Test Sınırı

"Agentic UI test edilemez" itirazı modeli sistemle karıştırır. Model
non-deterministik; **onu çağıran, cevabını çözen, tool'unu çalıştıran ve
state'ini render eden kod değil.** Belirlenmiş bir protokol doğal bir test
sınırıdır: olaylar belgelenmişse simüle edilebilir.

Üç dikiş noktası — üçü de sunucusuz, modelsiz, API anahtarsız:

```ts
// 1) Runtime'ın arkasında — agent'ı mock'la, hazır olay dizisi döndür
class MockAgent extends HttpAgent {
  run() { return of(...cannedEvents) }   // store ve state test edilir
}

// 2) Tel üzerinde — gerçek agent kalır, sadece fetch değişir.
//    Bu bir CONTRACT TEST: giden payload'ın formatını da sabitler.
const agent = new AppHttpAgent({ url, fetch: mockFetch })
expect(recordedBody.messages.find(m => m.role === 'user')?.content).toBe('...')

// 3) Protokolün yanında — frontend tool'lar sıradan fonksiyon
expect(await findFlightsTool.handler({ from: 'Graz', to: 'Wien' })).toEqual({ ok: true })
```

**Tool testlerinin gözden kaçan değeri**: agent yanlış davrandığında refleks
prompt'u kurcalamaktır. Oysa sıklıkla tool, açıklamasının vaat ettiğinden
farklı bir şey döndürür ve model doğru veriden yanlış sonuç çıkarır. Tool
davranışını **açıklamasına karşı** sabitleyen bir test hata ayıklamayı ikili
hale getirir: *tool'lar doğruysa sorun prompt'tadır.*

Çift iddia kur — hem dönüş değeri (modelin gördüğü) hem yan etki (kullanıcının
gördüğü). İkisi de doğru olmalı.

---

### Doğrulanmış API Haritası — Angular → React

Kitap Angular kullanıyor; CopilotKit'in **React v2** girişi (`@copilotkit/react-core/v2`)
aynı modeli birebir sunar. Aşağıdaki tablo `1.69.2` sürümünün tip tanımlarından
çıkarıldı ve `tsc --noEmit` ile doğrulandı (2026-08-27).

| Kitapta (Angular) | React v2 karşılığı |
|---|---|
| `provideCopilotKit({...})` | `<CopilotKitProvider>` |
| `initAgentStore` + `injectAgentStore` | `useAgent({ agentId })` → `{ agent, isReady }` |
| `createFrontendTool` + `registerFrontendTool` | `useFrontendTool(tool, deps)` |
| widget (tool + `component`) | `useFrontendTool({ ..., render })` |
| Action Card (`toolCallRenderer`) | `useRenderTool({ name, parameters, render })` |
| `defaultToolRendering: true` | `useDefaultRenderTool()` |
| `injectInterrupt` / HITL | `useHumanInTheLoop({ ..., render })` veya `useInterrupt` |
| `connectAgentContext` | `useAgentContext({ description, value })` |
| A2UI / MCP Apps activity renderer | `useRenderActivityMessage` (A2UI yerleşik) |
| headless mod | `@copilotkit/react-core/v2/headless` |
| `AppHttpAgent` (self-managed) | `selfManagedAgents={{ id: new HttpAgent({ url }) }}` |

**`FrontendTool` gerçek şekli** — `parameters` Standard Schema V1 kabul eder,
yani Zod v4 doğrudan çalışır:

```ts
type FrontendTool<T> = {
  name: string
  description?: string
  parameters?: StandardSchemaV1<any, T>   // Zod / Valibot / ArkType
  handler?: (args: T, ctx: FrontendToolHandlerContext) => Promise<unknown>
  followUp?: boolean
  agentId?: string      // tool'u tek bir agent'a kısıtla → least privilege
  available?: boolean   // kaydı silmeden modelden gizle
}
```

**Kitapta olmayan, React tarafında olan iki şey:**

- `openGenerativeUI.sandboxFunctions` — LLM'in ürettiği UI sandbox'lı iframe'de
  çalışır ve yalnızca elle verdiğin fonksiyonlara erişir. `rules/agentic-ui.md`
  kural 6'nın (üretilen kod sandbox'ta çalışır) hazır implementasyonu.
- `available` bayrağı — tool'u kaydı silmeden modelden gizler. Rol/duruma göre
  yüzey daraltmanın en ucuz yolu.

**İki tuzak** — ikisi de `tsc` ile bulundu, tahminle değil:
`useRenderTool` string literal verir, `useFrontendTool` enum → `mistakes.md #70`.
`@ag-ui/client` sürümü CopilotKit'inkine sabitlenmeli → `mistakes.md #71`.

**Çalışan referans**: `snippets/agent-tool.tsx`, `snippets/action-card.tsx`,
`snippets/agent-approval.tsx` — üçü de derlendi. İskelet:
`templates/agentic-chat/`.



---

*Yeni desenler eklendikçe bu dosya güncellenir.*

*Son güncelleme: 2026-10-03*
