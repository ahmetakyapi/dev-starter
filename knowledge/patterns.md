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
export { handlers as GET, handlers as POST } from '@/auth'
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

### next-themes Kurulumu (Doğru)
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

### Mounted Guard (Hydration-Safe)
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
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GitHub OAuth (auth gerekiyorsa)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Vercel Blob (dosya upload gerekiyorsa)
BLOB_READ_WRITE_TOKEN=
```

---

## Framer Motion

### Spotlight Hero
```tsx
'use client'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
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
// <motion.div style={{ background: spotlight }} />
```

### Stagger List
```tsx
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/variants'

<motion.ul
  variants={staggerContainer(0.08)}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
>
  {items.map(item => (
    <motion.li key={item.id} variants={fadeUp}>{item.name}</motion.li>
  ))}
</motion.ul>
```

### AnimatePresence Modal
```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { modalBackdrop, modalPanel } from '@/lib/variants'

<AnimatePresence>
  {open && (
    <motion.div
      variants={modalBackdrop}
      initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalPanel}
        className="glass w-full max-w-lg rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
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

### Edge Health Route
```ts
// app/api/health/route.ts
export const runtime = 'edge'
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

<motion.div
  ref={ref}
  style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
  onMouseMove={onMove}
  onMouseLeave={onLeave}
  className="glass relative overflow-hidden rounded-2xl p-7"
>
  <motion.div className="pointer-events-none absolute inset-0" style={{ background: shine }} />
  {/* kart içeriği */}
</motion.div>
```

Aynı efekti `GlassCard` bileşeniyle de kullanabilirsin: `<GlassCard tilt glow>`.

### Magnetic Buton

Fare yaklaştığında buton çekilir efekti.

```tsx
import { useMagnetic } from '@/hooks/useMagnetic'

const mag = useMagnetic(0.28)

<motion.a
  style={{ x: mag.mx, y: mag.my }}
  onMouseMove={mag.onMove}
  onMouseLeave={mag.onLeave}
  whileTap={{ scale: 0.96 }}
  className="rounded-full bg-indigo-600 px-7 py-3.5 font-semibold text-white"
>
  Get started
</motion.a>
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
      <span key={`${name}-${i}`} className="text-sm font-semibold text-slate-600">
        {name}
      </span>
    ))}
  </div>
</div>
```

`tailwind.config.ts`'e gerekli keyframe:
```ts
marquee: {
  '0%':   { transform: 'translateX(0%)' },
  '100%': { transform: 'translateX(-50%)' },
},
```

### Mouse Spotlight

Hero veya sayfa arka planında fare takip eden radial gradient.

```tsx
import { useSpotlight } from '@/hooks/useSpotlight'

const spotlight = useSpotlight() // varsayılan: 620px, rgba(96,165,250,0.07)

<motion.div className="pointer-events-none fixed inset-0 z-0" style={{ background: spotlight }} />
```

### Top Accent Line (Kart Dekorasyon)

Her glass kartın üst kenarına ince gradient çizgi.

```tsx
<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
```

### Radial Glow Orbs (Hero / CTA Arka Plan)

Atmosferik derinlik için pozisyonlanmış blur'd daireler.

```tsx
<div className="pointer-events-none absolute inset-0 overflow-hidden">
  <div className="absolute -top-1/4 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/8 blur-[120px]" />
  <div className="absolute -left-64 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[100px]" />
  <div className="absolute -right-64 top-1/3 h-[600px] w-[600px] rounded-full bg-violet-500/5 blur-[100px]" />
</div>
```

---

*Yeni desenler eklendikçe bu dosya güncellenir.*
