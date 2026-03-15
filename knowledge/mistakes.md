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

---

## Mimio'dan Öğrenilenler (next-themes Alternatifleri)

### 16. next-themes Olmadan FOUC Önleme
**Hata**: `next-themes` kullanmadan dark mode — sayfa ilk açılışta beyaz çakar
**Çözüm**: `<head>` içine inline script ekle:
```html
<script dangerouslySetInnerHTML={{ __html:
  `try{var t=localStorage.getItem('mimio-theme');
   document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');
  }catch(e){}`
}} />
```
**Not**: Bu pattern `suppressHydrationWarning` yerine `data-theme` attribute kullanır. next-themes olmadan hydration mismatch olmaz.

### 17. Tailwind v4: `tailwind.config.ts` Yok
**Hata**: v4 projesinde `tailwind.config.ts` oluşturmaya çalışmak
**Fark**: Tailwind v4'te konfigürasyon `globals.css` içinde `@theme {}` bloğuyla yapılır
```css
@import "tailwindcss";
@theme {
  --color-primary: #6366f1;
}
```
**Kullanım**: `bg-(--color-primary)` syntax'ı — `bg-indigo-500` değil

### 18. `background-attachment: fixed` Mobilde Çalışmaz
**Hata**: `background-attachment: fixed` iOS/Android'de scroll sırasında titreşir
**Çözüm**: Mobil breakpoint'te `scroll`'a döndür:
```css
@media (max-width: 640px) {
  body { background-attachment: scroll; }
}
```
**Not**: DigyNotes ve Keskealsaydım da bu düzeltmeyi yapıyor.

---

## DigyNotes'tan Öğrenilenler

### 19. React Quill SSR Sorunu
**Hata**: `react-quill` Next.js'de SSR ile çalışmaz
**Çözüm**: `dynamic` import ile yükle:
```tsx
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
```

### 20. Prisma Generate Build'de Unutulması
**Hata**: Vercel build'de `PrismaClientInitializationError`
**Sebep**: `prisma generate` build öncesi çalıştırılmadı
**Çözüm**:
```json
{ "scripts": { "build": "prisma generate && next build" } }
```

### 21. Scroll Lock'ta `position: fixed` ile Scroll Pozisyonu Kaybolması
**Hata**: Modal açıldığında body'e `overflow: hidden` + `position: fixed` eklenince sayfa başa atlar
**Çözüm**: `top: var(--scroll-lock-top, 0)` ile scroll pozisyonunu sakla, kapanışta geri yükle:
```ts
document.documentElement.style.setProperty('--scroll-lock-top', `-${window.scrollY}px`)
// Kapatınca:
const scrollY = parseInt(style.getPropertyValue('--scroll-lock-top') || '0')
window.scrollTo(0, -scrollY)
```

---

## Keskealsaydım'dan Öğrenilenler

### 22. Vite Chunk Boyutu Uyarısı (`> 500kB`)
**Hata**: `Some chunks are larger than 500 kB after minification`
**Çözüm**:
1. Route bazlı lazy loading: `const Page = lazy(() => import('./pages/X'))`
2. `vite.config.ts`'de `manualChunks`:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: { vendor: ['react', 'react-dom'] }
    }
  }
}
```

### 23. Go Backend + Frontend Vercel Deploy
**Hata**: Go API + Vite frontend'i Vercel'de nasıl deploy edilir bilinmiyor
**Çözüm**: `vercel.json` ile rewrite kuralları:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
**Not**: Go için `api/` dizini Vercel Serverless Functions olarak çalışır.

### 24. ESLint Config Dosyası Bulunamadı
**Hata**: `ESLint couldn't find a configuration file`
**Sebep**: Frontend alt dizininde ayrı eslint config gerekiyor
**Çözüm**: `frontend/.eslintrc.cjs` oluştur ve `@typescript-eslint/*` paketlerini kur

### 25. DB Migration'ları Geri Dönük Değiştirme
**Hata**: Var olan migration dosyasını düzenlemek
**Kural**: Migration dosyaları immutable'dır — değişiklik için her zaman yeni migration dosyası oluştur

---

## Genel (Tüm Projelerden)

### 26. Hardcoded Renk Değerleri Kullanmak
**Hata**: `bg-white`, `text-gray-900`, `border-gray-200`, `rgba(255,255,255,0.04)`
**Kural**: Her zaman CSS variable veya Tailwind token kullan
```tsx
// ❌ Yanlış
<div className="bg-white dark:bg-gray-900">
<div style={{ background: "rgba(255,255,255,0.04)" }}>

// ✅ Doğru (Mimio/ahmetakyapi stili)
<div className="bg-(--color-surface)">
<div className="glass">
```

### 27. `font-variant-numeric` Sayı Gösterimlerinde
**Hata**: Rakamlar satır içinde farklı genişliklerde — tablo hizalama bozulur
**Çözüm**:
```css
.number-ticker { font-variant-numeric: tabular-nums; }
```
Finance/istatistik uygulamalarında her sayı gösterimi için.

---

*Son güncelleme: 2026-03-15*
*Yeni hata eklemek için bu dosyayı düzenle.*
