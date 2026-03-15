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

*Yeni desenler eklendikçe bu dosya güncellenir.*
