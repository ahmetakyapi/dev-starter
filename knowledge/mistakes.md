# Öğrenilen Hatalar — Tekrarlama

Her proje sonrası tespit edilen hatalar buraya eklenir.
Yeni bir projeye başlamadan önce bu dosya okunmalı.

---

## Next.js

### 1. next-themes Hydration Mismatch
**Hata**: `Warning: Text content did not match. Server: "dark" Client: "light"`
**Sebep**: `<html>` tag'ine `suppressHydrationWarning` eklenmemiş
**Çözüm**:
```tsx
// app/layout.tsx
<html lang="tr" suppressHydrationWarning>
```
**Ekstra**: Tema bağımlı UI için `mounted` state bekle:
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null  // veya skeleton
```

### 2. Three.js / SSR Çakışması
**Hata**: `ReferenceError: window is not defined` — server-side render sırasında
**Sebep**: Three.js/R3F bileşenleri SSR ile uyumsuz
**Çözüm**:
```tsx
const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), { ssr: false })
```
**Kural**: Three.js, canvas, WebGL kullanan tüm bileşenler `dynamic` ile import edilmeli.

### 3. App Router'da `params` await Edilmemesi
**Hata**: Next.js 15'te `params` bir Promise oldu
**Çözüm**:
```tsx
// Next.js 15+
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}
```

### 4. `useSearchParams` Suspense Boundary
**Hata**: `useSearchParams() should be wrapped in a suspense boundary`
**Çözüm**: `useSearchParams` kullanan bileşeni `<Suspense>` ile sar

---

## PostgreSQL / Database

### 5. Serverless'ta pg Pool Sorunu
**Hata**: Vercel'de her request yeni connection açıyor, timeout'lar oluşuyor
**Sebep**: `pg` kütüphanesi serverless için optimize edilmemiş
**Çözüm**: Neon Postgres için `@neondatabase/serverless` kullan:
```ts
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)
```

### 6. Migration Sonrası Tip Uyumsuzluğu
**Hata**: DB'ye kolon eklendi ama TypeScript tipler güncellenmedi
**Çözüm**: Her migration sonrası Drizzle/Prisma ile tip yeniden üret:
```bash
npx drizzle-kit generate && npx drizzle-kit push
# veya
npx prisma generate
```

### 7. `ON DELETE CASCADE` Unutulması
**Hata**: Parent silince orphan kayıtlar kalıyor
**Kural**: Her foreign key tanımında `ON DELETE` davranışını açıkça belirt

---

## Framer Motion

### 8. `layoutId` Key Çakışmaları
**Hata**: Aynı `layoutId`'ye sahip birden fazla element, animasyon bozulması
**Sebep**: Liste öğelerinde unique olmayan `layoutId`
**Çözüm**: `layoutId={`card-${item.id}`}` şeklinde unique yap

### 9. `AnimatePresence` mode="wait" Unutulması
**Hata**: Çıkış animasyonu beklenmiyor, yeni eleman üstüne bindirilmiyor
**Çözüm**:
```tsx
<AnimatePresence mode="wait">
  <motion.div key={currentPage} ... />
</AnimatePresence>
```

### 10. Server Component'te Framer Motion
**Hata**: `You're importing a component that needs useState...`
**Çözüm**: Framer Motion kullanan tüm bileşenler `'use client'` direktifi içermeli

---

## TypeScript

### 11. `as const` Olmadan Tuple
**Hata**: `[0.22, 1, 0.36, 1]` tipi `number[]` olarak çıkarılıyor
**Çözüm**:
```ts
const EASE = [0.22, 1, 0.36, 1] as const  // readonly [0.22, 1, 0.36, 1]
```

---

## Vercel / Deployment

### 12. Environment Variable Eksikliği
**Hata**: Build geçiyor, production'da runtime error
**Kural**: Her yeni env var için:
1. `.env.local` — local
2. Vercel dashboard → Settings → Environment Variables
3. `.env.example` dosyasına ekle (değer olmadan)

### 13. `NEXT_PUBLIC_` Prefix Unutulması
**Hata**: Client-side'da env var `undefined`
**Kural**: Client'ta erişilecek env varlar `NEXT_PUBLIC_` ile başlamalı

---

## Genel

### 14. `useCallback`/`useMemo` Bağımlılık Dizisi
**Hata**: Stale closure — eski değerler kullanılıyor
**Kural**: ESLint `exhaustive-deps` uyarılarını asla yoksayma

### 15. Tailwind Dark Mode Sınıf Karışıklığı
**Hata**: `dark:bg-gray-900` çalışmıyor
**Sebep**: `tailwind.config` içinde `darkMode: 'class'` yok veya `<html>` üzerinde `.dark` class eksik
**Çözüm**: next-themes + `darkMode: 'class'` kombinasyonu

---

*Son güncelleme: 2026-03-15*
*Yeni hata eklemek için bu dosyayı düzenle.*
